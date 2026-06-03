import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function LaunchModal({ quizTitle, onConfirm, onClose }) {
  const [mode, setMode] = useState('projection');
  const [teamsEnabled, setTeamsEnabled] = useState(false);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative card w-full max-w-md space-y-6"
        >
          <div>
            <h2 className="font-display font-bold text-xl text-white">▶️ Lancer le quiz</h2>
            <p className="text-gray-400 text-sm mt-1 truncate">{quizTitle}</p>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium text-gray-300">Mode de jeu</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setMode('projection')}
                className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                  mode === 'projection'
                    ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                    : 'border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-500'
                }`}
              >
                <span className="text-3xl">📺</span>
                <span className="font-semibold text-sm">Projection</span>
                <span className="text-xs text-center opacity-70">Réponses affichées sur un écran commun</span>
              </button>
              <button
                onClick={() => setMode('device')}
                className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                  mode === 'device'
                    ? 'border-purple-500 bg-purple-500/10 text-purple-400'
                    : 'border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-500'
                }`}
              >
                <span className="text-3xl">📱</span>
                <span className="font-semibold text-sm">Appareils</span>
                <span className="text-xs text-center opacity-70">Chaque joueur répond sur son téléphone</span>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-800 rounded-2xl">
            <div>
              <p className="text-sm font-medium text-white">Équipes</p>
              <p className="text-xs text-gray-400">Regrouper les participants en équipes</p>
            </div>
            <button
              onClick={() => setTeamsEnabled(t => !t)}
              className={`relative w-12 h-6 rounded-full transition-colors ${teamsEnabled ? 'bg-green-500' : 'bg-gray-600'}`}
            >
              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${teamsEnabled ? 'translate-x-7' : 'translate-x-1'}`} />
            </button>
          </div>

          <div className="flex gap-3">
            <button onClick={onClose} className="btn-secondary flex-1">Annuler</button>
            <button onClick={() => onConfirm({ mode, teamsEnabled })} className="btn-accent flex-1">
              Créer la partie
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
