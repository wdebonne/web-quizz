import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import api from '../api';
import { motion } from 'framer-motion';

export default function Dashboard() {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/quizzes').then(({ data }) => setQuizzes(data)).finally(() => setLoading(false));
  }, []);

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    setCreating(true);
    try {
      const { data } = await api.post('/quizzes', { title: newTitle.trim() });
      navigate(`/quiz/${data.id}`);
    } catch { alert('Erreur.'); }
    finally { setCreating(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Supprimer ce quiz ?')) return;
    await api.delete(`/quizzes/${id}`);
    setQuizzes(q => q.filter(x => x.id !== id));
  };

  const handleCreateGame = async (quizId) => {
    try {
      const { data } = await api.post('/games', { quizId });
      navigate(`/game/${data.id}/lobby`);
    } catch (err) { alert(err.response?.data?.error || 'Erreur.'); }
  };

  return (
    <Layout
      title="Mes Quiz"
      actions={
        <div className="flex gap-2">
          <input value={newTitle} onChange={e => setNewTitle(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCreate()}
            placeholder="Nom du nouveau quiz..." className="input py-2 w-48 sm:w-64" />
          <button onClick={handleCreate} disabled={creating || !newTitle.trim()} className="btn-primary">
            {creating ? '⏳' : '+ Créer'}
          </button>
        </div>
      }>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : quizzes.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-7xl mb-4">🎮</div>
          <h2 className="font-display font-bold text-2xl text-white mb-2">Aucun quiz encore</h2>
          <p className="text-gray-400 mb-6">Créez votre premier quiz pour commencer !</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {quizzes.map((quiz, i) => (
            <motion.div key={quiz.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="card-hover group">

              {quiz.coverImage && (
                <img src={quiz.coverImage} alt={quiz.title} className="w-full h-32 object-cover rounded-xl mb-4" />
              )}

              <div className="flex items-start justify-between gap-2 mb-3">
                <h3 className="font-display font-bold text-white text-lg line-clamp-2">{quiz.title}</h3>
                {quiz.isPublished && <span className="badge bg-green-500/20 text-green-400">Publié</span>}
              </div>

              {quiz.description && <p className="text-gray-400 text-sm line-clamp-2 mb-3">{quiz.description}</p>}

              <div className="flex items-center gap-3 text-sm text-gray-500 mb-4">
                <span>❓ {quiz.questionCount || 0} questions</span>
                <span>⭐ {quiz.defaultPoints} pts</span>
                <span>⏱️ {quiz.defaultTimeLimit}s</span>
              </div>

              {quiz.tags?.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-4">
                  {quiz.tags.map(tag => (
                    <span key={tag} className="badge bg-gray-800 text-gray-400">#{tag}</span>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <Link to={`/quiz/${quiz.id}`} className="btn-secondary btn-sm flex-1 text-center">
                  ✏️ Éditer
                </Link>
                <button onClick={() => handleCreateGame(quiz.id)}
                  disabled={!quiz.questionCount}
                  className="btn-primary btn-sm flex-1"
                  title={!quiz.questionCount ? 'Ajoutez des questions d\'abord' : ''}>
                  ▶️ Lancer
                </button>
                <button onClick={() => handleDelete(quiz.id)}
                  className="btn-ghost btn-sm text-red-400 hover:text-red-300 px-2">
                  🗑️
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </Layout>
  );
}
