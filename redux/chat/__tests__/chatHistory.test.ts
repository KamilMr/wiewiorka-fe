/** @jest-environment node */

import {dropMe} from '../../auth/authSlice';
import {signIn} from '../../auth/thunks';
import {appendChatMessage, clearChatHistory} from '../chatSlice';

const mockDisk = new Map<string, string>();

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: async (key: string) => mockDisk.get(key) ?? null,
  setItem: async (key: string, value: string) => mockDisk.set(key, value),
}));
jest.mock('@/constants/theme', () => ({}));
jest.mock('@/utils/crashlytics', () => ({}));

type StoreModule = typeof import('../../store');

const loadStore = async () => {
  let module!: StoreModule;
  jest.isolateModules(() => {
    module = jest.requireActual<StoreModule>('../../store');
  });

  const {persistor} = module;
  if (!persistor.getState().bootstrapped) {
    await new Promise<void>(resolve => {
      const unsubscribe = persistor.subscribe(() => {
        if (!persistor.getState().bootstrapped) return;
        unsubscribe();
        resolve();
      });
    });
  }
  return module;
};

beforeEach(() => {
  mockDisk.clear();
  jest.useFakeTimers();
});

afterEach(() => {
  // Redux Persist leaves its rehydration timeout scheduled after bootstrapping.
  jest.clearAllTimers();
  jest.useRealTimers();
});

it('persists the latest 50 messages and restores them with their actions', async () => {
  const {store, persistor} = await loadStore();
  store.dispatch(
    signIn.fulfilled({token: 'test-token'}, 'login', {email: '', password: ''}),
  );
  for (let id = 1; id <= 51; id++) {
    store.dispatch(appendChatMessage({role: 'user', text: `Message ${id}`}));
  }
  store.dispatch(
    appendChatMessage({
      role: 'assistant',
      text: 'View budgets',
      action: 'show-budgets',
    }),
  );
  await persistor.flush();

  const reopened = await loadStore();
  const history = reopened.store.getState().chat;
  expect(history).toHaveLength(50);
  expect(history[0]).toMatchObject({id: 3, text: 'Message 3'});
  expect(history.at(-1)).toEqual({
    id: 52,
    role: 'assistant',
    text: 'View budgets',
    action: 'show-budgets',
  });
  reopened.store.dispatch(appendChatMessage({role: 'user', text: 'Next'}));
  expect(reopened.store.getState().chat.at(-1)?.id).toBe(53);
  await reopened.persistor.flush();
});

it('removes cleared history from storage and drops history on session reset', async () => {
  const {store, persistor} = await loadStore();
  store.dispatch(
    signIn.fulfilled({token: 'test-token'}, 'login', {email: '', password: ''}),
  );
  store.dispatch(appendChatMessage({role: 'user', text: 'Clear me'}));
  await persistor.flush();
  store.dispatch(clearChatHistory());
  expect(store.getState().chat).toEqual([]);
  await persistor.flush();
  expect(mockDisk.get('persist:squirrel')).not.toContain('Clear me');

  store.dispatch(appendChatMessage({role: 'user', text: 'Private history'}));
  store.dispatch(dropMe());
  expect(store.getState().chat).toEqual([]);
  await persistor.flush();
  expect(mockDisk.get('persist:squirrel')).not.toContain('Private history');
});
