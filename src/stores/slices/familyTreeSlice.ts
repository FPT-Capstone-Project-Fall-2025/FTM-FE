import {
  createAsyncThunk,
  createSlice,
  type PayloadAction,
} from '@reduxjs/toolkit';
import { type Node, type Edge } from 'reactflow';
import type { FamilyMember } from '@/types/familytree';
import { mapFamilyDataToFlow } from '@/utils/familyTreeMapper';
import familytreeService from '@/services/familyTreeService';

interface FamilyTreeState {
  nodes: Node[];
  edges: Edge[];
  selectedMemberId: string | null;
  members: Record<string, FamilyMember>;
  highlightedNodeId: string | null;
  loading: boolean;
  error: string | null;

  initialNodes?: Node[];
  initialEdges?: Edge[];
}

const initialState: FamilyTreeState = {
  nodes: [],
  edges: [],
  members: {},
  selectedMemberId: null,
  highlightedNodeId: null,
  loading: false,
  error: null,
};

export const fetchFamilyTree = createAsyncThunk(
  'familyTree/fetchFamilyTree',
  async (treeId: string, { rejectWithValue }) => {
    try {
      const response = await familytreeService.getFamilyTreeData(treeId);
      const { nodes, edges, members } = mapFamilyDataToFlow(response.data);
      return {
        nodes,
        edges,
        members,
        initialNodes: nodes,
        initialEdges: edges,
      };
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to load family tree');
    }
  }
);

const familyTreeSlice = createSlice({
  name: 'familyTree',
  initialState,
  reducers: {
    setNodes: (state, action: PayloadAction<Node[]>) => {
      state.nodes = action.payload;
    },
    updateNodePosition: (
      state,
      action: PayloadAction<{ id: string; position: { x: number; y: number } }>
    ) => {
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
      state.edges = state.edges.filter(
        e => e.source !== action.payload && e.target !== action.payload
      );
    },
    setHighlightedNode: (state, action: PayloadAction<string | null>) => {
      state.highlightedNodeId = action.payload;
    },
    importFamilyTree: (
      state,
      action: PayloadAction<{
        nodes: Node[];
        edges: Edge[];
        members: Record<string, FamilyMember>;
      }>
    ) => {
      state.nodes = action.payload.nodes;
      state.edges = action.payload.edges;
      state.members = action.payload.members;

      state.initialNodes = action.payload.nodes;
      state.initialEdges = action.payload.edges;
    },
    applyLayout: (state, action: PayloadAction<Node[]>) => {
      state.nodes = action.payload;
    },
    resetToInitialLayout: state => {
      console.log('Reset triggered', {
        hasInitial: !!state.initialNodes,
        nodeCount: state.initialNodes?.length,
      });
      if (state.initialNodes && state.initialEdges) {
        state.nodes = [...state.initialNodes];
        state.edges = [...state.initialEdges];
      }
    },
    clearFamilyTree: state => {
      state.nodes = [];
      state.edges = [];
      state.members = {};
      state.selectedMemberId = null;
      state.highlightedNodeId = null;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchFamilyTree.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFamilyTree.fulfilled, (state, action) => {
        state.nodes = action.payload.nodes;
        state.edges = action.payload.edges;
        state.members = action.payload.members;
        state.initialNodes = action.payload.initialNodes;
        state.initialEdges = action.payload.initialEdges;
        state.loading = false;
        state.error = null;
      })
      .addCase(fetchFamilyTree.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as string) || 'Failed to fetch family tree';
      });
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
  resetToInitialLayout,
  clearFamilyTree,
} = familyTreeSlice.actions;

export default familyTreeSlice.reducer;
