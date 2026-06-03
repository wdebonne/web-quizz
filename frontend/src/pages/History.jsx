import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { AvatarDisplay } from '../components/AvatarPicker';
import api from '../api';
import { motion } from 'framer-motion';

export default function History() {
  const [histories, setHistories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    api.get('/games/history/all').then(({ data }) => setHistories(data)).finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id) => {
    if (!confirm('Supprimer cet historique ?')) return;
    await api.delete(`/games/history/${id}`);
    setHistories(h => h.filter(x => x.id !== id));
    if (selected?.id === id) setSelected(null);
  };

  const formatDuration = (s) => {
    if (!s) return '—';
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}m${sec.toString().padStart(2, '0')}s`;
  };

  return (
    <Layout title="Historique des parties">
      {loading ? (
        <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : histories.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">📊</div>
          <p className="text-gray-400">Aucune partie terminée</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-3">
            {histories.map((h, i) => (
              <motion.div key={h.id}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                onClick={() => setSelected(h)}
                className={`card-hover cursor-pointer ${selected?.id === h.id ? 'border-brand-500/70 bg-gray-800' : ''}`}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-white truncate">{h.quizTitle}</h3>
                    <p className="text-sm text-gray-400 mt-1">
                      {new Date(h.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <button onClick={e => { e.stopPropagation(); handleDelete(h.id); }}
                    className="btn-ghost btn-sm text-red-400 flex-shrink-0">🗑️</button>
                </div>
                <div className="flex gap-3 mt-3 text-xs text-gray-500">
                  <span>👥 {h.participantCount}</span>
                  <span>❓ {h.questionCount}</span>
                  <span>⏱️ {formatDuration(h.durationSeconds)}</span>
                  <span>{h.mode === 'projection' ? '📺' : '📱'}</span>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Detail panel */}
          <div className="lg:col-span-2">
            {selected ? (
              <div className="card">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="font-display font-bold text-2xl text-white">{selected.quizTitle}</h2>
                    <p className="text-gray-400 text-sm">{new Date(selected.createdAt).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  </div>
                  <div className="flex gap-2">
                    <span className="badge bg-gray-800 text-gray-300">⏱️ {formatDuration(selected.durationSeconds)}</span>
                    <span className="badge bg-brand-500/20 text-brand-400">{selected.participantCount} joueurs</span>
                  </div>
                </div>

                <h3 className="font-semibold text-white mb-3">🏆 Classement final</h3>
                <div className="space-y-2">
                  {selected.leaderboard.map((entry, i) => (
                    <div key={entry.id} className={`flex items-center gap-3 px-4 py-3 rounded-xl
                      ${i === 0 ? 'bg-yellow-500/10 border border-yellow-500/30' : i === 1 ? 'bg-gray-500/10 border border-gray-500/20' : i === 2 ? 'bg-amber-700/10 border border-amber-700/20' : 'bg-gray-800'}`}>
                      <span className={`font-display font-black text-2xl w-8 text-center
                        ${i === 0 ? 'text-yellow-400' : i === 1 ? 'text-gray-300' : i === 2 ? 'text-amber-600' : 'text-gray-500'}`}>
                        {entry.rank}
                      </span>
                      <AvatarDisplay avatar={entry.avatar} size="md" />
                      <div className="flex-1">
                        <p className="font-bold text-white">{entry.name}</p>
                        {entry.streak > 2 && <p className="text-xs text-orange-400">🔥 Série de {entry.streak}</p>}
                        {entry.members && (
                          <p className="text-xs text-gray-400">{entry.members.map(m => m.name).join(', ')}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-display font-bold text-xl text-brand-400">{entry.score} pts</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <div className="text-5xl mb-3">👆</div>
                  <p>Sélectionnez une partie</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </Layout>
  );
}
