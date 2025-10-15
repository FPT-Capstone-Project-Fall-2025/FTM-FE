import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Node, Edge } from 'reactflow';

interface HistoryState {
  past: Array<{
    nodes: Node[];
    edges: Edge[];
  }>;
  future: Array<{
    nodes: Node[];
    edges: Edge[];
  }>;
  canUndo: boolean;
  canRedo: boolean;
}

const initialState: HistoryState = {
  past: [],
  future: [],
  canUndo: false,
  canRedo: false,
};

const historySlice = createSlice({
  name: 'history',
  initialState,
  reducers: {
    addHistory: (state, action: PayloadAction<{ nodes: Node[]; edges: Edge[] }>) => {
      // Limit history to last 20 states
      if (state.past.length >= 20) {
        state.past.shift();
      }
      state.past.push(action.payload);
      state.future = [];
      state.canUndo = true;
      state.canRedo = false;
    },
    undo: (state) => {
      if (state.past.length > 0) {
        const previous = state.past.pop()!;
        state.future.unshift(previous);
        state.canUndo = state.past.length > 0;
        state.canRedo = true;
      }
    },
    redo: (state) => {
      if (state.future.length > 0) {
        const next = state.future.shift()!;
        state.past.push(next);
        state.canUndo = true;
        state.canRedo = state.future.length > 0;
      }
    },
    clearHistory: (state) => {
      state.past = [];
      state.future = [];
      state.canUndo = false;
      state.canRedo = false;
    },
  },
});

export const { addHistory, undo, redo, clearHistory } = historySlice.actions;
export default historySlice.reducer;