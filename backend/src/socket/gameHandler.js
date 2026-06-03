const jwt = require('jsonwebtoken');
const { GameSession, Quiz, Question, Participant, Team, Message, GameHistory, Bonus } = require('../models');
const { generateCode, getRandomAvatar } = require('../utils/helpers');
const { generateQRCode } = require('../utils/qrcode');

// In-memory timers per session
const sessionTimers = {};
// Active socket rooms map: sessionId -> { creatorSocketId, participantSockets: Map<socketId, participantId> }
const sessionRooms = {};

const initGameHandler = (io) => {

  io.use(async (socket, next) => {
    const { token, participantId, sessionCode } = socket.handshake.auth;
    // Creator authentication
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.userId = decoded.userId;
        socket.isCreator = true;
        return next();
      } catch { return next(new Error('Token invalide')); }
    }
    // Participant authentication (no account required)
    if (participantId && sessionCode) {
      socket.participantId = participantId;
      socket.sessionCode = sessionCode;
      socket.isCreator = false;
      return next();
    }
    // Projection screen (creator token but different room)
    next(new Error('Auth manquante'));
  });

  io.on('connection', async (socket) => {
    if (socket.isCreator) {
      handleCreatorConnection(socket, io);
    } else {
      handleParticipantConnection(socket, io);
    }

    socket.on('disconnect', () => handleDisconnect(socket, io));
  });
};

// --- CREATOR ---

