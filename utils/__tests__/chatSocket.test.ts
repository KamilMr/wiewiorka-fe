import {io} from 'socket.io-client';
import {env} from '@/config/environment';
import {createChatSocket, sendChatMessage} from '../chatSocket';

jest.mock('socket.io-client', () => ({io: jest.fn()}));
const originalApiUrl = env.apiUrl;

beforeAll(() => {
  env.apiUrl = 'https://finance.example.test/finance-dev/';
});

afterAll(() => {
  env.apiUrl = originalApiUrl;
});

describe('app chat socket', () => {
  it('uses the chat namespace through the API proxy path with handshake auth', () => {
    createChatSocket('test-token');

    expect(io).toHaveBeenCalledWith('https://finance.example.test/chat', {
      path: '/finance-dev/socket.io/',
      autoConnect: false,
      transports: ['websocket'],
      multiplex: false,
      auth: {token: 'test-token'},
    });
  });

  it('requests one acknowledgement without buffering a write for reconnection', async () => {
    const reply = {d: {text: 'Zapisano.'}, err: null, financeChanged: true};
    const emitWithAck = jest.fn().mockResolvedValue(reply);
    const timeout = jest.fn().mockReturnValue({emitWithAck});
    jest
      .mocked(io)
      .mockReturnValue({volatile: {timeout}} as unknown as ReturnType<
        typeof io
      >);

    await expect(
      sendChatMessage(createChatSocket('token'), 'Zapisz przychód'),
    ).resolves.toEqual(reply);
    expect(timeout).toHaveBeenCalledWith(65_000);
    expect(emitWithAck).toHaveBeenCalledTimes(1);
    expect(emitWithAck).toHaveBeenCalledWith('chat:message', {
      text: 'Zapisz przychód',
    });
  });
});
