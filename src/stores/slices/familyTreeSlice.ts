import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Node, Edge } from 'reactflow';

interface FamilyTreeState {
  nodes: Node[];
  edges: Edge[];
  selectedMemberId: string | null;
  viewport: { x: number; y: number; zoom: number };
}

const initialState: FamilyTreeState = {
  nodes: [],
  edges: [],
  selectedMemberId: null,
  viewport: { x: 0, y: 0, zoom: 1 },
};

const familyTreeSlice = createSlice({
  name: 'familyTree',
  initialState,
  reducers: {
    setNodes: (state, action: PayloadAction<Node[]>) => {
      state.nodes = action.payload;
    },
    setEdges: (state, action: PayloadAction<Edge[]>) => {
      state.edges = action.payload;
    },
    setSelectedMember: (state, action: PayloadAction<string | null>) => {
      state.selectedMemberId = action.payload;
    },
    updateViewport: (state, action) => {
      state.viewport = action.payload;
    },
  },
});

export const { setNodes, setEdges, setSelectedMember, updateViewport } = familyTreeSlice.actions;
export default familyTreeSlice.reducer;