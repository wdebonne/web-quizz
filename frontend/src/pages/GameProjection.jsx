import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { connectProjection, disconnect } from '../socket';
import { AvatarDisplay, getDiceBearUrl } from '../components/AvatarPicker';
import { QRCodeSVG } from 'qrcode.react';
import { motion, AnimatePresence } from 'framer-motion';

export default function GameProjection() {
  const { sessionId } = useParams();
  const [status, setStatus] = useState('lobby');
  const [mode, setMode] = useState('projection');
  const [question, setQuestion] = useState(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [timer, setTimer] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [scores, setScores] = useState([]);
  const [bonusEvent, setBonusEvent] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [sessionInfo, setSessionInfo] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [teams, setTeams] = useState([]);
  const [newJoiner, setNewJoiner] = useState(null);
  const [flyingEmojis, setFlyingEmojis] = useState([]);
  const socketRef = useRef(null);

  useEffect(() => {
    const socket = connectProjection();
    socketRef.current = socket;
    socket.on('connect', () => socket.emit('projection:join', { sessionId }));

    socket.on('session:state', (s) => {
      setStatus(s.status);
      setMode(s.mode);
      setSessionInfo(s);
      setParticipants(s.participants || []);
      setTeams(s.teams || []);
    });

    socket.on('lobby:update', ({ participants: p, teams: t }) => {
      setParticipants(p || []);
      setTeams(t || []);
    });

    socket.on('participant:new', ({ participant }) => {
      setParticipants(p => {
        if (p.find(x => x.id === participant.id)) return p;
        return [...p, participant];
      });
      setNewJoiner(participant);
      setTimeout(() => setNewJoiner(null), 3000);
    });

    socket.on('participant:left', ({ participantId }) => {
      setParticipants(p => p.filter(x => x.id !== participantId));
    });

    socket.on('game:started', ({ mode: m }) => {
      setStatus('active');
      setMode(m);
      setShowResults(false);
    });

    socket.on('game:question', ({ question: q, questionIndex: qi, totalQuestions: total, timeLimit }) => {
      setQuestion(q);
      setQuestionIndex(qi);
      setTotalQuestions(total);
      setShowResults(false);
      setTimer({ remaining: timeLimit, total: timeLimit });
    });

    socket.on('game:timer', ({ remaining, total }) => setTimer({ remaining, total }));

    socket.on('scores:update', ({ participants, teams }) => {
      const data = (teams.length > 0 ? teams : participants)
        .sort((a, b) => b.score - a.score);
      setScores(data);
    });

    socket.on('game:results_show', ({ leaderboard: lb }) => {
      setLeaderboard(lb);
      setShowResults(true);
    });

    socket.on('game:finished', ({ leaderboard: lb }) => {
      setLeaderboard(lb);
      setStatus('finished');
      setShowResults(true);
    });

    socket.on('bonus:activated', (data) => {
      setBonusEvent(data);
      setTimeout(() => setBonusEvent(null), 3000);
    });

    socket.on('game:paused', () => setStatus('paused'));
    socket.on('game:resumed', () => setStatus('active'));

    socket.on('emoji:reaction', ({ emoji }) => {
      const id = Date.now() + Math.random();
      const goUp = Math.random() > 0.5;
      const x = 5 + Math.random() * 88;
      const size = 2.8 + Math.random() * 2.4;
      const wobble = (Math.random() - 0.5) * 30;
      setFlyingEmojis(prev => [...prev, { id, emoji, x, goUp, size, wobble }]);
      setTimeout(() => setFlyingEmojis(prev => prev.filter(e => e.id !== id)), 4200);
    });

    return () => disconnect();
  }, [sessionId]);

  const COLORS = ['from-red-500 to-rose-600', 'from-blue-500 to-indigo-600', 'from-yellow-500 to-amber-600', 'from-green-500 to-emerald-600'];
  const timerPercent = timer && timer.total > 0 ? (timer.remaining / timer.total) * 100 : 0;

  return (
    <div className="min-h-screen overflow-hidden relative"
      style={{ fontFamily: 'Poppins, sans-serif', background: '#0d0d1a' }}>
      {/* Animated background — derrière tout le contenu (z-index: 0) */}
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
        {[...Array(6)].map((_, i) => (
          <div key={i} className="absolute rounded-full blur-3xl"
            style={{
              opacity: 0.07,
              width: `${120 + i * 60}px`, height: `${120 + i * 60}px`,
              background: i % 2 === 0 ? '#6366f1' : '#a855f7',
              left: `${5 + i * 15}%`, top: `${10 + (i % 3) * 28}%`,
              animation: `float ${5 + i}s ease-in-out ${i * 0.8}s infinite`,
            }} />
        ))}
      </div>

      {/* Flying emojis — visibles sur tous les écrans */}
      <AnimatePresence>
        {flyingEmojis.map(e => (
          <motion.div
            key={e.id}
            initial={{
              left: `${e.x}%`,
              top: e.goUp ? '100%' : '-10%',
              opacity: 1,
              scale: 0.4,
              rotate: 0,
            }}
            animate={{
              top: e.goUp ? '-15%' : '110%',
              opacity: [1, 1, 1, 0],
              scale: [0.4, 1.3, 1.1, 0.9],
              rotate: [0, e.wobble, -e.wobble * 0.5, e.wobble * 0.3],
            }}
            transition={{ duration: 4, ease: 'easeOut' }}
            style={{
              position: 'fixed',
              fontSize: `${e.size}rem`,
              zIndex: 200,
              pointerEvents: 'none',
              filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.5))',
              lineHeight: 1,
            }}
          >
            {e.emoji}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Bonus notification */}
      <AnimatePresence>
        {bonusEvent && (
          <motion.div initial={{ scale: 0.5, opacity: 0, y: -100 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.5, opacity: 0 }}
            className="fixed top-8 left-1/2 -translate-x-1/2 z-50 text-center pointer-events-none">
            <div className="bg-yellow-500 text-gray-900 px-8 py-4 rounded-3xl shadow-2xl">
              <p className="font-display font-black text-3xl">⭐ BONUS ACTIVÉ !</p>
              <p className="text-lg font-bold">{bonusEvent.fromName} utilise un bonus !</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lobby screen */}
      {status === 'lobby' && (
        <div className="flex flex-col min-h-screen" style={{ position: 'relative', zIndex: 1, background: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)' }}>

          {/* New joiner toast */}
          <AnimatePresence>
            {newJoiner && (
              <motion.div
                key={newJoiner.id}
                initial={{ x: 160, opacity: 0, scale: 0.9 }}
                animate={{ x: 0, opacity: 1, scale: 1 }}
                exit={{ x: 160, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                className="fixed top-6 right-6 z-50 flex items-center gap-4 px-6 py-4 rounded-2xl shadow-2xl"
                style={{ background: 'rgba(34,197,94,0.25)', border: '1.5px solid rgba(34,197,94,0.6)', backdropFilter: 'blur(12px)' }}
              >
                <AvatarDisplay avatar={newJoiner.avatar} size="lg" />
                <div>
                  <p className="text-white font-black text-xl">{newJoiner.name}</p>
                  <p className="text-green-300 font-semibold">a rejoint la partie !</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Title bar */}
          <motion.div initial={{ y: -40, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            className="text-center py-8 px-8">
            <h1 className="font-display font-black text-white mb-1"
              style={{ fontSize: 'clamp(2rem, 5vw, 4rem)', textShadow: '0 2px 20px rgba(99,102,241,0.6)' }}>
              {sessionInfo?.quiz?.title || '⏳ Chargement...'}
            </h1>
            <p className="text-indigo-300 text-xl font-semibold">
              {participants.length > 0
                ? `👥 ${participants.length} participant${participants.length > 1 ? 's' : ''} connecté${participants.length > 1 ? 's' : ''}`
                : '⏳ En attente des participants...'}
            </p>
          </motion.div>

          {/* Main row */}
          <div className="flex flex-1 items-center justify-center gap-12 px-12 pb-8 flex-wrap">

            {/* QR Code block — très visible */}
            <motion.div initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20, delay: 0.1 }}
              className="flex flex-col items-center gap-5 shrink-0">

              {/* Halo glow behind QR */}
              <div className="relative">
                <div className="absolute inset-0 rounded-3xl blur-2xl"
                  style={{ background: 'rgba(99,102,241,0.5)', transform: 'scale(1.15)' }} />
                <div className="relative bg-white rounded-3xl p-5 shadow-2xl">
                  {sessionInfo?.joinUrl ? (
                    <QRCodeSVG value={sessionInfo.joinUrl} size={260} level="M"
                      fgColor="#1e1b4b" bgColor="#ffffff" />
                  ) : (
                    <div className="w-64 h-64 flex items-center justify-center">
                      <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </div>
              </div>

              {/* Code */}
              <div className="text-center">
                <p className="text-indigo-300 text-base font-semibold mb-1 uppercase tracking-widest">Code de la partie</p>
                <div className="rounded-2xl px-8 py-3"
                  style={{ background: 'rgba(99,102,241,0.2)', border: '2px solid rgba(99,102,241,0.6)' }}>
                  <p className="font-display font-black tracking-widest text-white"
                    style={{ fontSize: 'clamp(2rem, 6vw, 4.5rem)', letterSpacing: '0.2em' }}>
                    {sessionInfo?.code || '...'}
                  </p>
                </div>
                {sessionInfo?.joinUrl && (
                  <p className="text-indigo-400/60 text-sm mt-2">{sessionInfo.joinUrl}</p>
                )}
              </div>
            </motion.div>

            {/* Participants / Teams */}
            <div className="flex-1 min-w-0 max-w-2xl">
              {teams.length > 0 ? (
                <div className="space-y-3">
                  {teams.map((team, i) => {
                    const members = participants.filter(p => p.teamId === team.id);
                    return (
                      <motion.div key={team.id}
                        initial={{ x: 80, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: i * 0.08 }}
                        className="flex items-center gap-4 rounded-2xl px-5 py-3"
                        style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)' }}>
                        <span className="text-3xl">{team.avatar}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-bold text-lg">{team.name}</p>
                          <p className="text-indigo-300 text-sm">{members.length} membre{members.length > 1 ? 's' : ''}</p>
                        </div>
                        <div className="flex -space-x-2">
                          {members.slice(0, 6).map(m => (
                            <AvatarDisplay key={m.id} avatar={m.avatar} size="sm"
                              className="ring-2" style={{ '--tw-ring-color': '#1a1a2e' }} />
                          ))}
                          {members.length > 6 && (
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                              style={{ background: 'rgba(99,102,241,0.5)' }}>
                              +{members.length - 6}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              ) : participants.length > 0 ? (
                <div className="flex flex-wrap gap-4 justify-center">
                  <AnimatePresence>
                    {participants.map((p, i) => (
                      <motion.div key={p.id}
                        initial={{ scale: 0, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 22, delay: i < 24 ? i * 0.03 : 0 }}
                        className="flex flex-col items-center gap-2">
                        <div className="relative">
                          <div className="absolute inset-0 rounded-full blur-md opacity-60"
                            style={{ background: 'rgba(99,102,241,0.4)' }} />
                          <AvatarDisplay avatar={p.avatar} size="xl" className="relative" />
                        </div>
                        <p className="text-white text-sm font-semibold max-w-20 truncate text-center
                          drop-shadow-lg">
                          {p.name}
                        </p>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="text-center text-indigo-300/50 text-2xl font-semibold py-12">
                  Les participants apparaîtront ici...
                </div>
              )}
            </div>
          </div>

          {/* Bottom pulse */}
          <div className="flex justify-center gap-2 pb-6">
            {[...Array(7)].map((_, i) => (
              <motion.div key={i}
                animate={{ scaleY: [1, 2.5, 1] }}
                transition={{ duration: 0.9, delay: i * 0.1, repeat: Infinity, ease: 'easeInOut' }}
                className="w-1.5 rounded-full"
                style={{ height: 18, background: 'rgba(99,102,241,0.7)' }} />
            ))}
          </div>
        </div>
      )}

      {/* Active game — Projection mode (question on screen) */}
      {status === 'active' && !showResults && question && (
        <div className="flex flex-col min-h-screen" style={{ position: 'relative', zIndex: 1 }}>

          {/* Top bar */}
          <div className="flex items-center justify-between px-8 pt-5 pb-3"
            style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }}>
            <div className="flex items-center gap-3">
              <span className="font-display font-bold text-2xl text-white px-5 py-2 rounded-2xl"
                style={{ background: 'rgba(99,102,241,0.4)', border: '1px solid rgba(99,102,241,0.7)' }}>
                Q{questionIndex + 1} / {totalQuestions}
              </span>
              {question.isBonus && (
                <span className="font-bold text-xl text-yellow-300 px-4 py-2 rounded-2xl"
                  style={{ background: 'rgba(234,179,8,0.25)', border: '1px solid rgba(234,179,8,0.5)' }}>
                  ⭐ BONUS
                </span>
              )}
            </div>
            {/* Timer — toujours visible */}
            <div className="flex items-center gap-3">
              {timer && timer.total > 0 && (
                <span className="font-display font-black tabular-nums"
                  style={{
                    fontSize: '4rem',
                    lineHeight: 1,
                    color: timer.remaining <= 5 ? '#f87171' : timer.remaining <= 10 ? '#fbbf24' : '#ffffff',
                    textShadow: timer.remaining <= 5
                      ? '0 0 30px rgba(248,113,113,0.8)'
                      : '0 2px 12px rgba(0,0,0,0.8)',
                  }}>
                  {timer.remaining}
                </span>
              )}
            </div>
          </div>

          {/* Timer bar */}
          {timer && timer.total > 0 && (
            <div className="w-full h-3" style={{ background: 'rgba(255,255,255,0.1)' }}>
              <div className="h-3 transition-all duration-1000"
                style={{
                  width: `${timerPercent}%`,
                  background: timerPercent > 50 ? '#22c55e' : timerPercent > 25 ? '#eab308' : '#ef4444',
                  boxShadow: `0 0 8px ${timerPercent > 50 ? '#22c55e' : timerPercent > 25 ? '#eab308' : '#ef4444'}`,
                }} />
            </div>
          )}

          {/* Content */}
          <div className="flex-1 flex flex-col px-8 py-5 gap-5">

            {/* Image */}
            {question.mediaUrl && (
              <div className="flex justify-center shrink-0">
                {question.mediaType === 'image' && (
                  <img src={question.mediaUrl} alt=""
                    className="rounded-3xl object-contain shadow-2xl"
                    style={{ maxHeight: '32vh', maxWidth: '70%', border: '2px solid rgba(255,255,255,0.15)' }} />
                )}
                {question.mediaType === 'audio' && (
                  <audio src={question.mediaUrl} controls autoPlay className="w-full max-w-lg" />
                )}
                {question.mediaType === 'video' && (
                  <video src={question.mediaUrl} controls autoPlay className="rounded-3xl shadow-2xl"
                    style={{ maxHeight: '32vh', maxWidth: '70%' }} />
                )}
              </div>
            )}

            {/* Question */}
            <div className="flex justify-center shrink-0 px-4">
              <div className="w-full max-w-5xl rounded-3xl text-center px-10 py-7"
                style={{
                  background: 'rgba(255,255,255,0.13)',
                  border: '2px solid rgba(255,255,255,0.25)',
                  backdropFilter: 'blur(4px)',
                }}>
                <h2 className="font-display font-black text-white"
                  style={{
                    fontSize: 'clamp(2rem, 4.5vw, 4rem)',
                    lineHeight: 1.2,
                    textShadow: '0 2px 24px rgba(0,0,0,1), 0 0 60px rgba(0,0,0,0.8)',
                  }}>
                  {question.content}
                </h2>
              </div>
            </div>

            {/* Answers */}
            <div className="mt-auto">
              {mode === 'projection' && question.options?.length > 0 && Array.isArray(question.options) && (
                <div className={`grid gap-3 ${question.options.length <= 2 ? 'grid-cols-2' : 'grid-cols-2'}`}>
                  {question.options.map((opt, i) => (
                    <div key={opt.id}
                      className={`flex items-center gap-5 rounded-3xl bg-gradient-to-br ${COLORS[i % 4]}`}
                      style={{ padding: '1.2rem 1.8rem', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>
                      <div className="shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center font-display font-black text-3xl text-white"
                        style={{ background: 'rgba(0,0,0,0.35)' }}>
                        {['A', 'B', 'C', 'D'][i]}
                      </div>
                      <span className="font-display font-black text-white"
                        style={{
                          fontSize: 'clamp(1.3rem, 2.8vw, 2.4rem)',
                          textShadow: '0 2px 8px rgba(0,0,0,0.6)',
                          lineHeight: 1.2,
                        }}>
                        {opt.text}
                      </span>
                      {opt.mediaUrl && (
                        <img src={opt.mediaUrl} alt="" className="ml-auto rounded-xl object-cover"
                          style={{ width: '5rem', height: '5rem' }} />
                      )}
                    </div>
                  ))}
                </div>
              )}
              {mode === 'device' && (
                <div className="text-center py-4 text-gray-300 text-2xl font-semibold">
                  📱 Répondez sur vos appareils
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Results / Race view */}
      {showResults && (
        <div className="flex flex-col min-h-screen p-8" style={{ position: 'relative', zIndex: 1 }}>
          <h2 className="font-display font-black text-4xl text-center text-white mb-8">
            {status === 'finished' ? '🏁 Résultats finaux' : '📊 Classement'}
          </h2>

          {/* Race track visualization */}
          <div className="flex-1 space-y-4 max-w-4xl mx-auto w-full">
            {leaderboard.slice(0, 8).map((entry, i) => {
              const maxScore = leaderboard[0]?.score || 1;
              const pct = Math.max(5, (entry.score / maxScore) * 90);
              return (
                <motion.div key={entry.id}
                  initial={{ x: -200, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-center gap-4">
                  <span className={`w-12 font-display font-black text-3xl text-center
                    ${i === 0 ? 'text-yellow-400' : i === 1 ? 'text-gray-300' : i === 2 ? 'text-amber-600' : 'text-gray-500'}`}>
                    {i + 1}
                  </span>
                  <AvatarDisplay avatar={entry.avatar} size="lg" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-white text-xl">{entry.name}</span>
                      <span className="font-display font-black text-2xl text-brand-400">{entry.score}</span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-6 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, delay: i * 0.1 }}
                        className={`h-6 rounded-full bg-gradient-to-r ${COLORS[i % 4]} flex items-center justify-end pr-2`}>
                        {entry.avatar?.startsWith('dicebear:') && (
                          <img src={getDiceBearUrl(entry.avatar.slice(9))} alt="" className="w-5 h-5 rounded-full" />
                        )}
                      </motion.div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {status === 'finished' && leaderboard[0] && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 1, type: 'spring' }}
              className="text-center mt-8">
              <div className="text-8xl mb-4">🏆</div>
              <p className="font-display font-black text-5xl text-yellow-400">{leaderboard[0].name}</p>
              <p className="text-2xl text-gray-300">{leaderboard[0].score} points</p>
            </motion.div>
          )}
        </div>
      )}

      {/* Pause overlay */}
      {status === 'paused' && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-40">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
            className="text-center">
            <div className="text-8xl mb-4">⏸️</div>
            <p className="font-display font-black text-5xl text-white">Pause</p>
          </motion.div>
        </div>
      )}
    </div>
  );
}