function handleCreatorConnection(socket, io) {
  socket.on('creator:join_session', async ({ sessionId }) => {
    try {
      const session = await GameSession.findByPk(sessionId, {
        include: [
          { model: Quiz, as: 'quiz', include: [{ model: Question, as: 'questions', order: [['order', 'ASC']] }] },
          { model: Participant, as: 'participants' },
          { model: Team, as: 'teams' },
        ],
      });
      if (!session || session.creatorId !== socket.userId) {
        return socket.emit('error', { message: 'Session invalide.' });
      }
      socket.sessionId = sessionId;
      socket.join(`session:${sessionId}`);
      socket.join(`session:${sessionId}:creator`);
      if (!sessionRooms[sessionId]) sessionRooms[sessionId] = { creatorSocketId: null, participantSockets: new Map() };
      sessionRooms[sessionId].creatorSocketId = socket.id;

      socket.emit('session:state', await buildSessionState(session));
    } catch (err) {
      socket.emit('error', { message: 'Erreur serveur.' });
    }
  });

  socket.on('creator:start_game', async () => {
    try {
      const session = await getSession(socket.sessionId);
      if (!session || session.creatorId !== socket.userId) return;
      if (session.status !== 'lobby') return socket.emit('error', { message: 'Partie déjà démarrée.' });

      await session.update({ status: 'active', startedAt: new Date(), currentQuestionIndex: -1 });

      io.to(`session:${session.id}`).emit('game:started', { mode: session.mode });
      // Advance to first question
      await advanceQuestion(session.id, io);
    } catch {}
  });

  socket.on('creator:next_question', async () => {
    const session = await getSession(socket.sessionId);
    if (!session || session.creatorId !== socket.userId || session.status !== 'active') return;
    clearTimer(session.id);
    await advanceQuestion(session.id, io);
  });

  socket.on('creator:pause', async () => {
    const session = await getSession(socket.sessionId);
    if (!session || session.creatorId !== socket.userId) return;
    if (session.status !== 'active') return;
    clearTimer(session.id);
    await session.update({ status: 'paused' });
    io.to(`session:${session.id}`).emit('game:paused');
  });

  socket.on('creator:resume', async () => {
    const session = await getSession(socket.sessionId);
    if (!session || session.creatorId !== socket.userId) return;
    if (session.status !== 'paused') return;
    await session.update({ status: 'active' });
    io.to(`session:${session.id}`).emit('game:resumed');
    // Restart timer if applicable
    const quiz = await Quiz.findByPk(session.quizId, { include: [{ model: Question, as: 'questions', order: [['order', 'ASC']] }] });
    const q = quiz.questions[session.currentQuestionIndex];
    if (q) {
      const timeLimit = q.timeLimit ?? quiz.defaultTimeLimit;
      if (timeLimit > 0 && session.questionStartedAt) {
        const elapsed = Math.floor((Date.now() - new Date(session.questionStartedAt).getTime()) / 1000);
        const remaining = timeLimit - elapsed;
        if (remaining > 0) startQuestionTimer(session.id, remaining, io);
      }
    }
  });

  socket.on('creator:end_game', async () => {
    const session = await getSession(socket.sessionId);
    if (!session || session.creatorId !== socket.userId) return;
    await finishGame(session.id, io);
  });

  socket.on('creator:send_message', async ({ content, toType, toId, toName }) => {
    const session = await getSession(socket.sessionId);
    if (!session) return;
    const msg = await Message.create({
      sessionId: session.id,
      fromType: 'creator',
      fromId: socket.userId,
      fromName: 'Créateur',
      toType: toType || 'all',
      toId: toId || null,
      toName: toName || null,
      content,
    });
    emitMessage(io, session.id, msg);
  });

  socket.on('creator:reject_avatar', async ({ participantId, reason }) => {
    const session = await getSession(socket.sessionId);
    if (!session) return;
    const participant = await Participant.findOne({ where: { id: participantId, sessionId: session.id } });
    if (!participant) return;

    const usedAvatars = (await Participant.findAll({ where: { sessionId: session.id } })).map(p => p.avatar);
    const newAvatar = getRandomAvatar(usedAvatars);
    await participant.update({ avatar: newAvatar, avatarPendingApproval: false });

    const targetSocket = sessionRooms[session.id]?.participantSockets?.get(participantId);
    if (targetSocket) {
      io.to(targetSocket).emit('avatar:rejected', { newAvatar, reason: reason || 'Votre avatar a été refusé par le créateur.' });
    }
    io.to(`session:${session.id}:creator`).emit('participant:updated', { participant: await participant.reload() });
  });

  socket.on('creator:approve_avatar', async ({ participantId }) => {
    const session = await getSession(socket.sessionId);
    if (!session) return;
    await Participant.update({ avatarPendingApproval: false }, { where: { id: participantId, sessionId: session.id } });
    const participant = await Participant.findByPk(participantId);
    io.to(`session:${session.id}`).emit('participant:updated', { participant });
  });

  socket.on('creator:kick_participant', async ({ participantId }) => {
    const session = await getSession(socket.sessionId);
    if (!session) return;
    const participant = await Participant.findOne({ where: { id: participantId, sessionId: session.id } });
    if (!participant) return;
    const targetSocket = sessionRooms[session.id]?.participantSockets?.get(participantId);
    if (targetSocket) io.to(targetSocket).emit('game:kicked');
    await participant.destroy();
    io.to(`session:${session.id}`).emit('participant:left', { participantId });
  });

  socket.on('creator:show_results', async () => {
    const session = await getSession(socket.sessionId);
    if (!session) return;
    const participants = await Participant.findAll({ where: { sessionId: session.id }, include: [{ model: Team, as: 'team' }] });
    const teams = await Team.findAll({ where: { sessionId: session.id } });
    const leaderboard = buildLeaderboard(participants, teams, session.teamsEnabled);
    io.to(`session:${session.id}`).emit('game:results_show', { leaderboard });
  });
}

// --- PARTICIPANT ---

