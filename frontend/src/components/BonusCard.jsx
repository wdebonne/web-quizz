import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { AvatarDisplay } from './AvatarPicker';

const BONUS_INFO = {
  immunity: { icon: '🛡️', name: 'Immunité', color: 'from-blue-500 to-cyan-500', category: 'defense' },
  double_points: { icon: '✖️2', name: 'Double Points', color: 'from-yellow-500 to-amber-500', category: 'boost' },
  extra_time: { icon: '⏰', name: 'Temps Bonus', color: 'from-green-500 to-emerald-500', category: 'boost' },
  free_answer: { icon: '🎯', name: 'Réponse Libre', color: 'from-purple-500 to-pink-500', category: 'boost' },
  steal_points: { icon: '💸', name: 'Vol de Points', color: 'from-red-500 to-orange-500', category: 'attack' },
  freeze: { icon: '🧊', name: 'Gel', color: 'from-cyan-500 to-blue-600', category: 'attack' },
  skip_question: { icon: '⏭️', name: 'Passer', color: 'from-gray-500 to-gray-600', category: 'neutral' },
  hint: { icon: '💡', name: 'Indice', color: 'from-yellow-400 to-yellow-500', category: 'boost' },
  reverse: { icon: '🔄', name: 'Inversé', color: 'from-red-600 to-pink-600', category: 'attack' },
  extra_wrong: { icon: '✅', name: 'Erreur Gratuite', color: 'from-green-400 to-teal-500', category: 'boost' },
  blind: { icon: '🙈', name: 'Aveugle', color: 'from-gray-600 to-gray-700', category: 'attack' },
  swap_scores: { icon: '🔀', name: 'Échange', color: 'from-orange-500 to-red-500', category: 'attack' },
};

export const BonusIcon = ({ type, size = 'md' }) => {
  const info = BONUS_INFO[type] || { icon: '⭐', name: type, color: 'from-gray-500 to-gray-600' };
  const sizes = { sm: 'w-8 h-8 text-lg', md: 'w-12 h-12 text-2xl', lg: 'w-16 h-16 text-3xl' };
  return (
    <div className={`${sizes[size]} rounded-xl bg-gradient-to-br ${info.color} flex items-center justify-center shadow-lg`}>
      {info.icon}
    </div>
  );
};

export default function BonusCard({ bonus, onUse, participants, teams, disabled }) {
  const [showTargets, setShowTargets] = useState(false);
  const info = BONUS_INFO[bonus.type] || { icon: '⭐', name: bonus.name || bonus.type, color: 'from-gray-500 to-gray-600' };
  const isAttack = info.category === 'attack';

  const handleUse = (targetId, targetType) => {
    onUse(bonus.type, targetId, targetType);
    setShowTargets(false);
  };

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.8, opacity: 0 }}
      className={`relative bg-gradient-to-br ${info.color} p-0.5 rounded-2xl shadow-lg`}>
      <div className="bg-gray-900 rounded-2xl p-4 h-full">
        <div className="flex items-center gap-3 mb-2">
          <BonusIcon type={bonus.type} size="md" />
          <div>
            <p className="font-bold text-white text-sm">{info.name}</p>
            <p className="text-xs text-gray-400">{bonus.description || info.description}</p>
          </div>
        </div>
        <button
          disabled={disabled}
          onClick={() => isAttack ? setShowTargets(true) : handleUse(null, null)}
          className={`w-full btn-sm bg-gradient-to-r ${info.color} text-white font-semibold rounded-xl mt-2`}>
          Utiliser
        </button>

        {/* Target selector for attack bonuses */}
        <AnimatePresence>
          {showTargets && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute left-0 right-0 bottom-full mb-2 bg-gray-800 border border-gray-700 rounded-2xl p-3 z-10 shadow-xl">
              <p className="text-xs text-gray-400 mb-2">Choisir une cible:</p>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {teams?.length > 0 && teams.map(t => (
                  <button key={t.id} onClick={() => handleUse(t.id, 'team')}
                    className="w-full text-left px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm flex items-center gap-2">
                    <span>{t.avatar}</span><span>{t.name}</span>
                    <span className="ml-auto text-gray-400">{t.score} pts</span>
                  </button>
                ))}
                {participants?.map(p => (
                  <button key={p.id} onClick={() => handleUse(p.id, 'participant')}
                    className="w-full text-left px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm flex items-center gap-2">
                    <AvatarDisplay avatar={p.avatar} size="sm" className="w-5 h-5" />
                    <span>{p.name}</span>
                    <span className="ml-auto text-gray-400">{p.score} pts</span>
                  </button>
                ))}
              </div>
              <button onClick={() => setShowTargets(false)} className="w-full btn-ghost btn-sm mt-2">Annuler</button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// Bonus notification overlay
export function BonusNotification({ bonus, fromName }) {
  if (!bonus) return null;
  const info = BONUS_INFO[bonus.type] || { icon: '⭐', name: bonus.type, color: 'from-gray-500 to-gray-600' };
  return (
    <motion.div
      initial={{ scale: 0.5, y: -50, opacity: 0 }}
      animate={{ scale: 1, y: 0, opacity: 1 }}
      exit={{ scale: 0.5, y: -50, opacity: 0 }}
      className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none">
      <div className={`bg-gradient-to-br ${info.color} p-1 rounded-3xl shadow-2xl`}>
        <div className="bg-gray-900 rounded-3xl px-8 py-6 text-center">
          <div className="text-6xl mb-3">{info.icon}</div>
          <p className="font-display font-bold text-2xl text-white">{info.name}</p>
          {fromName && <p className="text-gray-400 text-sm mt-1">de {fromName}</p>}
        </div>
      </div>
    </motion.div>
  );
}
