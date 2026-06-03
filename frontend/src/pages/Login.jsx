import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useAppSettings } from '../contexts/AppSettingsContext';
import api from '../api';

export default function Login() {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ email: '', password: '', newPassword: '', token: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { login } = useAuth();
  const { settings } = useAppSettings();
  const navigate = useNavigate();

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const user = await login(form.email, form.password);
      navigate(user.mustChangePassword ? '/change-password' : '/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur de connexion.');
    } finally { setLoading(false); }
  };

  const handleForgot = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await api.post('/auth/forgot-password', { email: form.email });
      setSuccess('Si ce compte existe, un email a été envoyé.');
    } catch { setError('Erreur.'); }
    finally { setLoading(false); }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await api.post('/auth/reset-password', { token: form.token, password: form.newPassword });
      setSuccess('Mot de passe réinitialisé ! Vous pouvez vous connecter.');
      setMode('login');
    } catch (err) { setError(err.response?.data?.error || 'Token invalide.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="absolute rounded-full blur-3xl opacity-10"
            style={{
              width: `${200 + i * 80}px`, height: `${200 + i * 80}px`,
              background: i % 2 === 0 ? '#6366f1' : '#f59e0b',
              left: `${10 + i * 15}%`, top: `${10 + (i % 3) * 25}%`,
              animation: `float ${3 + i}s ease-in-out ${i * 0.5}s infinite`,
            }} />
        ))}
      </div>

      <div className="w-full max-w-md relative">
        {/* Logo */}
        <div className="text-center mb-8 animate-slide-up">
          <div className="text-6xl mb-4">🎮</div>
          <h1 className="font-display font-black text-4xl text-white">
            {settings.app_name || 'QuizzApp'}
          </h1>
          <p className="text-gray-400 mt-2">La plateforme de quiz interactive</p>
        </div>

        <div className="card animate-slide-up">
          {mode === 'login' && (
            <>
              <h2 className="font-display font-bold text-xl text-white mb-6">Connexion</h2>
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="label">Email</label>
                  <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
                    placeholder="votre@email.com" className="input" required autoFocus />
                </div>
                <div>
                  <label className="label">Mot de passe</label>
                  <input type="password" value={form.password} onChange={e => set('password', e.target.value)}
                    placeholder="••••••••" className="input" required />
                </div>
                {error && <p className="text-red-400 text-sm bg-red-500/10 px-4 py-2 rounded-xl">{error}</p>}
                <button type="submit" disabled={loading} className="btn-primary btn w-full btn-lg">
                  {loading ? '⏳ Connexion...' : '🔐 Se connecter'}
                </button>
              </form>
              <button onClick={() => setMode('forgot')} className="text-sm text-gray-400 hover:text-brand-400 mt-4 w-full text-center transition-colors">
                Mot de passe oublié ?
              </button>
            </>
          )}

          {mode === 'forgot' && (
            <>
              <h2 className="font-display font-bold text-xl text-white mb-2">Mot de passe oublié</h2>
              <p className="text-gray-400 text-sm mb-6">Entrez votre email pour recevoir un lien de réinitialisation.</p>
              <form onSubmit={handleForgot} className="space-y-4">
                <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
                  placeholder="votre@email.com" className="input" required />
                {error && <p className="text-red-400 text-sm">{error}</p>}
                {success && <p className="text-green-400 text-sm">{success}</p>}
                <button type="submit" disabled={loading} className="btn-primary btn w-full">
                  {loading ? '⏳...' : 'Envoyer'}
                </button>
              </form>
              <button onClick={() => setMode('login')} className="text-sm text-gray-400 hover:text-white mt-4 w-full text-center">
                ← Retour à la connexion
              </button>
            </>
          )}
        </div>

        {/* Join as participant */}
        <div className="mt-4 text-center">
          <p className="text-gray-500 text-sm">Participant à une partie ?</p>
          <Link to="/join" className="btn-accent btn mt-2 w-full btn-lg">
            🎮 Rejoindre une partie
          </Link>
        </div>
      </div>
    </div>
  );
}