function handleParticipantConnection(socket, io) {
  socket.on('participant:join', async ({ sessionCode, name, avatar, teamId, teamCode, createTeam, teamName }) => {
    try {
      const session = await GameSession.findOne({
        where: { code: sessionCode },
        include: [{ model: Quiz, as: 'quiz', attributes: ['title', 'coverImage'] }],
      });
      if (!session) return socket.emit('error', { message: 'Code invalide.' });
      if (session.status === 'finished') return socket.emit('error', { message: 'Partie terminée.' });

      const count = await Participant.count({ where: { sessionId: session.id } });
      if (count >= session.maxParticipants) return socket.emit('error', { message: 'Partie complète.' });

      // Check if name already taken
      const existing = await Participant.findOne({ where: { sessionId: session.id, name } });
      if (existing) return socket.emit('error', { message: 'Ce pseudo est déjà pris.' });

      // Determine if avatar needs approval (custom upload)
      const needsApproval = avatar && avatar.startsWith('/uploads/');

      let resolvedTeamId = null;

      // Handle team logic
      if (session.teamsEnabled) {
        if (createTeam && teamName) {
          // Create new team
          const teamCodeNew = generateCode(4);
          const team = await Team.create({
            sessionId: session.id,
            name: teamName,
            code: teamCodeNew,
            color: randomColor(),
          });
          resolvedTeamId = team.id;
          const appUrl = process.env.APP_URL || 'http://localhost:3000';
          socket.emit('team:created', {
            team: { ...team.toJSON(), joinUrl: `${appUrl}/join/${sessionCode}?team=${teamCodeNew}`, qrCode: await generateQRCode(`${appUrl}/join/${sessionCode}?team=${teamCodeNew}`) },
          });
        } else if (teamCode) {
          const team = await Team.findOne({ where: { sessionId: session.id, code: teamCode } });
          if (!team) return socket.emit('error', { message: 'Code équipe invalide.' });
          resolvedTeamId = team.id;
        } else if (teamId) {
          resolvedTeamId = teamId;
        }
      }

      const participant = await Participant.create({
        sessionId: session.id,
        name,
        avatar: avatar || getRandomAvatar([]),
        avatarPendingApproval: needsApproval,
        teamId: resolvedTeamId,
        socketId: socket.id,
      });

      socket.participantId = participant.id;
      socket.sessionId = session.id;
      socket.join(`session:${session.id}`);
      if (resolvedTeamId) socket.join(`session:${session.id}:team:${resolvedTeamId}`);

      if (!sessionRooms[session.id]) sessionRooms[session.id] = { creatorSocketId: null, participantSockets: new Map() };
      sessionRooms[session.id].participantSockets.set(participant.id, socket.id);

      socket.emit('participant:joined', {
        participant,
        session: {
          id: session.id,
          status: session.status,
          mode: session.mode,
          teamsEnabled: session.teamsEnabled,
          quiz: session.quiz,
        },
      });

      // Notify creator
      io.to(`session:${session.id}:creator`).emit('participant:new', {
        participant: participant.toJSON(),
        needsApproval,
      });
      io.to(`session:${session.id}`).emit('lobby:update', await buildLobbyState(session.id));

      // If custom avatar, notify creator for approval
      if (needsApproval) {
        io.to(`session:${session.id}:creator`).emit('avatar:pending_approval', { participant: participant.toJSON() });
      }

      // Create system message
      const msg = await Message.create({
        sessionId: session.id,
        fromType: 'system',
        toType: 'all',
        content: `${name} a rejoint la partie !`,
        type: 'system',
      });
      emitMessage(io, session.id, msg);

    } catch (err) {
      console.error('participant:join error', err);
      socket.emit('error', { message: 'Erreur lors de la connexion.' });
    }
  });

  socket.on('participant:answer', async ({ questionId, answer, timeMs }) => {
    try {
      if (!socket.participantId || !socket.sessionId) return;
      const session = await getSession(socket.sessionId);
      if (!session || session.status !== 'active') return;

      const participant = await Participant.findByPk(socket.participantId);
      if (!participant) return;

      // Check if already answered this question
      const alreadyAnswered = (participant.answers || []).find(a => a.questionId === questionId);
      if (alreadyAnswered) return;

      const quiz = await Quiz.findByPk(session.quizId, {
        include: [{ model: Question, as: 'questions', order: [['order', 'ASC']] }],
      });
      const question = quiz.questions.find(q => q.id === questionId);
      if (!question) return;

      const sessionSettings = session.settings || {};
      const basePoints = question.points ?? quiz.defaultPoints;
      const penaltyPercent = sessionSettings.penaltyPercent ?? quiz.penaltyPercent;
      const timeLimit = question.timeLimit ?? quiz.defaultTimeLimit;

      // Check active bonuses
      const activeBonuses = participant.bonuses || [];
      const hasFreeAnswer = activeBonuses.some(b => b.type === 'free_answer');
      const hasDoublePoints = activeBonuses.some(b => b.type === 'double_points');
      const hasFreeze = activeBonuses.some(b => b.type === 'freeze');
      const hasReverse = activeBonuses.some(b => b.type === 'reverse');

      let isCorrect = false;
      let answerResult = null;

      if (hasFreeAnswer) {
        isCorrect = true;
      } else {
        answerResult = evaluateAnswer(question, answer);
        isCorrect = answerResult.correct;
      }

      // Adjust time if freeze bonus
      const effectiveTimeMs = hasFreeze ? timeMs * 2 : timeMs;

      // Calculate points
      let pointsEarned = 0;
      if (question.type !== 'poll') {
        if (isCorrect) {
          pointsEarned = basePoints;
          // Speed bonus: up to 20% extra for fast answers
          if (timeLimit > 0 && effectiveTimeMs < timeLimit * 1000) {
            const speedRatio = 1 - (effectiveTimeMs / (timeLimit * 1000));
            pointsEarned += Math.round(basePoints * 0.2 * speedRatio);
          }
          if (hasDoublePoints) pointsEarned *= 2;
          if (hasReverse) pointsEarned = -Math.abs(pointsEarned);
        } else {
          const penaltyBonus = activeBonuses.some(b => b.type === 'extra_wrong');
          if (!penaltyBonus) {
            pointsEarned = -Math.round(basePoints * penaltyPercent / 100);
          }
        }
      }

      // Consume used bonuses
      const usedBonusTypes = ['free_answer', 'double_points'];
      const remainingBonuses = activeBonuses.filter(b => !usedBonusTypes.includes(b.type));

      const newAnswers = [...(participant.answers || []), {
        questionId,
        answer,
        isCorrect,
        pointsEarned,
        timeMs: effectiveTimeMs,
      }];

      const newScore = Math.max(0, participant.score + pointsEarned);
      const newStreak = isCorrect ? participant.streak + 1 : 0;
      const maxStreak = Math.max(participant.maxStreak, newStreak);

      await participant.update({
        answers: newAnswers,
        score: newScore,
        bonuses: remainingBonuses,
        streak: newStreak,
        maxStreak,
      });

      // Update team score
      if (participant.teamId) {
        const teamParticipants = await Participant.findAll({ where: { teamId: participant.teamId } });
        const teamScore = teamParticipants.reduce((s, p) => s + p.score, 0);
        await Team.update({ score: teamScore }, { where: { id: participant.teamId } });
      }

      socket.emit('answer:result', {
        questionId,
        isCorrect,
        pointsEarned,
        newScore,
        correctAnswer: question.correctAnswer,
        explanation: question.explanation,
        streak: newStreak,
      });

      // Check if question is bonus and award bonus
      if (question.isBonus && isCorrect && question.bonusReward) {
        await giveBonus(participant.id, question.bonusReward, session.id, io);
      }

      // Notify creator of answer
      io.to(`session:${session.id}:creator`).emit('participant:answered', {
        participantId: participant.id,
        name: participant.name,
        isCorrect,
        pointsEarned,
        newScore,
        questionId,
      });

      // Broadcast live scores update
      const updatedScores = await getScores(session.id);
      io.to(`session:${session.id}`).emit('scores:update', updatedScores);

    } catch (err) {
      console.error('participant:answer error', err);
    }
  });

  socket.on('participant:send_message', async ({ content, toType, toId, toName }) => {
    try {
      if (!socket.participantId || !socket.sessionId) return;
      const participant = await Participant.findByPk(socket.participantId);
      if (!participant) return;
      const msg = await Message.create({
        sessionId: socket.sessionId,
        fromType: 'participant',
        fromId: socket.participantId,
        fromName: participant.name,
        toType: toType || 'all',
        toId: toId || null,
        toName: toName || null,
        content,
      });
      emitMessage(io, socket.sessionId, msg);
    } catch {}
  });

  socket.on('participant:use_bonus', async ({ bonusType, targetId, targetType }) => {
    try {
      if (!socket.participantId || !socket.sessionId) return;
      const participant = await Participant.findByPk(socket.participantId);
      if (!participant) return;

      const activeBonuses = participant.bonuses || [];
      const bonusIndex = activeBonuses.findIndex(b => b.type === bonusType);
      if (bonusIndex === -1) return socket.emit('error', { message: 'Bonus non disponible.' });

      const bonus = activeBonuses[bonusIndex];
      const newBonuses = [...activeBonuses];
      newBonuses.splice(bonusIndex, 1);
      await participant.update({ bonuses: newBonuses });

      // Apply bonus to target
      if (targetId && targetType) {
        await applyBonusToTarget(bonusType, bonus, targetId, targetType, socket.sessionId, io);
      }

      socket.emit('bonus:used', { bonusType });

      // Bonus animation for everyone
      io.to(`session:${socket.sessionId}`).emit('bonus:activated', {
        fromName: participant.name,
        fromAvatar: participant.avatar,
        bonusType,
        targetId,
        targetType,
      });
    } catch {}
  });

  // Team messaging
  socket.on('team:send_message', async ({ content }) => {
    try {
      if (!socket.participantId || !socket.sessionId) return;
      const participant = await Participant.findByPk(socket.participantId);
      if (!participant || !participant.teamId) return;
      const msg = await Message.create({
        sessionId: socket.sessionId,
        fromType: 'participant',
        fromId: socket.participantId,
        fromName: participant.name,
        toType: 'team',
        toId: participant.teamId,
        content,
      });
      io.to(`session:${socket.sessionId}:team:${participant.teamId}`).emit('message:new', msg);
    } catch {}
  });

  socket.on('projection:join', async ({ sessionId }) => {
    socket.join(`session:${sessionId}`);
    socket.join(`session:${sessionId}:projection`);
    const session = await getSession(sessionId);
    if (session) socket.emit('session:state', await buildSessionState(session));
  });
}

