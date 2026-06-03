import { useState, useEffect, useRef } from 'react';
import Layout from '../components/Layout';
import api from '../api';
import { motion } from 'framer-motion';

export default function Admin() {
  const [tab, setTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [settings, setSettings] = useState({});
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({ username: '', email: '', password: '', role: 'creator' });
  const [editUser, setEditUser] = useState(null);
  const logoRef = useRef();
  const faviconRef = useRef();

  useEffect(() => {
    api.get('/admin/users').then(({ data }) => setUsers(data)).finally(() => setLoadingUsers(false));
    api.get('/admin/settings').then(({ data }) => setSettings(data));
  }, []);

  const handleAddUser = async () => {
    try {
      const { data } = await api.post('/admin/users', newUser);
      setUsers(u => [...u, data]);
      setNewUser({ username: '', email: '', password: '', role: 'creator' });
      setShowAddUser(false);
    } catch (err) { alert(err.response?.data?.error || 'Erreur.'); }
  };

  const handleToggleActive = async (user) => {
    await api.put(`/admin/users/${user.id}`, { isActive: !user.isActive });
    setUsers(u => u.map(x => x.id === user.id ? { ...x, isActive: !x.isActive } : x));
  };

  const handleDeleteUser = async (id) => {
    if (!confirm('Supprimer cet utilisateur ?')) return;
    await api.delete(`/admin/users/${id}`);
    setUsers(u => u.filter(x => x.id !== id));
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      await api.put('/admin/settings', settings);
      alert('Paramètres sauvegardés !');
    } catch { alert('Erreur.'); }
    finally { setSaving(false); }
  };

  const handleUploadLogo = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const form = new FormData();
    form.append('file', file);
    const { data } = await api.post('/uploads/logo', form);
    setSettings(s => ({ ...s, app_logo: data.url }));
  };

  const handleTestSmtp = async () => {
    try {
      await api.put('/admin/settings', {
        smtp_host: settings.smtp_host || '',
        smtp_port: settings.smtp_port || '587',
        smtp_secure: settings.smtp_secure || 'false',
        smtp_user: settings.smtp_user || '',
        smtp_pass: settings.smtp_pass || '',
        smtp_from: settings.smtp_from || '',
      });
      alert('Paramètres SMTP sauvegardés. Testez en envoyant un email de réinitialisation de mot de passe.');
    } catch { alert('Erreur.'); }
  };

  const TABS = [
    { id: 'users', label: '👥 Utilisateurs' },
    { id: 'settings', label: '⚙️ Paramètres' },
    { id: 'smtp', label: '📧 SMTP' },
    { id: 'appearance', label: '🎨 Apparence' },
  ];

  return (
    <Layout title="Administration">
      <div className="flex gap-2 mb-6 flex-wrap">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-xl font-medium transition-all ${tab === t.id ? 'bg-brand-500 text-white' : 'text-gray-400 hover:text-white bg-gray-800'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* USERS */}
      {tab === 'users' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => setShowAddUser(true)} className="btn-primary">+ Ajouter un utilisateur</button>
          </div>

          {showAddUser && (
            <div className="card border-brand-500/50 space-y-4 max-w-lg">
              <h3 className="font-semibold text-white">Nouvel utilisateur</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Pseudo</label>
                  <input value={newUser.username} onChange={e => setNewUser(u => ({ ...u, username: e.target.value }))} className="input" />
                </div>
                <div>
                  <label className="label">Email</label>
                  <input type="email" value={newUser.email} onChange={e => setNewUser(u => ({ ...u, email: e.target.value }))} className="input" />
                </div>
                <div>
                  <label className="label">Mot de passe</label>
                  <input type="password" value={newUser.password} onChange={e => setNewUser(u => ({ ...u, password: e.target.value }))} className="input" />
                </div>
                <div>
                  <label className="label">Rôle</label>
                  <select value={newUser.role} onChange={e => setNewUser(u => ({ ...u, role: e.target.value }))} className="input">
                    <option value="creator">Créateur</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setShowAddUser(false)} className="btn-secondary flex-1">Annuler</button>
                <button onClick={handleAddUser} className="btn-primary flex-1">Créer</button>
              </div>
            </div>
          )}

          <div className="card overflow-hidden p-0">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left p-4 text-gray-400 text-sm font-medium">Utilisateur</th>
                  <th className="text-left p-4 text-gray-400 text-sm font-medium hidden sm:table-cell">Email</th>
                  <th className="text-left p-4 text-gray-400 text-sm font-medium">Rôle</th>
                  <th className="text-left p-4 text-gray-400 text-sm font-medium">Statut</th>
                  <th className="p-4"></th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                    <td className="p-4 font-medium text-white">{user.username}</td>
                    <td className="p-4 text-gray-400 text-sm hidden sm:table-cell">{user.email}</td>
                    <td className="p-4">
                      <span className={`badge ${user.role === 'admin' ? 'bg-brand-500/20 text-brand-400' : 'bg-gray-700 text-gray-300'}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="p-4">
                      <button onClick={() => handleToggleActive(user)}
                        className={`badge cursor-pointer ${user.isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                        {user.isActive ? '● Actif' : '● Inactif'}
                      </button>
                    </td>
                    <td className="p-4">
                      <button onClick={() => handleDeleteUser(user.id)} className="btn-ghost btn-sm text-red-400">🗑️</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* APP SETTINGS */}
      {tab === 'settings' && (
        <div className="card max-w-2xl space-y-6">
          <div>
            <label className="label">Nom de l'application</label>
            <input value={settings.app_name || ''} onChange={e => setSettings(s => ({ ...s, app_name: e.target.value }))} className="input" />
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <div onClick={() => setSettings(s => ({ ...s, registration_enabled: s.registration_enabled === 'true' ? 'false' : 'true' }))}
                className={`w-12 h-6 rounded-full transition-colors ${settings.registration_enabled === 'true' ? 'bg-brand-500' : 'bg-gray-700'}`}>
                <div className={`w-6 h-6 bg-white rounded-full transition-transform ${settings.registration_enabled === 'true' ? 'translate-x-6' : ''}`} />
              </div>
              <span className="text-gray-300">Inscription ouverte au public</span>
            </label>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Couleur principale</label>
              <div className="flex gap-2">
                <input type="color" value={settings.app_primary_color || '#6366f1'}
                  onChange={e => setSettings(s => ({ ...s, app_primary_color: e.target.value }))}
                  className="w-12 h-11 rounded-lg border-0 cursor-pointer bg-gray-800 p-1" />
                <input value={settings.app_primary_color || '#6366f1'}
                  onChange={e => setSettings(s => ({ ...s, app_primary_color: e.target.value }))} className="input flex-1" />
              </div>
            </div>
            <div>
              <label className="label">Couleur d'accent</label>
              <div className="flex gap-2">
                <input type="color" value={settings.app_accent_color || '#f59e0b'}
                  onChange={e => setSettings(s => ({ ...s, app_accent_color: e.target.value }))}
                  className="w-12 h-11 rounded-lg border-0 cursor-pointer bg-gray-800 p-1" />
                <input value={settings.app_accent_color || '#f59e0b'}
                  onChange={e => setSettings(s => ({ ...s, app_accent_color: e.target.value }))} className="input flex-1" />
              </div>
            </div>
          </div>
          <button onClick={handleSaveSettings} disabled={saving} className="btn-primary">
            {saving ? '⏳...' : '💾 Sauvegarder'}
          </button>
        </div>
      )}

      {/* SMTP */}
      {tab === 'smtp' && (
        <div className="card max-w-2xl space-y-4">
          <p className="text-gray-400 text-sm">Configuration du serveur email pour les réinitialisations de mot de passe et invitations.</p>
          {[
            { key: 'smtp_host', label: 'Hôte SMTP', placeholder: 'smtp.gmail.com' },
            { key: 'smtp_port', label: 'Port', placeholder: '587' },
            { key: 'smtp_user', label: 'Utilisateur SMTP', placeholder: 'user@gmail.com' },
            { key: 'smtp_pass', label: 'Mot de passe SMTP', placeholder: '••••••••', type: 'password' },
            { key: 'smtp_from', label: 'Adresse expéditeur', placeholder: 'noreply@quizz.local' },
          ].map(({ key, label, placeholder, type }) => (
            <div key={key}>
              <label className="label">{label}</label>
              <input type={type || 'text'} value={settings[key] || ''} placeholder={placeholder}
                onChange={e => setSettings(s => ({ ...s, [key]: e.target.value }))} className="input" />
            </div>
          ))}
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <div onClick={() => setSettings(s => ({ ...s, smtp_secure: s.smtp_secure === 'true' ? 'false' : 'true' }))}
                className={`w-12 h-6 rounded-full transition-colors ${settings.smtp_secure === 'true' ? 'bg-brand-500' : 'bg-gray-700'}`}>
                <div className={`w-6 h-6 bg-white rounded-full transition-transform ${settings.smtp_secure === 'true' ? 'translate-x-6' : ''}`} />
              </div>
              <span className="text-gray-300">TLS/SSL</span>
            </label>
          </div>
          <button onClick={handleTestSmtp} className="btn-primary">💾 Sauvegarder SMTP</button>
        </div>
      )}

      {/* APPEARANCE */}
      {tab === 'appearance' && (
        <div className="card max-w-2xl space-y-6">
          <div>
            <label className="label">Logo de l'application</label>
            {settings.app_logo && (
              <div className="mb-3">
                <img src={settings.app_logo} alt="logo" className="h-16 object-contain rounded-xl" />
              </div>
            )}
            <input ref={logoRef} type="file" accept="image/*" onChange={handleUploadLogo} className="hidden" />
            <button onClick={() => logoRef.current?.click()} className="btn-secondary">📁 Télécharger un logo</button>
          </div>

          <div>
            <label className="label">Templates d'email</label>
            <div className="space-y-4">
              <div>
                <label className="label text-xs">Objet email de bienvenue</label>
                <input value={settings.email_template_welcome || ''}
                  onChange={e => setSettings(s => ({ ...s, email_template_welcome: e.target.value }))} className="input" />
              </div>
              <div>
                <label className="label text-xs">Objet email réinitialisation</label>
                <input value={settings.email_template_reset || ''}
                  onChange={e => setSettings(s => ({ ...s, email_template_reset: e.target.value }))} className="input" />
              </div>
            </div>
          </div>

          <button onClick={handleSaveSettings} disabled={saving} className="btn-primary">
            {saving ? '⏳...' : '💾 Sauvegarder'}
          </button>
        </div>
      )}
    </Layout>
  );
}
