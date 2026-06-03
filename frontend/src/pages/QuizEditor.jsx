import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import QuestionEditor from '../components/QuestionEditor';
import LaunchModal from '../components/LaunchModal';
import api from '../api';
import { motion, AnimatePresence } from 'framer-motion';

export default function QuizEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingQ, setEditingQ] = useState(null);
  const [showQEditor, setShowQEditor] = useState(false);
  const [activeTab, setActiveTab] = useState('questions');
  const [showLaunchModal, setShowLaunchModal] = useState(false);

  useEffect(() => {
    if (id) {
      api.get(`/quizzes/${id}`).then(({ data }) => {
        setQuiz(data);
        setQuestions([...(data.questions || [])].sort((a, b) => a.order - b.order));
      }).finally(() => setLoading(false));
    } else setLoading(false);
  }, [id]);

  const saveQuizSettings = async () => {
    setSaving(true);
    try {
      if (id) {
        await api.put(`/quizzes/${id}`, quiz);
      }
    } catch { alert('Erreur sauvegarde.'); }
    finally { setSaving(false); }
  };

  const handleSaveQuestion = (savedQ) => {
    if (editingQ?.id) {
      setQuestions(qs => qs.map(q => q.id === savedQ.id ? savedQ : q));
    } else {
      setQuestions(qs => [...qs, savedQ]);
    }
    setShowQEditor(false);
    setEditingQ(null);
  };

  const handleDeleteQuestion = async (qid) => {
    if (!confirm('Supprimer cette question ?')) return;
    await api.delete(`/quizzes/${id}/questions/${qid}`);
    setQuestions(qs => qs.filter(q => q.id !== qid));
  };

  const handleMoveQuestion = async (qid, direction) => {
    const idx = questions.findIndex(q => q.id === qid);
    if (direction === 'up' && idx === 0) return;
    if (direction === 'down' && idx === questions.length - 1) return;
    const newQs = [...questions];
    const swap = direction === 'up' ? idx - 1 : idx + 1;
    [newQs[idx], newQs[swap]] = [newQs[swap], newQs[idx]];
    setQuestions(newQs);
    await api.put(`/quizzes/${id}/questions/reorder`, { orderedIds: newQs.map(q => q.id) });
  };

  const handleCreateGame = async ({ mode, teamsEnabled }) => {
    setShowLaunchModal(false);
    try {
      const { data } = await api.post('/games', { quizId: id, mode, teamsEnabled });
      navigate(`/game/${data.id}/lobby`);
    } catch (err) { alert(err.response?.data?.error || 'Erreur.'); }
  };

  const QUESTION_TYPE_LABELS = {
    single_choice: '🔘', multiple_choice: '☑️', true_false: '✅', free_text: '⌨️',
    ordering: '🔢', matching: '🔗', image: '🖼️', audio: '🎵', video: '🎬', slider: '🎚️', poll: '📊',
  };

  if (loading) return (
    <Layout title="Chargement...">
      <div className="flex justify-center py-20">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    </Layout>
  );

  return (
    <Layout
      title={quiz?.title || 'Nouveau Quiz'}
      actions={
        <div className="flex gap-2">
          {id && (
            <button onClick={() => { if (questions.length === 0) return alert('Ajoutez au moins une question !'); setShowLaunchModal(true); }} className="btn-accent">
              ▶️ Lancer
            </button>
          )}
          <button onClick={saveQuizSettings} disabled={saving} className="btn-primary">
            {saving ? '⏳' : '💾 Sauvegarder'}
          </button>
        </div>
      }>

      <div className="flex gap-4 mb-6">
        {['questions', 'settings', 'bonuses'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl font-medium transition-all ${activeTab === tab ? 'bg-brand-500 text-white' : 'text-gray-400 hover:text-white'}`}>
            {tab === 'questions' ? `❓ Questions (${questions.length})` : tab === 'settings' ? '⚙️ Paramètres' : '⭐ Bonus'}
          </button>
        ))}
      </div>

      {/* QUESTIONS TAB */}
      {activeTab === 'questions' && (
        <div className="space-y-4">
          {/* Add question button */}
          <button onClick={() => { setEditingQ(null); setShowQEditor(true); }}
            className="btn-primary w-full py-4 text-lg">
            + Ajouter une question
          </button>

          {/* Question list */}
          <AnimatePresence>
            {questions.map((q, idx) => (
              <motion.div key={q.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="card flex gap-4 items-start">
                <div className="flex flex-col items-center gap-1">
                  <span className="text-gray-400 text-sm font-mono">{idx + 1}</span>
                  <button onClick={() => handleMoveQuestion(q.id, 'up')} disabled={idx === 0}
                    className="text-gray-500 hover:text-white disabled:opacity-30">▲</button>
                  <button onClick={() => handleMoveQuestion(q.id, 'down')} disabled={idx === questions.length - 1}
                    className="text-gray-500 hover:text-white disabled:opacity-30">▼</button>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2 flex-wrap">
                    <span className="text-xl">{QUESTION_TYPE_LABELS[q.type] || '❓'}</span>
                    <p className="font-medium text-white flex-1 line-clamp-2">{q.content}</p>
                    {q.isBonus && <span className="badge bg-yellow-500/20 text-yellow-400">⭐ Bonus</span>}
                  </div>
                  <div className="flex gap-3 mt-1 text-xs text-gray-500">
                    <span>⭐ {q.points ?? 'Défaut'} pts</span>
                    <span>⏱️ {q.timeLimit ?? 'Défaut'}s</span>
                    {q.options?.length > 0 && <span>📋 {Array.isArray(q.options) ? q.options.length : 0} options</span>}
                  </div>
                </div>

                <div className="flex gap-1">
                  <button onClick={() => { setEditingQ(q); setShowQEditor(true); }}
                    className="btn-ghost btn-sm">✏️</button>
                  <button onClick={() => handleDeleteQuestion(q.id)}
                    className="btn-ghost btn-sm text-red-400">🗑️</button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {questions.length === 0 && !showQEditor && (
            <div className="text-center py-12 text-gray-500">
              <div className="text-5xl mb-3">❓</div>
              <p>Aucune question. Cliquez sur "+ Ajouter" pour commencer.</p>
            </div>
          )}
        </div>
      )}

      {/* SETTINGS TAB */}
      {activeTab === 'settings' && quiz && (
        <div className="card max-w-2xl space-y-6">
          <div>
            <label className="label">Titre *</label>
            <input value={quiz.title} onChange={e => setQuiz(q => ({ ...q, title: e.target.value }))}
              className="input" maxLength={200} />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea value={quiz.description || ''} onChange={e => setQuiz(q => ({ ...q, description: e.target.value }))}
              rows={3} className="input resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Points par défaut</label>
              <input type="number" min="0" value={quiz.defaultPoints}
                onChange={e => setQuiz(q => ({ ...q, defaultPoints: Number(e.target.value) }))}
                className="input" />
            </div>
            <div>
              <label className="label">Pénalité fausse réponse (%)</label>
              <input type="number" min="0" max="100" value={quiz.penaltyPercent}
                onChange={e => setQuiz(q => ({ ...q, penaltyPercent: Number(e.target.value) }))}
                className="input" />
            </div>
            <div>
              <label className="label">Temps par question (s)</label>
              <input type="number" min="0" value={quiz.defaultTimeLimit}
                onChange={e => setQuiz(q => ({ ...q, defaultTimeLimit: Number(e.target.value) }))}
                className="input" />
            </div>
            <div>
              <label className="label">Temps global (s, 0=désactivé)</label>
              <input type="number" min="0" value={quiz.globalTimeLimit}
                onChange={e => setQuiz(q => ({ ...q, globalTimeLimit: Number(e.target.value) }))}
                className="input" />
            </div>
          </div>
          <div>
            <label className="label">Tags (séparés par virgule)</label>
            <input value={(quiz.tags || []).join(', ')}
              onChange={e => setQuiz(q => ({ ...q, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) }))}
              placeholder="culture, histoire, science..." className="input" />
          </div>
          <button onClick={saveQuizSettings} disabled={saving} className="btn-primary">
            {saving ? '⏳ Sauvegarde...' : '💾 Sauvegarder les paramètres'}
          </button>
        </div>
      )}

      {/* BONUSES TAB */}
      {activeTab === 'bonuses' && (
        <BonusManager quizId={id} />
      )}

      {/* Launch modal */}
      {showLaunchModal && (
        <LaunchModal
          quizTitle={quiz?.title}
          onConfirm={handleCreateGame}
          onClose={() => setShowLaunchModal(false)}
        />
      )}

      {/* Question editor modal */}
      <AnimatePresence>
        {showQEditor && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-50 flex items-start justify-center p-4 overflow-y-auto">
            <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
              className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-2xl my-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display font-bold text-xl text-white">
                  {editingQ ? 'Modifier la question' : 'Nouvelle question'}
                </h2>
                <button onClick={() => { setShowQEditor(false); setEditingQ(null); }}
                  className="btn-ghost btn-sm">✕</button>
              </div>
              <QuestionEditor
                question={editingQ}
                quizId={id}
                onSave={handleSaveQuestion}
                onCancel={() => { setShowQEditor(false); setEditingQ(null); }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Layout>
  );
}

function BonusManager({ quizId }) {
  const [bonuses, setBonuses] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ type: 'immunity', name: '', icon: '⭐', description: '' });

  useEffect(() => {
    if (quizId) api.get(`/quizzes/${quizId}/bonuses`).then(({ data }) => setBonuses(data));
  }, [quizId]);

  const handleAdd = async () => {
    const { data } = await api.post(`/quizzes/${quizId}/bonuses`, form);
    setBonuses(b => [...b, data]);
    setShowForm(false);
    setForm({ type: 'immunity', name: '', icon: '⭐', description: '' });
  };

  const handleDelete = async (id) => {
    await api.delete(`/quizzes/${quizId}/bonuses/${id}`);
    setBonuses(b => b.filter(x => x.id !== id));
  };

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="flex items-center justify-between">
        <p className="text-gray-400 text-sm">Bonus personnalisés attribuables aux questions bonus de ce quiz.</p>
        <button onClick={() => setShowForm(true)} className="btn-primary btn-sm">+ Ajouter</button>
      </div>

      {bonuses.map(b => (
        <div key={b.id} className="card flex items-center gap-4">
          <span className="text-2xl">{b.icon}</span>
          <div className="flex-1">
            <p className="font-semibold text-white">{b.name}</p>
            <p className="text-sm text-gray-400">{b.type} — {b.description}</p>
          </div>
          <button onClick={() => handleDelete(b.id)} className="btn-ghost btn-sm text-red-400">🗑️</button>
        </div>
      ))}

      {showForm && (
        <div className="card space-y-4 border-brand-500/50">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Type de bonus</label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className="input">
                <option value="immunity">Immunité</option>
                <option value="double_points">Double Points</option>
                <option value="extra_time">Temps Bonus</option>
                <option value="free_answer">Réponse Libre</option>
                <option value="steal_points">Vol de Points</option>
                <option value="freeze">Gel</option>
                <option value="skip_question">Passer</option>
                <option value="hint">Indice</option>
                <option value="extra_wrong">Erreur Gratuite</option>
                <option value="blind">Aveugle</option>
                <option value="swap_scores">Échange</option>
              </select>
            </div>
            <div>
              <label className="label">Icône</label>
              <input value={form.icon} onChange={e => setForm(f => ({ ...f, icon: e.target.value }))} className="input" />
            </div>
          </div>
          <div>
            <label className="label">Nom</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="input" />
          </div>
          <div>
            <label className="label">Description</label>
            <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="input" />
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowForm(false)} className="btn-secondary flex-1">Annuler</button>
            <button onClick={handleAdd} className="btn-primary flex-1">Ajouter</button>
          </div>
        </div>
      )}
    </div>
  );
}
