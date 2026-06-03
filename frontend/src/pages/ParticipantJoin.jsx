import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import AvatarPicker from '../components/AvatarPicker';
import { connectParticipant, disconnect } from '../socket';
import api from '../api';
import { useAppSettings } from '../contexts/AppSettingsContext';
import { motion, AnimatePresence } from 'framer-motion';
import { v4 as uuidv4 } from 'uuid';

const STEPS = { CODE: 'code', INFO: 'info', AVATAR: 'avatar', TEAM: 'team' };

export default function ParticipantJoin() {
  const { code: codeParam } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { settings } = useAppSettings();

  const [step, setStep] = useState(codeParam ? STEPS.INFO : STEPS.CODE);
  const [code, setCode] = useState((codeParam || '').toUpperCase());
  const [session, setSession] = useState(null);
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('dicebear:star');
  const [teamOption, setTeamOption] = useState('none');
  const [teamCode, setTeamCode] = useState(searchParams.get('team') || '');
  const [teamName, setTeamName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [participantId] = useState(() => uuidv4());

  useEffect(() => {
    if (codeParam) validateCode(codeParam);
  }, [codeParam]);

  const validateCode = async (c) => {
    setLoading(true); setError('');
    try {
      const { data } = await api.get(`/games/join/${c.toUpperCase()}`);
      setSession(data);
      setCode(c.toUpperCase());
      setStep(STEPS.INFO);
    } catch (err) {
      setError(err.response?.data?.error || 'Code invalide.');
    } finally { setLoading(false); }
  };

  const handleCodeSubmit = (e) => {
    e.preventDefault();
    if (!code.trim()) return;
    validateCode(code.trim());
  };

  const handleInfoNext = (e) => {
    e.preventDefault();
    if (!name.trim() || name.length < 2) return setError('Pseudo trop court (2 min).');
    if (name.length > 30) return setError('Pseudo trop long (30 max).');
    setError('');
    setStep(STEPS.AVATAR);
  };

  const handleAvatarNext = () => {
    if (session?.teamsEnabled) setStep(STEPS.TEAM);
    else handleJoin();
  };

  const handleJoin = () => {
    setLoading(true);
    const socket = connectParticipant(participantId, code);

    socket.on('connect', () => {
      socket.emit('participant:join', {
        sessionCode: code,
        name: name.trim(),
        avatar,
        teamId: null,
        teamCode: teamCode || null,
        createTeam: teamOption === 'create',
        teamName: teamName.trim() || null,
      });
    });

    socket.on('participant:joined', ({ participant, session: s }) => {
      localStorage.setItem(`participant_${s.id}`, JSON.stringify({ id: participant.id, name: participant.name, avatar: participant.avatar }));
      if (s.status === 'active') {
        navigate(`/play/${s.id}`, { state: { participant, session: s } });
      } else {
        navigate(`/play/${s.id}/waiting`, { state: { participant, session: s } });
      }
    });

    socket.on('team:created', ({ team }) => {
      alert(`Équipe "${team.name}" créée ! Code équipe: ${team.code}`);
    });

    socket.on('error', ({ message }) => {
      setError(message);
      setLoading(false);
      disconnect();
    });
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="absolute rounded-full blur-3xl opacity-10"
            style={{
              width: `${150 + i * 80}px`, height: `${150 + i * 80}px`,
              background: i % 2 === 0 ? '#6366f1' : '#f59e0b',
              left: `${5 + i * 20}%`, top: `${5 + (i % 3) * 25}%`,
              animation: `float ${3 + i}s ease-in-out ${i * 0.7}s infinite`,
            }} />
        ))}
      </div>

      <div className="w-full max-w-md relative">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🎮</div>
          <h1 className="font-display font-black text-3xl text-white">{settings.app_name || 'QuizzApp'}</h1>
          {session && <p className="text-brand-400 font-semibold mt-1">{session.quiz?.title}</p>}
        </div>

        {/* Progress */}
        {step !== STEPS.CODE && (
          <div className="flex gap-2 mb-6">
            {[STEPS.INFO, STEPS.AVATAR, ...(session?.teamsEnabled ? [STEPS.TEAM] : [])].map((s, i) => (
              <div key={s} className={`flex-1 h-1.5 rounded-full transition-all ${
                [STEPS.INFO, STEPS.AVATAR, STEPS.TEAM].indexOf(step) >= i ? 'bg-brand-500' : 'bg-gray-700'
              }`} />
            ))}
          </div>
        )}

        <AnimatePresence mode="wait">
          {/* STEP: CODE */}
          {step === STEPS.CODE && (
            <motion.div key="code" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className="card">
              <h2 className="font-display font-bold text-xl text-white mb-6">Rejoindre une partie</h2>
              <form onSubmit={handleCodeSubmit} className="space-y-4">
                <div>
                  <label className="label">Code de la partie</label>
                  <input
                    value={code}
                    onChange={e => setCode(e.target.value.toUpperCase())}
                    placeholder="ABC123"
                    className="input text-center text-3xl font-display font-bold tracking-widest"
                    maxLength={8}
                    autoFocus
                  />
                </div>
                {error && <p className="text-red-400 text-sm text-center">{error}</p>}
                <button type="submit" disabled={loading || !code.trim()} className="btn-primary w-full btn-lg">
                  {loading ? '⏳ Vérification...' : '→ Rejoindre'}
                </button>
              </form>
            </motion.div>
          )}

          {/* STEP: INFO (name) */}
          {step === STEPS.INFO && (
            <motion.div key="info" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}
              className="card">
              <h2 className="font-display font-bold text-xl text-white mb-6">Votre pseudo</h2>
              <form onSubmit={handleInfoNext} className="space-y-4">
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Entrez votre pseudo..."
                  className="input text-center text-2xl font-bold"
                  maxLength={30}
                  autoFocus
                />
                {error && <p className="text-red-400 text-sm text-center">{error}</p>}
                <button type="submit" disabled={!name.trim()} className="btn-primary w-full btn-lg">
                  Suivant →
                </button>
              </form>
            </motion.div>
          )}

          {/* STEP: AVATAR */}
          {step === STEPS.AVATAR && (
            <motion.div key="avatar" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}
              className="card">
              <h2 className="font-display font-bold text-xl text-white mb-6">Choisir un avatar</h2>
              <AvatarPicker value={avatar} onChange={setAvatar} allowUpload={true} />
              <button onClick={handleAvatarNext} disabled={loading} className="btn-primary w-full btn-lg mt-6">
                {loading ? '⏳ Connexion...' : session?.teamsEnabled ? 'Suivant →' : '🎮 Rejoindre !'}
              </button>
            </motion.div>
          )}

          {/* STEP: TEAM */}
          {step === STEPS.TEAM && session?.teamsEnabled && (
            <motion.div key="team" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}
              className="card">
              <h2 className="font-display font-bold text-xl text-white mb-6">Équipe</h2>
              <div className="space-y-3">
                {[
                  { value: 'none', label: '🧍 Jouer seul', desc: 'Participer sans équipe' },
                  { value: 'join', label: '🔗 Rejoindre une équipe', desc: 'Entrer le code de l\'équipe' },
                  { value: 'create', label: '🆕 Créer une équipe', desc: 'Créer et inviter des membres' },
                ].map(opt => (
                  <button key={opt.value} onClick={() => setTeamOption(opt.value)}
                    className={`w-full text-left p-4 rounded-2xl border-2 transition-all
                      ${teamOption === opt.value ? 'border-brand-500 bg-brand-500/10' : 'border-gray-700 bg-gray-800 hover:border-gray-600'}`}>
                    <p className="font-bold text-white">{opt.label}</p>
                    <p className="text-sm text-gray-400">{opt.desc}</p>
                  </button>
                ))}

                {teamOption === 'join' && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <label className="label">Code équipe</label>
                    <input value={teamCode} onChange={e => setTeamCode(e.target.value.toUpperCase())}
                      placeholder="ABCD" className="input text-center text-2xl font-bold tracking-widest" maxLength={8} />
                  </motion.div>
                )}

                {teamOption === 'create' && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                    <div>
                      <label className="label">Nom de l'équipe</label>
                      <input value={teamName} onChange={e => setTeamName(e.target.value)}
                        placeholder="Les Champions..." className="input" maxLength={30} />
                    </div>
                  </motion.div>
                )}
              </div>

              {error && <p className="text-red-400 text-sm text-center mt-3">{error}</p>}

              <button onClick={handleJoin} disabled={loading ||
                (teamOption === 'join' && !teamCode) ||
                (teamOption === 'create' && !teamName)}
                className="btn-primary w-full btn-lg mt-6">
                {loading ? '⏳ Connexion...' : '🎮 Rejoindre !'}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
