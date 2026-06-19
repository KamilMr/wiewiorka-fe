import {configureStore, combineReducers, MiddlewareAPI} from '@reduxjs/toolkit';
import {createMigrate, persistReducer, persistStore} from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';

import authReducer, {authEmptyState, dropMe} from './auth/authSlice';
import mainReducer, {
  dropMain,
  mainEmptyState,
  startLoading,
  stopLoading,
} from './main/mainSlice';
import syncReducer, {syncEmptyState, dropSync} from './sync/syncSlice';
import storageReducer, {resetStorage} from './storage/storageSlice';

const rootReducer = combineReducers({
  auth: authReducer,
  main: mainReducer,
  sync: syncReducer,
  storage: storageReducer,
});

const authMiddleware =
  (store: MiddlewareAPI) => (next: any) => async (action: any) => {
    if (['session_not_active', 'not_auth'].includes(action.error?.message)) {
      store.dispatch(dropMe());
      store.dispatch(dropMain());
      store.dispatch(dropSync());
      store.dispatch(resetStorage());
    }
    return next(action);
  };

const setLoadingStatusMiddleware =
  (store: MiddlewareAPI) => (next: any) => async (action: any) => {
    if (action.type.endsWith('/pending')) {
      store.dispatch(startLoading(''));
    } else if (
      action.type.endsWith('/fulfilled') ||
      action.type.endsWith('/rejected')
    ) {
      store.dispatch(stopLoading(''));
    }
    return next(action);
  };

const migrations = {
  4: (state: any) => {
    return {
      ...state,
      auth: authEmptyState(),
      main: mainEmptyState(),
    };
  },
  5: (state: any) => {
    return {
      ...state,
      auth: authEmptyState(),
      main: mainEmptyState(),
      sync: syncEmptyState(),
    };
  },
  6: (state: any) => {
    return {
      ...state,
      main: {
        ...state.main,
        debts: [],
      },
    };
  },
  7: (state: any) => {
    return {
      ...state,
      sync: {
        ...syncEmptyState(),
        ...state.sync,
        syncLogs: state.sync?.syncLogs ?? [],
      },
    };
  },
};

const persistConfig = {
  key: 'squirrel',
  version: 7,
  storage: AsyncStorage,
  whitelist: ['auth', 'main', 'sync'],
  migrate: createMigrate(migrations, {debug: false}),
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

const store = configureStore({
  reducer: persistedReducer,
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: false,
      immutableCheck: false,
      // serializableCheck: {
      //   ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      // },
    }).concat([authMiddleware, setLoadingStatusMiddleware]),
});

const persistor = persistStore(store);

export {store, persistor};
// Get the type of our store variable
export type AppStore = typeof store;
// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof rootReducer>;
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch;
