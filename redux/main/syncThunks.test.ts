import {configureStore} from '@reduxjs/toolkit';

import mainReducer, {
  addGroupCategoryAction,
  addSubcategoryAction,
} from './mainSlice';
import syncReducer, {addToQueue} from '../sync/syncSlice';
import {genericSync} from './syncThunks';
import {
  deleteGroupCategoryLocal,
  updateSubcategoryLocal,
} from './categoryThunks';
import {authenticatedFetch} from './api';
import type {SyncCallbackName} from '@/types';

jest.mock('immer', () =>
  jest.requireActual('../../node_modules/immer/dist/cjs/index.js'),
);

jest.mock('./api', () => ({
  authenticatedFetch: jest.fn(),
}));

jest.mock('@/utils/crashlytics', () => ({
  log: jest.fn(),
  logError: jest.fn(),
  setAttribute: jest.fn(),
}));

const mockedAuthenticatedFetch = authenticatedFetch as jest.Mock;

const createStore = () =>
  configureStore({
    reducer: {
      main: mainReducer,
      sync: syncReducer,
      auth: (state = {token: 'token'}) => state,
    },
  });

const successfulResponse = (data: unknown) => ({
  ok: true,
  status: 200,
  text: async () => JSON.stringify({d: data}),
});

describe('genericSync category callbacks', () => {
  beforeEach(() => {
    mockedAuthenticatedFetch.mockReset();
  });

  it('replaces a temporary subcategory ID and removes its queue operation', async () => {
    const store = createStore();
    store.dispatch(
      addGroupCategoryAction({id: 10, name: 'Group', color: 'red'}),
    );
    store.dispatch(
      addSubcategoryAction({
        id: 'f_subcategory',
        name: 'Temporary',
        color: 'red',
        groupId: 10,
      }),
    );
    store.dispatch(
      addToQueue({
        path: ['main', 'category'],
        method: 'POST',
        handler: 'genericSync',
        frontendId: 'f_subcategory',
        cb: 'replaceSubcategoryAction',
      }),
    );
    const operation = store.getState().sync.pendingOperations[0];
    mockedAuthenticatedFetch.mockResolvedValue(
      successfulResponse({
        id: 101,
        name: 'Server category',
        color: 'blue',
        groupId: 10,
      }),
    );

    await (store.dispatch as any)(
      genericSync({
        path: operation.path.slice(1),
        method: operation.method,
        cb: operation.cb,
        operationId: operation.id,
        frontendId: operation.frontendId,
      }),
    );

    expect(store.getState().main.categories[10].subcategories).toEqual([
      {
        id: 101,
        name: 'Server category',
        color: 'blue',
        groupId: 10,
      },
    ]);
    expect(store.getState().sync.pendingOperations).toEqual([]);
  });

  it('replaces a temporary group ID and removes its queue operation', async () => {
    const store = createStore();
    store.dispatch(
      addGroupCategoryAction({
        id: 'f_group',
        name: 'Temporary group',
        color: 'red',
      }),
    );
    store.dispatch(
      addToQueue({
        path: ['main', 'category', 'group'],
        method: 'POST',
        handler: 'genericSync',
        frontendId: 'f_group',
        cb: 'replaceGroupCategoryAction',
      }),
    );
    const operation = store.getState().sync.pendingOperations[0];
    mockedAuthenticatedFetch.mockResolvedValue(
      successfulResponse({id: 202, name: 'Server group', color: 'blue'}),
    );

    await (store.dispatch as any)(
      genericSync({
        path: operation.path.slice(1),
        method: operation.method,
        cb: operation.cb,
        operationId: operation.id,
        frontendId: operation.frontendId,
      }),
    );

    expect(store.getState().main.categories).not.toHaveProperty('f_group');
    expect(store.getState().main.categories[202]).toEqual({
      name: 'Server group',
      color: 'blue',
      subcategories: [],
    });
    expect(store.getState().sync.pendingOperations).toEqual([]);
  });

  it('rejects deleting a non-empty group without changing categories or queueing a DELETE', async () => {
    const store = createStore();
    store.dispatch(
      addGroupCategoryAction({id: 10, name: 'Group', color: 'red'}),
    );
    store.dispatch(
      addSubcategoryAction({
        id: 101,
        name: 'Subcategory',
        color: 'red',
        groupId: 10,
      }),
    );
    const categoriesBefore = structuredClone(store.getState().main.categories);
    expect(categoriesBefore[10].subcategories).toHaveLength(1);

    const result = await (store.dispatch as any)(deleteGroupCategoryLocal(10));
    expect(result).toMatchObject({
      type: 'groupCategory/deleteLocal/rejected',
      error: {message: 'HAS_SUBCATEGORIES'},
    });

    expect(store.getState().main.categories).toEqual(categoriesBefore);
    expect(
      store
        .getState()
        .sync.pendingOperations.some(
          operation => operation.method === 'DELETE',
        ),
    ).toBe(false);
  });

  it('updates a subcategory while another group still has a temporary ID', async () => {
    const store = createStore();
    store.dispatch(
      addGroupCategoryAction({id: 10, name: 'Group', color: 'red'}),
    );
    store.dispatch(
      addGroupCategoryAction({
        id: 'f_g_group',
        name: 'Temporary group',
        color: 'blue',
      }),
    );
    store.dispatch(
      addSubcategoryAction({
        id: 101,
        name: 'Before update',
        color: 'red',
        groupId: 10,
      }),
    );

    const result = await (store.dispatch as any)(
      updateSubcategoryLocal({
        id: 101,
        name: 'After update',
        color: '#00ff00',
        groupId: 10,
      }),
    );

    expect(result.type).toBe('subcategory/updateLocal/fulfilled');
    expect(store.getState().main.categories[10].subcategories[0]).toMatchObject(
      {id: 101, name: 'After update'},
    );
    expect(store.getState().sync.pendingOperations).toEqual([
      expect.objectContaining({
        path: ['main', 'category', '101'],
        method: 'PUT',
        frontendId: '101',
      }),
    ]);
    expect(store.getState().sync.pendingOperations[0]).not.toHaveProperty('cb');
  });

  it('keeps an operation queued when its persisted callback is unknown', async () => {
    const store = createStore();
    store.dispatch(
      addToQueue({
        path: ['main', 'category'],
        method: 'POST',
        handler: 'genericSync',
        frontendId: 'f_category',
        cb: 'replaceSubcategoryAction',
      }),
    );
    const operation = store.getState().sync.pendingOperations[0];
    mockedAuthenticatedFetch.mockResolvedValue(successfulResponse({id: 303}));

    await (store.dispatch as any)(
      genericSync({
        path: operation.path.slice(1),
        method: operation.method,
        cb: 'missingPersistedCallback' as unknown as SyncCallbackName,
        operationId: operation.id,
        frontendId: operation.frontendId,
      }),
    );

    expect(store.getState().sync.pendingOperations).toHaveLength(1);
    expect(store.getState().sync.pendingOperations[0].retryCount).toBe(1);
    expect(store.getState().sync.syncErrors[operation.id]).toContain(
      'Sync callback is not registered',
    );
  });
});
