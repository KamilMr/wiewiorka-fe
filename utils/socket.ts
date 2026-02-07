import {io, Socket} from 'socket.io-client';
import {env} from '@/config/environment';

let socket: Socket | null = null;

const connectSocket = (token: string): Socket => {
  if (socket?.connected) return socket;

  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
  }

  socket = io(env.apiUrl, {
    autoConnect: false,
    auth: {token},
  });

  socket.on('connect_error', err => {
    console.error('Socket.IO connection error:', err.message);
  });

  socket.connect();
  return socket;
};

const disconnectSocket = () => {
  if (!socket) return;
  socket.removeAllListeners();
  socket.disconnect();
  socket = null;
};

const getSocket = (): Socket | null => socket;

export {connectSocket, disconnectSocket, getSocket};