// --- HELPERS ---

async function advanceQuestion(sessionId, io) {
  const session = await getSession(sessionId);
  if (!session) return;

  const quiz = await Quiz.findByPk(session.quizId, {
    include: [{ model: Question, as: 'questions', order: [['order', 'ASC']] }],
  });

  const nextIndex = session.currentQuestionIndex + 1;

  if (nextIndex >= quiz.questions.length) {
    return finishGame(sessionId, io);
  }

  await session.update({
    currentQuestionIndex: nextIndex,
    questionStartedAt: new Date(),
  });

  const question = quiz.questions[nextIndex];
  const timeLimit = question.timeLimit ?? quiz.defaultTimeLimit;

  // Prepare question data (hide correct answer from participants)
  const questionData = prepareQuestionForParticipants(question, quiz);
  const creatorQuestion = question.toJSON();

  io.to(`session:${sessionId}`).emit('game:question', {
    question: questionData,
    questionIndex: nextIndex,
    totalQuestions: quiz.questions.length,
    timeLimit,
  });

  io.to(`session:${sessionId}:creator`).emit('game:question_full', {
    question: creatorQuestion,
    questionIndex: nextIndex,
    totalQuestions: quiz.questions.length,
    timeLimit,
  });

  if (timeLimit > 0) {
    startQuestionTimer(sessionId, timeLimit, io);
  }
}

