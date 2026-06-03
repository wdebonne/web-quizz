const router = require('express').Router();
const { GameSession, Quiz, Question, Participant, Team, Message, GameHistory } = require('../models');
const { authenticate, requireCreator } = require('../middleware/auth');
const { generateQRCode } = require('../utils/qrcode');
const { generateCode } = require('../utils/helpers');

// POST /api/games — Create a new game session
router.post('/', authenticate, requireCreator, async (req, res) => {
  const { quizId, mode, teamsEnabled, settings, maxParticipants } = req.body;
  try {
    const quiz = await Quiz.findByPk(quizId, {
      include: [{ model: Question, as: 'questions' }],
    });
    if (!quiz) return res.status(404).json({ error: 'Quiz introuvable.' });
    if (quiz.questions.length === 0) {
      return res.status(400).json({ error: 'Ce quiz n\'a aucune question.' });
    }

    let code;
    let attempts = 0;
    do {
      code = generateCode(6);
      attempts++;
    } while (await GameSession.findOne({ where: { code } }) && attempts < 10);

    const session = await GameSession.create({
      quizId,
      creatorId: req.user.id,
      code,
      mode: mode || 'projection',
      teamsEnabled: teamsEnabled || false,
      settings: settings || {},
      maxParticipants: maxParticipants || 100,
    });

    const appUrl = process.env.APP_URL || `http://localhost:${process.env.PORT || 3000}`;
    const joinUrl = `${appUrl}/join/${code}`;
    const qrCode = await generateQRCode(joinUrl);

    res.status(201).json({ ...session.toJSON(), joinUrl, qrCode });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// GET /api/games — List sessions for creator
router.get('/', authenticate, requireCreator, async (req, res) => {
  try {
    const where = req.user.role === 'admin' ? {} : { creatorId: req.user.id };
    const sessions = await GameSession.findAll({
      where,
      include: [{ model: Quiz, as: 'quiz', attributes: ['title'] }],
      order: [['createdAt', 'DESC']],
    });
    res.json(sessions);
  } catch {
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// GET /api/games/:id — Get session details
router.get('/:id', authenticate, requireCreator, async (req, res) => {
  try {
    const session = await GameSession.findByPk(req.params.id, {
      include: [
        { model: Quiz, as: 'quiz', include: [{ model: Question, as: 'questions', order: [['order', 'ASC']] }] },
        { model: Participant, as: 'participants', include: [{ model: Team, as: 'team' }] },
        { model: Team, as: 'teams' },
      ],
    });
    if (!session) return res.status(404).json({ error: 'Session introuvable.' });
    if (session.creatorId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Accès refusé.' });
    }
    const appUrl = process.env.APP_URL || `http://localhost:${process.env.PORT || 3000}`;
    const joinUrl = `${appUrl}/join/${session.code}`;
    const qrCode = await generateQRCode(joinUrl);
    res.json({ ...session.toJSON(), joinUrl, qrCode });
  } catch {
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// DELETE /api/games/:id
router.delete('/:id', authenticate, requireCreator, async (req, res) => {
  try {
    const session = await GameSession.findByPk(req.params.id);
    if (!session) return res.status(404).json({ error: 'Session introuvable.' });
    if (session.creatorId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Accès refusé.' });
    }
    await session.destroy();
    res.json({ message: 'Session supprimée.' });
  } catch {
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// GET /api/games/join/:code — Validate join code (public)
router.get('/join/:code', async (req, res) => {
  try {
    const session = await GameSession.findOne({
      where: { code: req.params.code.toUpperCase() },
      include: [{ model: Quiz, as: 'quiz', attributes: ['title', 'coverImage'] }],
      attributes: ['id', 'code', 'status', 'mode', 'teamsEnabled', 'maxParticipants'],
    });
    if (!session) return res.status(404).json({ error: 'Code invalide.' });
    if (session.status === 'finished') return res.status(410).json({ error: 'Cette partie est terminée.' });
    const count = await Participant.count({ where: { sessionId: session.id } });
    if (count >= session.maxParticipants) {
      return res.status(403).json({ error: 'La partie est complète.' });
    }
    res.json(session);
  } catch {
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// GET /api/games/:id/history
router.get('/:id/history', authenticate, requireCreator, async (req, res) => {
  try {
    const history = await GameHistory.findOne({ where: { sessionId: req.params.id } });
    if (!history) return res.status(404).json({ error: 'Historique introuvable.' });
    res.json(history);
  } catch {
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// GET /api/games/history/all
router.get('/history/all', authenticate, requireCreator, async (req, res) => {
  try {
    const where = req.user.role === 'admin' ? {} : { creatorId: req.user.id };
    const histories = await GameHistory.findAll({
      where,
      order: [['createdAt', 'DESC']],
    });
    res.json(histories);
  } catch {
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// DELETE /api/games/history/:id
router.delete('/history/:id', authenticate, requireCreator, async (req, res) => {
  try {
    const history = await GameHistory.findByPk(req.params.id);
    if (!history) return res.status(404).json({ error: 'Introuvable.' });
    if (history.creatorId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Accès refusé.' });
    }
    await history.destroy();
    res.json({ message: 'Historique supprimé.' });
  } catch {
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

module.exports = router;
