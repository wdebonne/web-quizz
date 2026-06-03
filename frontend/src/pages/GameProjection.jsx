import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { connectProjection, disconnect } from '../socket';
import { AvatarDisplay, getDiceBearUrl } from '../components/AvatarPicker';
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
  const socketRef = useRef(null);

  useEffect(() => {
    const socket = connectProjection();
    socketRef.current = socket;
    socket.on('connect', () => socket.emit('projection:join', { sessionId }));

    socket.on('session:state', (s) => {
      setStatus(s.status);
      setMode(s.mode);
      setSessionInfo(s);
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

    return () => disconnect();
  }, [sessionId]);

  const COLORS = ['from-red-500 to-rose-600', 'from-blue-500 to-indigo-600', 'from-yellow-500 to-amber-600', 'from-green-500 to-emerald-600'];
  const timerPercent = timer && timer.total > 0 ? (timer.remaining / timer.total) * 100 : 0;

  return (
    <div className="min-h-screen bg-gray-950 overflow-hidden relative" style={{ fontFamily: 'Poppins, sans-serif' }}>
      {/* Animated background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-900/20 via-gray-950 to-accent-900/10" />
        {[...Array(8)].map((_, i) => (
          <div key={i} className="absolute rounded-full blur-3xl opacity-5"
            style={{
              width: `${100 + i * 50}px`, height: `${100 + i * 50}px`,
              background: i % 2 === 0 ? '#6366f1' : '#f59e0b',
              left: `${5 + i * 12}%`, top: `${5 + (i % 3) * 30}%`,
              animation: `float ${4 + i}s ease-in-out ${i * 0.8}s infinite`,
            }} />
        ))}
      </div>

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
        <div className="flex flex-col items-center justify-center min-h-screen text-center p-8">
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
            <div className="text-8xl mb-6 animate-bounce">🎮</div>
            <h1 className="font-display font-black text-6xl text-white mb-4">
              {sessionInfo?.quiz?.title || 'Quiz'}
            </h1>
            <p className="text-2xl text-gray-400 mb-8">En attente des participants...</p>
            <div className="bg-white/5 backdrop-blur border border-white/10 rounded-3xl px-12 py-6">
              <p className="text-gray-400 mb-2">Rejoindre avec le code</p>
              <p className="font-display font-black text-6xl tracking-widest text-brand-400">
                {sessionInfo?.code}
              </p>
            </div>
          </motion.div>
        </div>
      )}

      {/* Active game — Projection mode (question on screen) */}
      {status === 'active' && !showResults && question && (
        <div className="flex flex-col min-h-screen p-8 gap-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="bg-brand-500/20 text-brand-400 border border-brand-500/30 rounded-2xl px-5 py-2 font-display font-bold text-xl">
                Q{questionIndex + 1} / {totalQuestions}
              </span>
              {question.isBonus && (
                <span className="bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded-2xl px-4 py-2 font-bold text-lg">
                  ⭐ BONUS
                </span>
              )}
            </div>
            {timer && timer.total > 0 && (
              <div className="flex items-center gap-4">
                <span className={`font-display font-black text-5xl ${timer.remaining <= 5 ? 'text-red-400 animate-pulse' : 'text-white'}`}>
                  {timer.remaining}
                </span>
              </div>
            )}
          </div>

          {/* Timer bar */}
          {timer && timer.total > 0 && (
            <div className="w-full bg-gray-800 rounded-full h-3">
              <div className={`h-3 rounded-full transition-all duration-1000 ${timerPercent > 50 ? 'bg-green-500' : timerPercent > 25 ? 'bg-yellow-500' : 'bg-red-500'}`}
                style={{ width: `${timerPercent}%` }} />
            </div>
          )}

          {/* Media */}
          {question.mediaUrl && (
            <div className="flex justify-center">
              {question.mediaType === 'image' && <img src={question.mediaUrl} className="max-h-64 rounded-3xl object-cover shadow-2xl" />}
              {question.mediaType === 'audio' && <audio src={question.mediaUrl} controls autoPlay className="w-full max-w-lg" />}
              {question.mediaType === 'video' && <video src={question.mediaUrl} controls autoPlay className="max-h-64 rounded-3xl" />}
            </div>
          )}

          {/* Question */}
          <div className="flex-1 flex items-center justify-center">
            <h2 className="font-display font-black text-4xl sm:text-5xl text-white text-center leading-tight max-w-4xl">
              {question.content}
            </h2>
          </div>

          {/* Answer options (shown in projection mode) */}
          {mode === 'projection' && question.options?.length > 0 && Array.isArray(question.options) && (
            <div className={`grid gap-4 ${question.options.length <= 2 ? 'grid-cols-2' : 'grid-cols-2'}`}>
              {question.options.map((opt, i) => (
                <div key={opt.id} className={`relative p-6 rounded-3xl bg-gradient-to-br ${COLORS[i % 4]} shadow-xl`}>
                  <span className="font-display font-black text-2xl text-white">{opt.text}</span>
                  <div className="absolute top-4 right-4 w-10 h-10 bg-black/30 rounded-xl flex items-center justify-center font-bold text-white">
                    {['A', 'B', 'C', 'D'][i]}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Device mode: only show instructions */}
          {mode === 'device' && (
            <div className="text-center text-gray-400 text-xl">
              📱 Répondez sur vos appareils
            </div>
          )}
        </div>
      )}

      {/* Results / Race view */}
      {showResults && (
        <div className="flex flex-col min-h-screen p-8">
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