function prepareQuestionForParticipants(question, quiz) {
  const q = question.toJSON();
  // Shuffle options for single/multiple choice
  if (['single_choice', 'multiple_choice', 'true_false', 'image', 'audio', 'video'].includes(q.type)) {
    if (q.options && q.options.length > 0) {
      q.options = shuffleArray(q.options);
    }
  }
  delete q.correctAnswer;
  delete q.explanation;
  return q;
}

function startQuestionTimer(sessionId, durationSeconds, io) {
  clearTimer(sessionId);
  let remaining = durationSeconds;
  sessionTimers[sessionId] = setInterval(async () => {
    remaining--;
    io.to(`session:${sessionId}`).emit('game:timer', { remaining, total: durationSeconds });
    if (remaining <= 0) {
      clearTimer(sessionId);
      // Auto-advance after brief delay
      setTimeout(() => io.to(`session:${sessionId}:creator`).emit('game:time_up'), 1000);
    }
  }, 1000);
}

function clearTimer(sessionId) {
  if (sessionTimers[sessionId]) {
    clearInterval(sessionTimers[sessionId]);
    delete sessionTimers[sessionId];
  }
}

async function finishGame(sessionId, io) {
  clearTimer(sessionId);
  const session = await getSession(sessionId);
  if (!session) return;

  await session.update({ status: 'finished', finishedAt: new Date() });

  const participants = await Participant.findAll({ where: { sessionId }, include: [{ model: Team, as: 'team' }] });
  const teams = await Team.findAll({ where: { sessionId } });
  const quiz = await Quiz.findByPk(session.quizId, {
    include: [{ model: Question, as: 'questions' }],
  });

  const leaderboard = buildLeaderboard(participants, teams, session.teamsEnabled);

  const duration = session.startedAt ? Math.floor((new Date() - new Date(session.startedAt)) / 1000) : null;

  await GameHistory.findOrCreate({
    where: { sessionId },
    defaults: {
      sessionId,
      creatorId: session.creatorId,
      quizTitle: quiz.title,
      mode: session.mode,
      teamsEnabled: session.teamsEnabled,
      participantCount: participants.length,
      questionCount: quiz.questions.length,
      leaderboard,
      results: {
        participants: participants.map(p => ({
          id: p.id, name: p.name, score: p.score, avatar: p.avatar,
          answers: p.answers, streak: p.maxStreak, teamId: p.teamId,
          teamName: p.team?.name,
        })),
        teams: teams.map(t => ({ id: t.id, name: t.name, score: t.score, color: t.color })),
      },
      startedAt: session.startedAt,
      finishedAt: new Date(),
      durationSeconds: duration,
    },
  });

  io.to(`session:${sessionId}`).emit('game:finished', { leaderboard });

  // Clean up room memory
  delete sessionRooms[sessionId];
}

