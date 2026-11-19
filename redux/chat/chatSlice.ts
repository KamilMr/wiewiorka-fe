import {createSlice, type PayloadAction} from '@reduxjs/toolkit';

import type {RootState} from '../store';
import type {ChatAction} from '@/utils/wiewiorkaChat';

export type ChatMessage = {
  id: number;
  role: 'assistant' | 'user';
  text: string;
  action?: ChatAction;
};

const MAX_MESSAGES = 50;

const chatSlice = createSlice({
  name: 'chat',
  initialState: [] as ChatMessage[],
  reducers: {
    appendChatMessage(
      state,
      {payload}: PayloadAction<Omit<ChatMessage, 'id'>>,
    ) {
      const id = (state.at(-1)?.id ?? 0) + 1;
      state.push({...payload, id});
      if (state.length > MAX_MESSAGES) {
        state.splice(0, state.length - MAX_MESSAGES);
      }
    },
    clearChatHistory: () => [],
  },
});

export const {appendChatMessage, clearChatHistory} = chatSlice.actions;
export const selectChatMessages = (state: RootState) => state.chat;
export default chatSlice.reducer;
