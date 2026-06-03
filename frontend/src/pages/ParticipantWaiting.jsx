import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { AvatarDisplay } from '../components/AvatarPicker';
import ChatPanel from '../components/ChatPanel';
import { getSocket } from '../socket';
import { motion, AnimatePresence } from 'framer-motion';

const EMOJIS = ['👍','❤️','🔥','😂','😮','👏','🎉','🤔','😎','💯','⭐','🚀','😍','🥳','😱'];

export default function ParticipantWaiting() {
  const { sessionId } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const [participant, setParticipant] = useState(state?.participant);
  const [session, setSession] = useState(state?.session);
  const [participants, setParticipants] = useState([]);
  const [teams, setTeams] = useState([]);
  const [messages, setMessages] = useState([]);
  const [avatarRejected, setAvatarRejected] = useState(false);
  const [kicked, setKicked] = useState(false);
  const [teamCreated, setTeamCreated] = useState(null);
  const [emojiCooldown, setEmojiCooldown] = useState(false);
  const [lastSentEmoji, setLastSentEmoji] = useState(null);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    socket.on('lobby:update', ({ participants: p, teams: t }) => {
      setParticipants(p || []);
      setTeams(t || []);
    });

    socket.on('participant:updated', ({ participant: p }) => {
      if (p.id === participant?.id) setParticipant(p);
    });

    socket.on('message:new', (msg) => setMessages(m => [...m, msg]));

    socket.on('avatar:rejected', ({ newAvatar, reason }) => {
      setParticipant(p => ({ ...p, avatar: newAvatar }));
      setAvatarRejected(true);
      setTimeout(() => setAvatarRejected(false), 4000);
    });

    socket.on('game:kicked', () => setKicked(true));

    socket.on('game:started', ({ mode }) => {
      navigate(`/play/${sessionId}`, {
        replace: true,
        state: { participant, session: { ...session, mode } },
      });
    });

    socket.on('team:created', ({ team }) => setTeamCreated(team));

    return () => {
      socket.off('lobby:update');
      socket.off('participant:updated');
      socket.off('message:new');
      socket.off('avatar:rejected');
      socket.off('game:kicked');
      socket.off('game:started');
      socket.off('team:created');
    };
  }, [sessionId, navigate, participant?.id]);

  const handleSendMessage = ({ content, toType, toId, toName }) => {
    const socket = getSocket();
    socket?.emit('participant:send_message', { content, toType, toId, toName });
  };

  const handleSendEmoji = (emoji) => {
    if (emojiCooldown) return;
    const socket = getSocket();
    socket?.emit('participant:send_emoji', { emoji });
    setLastSentEmoji(emoji);
    setEmojiCooldown(true);
    setTimeout(() => setEmojiCooldown(false), 1500);
    setTimeout(() => setLastSentEmoji(null), 800);
  };

  if (kicked) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-center">
        <div className="text-6xl mb-4">👋</div>
        <h2 className="font-display font-bold text-2xl text-white mb-2">Vous avez été exclu</h2>
        <button onClick={() => navigate('/join')} className="btn-primary mt-4">Retour</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-950 p-4 pb-20">
      {/* Avatar rejected notification */}
      <AnimatePresence>
        {avatarRejected && (
          <motion.div initial={{ y: -100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -100, opacity: 0 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-red-500 text-white px-6 py-3 rounded-2xl shadow-xl">
            ⚠️ Avatar refusé — un avatar aléatoire vous a été attribué
          </motion.div>
        )}
      </AnimatePresence>

      {/* Team QR code */}
      <AnimatePresence>
        {teamCreated && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
            <div className="card max-w-sm w-full text-center">
              <h3 className="font-display font-bold text-xl text-white mb-4">Équipe créée : {teamCreated.name}</h3>
              <div className="bg-white p-4 rounded-2xl inline-block mb-4">
                <img src={teamCreated.qrCode} alt="QR équipe" className="w-40 h-40" />
              </div>
              <p className="text-gray-400 mb-2">Code équipe</p>
              <p className="font-display font-black text-3xl text-brand-400 tracking-widest mb-4">{teamCreated.code}</p>
              <button onClick={() => setTeamCreated(null)} className="btn-primary w-full">OK</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-md mx-auto space-y-6">
        {/* My info */}
        <div className="card text-center">
          <AvatarDisplay avatar={participant?.avatar} size="xl" className="mx-auto mb-3" />
          <h2 className="font-display font-bold text-2xl text-white">{participant?.name}</h2>
          {participant?.avatarPendingApproval && (
            <p className="text-yellow-400 text-sm mt-2">⏳ Avatar en attente d'approbation</p>
          )}
          <div className="mt-4 flex items-center justify-center gap-3 text-sm text-gray-400">
            <span>{session?.quiz?.title}</span>
            <span>•</span>
            <span>{participant?.teamId ? `Équipe: ${teams.find(t => t.id === participant.teamId)?.name}` : 'Solo'}</span>
          </div>
        </div>

        {/* Waiting indicator */}
        <div className="card text-center">
          <div className="flex justify-center gap-2 mb-3">
            {[0, 1, 2].map(i => (
              <div key={i} className="w-3 h-3 bg-brand-500 rounded-full"
                style={{ animation: `bounce 1.4s ${i * 0.2}s infinite` }} />
            ))}
          </div>
          <p className="text-white font-medium">En attente du créateur...</p>
          <p className="text-gray-400 text-sm mt-1">{participants.length} participant{participants.length > 1 ? 's' : ''} connecté{participants.length > 1 ? 's' : ''}</p>
        </div>

        {/* Participants preview */}
        {participants.length > 0 && (
          <div className="card">
            <h3 className="font-semibold text-white mb-3">👥 Participants</h3>
            <div className="flex flex-wrap gap-2">
              {participants.map(p => (
                <div key={p.id} className="flex items-center gap-2 bg-gray-800 rounded-xl px-3 py-2">
                  <AvatarDisplay avatar={p.avatar} size="sm" className="w-6 h-6 text-sm" />
                  <span className="text-white text-sm">{p.name}</span>
                  {p.id === participant?.id && <span className="text-brand-400 text-xs">(vous)</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Emoji reactions */}
        <div className="card">
          <p className="text-gray-400 text-xs font-semibold uppercase tracking-widest mb-3 text-center">
            Réactions 🎭
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            {EMOJIS.map(emoji => (
              <button
                key={emoji}
                onClick={() => handleSendEmoji(emoji)}
                disabled={emojiCooldown}
                className={`text-2xl w-11 h-11 flex items-center justify-center rounded-xl transition-all
                  ${emojiCooldown ? 'opacity-40 cursor-not-allowed scale-95' : 'hover:scale-125 active:scale-95 bg-gray-800 hover:bg-gray-700'}
                  ${lastSentEmoji === emoji ? 'ring-2 ring-brand-400 scale-125' : ''}`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        {/* Chat */}
        <ChatPanel
          messages={messages}
          onSend={handleSendMessage}
          myId={participant?.id}
          myRole="participant"
          className="min-h-64"
        />
      </div>
    </div>
  );
}