function buildLeaderboard(participants, teams, teamsEnabled) {
  if (teamsEnabled && teams.length > 0) {
    return teams
      .sort((a, b) => b.score - a.score)
      .map((t, i) => ({
        rank: i + 1,
        id: t.id,
        name: t.name,
        score: t.score,
        avatar: t.avatar,
        color: t.color,
        type: 'team',
        members: participants.filter(p => p.teamId === t.id).map(p => ({
          id: p.id, name: p.name, score: p.score, avatar: p.avatar,
        })),
      }));
  }
  return participants
    .sort((a, b) => b.score - a.score)
    .map((p, i) => ({
      rank: i + 1,
      id: p.id,
      name: p.name,
      score: p.score,
      avatar: p.avatar,
      streak: p.maxStreak,
      type: 'participant',
    }));
}

async function buildLobbyState(sessionId) {
  const participants = await Participant.findAll({
    where: { sessionId },
    include: [{ model: Team, as: 'team' }],
  });
  const teams = await Team.findAll({ where: { sessionId } });
  return { participants, teams };
}

async function buildSessionState(session) {
  const participants = await Participant.findAll({ where: { sessionId: session.id } });
  const teams = await Team.findAll({ where: { sessionId: session.id } });
  const appUrl = process.env.APP_URL || `http://localhost:${process.env.PORT || 3000}`;
  const joinUrl = `${appUrl}/join/${session.code}`;
  return {
    id: session.id,
    code: session.code,
    status: session.status,
    mode: session.mode,
    teamsEnabled: session.teamsEnabled,
    currentQuestionIndex: session.currentQuestionIndex,
    joinUrl,
    participants,
    teams,
    quiz: session.quiz,
  };
}

async function getSession(sessionId) {
  return GameSession.findByPk(sessionId);
}

async function getScores(sessionId) {
  const participants = await Participant.findAll({ where: { sessionId }, include: [{ model: Team, as: 'team' }] });
  const teams = await Team.findAll({ where: { sessionId } });
  return {
    participants: participants.map(p => ({
      id: p.id, name: p.name, score: p.score, avatar: p.avatar,
      teamId: p.teamId, isConnected: p.isConnected, streak: p.streak,
    })),
    teams: teams.map(t => ({ id: t.id, name: t.name, score: t.score, color: t.color, avatar: t.avatar })),
  };
}

