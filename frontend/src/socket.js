import { io } from 'socket.io-client';

let socket = null;

export const getSocket = () => socket;

export const connectCreator = (token) => {
  if (socket) socket.disconnect();
  socket = io('/', {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });
  return socket;
};

export const connectParticipant = (participantId, sessionCode) => {
  if (socket) socket.disconnect();
  socket = io('/', {
    auth: { participantId, sessionCode },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
  });
  return socket;
};

export const connectProjection = () => {
  if (socket) socket.disconnect();
  const token = localStorage.getItem('accessToken');
  socket = io('/', {
    auth: { token },
    transports: ['websocket', 'polling'],
  });
  return socket;
};

export const disconnect = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export default { getSocket, connectCreator, connectParticipant, connectProjection, disconnect };
