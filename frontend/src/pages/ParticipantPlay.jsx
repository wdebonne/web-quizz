import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { AvatarDisplay } from '../components/AvatarPicker';
import BonusCard, { BonusNotification } from '../components/BonusCard';
import ChatPanel from '../components/ChatPanel';
import { getSocket } from '../socket';
import { motion, AnimatePresence } from 'framer-motion';

const ANSWER_COLORS = [
  'bg-red-500 hover:bg-red-600 border-red-600',
  'bg-blue-500 hover:bg-blue-600 border-blue-600',
  'bg-yellow-500 hover:bg-yellow-600 border-yellow-600',
  'bg-green-500 hover:bg-green-600 border-green-600',
  'bg-purple-500 hover:bg-purple-600 border-purple-600',
  'bg-orange-500 hover:bg-orange-600 border-orange-600',
];

export default function ParticipantPlay() {
  const { sessionId } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const [participant, setParticipant] = useState(state?.participant);
  const [session, setSession] = useState(state?.session);
  const [question, setQuestion] = useState(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [timer, setTimer] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [multiAnswers, setMultiAnswers] = useState([]);
  const [answerResult, setAnswerResult] = useState(null);
  const [score, setScore] = useState(0);
  const [scores, setScores] = useState([]);
  const [bonuses, setBonuses] = useState([]);
  const [activeBonusNotif, setActiveBonusNotif] = useState(null);
  const [messages, setMessages] = useState([]);
  const [showChat, setShowChat] = useState(false);
  const [showBonuses, setShowBonuses] = useState(false);
  const [streak, setStreak] = useState(0);
  const [gameFinished, setGameFinished] = useState(false);
  const [attackedBonus, setAttackedBonus] = useState(null);
  const startTimeRef = useRef(null);
  const answerSentRef = useRef(false);
  const [sliderValue, setSliderValue] = useState(50);
  const [orderItems, setOrderItems] = useState([]);
  const [freeTextAnswer, setFreeTextAnswer] = useState('');
  const [gameStatus, setGameStatus] = useState('active');

  const socket = getSocket();

  useEffect(() => {
    if (!socket) {
      navigate('/join');
      return;
    }

    socket.on('game:question', ({ question: q, questionIndex: qi, totalQuestions: total, timeLimit }) => {
      setQuestion(q);
      setQuestionIndex(qi);
      setTotalQuestions(total);
      setSelectedAnswer(null);
      setMultiAnswers([]);
      setAnswerResult(null);
      setFreeTextAnswer('');
      answerSentRef.current = false;
      startTimeRef.current = Date.now();
      setTimer({ remaining: timeLimit, total: timeLimit });
      if (q.options && Array.isArray(q.options)) {
        setOrderItems([...q.options]);
      }
      if (q.options?.min !== undefined) {
        setSliderValue(Math.floor((q.options.min + q.options.max) / 2));
      }
    });

    socket.on('game:timer', ({ remaining, total }) => setTimer({ remaining, total }));

    socket.on('answer:result', (result) => {
      setAnswerResult(result);
      setScore(result.newScore);
      setStreak(result.streak);
      if (result.isCorrect) {
        // Visual feedback
      }
    });

    socket.on('scores:update', ({ participants, teams }) => {
      setScores(teams.length > 0 ? teams : participants);
    });

    socket.on('bonus:received', ({ bonus }) => {
      setBonuses(prev => [...prev, bonus]);
      setActiveBonusNotif({ bonus });
      setTimeout(() => setActiveBonusNotif(null), 3000);
    });

    socket.on('bonus:attacked', ({ type }) => {
      setAttackedBonus(type);
      setTimeout(() => setAttackedBonus(null), 3000);
    });

    socket.on('bonus:used', ({ bonusType }) => {
      setBonuses(prev => {
        const idx = prev.findIndex(b => b.type === bonusType);
        if (idx === -1) return prev;
        const next = [...prev];
        next.splice(idx, 1);
        return next;
      });
    });

    socket.on('message:new', (msg) => setMessages(m => [...m, msg]));

    socket.on('game:results_show', ({ leaderboard }) => {});

    socket.on('game:finished', ({ leaderboard }) => {
      navigate(`/play/${sessionId}/finished`, {
        state: { leaderboard, myId: participant?.id },
      });
    });

    socket.on('game:kicked', () => navigate('/join'));

    socket.on('game:paused', () => setGameStatus('paused'));
    socket.on('game:resumed', () => setGameStatus('active'));

    socket.on('avatar:rejected', ({ newAvatar }) => {
      setParticipant(p => ({ ...p, avatar: newAvatar }));
    });

    socket.on('participant:updated', ({ participant: p }) => {
      if (p.id === participant?.id) {
        setParticipant(p);
        setBonuses(p.bonuses || []);
        setScore(p.score);
      }
    });

    return () => {
      ['game:question', 'game:timer', 'answer:result', 'scores:update', 'bonus:received',
        'bonus:attacked', 'bonus:used', 'message:new', 'game:results_show', 'game:finished',
        'game:kicked', 'game:paused', 'game:resumed', 'avatar:rejected', 'participant:updated'
      ].forEach(e => socket.off(e));
    };
  }, [socket, sessionId, navigate, participant?.id]);

  const sendAnswer = (answer) => {
    if (answerSentRef.current || !question) return;
    answerSentRef.current = true;
    const timeMs = Date.now() - (startTimeRef.current || Date.now());
    socket?.emit('participant:answer', { questionId: question.id, answer, timeMs });
  };

  const handleOptionClick = (optId) => {
    if (answerSentRef.current) return;
    if (question.type === 'multiple_choice') {
      setMultiAnswers(prev => {
        const next = prev.includes(optId) ? prev.filter(x => x !== optId) : [...prev, optId];
        return next;
      });
    } else {
      setSelectedAnswer(optId);
      sendAnswer(optId);
    }
  };

  const handleMultiSubmit = () => {
    if (multiAnswers.length === 0) return;
    sendAnswer(multiAnswers);
  };

  const handleUseBonus = (type, targetId, targetType) => {
    socket?.emit('participant:use_bonus', { bonusType: type, targetId, targetType });
  };

  const handleSendMessage = ({ content }) => {
    socket?.emit('participant:send_message', { content, toType: 'all' });
  };

  const myRank = scores.findIndex(s => s.id === participant?.id) + 1;

  const timerPercent = timer && timer.total > 0 ? (timer.remaining / timer.total) * 100 : 100;
  const timerColor = timerPercent > 50 ? 'bg-green-500' : timerPercent > 25 ? 'bg-yellow-500' : 'bg-red-500';

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col pb-16">
      {/* Attack notification */}
      <AnimatePresence>
        {attackedBonus && (
          <motion.div initial={{ y: -100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -100, opacity: 0 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-red-500 text-white px-6 py-3 rounded-2xl shadow-xl text-center">
            <p className="font-bold">⚠️ Vous avez été attaqué !</p>
            <p className="text-sm">{attackedBonus} activé sur vous</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bonus notification */}
      <AnimatePresence>
        {activeBonusNotif && <BonusNotification bonus={activeBonusNotif.bonus} />}
      </AnimatePresence>

      {/* Pause overlay */}
      <AnimatePresence>
        {gameStatus === 'paused' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-40 flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl mb-4">⏸️</div>
              <p className="font-display font-bold text-2xl text-white">Pause</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="sticky top-0 z-30 bg-gray-900/95 backdrop-blur border-b border-gray-800">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <AvatarDisplay avatar={participant?.avatar} size="sm" className="w-8 h-8 text-base" />
            <div>
              <p className="text-white text-sm font-medium">{participant?.name}</p>
              <p className="text-xs text-brand-400 font-bold">{score} pts</p>
            </div>
          </div>

          <div className="text-center">
            <p className="text-gray-400 text-xs">Q{questionIndex + 1}/{totalQuestions}</p>
            {streak >= 3 && (
              <p className="text-orange-400 text-xs font-bold">🔥 ×{streak}</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            {bonuses.length > 0 && (
              <button onClick={() => setShowBonuses(!showBonuses)}
                className={`relative px-3 py-1.5 rounded-xl text-sm font-bold transition-all
                  ${showBonuses ? 'bg-brand-500 text-white' : 'bg-gray-800 text-yellow-400'}`}>
                ⭐ {bonuses.length}
              </button>
            )}
            <button onClick={() => setShowChat(!showChat)}
              className={`px-3 py-1.5 rounded-xl text-sm transition-all ${showChat ? 'bg-brand-500 text-white' : 'bg-gray-800 text-gray-400'}`}>
              💬
            </button>
            {myRank > 0 && (
              <span className="text-xs text-gray-400">#{myRank}</span>
            )}
          </div>
        </div>

        {/* Timer */}
        {timer && timer.total > 0 && (
          <div className="w-full bg-gray-800 h-1.5">
            <div className={`h-1.5 transition-all duration-1000 ${timerColor}`}
              style={{ width: `${timerPercent}%` }} />
          </div>
        )}
        {timer && timer.total > 0 && (
          <div className="flex justify-end px-4 pb-2">
            <span className={`text-xs font-bold ${timer.remaining <= 5 ? 'text-red-400 animate-pulse' : 'text-gray-400'}`}>
              {timer.remaining}s
            </span>
          </div>
        )}
      </div>

      {/* Bonus panel */}
      <AnimatePresence>
        {showBonuses && bonuses.length > 0 && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-gray-900 border-b border-gray-800 p-4 overflow-hidden">
            <p className="text-sm text-gray-400 mb-3">Vos bonus ({bonuses.length})</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {bonuses.map((bonus, i) => (
                <BonusCard key={i} bonus={bonus} onUse={handleUseBonus}
                  participants={scores.filter(s => s.id !== participant?.id)}
                  disabled={!!answerResult} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat panel */}
      <AnimatePresence>
        {showChat && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-gray-900 border-b border-gray-800">
            <ChatPanel messages={messages} onSend={handleSendMessage} myId={participant?.id}
              myRole="participant" className="rounded-none border-0 min-h-48 max-h-64" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main game area */}
      <div className="flex-1 p-4 flex flex-col gap-4 max-w-2xl mx-auto w-full">
        <AnimatePresence mode="wait">
          {question ? (
            <motion.div key={question.id}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="space-y-4">

              {/* Bonus indicator */}
              {question.isBonus && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl px-4 py-2 text-center">
                  <span className="text-yellow-400 font-bold">⭐ Question Bonus — Répondez correctement pour gagner un bonus !</span>
                </div>
              )}

              {/* Media */}
              {question.mediaUrl && (
                <div className="flex justify-center">
                  {question.mediaType === 'image' && <img src={question.mediaUrl} className="max-h-48 rounded-2xl object-cover w-full" />}
                  {question.mediaType === 'audio' && <audio src={question.mediaUrl} controls autoPlay className="w-full" />}
                  {question.mediaType === 'video' && <video src={question.mediaUrl} controls autoPlay className="max-h-48 rounded-2xl w-full" />}
                </div>
              )}

              {/* Question text */}
              <div className="card text-center">
                <h2 className="font-display font-bold text-xl sm:text-2xl text-white leading-tight">
                  {question.content}
                </h2>
              </div>

              {/* Hint (if hint bonus used) */}
              {question.hint && answerResult === null && (
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl px-4 py-2 text-center">
                  <p className="text-yellow-300 text-sm">💡 {question.hint}</p>
                </div>
              )}

              {/* Answer area */}
              {!answerResult ? (
                <div className="space-y-3">
                  {/* Single/Multiple choice, Image, Audio, Video */}
                  {['single_choice', 'multiple_choice', 'image', 'audio', 'video'].includes(question.type) && question.options && Array.isArray(question.options) && (
                    <>
                      <div className={`grid gap-3 ${question.options.length <= 2 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                        {question.options.map((opt, i) => {
                          const isSelected = question.type === 'multiple_choice'
                            ? multiAnswers.includes(opt.id)
                            : selectedAnswer === opt.id;
                          return (
                            <motion.button key={opt.id}
                              whileTap={{ scale: 0.97 }}
                              onClick={() => handleOptionClick(opt.id)}
                              disabled={question.type !== 'multiple_choice' && !!selectedAnswer}
                              className={`relative p-4 rounded-2xl border-2 text-left font-semibold text-lg transition-all
                                ${isSelected
                                  ? 'border-white scale-95 brightness-125 ' + ANSWER_COLORS[i % 6].split(' ')[0]
                                  : ANSWER_COLORS[i % 6]
                                } text-white`}>
                              {question.type === 'image' && opt.mediaUrl && (
                                <img src={opt.mediaUrl} className="w-full h-24 object-cover rounded-xl mb-2" />
                              )}
                              <span>{opt.text}</span>
                              {isSelected && <span className="absolute top-2 right-2 text-white">✓</span>}
                            </motion.button>
                          );
                        })}
                      </div>
                      {question.type === 'multiple_choice' && (
                        <button onClick={handleMultiSubmit} disabled={multiAnswers.length === 0}
                          className="btn-primary w-full btn-lg">
                          ✅ Valider ({multiAnswers.length} sélectionné{multiAnswers.length > 1 ? 's' : ''})
                        </button>
                      )}
                    </>
                  )}

                  {/* True / False */}
                  {question.type === 'true_false' && (
                    <div className="grid grid-cols-2 gap-4">
                      {[{ id: 'true', label: '✅ Vrai', color: 'bg-green-500 hover:bg-green-600' }, { id: 'false', label: '❌ Faux', color: 'bg-red-500 hover:bg-red-600' }].map(opt => (
                        <motion.button key={opt.id} whileTap={{ scale: 0.95 }}
                          onClick={() => { setSelectedAnswer(opt.id); sendAnswer(opt.id); }}
                          disabled={!!selectedAnswer}
                          className={`${opt.color} text-white font-display font-black text-2xl py-8 rounded-3xl transition-all`}>
                          {opt.label}
                        </motion.button>
                      ))}
                    </div>
                  )}

                  {/* Free text */}
                  {question.type === 'free_text' && (
                    <div className="space-y-3">
                      <input value={freeTextAnswer} onChange={e => setFreeTextAnswer(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && freeTextAnswer.trim() && sendAnswer(freeTextAnswer.trim())}
                        placeholder="Votre réponse..." className="input text-center text-xl"
                        autoFocus maxLength={200} />
                      <button onClick={() => { if (freeTextAnswer.trim()) sendAnswer(freeTextAnswer.trim()); }}
                        disabled={!freeTextAnswer.trim()}
                        className="btn-primary w-full btn-lg">✅ Valider</button>
                    </div>
                  )}

                  {/* Slider */}
                  {question.type === 'slider' && (
                    <div className="space-y-4">
                      <div className="text-center">
                        <span className="font-display font-black text-4xl text-brand-400">{sliderValue}</span>
                      </div>
                      <input type="range"
                        min={question.options?.min ?? 0}
                        max={question.options?.max ?? 100}
                        value={sliderValue}
                        onChange={e => setSliderValue(Number(e.target.value))}
                        className="w-full accent-brand-500 h-3" />
                      <div className="flex justify-between text-xs text-gray-400">
                        <span>{question.options?.min ?? 0}</span>
                        <span>{question.options?.max ?? 100}</span>
                      </div>
                      <button onClick={() => sendAnswer(sliderValue)} className="btn-primary w-full btn-lg">
                        ✅ Valider
                      </button>
                    </div>
                  )}

                  {/* Poll (no correct answer) */}
                  {question.type === 'poll' && question.options && Array.isArray(question.options) && (
                    <div className="space-y-3">
                      {question.options.map((opt, i) => (
                        <motion.button key={opt.id} whileTap={{ scale: 0.97 }}
                          onClick={() => { setSelectedAnswer(opt.id); sendAnswer(opt.id); }}
                          disabled={!!selectedAnswer}
                          className={`w-full p-4 rounded-2xl text-left font-semibold text-lg transition-all
                            ${selectedAnswer === opt.id ? 'bg-brand-500 text-white' : 'bg-gray-800 hover:bg-gray-700 text-white'}`}>
                          {opt.text}
                        </motion.button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                /* Answer result */
                <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                  className={`card text-center border-2 ${answerResult.isCorrect ? 'border-green-500 bg-green-500/10' : 'border-red-500 bg-red-500/10'}`}>
                  <div className="text-5xl mb-3">{answerResult.isCorrect ? '🎉' : '😞'}</div>
                  <p className="font-display font-black text-2xl text-white mb-2">
                    {answerResult.isCorrect ? 'Bonne réponse !' : 'Mauvaise réponse'}
                  </p>
                  <p className={`font-bold text-xl ${answerResult.pointsEarned >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {answerResult.pointsEarned >= 0 ? '+' : ''}{answerResult.pointsEarned} points
                  </p>
                  <p className="text-gray-400 text-sm mt-1">Total: {answerResult.newScore} pts</p>
                  {answerResult.streak >= 3 && (
                    <p className="text-orange-400 font-bold mt-2">🔥 Série de {answerResult.streak} !</p>
                  )}
                  {answerResult.explanation && (
                    <p className="text-gray-300 text-sm mt-3 p-3 bg-gray-800 rounded-xl">{answerResult.explanation}</p>
                  )}
                  <p className="text-gray-500 text-sm mt-3">En attente de la prochaine question...</p>
                </motion.div>
              )}
            </motion.div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="flex justify-center gap-2 mb-4">
                  {[0, 1, 2].map(i => (
                    <div key={i} className="w-3 h-3 bg-brand-500 rounded-full"
                      style={{ animation: `bounce 1.4s ${i * 0.2}s infinite` }} />
                  ))}
                </div>
                <p className="text-gray-400">En attente de la question...</p>
              </div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
