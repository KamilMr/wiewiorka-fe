import {io, Socket} from 'socket.io-client';
import {env} from '@/config/environment';
import {
  addStorageItem,
  updateStorageItem,
  removeStorageItem,
  addShopListItem,
  updateShopListItem,
  removeShopListItem,
} from '@/redux/storage/storageSlice';

let socket: Socket | null = null;

const connectSocket = (token: string): Socket => {
  if (socket?.connected) return socket;

  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
  }

  const url = new URL(env.apiUrl);
  const basePath = url.pathname.replace(/\/$/, '');
  socket = io(url.origin, {
    path: `${basePath}/socket.io/`,
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

const broadcastEvents = {
  'storage:created': (data: any) => addStorageItem(data),
  'storage:updated': (data: any) => updateStorageItem(data),
  'storage:deleted': (data: any) => removeStorageItem(data.id),
  'shopList:created': (data: any) => addShopListItem(data),
  'shopList:updated': (data: any) => updateShopListItem(data),
  'shopList:deleted': (data: any) => removeShopListItem(data.id),
};

export {connectSocket, disconnectSocket, getSocket, broadcastEvents};
