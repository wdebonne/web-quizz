import { useLocation, useNavigate } from 'react-router-dom';
import { AvatarDisplay } from '../components/AvatarPicker';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export default function GameFinished() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const leaderboard = state?.leaderboard || [];
  const myId = state?.myId;
  const [confetti, setConfetti] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setConfetti(false), 4000);
    return () => clearTimeout(t);
  }, []);

  const myRank = leaderboard.findIndex(e => e.id === myId) + 1;

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-6">
      {confetti && (
        <div className="confetti-container">
          {[...Array(50)].map((_, i) => (
            <div key={i} className="absolute rounded-full opacity-70"
              style={{
                width: `${Math.random() * 10 + 5}px`,
                height: `${Math.random() * 10 + 5}px`,
                background: ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#3b82f6'][Math.floor(Math.random() * 5)],
                left: `${Math.random() * 100}%`,
                top: '-20px',
                animation: `fall ${Math.random() * 3 + 2}s linear ${Math.random() * 2}s forwards`,
              }} />
          ))}
        </div>
      )}

      <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="text-center mb-8">
        <div className="text-7xl mb-4">🏆</div>
        <h1 className="font-display font-black text-4xl text-white">Partie terminée !</h1>
        {myRank > 0 && (
          <p className="text-xl text-gray-300 mt-2">
            Vous êtes <span className="text-brand-400 font-bold">
              {myRank === 1 ? '🥇 1er' : myRank === 2 ? '🥈 2ème' : myRank === 3 ? '🥉 3ème' : `${myRank}ème`}
            </span>
          </p>
        )}
      </motion.div>

      <div className="w-full max-w-md space-y-3">
        {leaderboard.slice(0, 10).map((entry, i) => (
          <motion.div key={entry.id}
            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl
              ${entry.id === myId ? 'bg-brand-500/20 border-2 border-brand-500' : i === 0 ? 'bg-yellow-500/10 border border-yellow-500/30' : 'bg-gray-800'}`}>
            <span className={`font-display font-black text-2xl w-8 text-center
              ${i === 0 ? 'text-yellow-400' : i === 1 ? 'text-gray-300' : i === 2 ? 'text-amber-600' : 'text-gray-500'}`}>
              {i + 1}
            </span>
            <AvatarDisplay avatar={entry.avatar} size="md" />
            <span className="flex-1 font-bold text-white">{entry.name}
              {entry.id === myId && <span className="text-brand-400 text-sm ml-2">(vous)</span>}
            </span>
            <span className="font-display font-bold text-xl text-brand-400">{entry.score}</span>
          </motion.div>
        ))}
      </div>

      <button onClick={() => navigate('/join')} className="btn-primary btn-lg mt-8">
        🎮 Rejouer
      </button>

      <style>{`
        @keyframes fall {
          to { transform: translateY(110vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
