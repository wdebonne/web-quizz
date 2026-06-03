import { useState, useRef, useEffect } from 'react';
import { AvatarDisplay } from './AvatarPicker';

export default function ChatPanel({ messages, onSend, participants, teams, myId, myRole = 'creator', className = '' }) {
  const [input, setInput] = useState('');
  const [toType, setToType] = useState('all');
  const [toId, setToId] = useState(null);
  const [toName, setToName] = useState(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    onSend({ content: input.trim(), toType, toId, toName });
    setInput('');
  };

  const setTarget = (type, id, name) => {
    setToType(type);
    setToId(id);
    setToName(name);
  };

  return (
    <div className={`flex flex-col bg-gray-900 border border-gray-800 rounded-2xl ${className}`}>
      <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
        <h3 className="font-semibold text-white">💬 Chat</h3>
        <span className="text-xs text-gray-400">{messages.length} messages</span>
      </div>

      {/* Target selector */}
      {myRole === 'creator' && (
        <div className="px-3 py-2 border-b border-gray-800 flex gap-1 flex-wrap">
          <button onClick={() => setTarget('all', null, null)}
            className={`btn-sm text-xs ${toType === 'all' ? 'btn-primary' : 'btn-secondary'}`}>
            Tous
          </button>
          {teams?.map(t => (
            <button key={t.id} onClick={() => setTarget('team', t.id, t.name)}
              className={`btn-sm text-xs ${toId === t.id ? 'btn-primary' : 'btn-secondary'}`}>
              {t.avatar} {t.name}
            </button>
          ))}
          {participants?.map(p => (
            <button key={p.id} onClick={() => setTarget('participant', p.id, p.name)}
              className={`btn-sm text-xs ${toId === p.id ? 'btn-primary' : 'btn-secondary'}`}>
              <AvatarDisplay avatar={p.avatar} size="sm" className="w-4 h-4 text-xs" />
              {p.name}
            </button>
          ))}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0 max-h-64">
        {messages.length === 0 && (
          <p className="text-center text-gray-500 text-sm py-4">Aucun message</p>
        )}
        {messages.map((msg, i) => {
          const isMe = myRole === 'creator' ? msg.fromType === 'creator' : msg.fromId === myId;
          const isSystem = msg.type === 'system' || msg.fromType === 'system';

          if (isSystem) return (
            <div key={i} className="text-center">
              <span className="text-xs text-gray-500 bg-gray-800 px-3 py-1 rounded-full">{msg.content}</span>
            </div>
          );

          return (
            <div key={i} className={`flex gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`flex-shrink-0 w-7 h-7 rounded-full bg-gray-700 flex items-center justify-center text-sm`}>
                {msg.fromType === 'creator' ? '👑' : '👤'}
              </div>
              <div className={`max-w-[80%] ${isMe ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                <span className="text-xs text-gray-500">{msg.fromName}
                  {msg.toType !== 'all' && <span className="text-brand-400"> → {msg.toName}</span>}
                </span>
                <div className={`px-3 py-2 rounded-2xl text-sm ${isMe ? 'bg-brand-600 text-white' : 'bg-gray-800 text-gray-200'}`}>
                  {msg.content}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-gray-800 flex gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
          placeholder={toType === 'all' ? 'Message à tous...' : `À ${toName}...`}
          className="input flex-1 py-2 text-sm"
          maxLength={500}
        />
        <button onClick={handleSend} disabled={!input.trim()} className="btn-primary btn-sm">
          ➤
        </button>
      </div>
    </div>
  );
}
