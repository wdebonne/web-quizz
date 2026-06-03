import { useState, useRef } from 'react';
import api from '../api';

const QUESTION_TYPES = [
  { value: 'single_choice', label: '🔘 Choix unique', icon: '🔘' },
  { value: 'multiple_choice', label: '☑️ Choix multiple', icon: '☑️' },
  { value: 'true_false', label: '✅ Vrai / Faux', icon: '✅' },
  { value: 'free_text', label: '⌨️ Texte libre', icon: '⌨️' },
  { value: 'ordering', label: '🔢 Ordre', icon: '🔢' },
  { value: 'matching', label: '🔗 Association', icon: '🔗' },
  { value: 'image', label: '🖼️ Image', icon: '🖼️' },
  { value: 'audio', label: '🎵 Audio', icon: '🎵' },
  { value: 'video', label: '🎬 Vidéo', icon: '🎬' },
  { value: 'slider', label: '🎚️ Curseur', icon: '🎚️' },
  { value: 'poll', label: '📊 Sondage', icon: '📊' },
];

const COLORS = ['🟥', '🟦', '🟨', '🟩', '🟧', '🟪'];

export default function QuestionEditor({ question, quizId, onSave, onCancel }) {
  const [form, setForm] = useState({
    type: 'single_choice',
    content: '',
    mediaUrl: '',
    mediaType: null,
    options: [
      { id: 'a', text: '' },
      { id: 'b', text: '' },
      { id: 'c', text: '' },
      { id: 'd', text: '' },
    ],
    correctAnswer: null,
    points: '',
    timeLimit: '',
    explanation: '',
    isBonus: false,
    bonusReward: null,
    hint: '',
    ...question,
  });
  const [saving, setSaving] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const mediaRef = useRef();

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleMediaUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingMedia(true);
    try {
      const form2 = new FormData();
      form2.append('file', file);
      const { data } = await api.post('/uploads/media', form2);
      set('mediaUrl', data.url);
      set('mediaType', data.mediaType);
    } catch { alert('Erreur upload'); }
    finally { setUploadingMedia(false); }
  };

  const updateOption = (idx, text) => {
    const opts = [...form.options];
    opts[idx] = { ...opts[idx], text };
    set('options', opts);
  };

  const addOption = () => set('options', [...form.options, { id: `opt_${Date.now()}`, text: '' }]);
  const removeOption = (idx) => set('options', form.options.filter((_, i) => i !== idx));

  const toggleCorrect = (id) => {
    if (form.type === 'single_choice' || form.type === 'image' || form.type === 'audio' || form.type === 'video') {
      set('correctAnswer', id);
    } else if (form.type === 'multiple_choice') {
      const cur = Array.isArray(form.correctAnswer) ? form.correctAnswer : [];
      if (cur.includes(id)) set('correctAnswer', cur.filter(x => x !== id));
      else set('correctAnswer', [...cur, id]);
    }
  };

  const isCorrect = (id) => {
    if (!form.correctAnswer) return false;
    if (Array.isArray(form.correctAnswer)) return form.correctAnswer.includes(id);
    return form.correctAnswer === id;
  };

  const handleSave = async () => {
    if (!form.content.trim()) return alert('La question est vide.');
    setSaving(true);
    try {
      const payload = {
        ...form,
        points: form.points === '' ? null : Number(form.points),
        timeLimit: form.timeLimit === '' ? null : Number(form.timeLimit),
      };
      let saved;
      if (question?.id) {
        const { data } = await api.put(`/quizzes/${quizId}/questions/${question.id}`, payload);
        saved = data;
      } else {
        const { data } = await api.post(`/quizzes/${quizId}/questions`, payload);
        saved = data;
      }
      onSave(saved);
    } catch { alert('Erreur lors de la sauvegarde.'); }
    finally { setSaving(false); }
  };

  const showOptions = ['single_choice', 'multiple_choice', 'image', 'audio', 'video'].includes(form.type);
  const showMedia = ['image', 'audio', 'video'].includes(form.type);

  return (
    <div className="space-y-6">
      {/* Type */}
      <div>
        <label className="label">Type de question</label>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {QUESTION_TYPES.map(t => (
            <button key={t.value} onClick={() => set('type', t.value)}
              className={`p-3 rounded-xl text-sm font-medium text-center transition-all
                ${form.type === t.value ? 'bg-brand-500/20 border-2 border-brand-500 text-brand-400' : 'bg-gray-800 border-2 border-transparent text-gray-300 hover:border-gray-600'}`}>
              <div className="text-xl mb-1">{t.icon}</div>
              <div className="text-xs">{t.label.split(' ').slice(1).join(' ')}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Question content */}
      <div>
        <label className="label">Question *</label>
        <textarea value={form.content} onChange={e => set('content', e.target.value)}
          rows={3} placeholder="Entrez votre question..." className="input resize-none" />
      </div>

      {/* Media upload */}
      {showMedia && (
        <div>
          <label className="label">Média ({form.type})</label>
          {form.mediaUrl ? (
            <div className="space-y-2">
              {form.mediaType === 'image' && <img src={form.mediaUrl} alt="media" className="max-h-48 rounded-xl object-cover" />}
              {form.mediaType === 'audio' && <audio src={form.mediaUrl} controls className="w-full" />}
              {form.mediaType === 'video' && <video src={form.mediaUrl} controls className="max-h-48 w-full rounded-xl" />}
              <button onClick={() => { set('mediaUrl', ''); set('mediaType', null); }} className="btn-danger btn-sm">Supprimer</button>
            </div>
          ) : (
            <>
              <input ref={mediaRef} type="file"
                accept={form.type === 'image' ? 'image/*' : form.type === 'audio' ? 'audio/*' : 'video/*'}
                onChange={handleMediaUpload} className="hidden" />
              <button onClick={() => mediaRef.current?.click()} disabled={uploadingMedia} className="btn-secondary w-full">
                {uploadingMedia ? '⏳ Upload...' : `📁 Ajouter ${form.type === 'image' ? 'une image' : form.type === 'audio' ? 'un audio' : 'une vidéo'}`}
              </button>
              <p className="text-xs text-gray-500 mt-1">Ou coller une URL:</p>
              <input value={form.mediaUrl} onChange={e => { set('mediaUrl', e.target.value); set('mediaType', form.type); }}
                placeholder={`URL du ${form.type}...`} className="input" />
            </>
          )}
        </div>
      )}

      {/* True/False */}
      {form.type === 'true_false' && (
        <div>
          <label className="label">Bonne réponse</label>
          <div className="flex gap-3">
            {['true', 'false'].map(v => (
              <button key={v} onClick={() => set('correctAnswer', v)}
                className={`flex-1 py-3 rounded-xl font-bold transition-all
                  ${form.correctAnswer === v ? 'bg-green-500 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}>
                {v === 'true' ? '✅ Vrai' : '❌ Faux'}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Options */}
      {showOptions && (
        <div>
          <label className="label">Options de réponse</label>
          <div className="space-y-2">
            {form.options.map((opt, idx) => (
              <div key={opt.id} className={`flex gap-2 items-center p-2 rounded-xl transition-all
                ${isCorrect(opt.id) ? 'bg-green-500/10 border border-green-500/40' : 'bg-gray-800 border border-transparent'}`}>
                <span className="text-xl">{COLORS[idx % COLORS.length]}</span>
                <input value={opt.text} onChange={e => updateOption(idx, e.target.value)}
                  placeholder={`Option ${idx + 1}`}
                  className="flex-1 bg-transparent border-none outline-none text-white placeholder-gray-500" />
                <button onClick={() => toggleCorrect(opt.id)}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all
                    ${isCorrect(opt.id) ? 'bg-green-500 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'}`}>
                  ✓
                </button>
                {form.options.length > 2 && (
                  <button onClick={() => removeOption(idx)} className="w-8 h-8 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/40 flex items-center justify-center">×</button>
                )}
              </div>
            ))}
          </div>
          {form.options.length < 8 && (
            <button onClick={addOption} className="btn-secondary btn-sm mt-2 w-full">+ Ajouter une option</button>
          )}
        </div>
      )}

      {/* Free text answer */}
      {form.type === 'free_text' && (
        <div>
          <label className="label">Réponse(s) acceptée(s) (une par ligne)</label>
          <textarea
            value={Array.isArray(form.correctAnswer) ? form.correctAnswer.join('\n') : form.correctAnswer || ''}
            onChange={e => set('correctAnswer', e.target.value.split('\n').filter(Boolean))}
            rows={3} placeholder="Paris&#10;paris&#10;PARIS" className="input resize-none" />
          <p className="text-xs text-gray-500 mt-1">Insensible à la casse. Plusieurs variantes acceptées.</p>
        </div>
      )}

      {/* Slider */}
      {form.type === 'slider' && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Valeur correcte</label>
            <input type="number" value={form.correctAnswer || ''} onChange={e => set('correctAnswer', Number(e.target.value))}
              placeholder="42" className="input" />
          </div>
          <div>
            <label className="label">Tolérance (±)</label>
            <input type="number" value={form.options?.tolerance || 0}
              onChange={e => set('options', { ...form.options, tolerance: Number(e.target.value), min: form.options?.min || 0, max: form.options?.max || 100 })}
              placeholder="0" className="input" />
          </div>
          <div>
            <label className="label">Min</label>
            <input type="number" value={form.options?.min ?? 0}
              onChange={e => set('options', { ...form.options, min: Number(e.target.value) })} className="input" />
          </div>
          <div>
            <label className="label">Max</label>
            <input type="number" value={form.options?.max ?? 100}
              onChange={e => set('options', { ...form.options, max: Number(e.target.value) })} className="input" />
          </div>
        </div>
      )}

      {/* Points & Time */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Points (vide = défaut quiz)</label>
          <input type="number" value={form.points} onChange={e => set('points', e.target.value)}
            min="0" placeholder="Défaut" className="input" />
        </div>
        <div>
          <label className="label">Temps (s, 0 = illimité)</label>
          <input type="number" value={form.timeLimit} onChange={e => set('timeLimit', e.target.value)}
            min="0" placeholder="Défaut" className="input" />
        </div>
      </div>

      {/* Explanation */}
      <div>
        <label className="label">Explication (montrée après la réponse)</label>
        <textarea value={form.explanation || ''} onChange={e => set('explanation', e.target.value)}
          rows={2} placeholder="Optionnel..." className="input resize-none" />
      </div>

      {/* Hint */}
      <div>
        <label className="label">Indice (révélé avec le bonus Indice)</label>
        <input value={form.hint || ''} onChange={e => set('hint', e.target.value)}
          placeholder="Optionnel..." className="input" />
      </div>

      {/* Bonus question */}
      <div>
        <label className="flex items-center gap-3 cursor-pointer">
          <div onClick={() => set('isBonus', !form.isBonus)}
            className={`w-12 h-6 rounded-full transition-colors ${form.isBonus ? 'bg-brand-500' : 'bg-gray-700'}`}>
            <div className={`w-6 h-6 bg-white rounded-full transition-transform ${form.isBonus ? 'translate-x-6' : 'translate-x-0'}`} />
          </div>
          <span className="text-gray-300 text-sm">Question Bonus (la réponse correcte donne un bonus)</span>
        </label>
        {form.isBonus && (
          <div className="mt-3 p-4 bg-gray-800 rounded-xl">
            <label className="label">Type de bonus récompensé</label>
            <select value={form.bonusReward?.type || ''}
              onChange={e => set('bonusReward', { type: e.target.value })}
              className="input">
              <option value="">Aléatoire</option>
              <option value="immunity">🛡️ Immunité</option>
              <option value="double_points">✖️2 Double Points</option>
              <option value="extra_time">⏰ Temps Bonus</option>
              <option value="free_answer">🎯 Réponse Libre</option>
              <option value="steal_points">💸 Vol de Points</option>
              <option value="freeze">🧊 Gel</option>
              <option value="skip_question">⏭️ Passer</option>
              <option value="hint">💡 Indice</option>
              <option value="extra_wrong">✅ Erreur Gratuite</option>
            </select>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4 border-t border-gray-800">
        <button onClick={onCancel} className="btn-secondary flex-1">Annuler</button>
        <button onClick={handleSave} disabled={saving} className="btn-primary flex-1">
          {saving ? '⏳ Sauvegarde...' : question?.id ? '✅ Modifier' : '✅ Ajouter'}
        </button>
      </div>
    </div>
  );
}
