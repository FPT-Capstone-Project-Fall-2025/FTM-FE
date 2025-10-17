import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { type Node, type Edge } from 'reactflow';
import type { FamilyMember } from '@/types/familytree';
import { mapFamilyDataToFlow } from '@/utils/familyTreeMapper';
import mockData from "@/utils/familyTreeData.json";

interface FamilyTreeState {
  nodes: Node[];
  edges: Edge[];
  selectedMemberId: string | null;
  members: Record<string, FamilyMember>;
  highlightedNodeId: string | null;
}

const { edges, members, nodes } = mapFamilyDataToFlow(mockData);

const initialState: FamilyTreeState = {
  nodes: nodes,
  edges: edges,
  selectedMemberId: null,
  members: members,
  highlightedNodeId: null,
};

const familyTreeSlice = createSlice({
  name: 'familyTree',
  initialState,
  reducers: {
    setNodes: (state, action: PayloadAction<Node[]>) => {
      state.nodes = action.payload;
    },
    updateNodePosition: (state, action: PayloadAction<{ id: string; position: { x: number; y: number } }>) => {
      const node = state.nodes.find(n => n.id === action.payload.id);
      if (node) {
        node.position = action.payload.position;
      }
    },
    setEdges: (state, action: PayloadAction<Edge[]>) => {
      state.edges = action.payload;
    },
    setSelectedMember: (state, action: PayloadAction<string | null>) => {
      state.selectedMemberId = action.payload;
    },
    addMember: (state, action: PayloadAction<FamilyMember>) => {
      state.members[action.payload.id] = action.payload;
    },
    updateMember: (state, action: PayloadAction<FamilyMember>) => {
      state.members[action.payload.id] = action.payload;
    },
    deleteMember: (state, action: PayloadAction<string>) => {
      delete state.members[action.payload];
      state.nodes = state.nodes.filter(n => n.id !== action.payload);
      state.edges = state.edges.filter(e => e.source !== action.payload && e.target !== action.payload);
    },
    setHighlightedNode: (state, action: PayloadAction<string | null>) => {
      state.highlightedNodeId = action.payload;
    },
    importFamilyTree: (state, action: PayloadAction<{
      nodes: Node[];
      edges: Edge[];
      members: Record<string, FamilyMember>;
    }>) => {
      state.nodes = action.payload.nodes;
      state.edges = action.payload.edges;
      state.members = action.payload.members;
    },
    applyLayout: (state, action: PayloadAction<Node[]>) => {
      state.nodes = action.payload;
    },
  },
});

export const {
  setNodes,
  updateNodePosition,
  setEdges,
  setSelectedMember,
  addMember,
  updateMember,
  deleteMember,
  setHighlightedNode,
  importFamilyTree,
  applyLayout
} = familyTreeSlice.actions;

export default familyTreeSlice.reducer;