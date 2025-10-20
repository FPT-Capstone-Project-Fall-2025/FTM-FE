import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { type Node, type Edge } from 'reactflow';
import type { FamilyMember, Familytree } from '@/types/familytree';
import { mapFamilyDataToFlow } from '@/utils/familyTreeMapper';
import mockData from "@/utils/familyTreeData.json";

interface FamilyTreeState {
  nodes: Node[];
  edges: Edge[];
  selectedMemberId: string | null;
  members: Record<string, FamilyMember>;
  highlightedNodeId: string | null;
  selectedFamilyTree: Familytree | null;
  availableFamilyTrees: Familytree[];
}

const { edges, members, nodes } = mapFamilyDataToFlow(mockData);

const initialState: FamilyTreeState = {
  nodes: nodes,
  edges: edges,
  selectedMemberId: null,
  members: members,
  highlightedNodeId: null,
  selectedFamilyTree: null,
  availableFamilyTrees: [],
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
    setAvailableFamilyTrees: (state, action: PayloadAction<Familytree[]>) => {
      state.availableFamilyTrees = action.payload;
    },
    
    setSelectedFamilyTree: (state, action: PayloadAction<Familytree | null>) => {
      state.selectedFamilyTree = action.payload;
      
      // Clear current tree data when switching trees
      if (action.payload === null) {
        state.nodes = [];
        state.edges = [];
        state.members = {};
        state.selectedMemberId = null;
        state.highlightedNodeId = null;
      }
    },
    
    loadFamilyTreeData: (state, action: PayloadAction<{
      treeId: string;
      nodes: Node[];
      edges: Edge[];
      members: Record<string, FamilyMember>;
    }>) => {
      // Only load if the treeId matches the selected family tree
      if (state.selectedFamilyTree?.id === action.payload.treeId) {
        state.nodes = action.payload.nodes;
        state.edges = action.payload.edges;
        state.members = action.payload.members;
      }
    },
    
    addFamilyTree: (state, action: PayloadAction<Familytree>) => {
      state.availableFamilyTrees.push(action.payload);
    },
    
    updateFamilyTree: (state, action: PayloadAction<Familytree>) => {
      const index = state.availableFamilyTrees.findIndex(tree => tree.id === action.payload.id);
      if (index !== -1) {
        state.availableFamilyTrees[index] = action.payload;
      }
      
      // Update selected tree if it's the one being updated
      if (state.selectedFamilyTree?.id === action.payload.id) {
        state.selectedFamilyTree = action.payload;
      }
    },
    
    removeFamilyTree: (state, action: PayloadAction<string>) => {
      state.availableFamilyTrees = state.availableFamilyTrees.filter(
        tree => tree.id !== action.payload
      );
      
      // Clear selection if the removed tree was selected
      if (state.selectedFamilyTree?.id === action.payload) {
        state.selectedFamilyTree = null;
        state.nodes = [];
        state.edges = [];
        state.members = {};
        state.selectedMemberId = null;
        state.highlightedNodeId = null;
      }
    },
    
    clearFamilyTreeData: (state) => {
      state.nodes = [];
      state.edges = [];
      state.members = {};
      state.selectedMemberId = null;
      state.highlightedNodeId = null;
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
  applyLayout,
  setAvailableFamilyTrees,
  setSelectedFamilyTree,
  loadFamilyTreeData,
  addFamilyTree,
  updateFamilyTree,
  removeFamilyTree,
  clearFamilyTreeData,
} = familyTreeSlice.actions;

export default familyTreeSlice.reducer;