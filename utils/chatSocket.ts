import {io, type Socket} from 'socket.io-client';
import {getSocketEndpoint} from '@/config/environment';

type ChatAck = {
  d: {text: string; cleared?: true} | null;
  err: string | null;
  financeChanged: boolean;
};

type ChatEvents = {
  'chat:message': (
    payload: {text: string},
    ack: (result: ChatAck) => void,
  ) => void;
};

export type ChatSocket = Socket<Record<never, never>, ChatEvents>;

export const createChatSocket = (token: string): ChatSocket => {
  const {origin, path} = getSocketEndpoint();
  return io(`${origin}/chat`, {
    path,
    autoConnect: false,
    auth: {token},
    transports: ['websocket'],
    multiplex: false,
  });
};

export const sendChatMessage = (chat: ChatSocket, text: string) =>
  chat.volatile.timeout(65_000).emitWithAck('chat:message', {text});
