import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import ChatPanel from '../components/ChatPanel';
import { AvatarDisplay } from '../components/AvatarPicker';
import { connectCreator, disconnect } from '../socket';
import { motion, AnimatePresence } from 'framer-motion';

export default function GameControl() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [question, setQuestion] = useState(null);
  const [questionFull, setQuestionFull] = useState(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [scores, setScores] = useState({ participants: [], teams: [] });
  const [messages, setMessages] = useState([]);
  const [timer, setTimer] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [timeUp, setTimeUp] = useState(false);
  const [status, setStatus] = useState('active');
  const socketRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const socket = connectCreator(token);
    socketRef.current = socket;

    socket.on('connect', () => socket.emit('creator:join_session', { sessionId: id }));

    socket.on('session:state', (s) => {
      setSession(s);
      setStatus(s.status);
      setScores({ participants: s.participants || [], teams: s.teams || [] });
      setTotalQuestions(s.quiz?.questions?.length || 0);
    });

    socket.on('game:question', ({ question: q, questionIndex: qi, totalQuestions: total, timeLimit }) => {
      setQuestion(q);
      setQuestionIndex(qi);
      setTotalQuestions(total);
      setAnswers([]);
      setTimeUp(false);
      setTimer({ remaining: timeLimit, total: timeLimit });
    });

    socket.on('game:question_full', ({ question: q }) => setQuestionFull(q));

    socket.on('game:timer', ({ remaining, total }) => setTimer({ remaining, total }));

    socket.on('game:time_up', () => setTimeUp(true));

    socket.on('participant:answered', (data) => {
      setAnswers(prev => [...prev, data]);
    });

    socket.on('scores:update', (data) => {
      setScores(data);
    });

    socket.on('message:new', (msg) => setMessages(m => [...m, msg]));

    socket.on('game:paused', () => setStatus('paused'));
    socket.on('game:resumed', () => setStatus('active'));

    socket.on('game:finished', ({ leaderboard }) => {
      navigate(`/game/${id}/results`, { state: { leaderboard } });
    });

    socket.on('error', ({ message }) => alert(message));

    return () => disconnect();
  }, [id, navigate]);

  const emit = (event, data) => socketRef.current?.emit(event, data);

  const handleSendMessage = ({ content, toType, toId, toName }) => {
    emit('creator:send_message', { content, toType, toId, toName });
  };

  const leaderboard = [...(scores.teams.length > 0 ? scores.teams : scores.participants)]
    .sort((a, b) => b.score - a.score).slice(0, 10);

  const timerPercent = timer ? (timer.remaining / timer.total) * 100 : 0;
  const timerColor = timerPercent > 50 ? 'bg-green-500' : timerPercent > 25 ? 'bg-yellow-500' : 'bg-red-500';

  return (
    <Layout title={`Contrôle — Question ${questionIndex + 1}/${totalQuestions}`}
      actions={
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => window.open(`/projection/${id}`, '_blank')} className="btn-secondary btn-sm">
            📺 Projection
          </button>
          {status === 'active'
            ? <button onClick={() => emit('creator:pause')} className="btn-secondary btn-sm">⏸️ Pause</button>
            : <button onClick={() => emit('creator:resume')} className="btn-primary btn-sm">▶️ Reprendre</button>
          }
          <button onClick={() => { if (confirm('Terminer la partie ?')) emit('creator:end_game'); }}
            className="btn-danger btn-sm">⏹️ Terminer</button>
        </div>
      }>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Question + Timer */}
        <div className="xl:col-span-2 space-y-4">
          {/* Timer */}
          {timer && timer.total > 0 && (
            <div className="card">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">Temps restant</span>
                <span className={`font-display font-bold text-2xl ${timer.remaining <= 5 ? 'text-red-400 animate-pulse' : 'text-white'}`}>
                  {timer.remaining}s
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-3">
                <div className={`h-3 rounded-full transition-all duration-1000 ${timerColor}`}
                  style={{ width: `${timerPercent}%` }} />
              </div>
            </div>
          )}

          {/* Current question */}
          <div className="card">
            <div className="flex items-center gap-3 mb-4">
              <span className="badge bg-brand-500/20 text-brand-400">Q{questionIndex + 1}/{totalQuestions}</span>
              {question?.isBonus && <span className="badge bg-yellow-500/20 text-yellow-400">⭐ Bonus</span>}
              {timeUp && <span className="badge bg-red-500/20 text-red-400">⏰ Temps écoulé</span>}
              <div className="ml-auto text-sm text-gray-400">
                {answers.length} réponse{answers.length > 1 ? 's' : ''}
              </div>
            </div>

            {question ? (
              <>
                {question.mediaUrl && (
                  <div className="mb-4">
                    {question.mediaType === 'image' && <img src={question.mediaUrl} className="max-h-48 rounded-xl object-cover mx-auto" />}
                    {question.mediaType === 'audio' && <audio src={question.mediaUrl} controls className="w-full" autoPlay />}
                    {question.mediaType === 'video' && <video src={question.mediaUrl} controls className="max-h-48 w-full rounded-xl" autoPlay />}
                  </div>
                )}
                <h3 className="font-display font-bold text-xl text-white mb-4">{question.content}</h3>

                {/* Answer options */}
                {question.options?.length > 0 && Array.isArray(question.options) && (
                  <div className="grid grid-cols-2 gap-2">
                    {question.options.map((opt, i) => {
                      const colors = ['bg-red-500/20 border-red-500/40', 'bg-blue-500/20 border-blue-500/40', 'bg-yellow-500/20 border-yellow-500/40', 'bg-green-500/20 border-green-500/40'];
                      const isCorrect = questionFull?.correctAnswer === opt.id || (Array.isArray(questionFull?.correctAnswer) && questionFull.correctAnswer.includes(opt.id));
                      const answerCount = answers.filter(a => {
                        const ans = a.answer;
                        return ans === opt.id || (Array.isArray(ans) && ans.includes(opt.id));
                      }).length;

                      return (
                        <div key={opt.id} className={`relative p-3 rounded-xl border-2 ${isCorrect ? 'bg-green-500/20 border-green-500' : colors[i % 4]}`}>
                          <div className="flex items-center justify-between">
                            <span className="text-white text-sm font-medium">{opt.text}</span>
                            <span className="text-sm font-bold text-white bg-black/30 px-2 py-0.5 rounded-lg">{answerCount}</span>
                          </div>
                          {answers.length > 0 && (
                            <div className="mt-2 bg-black/30 rounded-full h-1.5">
                              <div className="h-1.5 rounded-full bg-white/50 transition-all"
                                style={{ width: `${(answerCount / answers.length) * 100}%` }} />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Correct answer reveal */}
                {questionFull && (
                  <div className="mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded-xl">
                    <p className="text-green-400 text-sm font-medium">✅ Bonne réponse: {
                      Array.isArray(questionFull.correctAnswer) ? questionFull.correctAnswer.join(', ') : String(questionFull.correctAnswer)
                    }</p>
                    {questionFull.explanation && <p className="text-gray-400 text-xs mt-1">{questionFull.explanation}</p>}
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8 text-gray-400">En attente de la prochaine question...</div>
            )}

            {/* Controls */}
            <div className="mt-4 flex gap-2">
              <button onClick={() => emit('creator:next_question')}
                className="btn-primary flex-1 btn-lg">
                {questionIndex + 1 >= totalQuestions ? '🏁 Terminer' : '⏭️ Question suivante'}
              </button>
              <button onClick={() => emit('creator:show_results')} className="btn-secondary">
                📊 Scores
              </button>
            </div>
          </div>

          {/* Recent answers */}
          <div className="card">
            <h3 className="font-semibold text-white mb-3">🎯 Réponses récentes</h3>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {answers.slice(-10).reverse().map((a, i) => (
                <div key={i} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm ${a.isCorrect ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                  <span>{a.isCorrect ? '✅' : '❌'}</span>
                  <span className="text-gray-300 flex-1">{a.name}</span>
                  <span className={`font-bold ${a.pointsEarned >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {a.pointsEarned >= 0 ? '+' : ''}{a.pointsEarned}
                  </span>
                </div>
              ))}
              {answers.length === 0 && <p className="text-gray-500 text-sm text-center py-2">En attente...</p>}
            </div>
          </div>
        </div>

        {/* Leaderboard + Chat */}
        <div className="space-y-4">
          {/* Live leaderboard */}
          <div className="card">
            <h3 className="font-semibold text-white mb-3">🏆 Classement Live</h3>
            <div className="space-y-2">
              {leaderboard.map((e, i) => (
                <div key={e.id} className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-all
                  ${i === 0 ? 'bg-yellow-500/10 border border-yellow-500/30' : 'bg-gray-800'}`}>
                  <span className={`font-display font-bold w-6 text-center ${i === 0 ? 'text-yellow-400' : i === 1 ? 'text-gray-300' : i === 2 ? 'text-amber-600' : 'text-gray-500'}`}>
                    {i + 1}
                  </span>
                  <AvatarDisplay avatar={e.avatar} size="sm" className="w-7 h-7 text-sm" />
                  <span className="text-white text-sm flex-1 truncate">{e.name}</span>
                  <span className="font-bold text-brand-400 text-sm">{e.score}</span>
                </div>
              ))}
              {leaderboard.length === 0 && <p className="text-gray-500 text-sm text-center">En attente...</p>}
            </div>
          </div>

          {/* Chat */}
          <ChatPanel
            messages={messages}
            onSend={handleSendMessage}
            participants={scores.participants}
            teams={scores.teams}
            myRole="creator"
            className="min-h-64"
          />
        </div>
      </div>
    </Layout>
  );
}