function evaluateAnswer(question, answer) {
  const correct = question.correctAnswer;
  if (!correct) return { correct: true };

  switch (question.type) {
    case 'single_choice':
    case 'true_false':
    case 'image':
    case 'audio':
    case 'video':
      return { correct: String(answer) === String(correct) };

    case 'multiple_choice': {
      const sortedAnswer = Array.isArray(answer) ? [...answer].sort() : [answer].sort();
      const sortedCorrect = Array.isArray(correct) ? [...correct].sort() : [correct].sort();
      return { correct: JSON.stringify(sortedAnswer) === JSON.stringify(sortedCorrect) };
    }

    case 'free_text': {
      const normalizer = s => String(s).toLowerCase().trim().replace(/\s+/g, ' ');
      const accepted = Array.isArray(correct) ? correct : [correct];
      return { correct: accepted.some(c => normalizer(c) === normalizer(answer)) };
    }

    case 'ordering': {
      return { correct: JSON.stringify(answer) === JSON.stringify(correct) };
    }

    case 'slider': {
      const tolerance = question.options?.tolerance || 0;
      return { correct: Math.abs(Number(answer) - Number(correct)) <= tolerance };
    }

    case 'matching': {
      const answerMap = answer || {};
      const correctMap = correct || {};
      return { correct: Object.keys(correctMap).every(k => answerMap[k] === correctMap[k]) };
    }

    default:
      return { correct: false };
  }
}

async function giveBonus(participantId, bonusReward, sessionId, io) {
  const participant = await Participant.findByPk(participantId);
  if (!participant) return;
  const newBonuses = [...(participant.bonuses || []), bonusReward];
  await participant.update({ bonuses: newBonuses });
  const targetSocket = sessionRooms[sessionId]?.participantSockets?.get(participantId);
  if (targetSocket) {
    io.to(targetSocket).emit('bonus:received', { bonus: bonusReward });
  }
}

async function applyBonusToTarget(bonusType, bonus, targetId, targetType, sessionId, io) {
  if (targetType === 'participant') {
    const target = await Participant.findOne({ where: { id: targetId, sessionId } });
    if (!target) return;
    const hasImmunity = (target.bonuses || []).some(b => b.type === 'immunity');
    if (hasImmunity) {
      // Consume immunity
      const newBonuses = (target.bonuses || []).filter(b => b.type !== 'immunity');
      await target.update({ bonuses: newBonuses });
      const targetSocket = sessionRooms[sessionId]?.participantSockets?.get(targetId);
      if (targetSocket) io.to(targetSocket).emit('bonus:immunity_used', { fromBonusType: bonusType });
      return;
    }

    if (bonusType === 'steal_points') {
      const stolen = Math.round(target.score * 0.1);
      await target.update({ score: Math.max(0, target.score - stolen) });
      // Give to the attacker (handled separately)
    } else {
      const newBonuses = [...(target.bonuses || []), { type: bonusType, config: bonus.config }];
      await target.update({ bonuses: newBonuses });
    }

    const targetSocket = sessionRooms[sessionId]?.participantSockets?.get(targetId);
    if (targetSocket) io.to(targetSocket).emit('bonus:attacked', { type: bonusType });
  }
}

function emitMessage(io, sessionId, msg) {
  const msgData = msg.toJSON ? msg.toJSON() : msg;
  if (msgData.toType === 'all') {
    io.to(`session:${sessionId}`).emit('message:new', msgData);
  } else if (msgData.toType === 'team' && msgData.toId) {
    io.to(`session:${sessionId}:team:${msgData.toId}`).emit('message:new', msgData);
    io.to(`session:${sessionId}:creator`).emit('message:new', msgData);
  } else if (msgData.toType === 'participant' && msgData.toId) {
    const targetSocket = sessionRooms[sessionId]?.participantSockets?.get(msgData.toId);
    if (targetSocket) io.to(targetSocket).emit('message:new', msgData);
    io.to(`session:${sessionId}:creator`).emit('message:new', msgData);
  } else if (msgData.toType === 'creator') {
    io.to(`session:${sessionId}:creator`).emit('message:new', msgData);
  }
}

async function handleDisconnect(socket, io) {
  if (socket.participantId && socket.sessionId) {
    await Participant.update(
      { isConnected: false },
      { where: { id: socket.participantId } }
    );
    if (sessionRooms[socket.sessionId]) {
      sessionRooms[socket.sessionId].participantSockets.delete(socket.participantId);
    }
    io.to(`session:${socket.sessionId}:creator`).emit('participant:disconnected', {
      participantId: socket.participantId,
    });
    io.to(`session:${socket.sessionId}`).emit('participant:disconnected', {
      participantId: socket.participantId,
    });
  }
}

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6'];
let colorIndex = 0;
function randomColor() {
  return COLORS[colorIndex++ % COLORS.length];
}

module.exports = { initGameHandler };
