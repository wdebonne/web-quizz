import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Layout from '../components/Layout';
import QRCodeDisplay from '../components/QRCodeDisplay';
import ChatPanel from '../components/ChatPanel';
import { AvatarDisplay } from '../components/AvatarPicker';
import { connectCreator, disconnect } from '../socket';
import api from '../api';
import { motion, AnimatePresence } from 'framer-motion';

export default function GameLobby() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [teams, setTeams] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [pendingAvatars, setPendingAvatars] = useState([]);
  const socketRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const socket = connectCreator(token);
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('creator:join_session', { sessionId: id });
    });

    socket.on('session:state', ({ participants: p, teams: t, ...s }) => {
      setSession(s);
      setParticipants(p || []);
      setTeams(t || []);
      setLoading(false);
    });

    socket.on('lobby:update', ({ participants: p, teams: t }) => {
      setParticipants(p || []);
      setTeams(t || []);
    });

    socket.on('participant:new', ({ participant, needsApproval }) => {
      setParticipants(p => {
        if (p.find(x => x.id === participant.id)) return p;
        return [...p, participant];
      });
      if (needsApproval) setPendingAvatars(prev => [...prev, participant]);
    });

    socket.on('participant:updated', ({ participant }) => {
      setParticipants(p => p.map(x => x.id === participant.id ? participant : x));
    });

    socket.on('participant:left', ({ participantId }) => {
      setParticipants(p => p.filter(x => x.id !== participantId));
    });

    socket.on('message:new', (msg) => {
      setMessages(m => [...m, msg]);
    });

    socket.on('avatar:pending_approval', ({ participant }) => {
      setPendingAvatars(prev => {
        if (prev.find(p => p.id === participant.id)) return prev;
        return [...prev, participant];
      });
    });

    socket.on('game:started', () => {
      navigate(`/game/${id}/control`);
    });

    socket.on('error', ({ message }) => alert(message));

    return () => { disconnect(); };
  }, [id, navigate]);

  const handleStart = () => {
    if (participants.length === 0) return alert('Aucun participant !');
    setStarting(true);
    socketRef.current?.emit('creator:start_game');
  };

  const handleCancel = async () => {
    if (!confirm('Annuler la partie et retourner au dashboard ?')) return;
    try {
      await api.delete(`/games/${id}`);
    } catch {}
    navigate('/dashboard');
  };

  const handleKick = (pid) => {
    socketRef.current?.emit('creator:kick_participant', { participantId: pid });
  };

  const handleApproveAvatar = (pid) => {
    socketRef.current?.emit('creator:approve_avatar', { participantId: pid });
    setPendingAvatars(prev => prev.filter(p => p.id !== pid));
  };

  const handleRejectAvatar = (pid) => {
    socketRef.current?.emit('creator:reject_avatar', { participantId: pid, reason: 'Avatar non approprié.' });
    setPendingAvatars(prev => prev.filter(p => p.id !== pid));
  };

  const handleSendMessage = ({ content, toType, toId, toName }) => {
    socketRef.current?.emit('creator:send_message', { content, toType, toId, toName });
  };

  const openProjection = () => {
    window.open(`/projection/${id}`, '_blank', 'fullscreen=yes');
  };

  if (loading) return <Layout title="Chargement..."><div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" /></div></Layout>;

  return (
    <Layout title={`Lobby — ${session?.quiz?.title || '...'}`}
      actions={
        <div className="flex gap-2">
          <button onClick={handleCancel} className="btn-ghost btn-sm text-red-400 hover:text-red-300">
            ⏹️ Arrêter
          </button>
          <button onClick={openProjection} className="btn-secondary btn-sm">📺 Projection</button>
          <button onClick={handleStart} disabled={starting || participants.length === 0}
            className="btn-accent btn-lg animate-pulse-fast">
            {starting ? '⏳ Démarrage...' : `▶️ Lancer (${participants.length})`}
          </button>
        </div>
      }>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* QR Code & Join info */}
        <div className="lg:col-span-1 space-y-4">
          <div className="card text-center">
            <QRCodeDisplay
              value={session?.joinUrl || ''}
              size={180}
              code={session?.code}
              label="Rejoindre la partie"
            />
          </div>

          {/* Session settings */}
          <div className="card space-y-3">
            <h3 className="font-semibold text-white">⚙️ Paramètres</h3>
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-sm">Mode</span>
              <span className={`badge ${session?.mode === 'projection' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'}`}>
                {session?.mode === 'projection' ? '📺 Projection' : '📱 Appareils'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-sm">Équipes</span>
              <span className={`badge ${session?.teamsEnabled ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-400'}`}>
                {session?.teamsEnabled ? '✅ Activées' : '❌ Désactivées'}
              </span>
            </div>
          </div>

          {/* Pending avatar approvals */}
          <AnimatePresence>
            {pendingAvatars.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="card border-yellow-500/50 space-y-3">
                <h3 className="font-semibold text-yellow-400">⚠️ Avatars à approuver ({pendingAvatars.length})</h3>
                {pendingAvatars.map(p => (
                  <div key={p.id} className="flex items-center gap-3">
                    <AvatarDisplay avatar={p.avatar} size="md" />
                    <div className="flex-1">
                      <p className="text-white text-sm font-medium">{p.name}</p>
                    </div>
                    <button onClick={() => handleApproveAvatar(p.id)} className="btn-primary btn-sm">✅</button>
                    <button onClick={() => handleRejectAvatar(p.id)} className="btn-danger btn-sm">❌</button>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Participants list */}
        <div className="lg:col-span-1">
          <div className="card h-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-white">👥 Participants ({participants.length})</h3>
            </div>

            {teams.length > 0 && (
              <div className="mb-4 space-y-2">
                <h4 className="text-sm font-medium text-gray-400">Équipes</h4>
                {teams.map(team => (
                  <div key={team.id} className="flex items-center gap-2 px-3 py-2 bg-gray-800 rounded-xl">
                    <span className="text-xl">{team.avatar}</span>
                    <span className="font-medium text-white">{team.name}</span>
                    <span className="text-xs text-gray-400 ml-auto">
                      {participants.filter(p => p.teamId === team.id).length} membres
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {participants.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2">👋</div>
                  <p className="text-gray-500 text-sm">En attente de participants...</p>
                </div>
              ) : participants.map((p) => (
                <motion.div key={p.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-3 px-3 py-2 bg-gray-800 rounded-xl group">
                  <AvatarDisplay avatar={p.avatar} size="md" className={p.avatarPendingApproval ? 'ring-2 ring-yellow-500' : ''} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white truncate">{p.name}</p>
                    {p.teamId && <p className="text-xs text-gray-400">
                      {teams.find(t => t.id === p.teamId)?.name}
                    </p>}
                  </div>
                  {!p.isConnected && <span className="w-2 h-2 rounded-full bg-red-500" title="Déconnecté" />}
                  <button onClick={() => handleKick(p.id)}
                    className="opacity-0 group-hover:opacity-100 btn-ghost btn-sm text-red-400">
                    ✕
                  </button>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Chat */}
        <div className="lg:col-span-1">
          <ChatPanel
            messages={messages}
            onSend={handleSendMessage}
            participants={participants}
            teams={teams}
            myRole="creator"
            className="h-full min-h-96"
          />
        </div>
      </div>
    </Layout>
  );
}
