import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { type Node, type Edge, MarkerType } from 'reactflow';
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

// Mock data for testing
// const mockMembers: FamilyMember[] = [
//   { 
//     id: '1', 
//     name: 'Trần Văn A', 
//     birthDate: '12/01/1970', 
//     gender: 'male',
//     bio: 'Ông tổ của gia đình, người sáng lập dòng họ Trần tại Đà Nẵng.'
//   },
//   { 
//     id: '2', 
//     name: 'Nguyễn Ngọc B', 
//     birthDate: '15/03/1970', 
//     gender: 'female',
//     bio: 'Vợ của Trần Văn A, người phụ nữ đảm đang và hiền lành.'
//   },
//   { 
//     id: '3', 
//     name: 'Trần Văn B', 
//     birthDate: '10/04/1995', 
//     gender: 'male',
//     bio: 'Con trai trưởng của gia đình, hiện đang làm kỹ sư phần mềm.'
//   },
//   { 
//     id: '4', 
//     name: 'Trần Văn C', 
//     birthDate: '10/04/1998', 
//     gender: 'male',
//     bio: 'Con trai thứ hai, đang học đại học ngành kinh tế.'
//   },
//   { 
//     id: '5', 
//     name: 'Nguyễn Nga', 
//     birthDate: '12/01/1997', 
//     gender: 'female',
//     bio: 'Vợ của Trần Văn C, giáo viên tiểu học.'
//   },
//   { 
//     id: '6', 
//     name: 'Trần Khởi', 
//     birthDate: '12/01/2020', 
//     gender: 'male',
//     bio: 'Con trai của Trần Văn B, đang học mẫu giáo.'
//   },
//   { 
//     id: '7', 
//     name: 'Trần Ngọc Uyên', 
//     birthDate: '12/01/2021', 
//     gender: 'female',
//     bio: 'Con gái của Trần Văn C và Nguyễn Nga.'
//   },
//   { 
//     id: '8', 
//     name: 'Trần Ngọc Mỹ', 
//     birthDate: '12/01/2022', 
//     gender: 'female',
//     bio: 'Con gái thứ hai của Trần Văn C và Nguyễn Nga.'
//   },
//   { 
//     id: '9', 
//     name: 'Trần Thắm', 
//     birthDate: '12/01/1972', 
//     gender: 'female',
//     bio: 'Em gái của Trần Văn A, hiện đang sống ở Hà Nội.'
//   },
// ];

// Convert array to normalized object
// const normalizedMembers = mockMembers.reduce((acc, member) => {
//   acc[member.id] = member;
//   return acc;
// }, {} as Record<string, FamilyMember>);

// // Mock nodes
// const mockNodes: Node[] = mockMembers.map((member, idx) => ({
//   id: member.id,
//   type: 'familyMember',
//   position: { 
//     x: (idx % 3) * 250 + 100, 
//     y: Math.floor(idx / 3) * 180 + 50 
//   },
//   data: member,
// }));

// // Mock edges (parent-child relationships)
// const mockEdges: Edge[] = [
//   { 
//     id: 'e1-3', 
//     source: '1', 
//     target: '3', 
//     type: 'smoothstep', 
//     markerEnd: { type: MarkerType.ArrowClosed } 
//   },
//   { 
//     id: 'e1-4', 
//     source: '1', 
//     target: '4', 
//     type: 'smoothstep', 
//     markerEnd: { type: MarkerType.ArrowClosed } 
//   },
//   { 
//     id: 'e2-3', 
//     source: '2', 
//     target: '3', 
//     type: 'smoothstep', 
//     markerEnd: { type: MarkerType.ArrowClosed } 
//   },
//   { 
//     id: 'e2-4', 
//     source: '2', 
//     target: '4', 
//     type: 'smoothstep', 
//     markerEnd: { type: MarkerType.ArrowClosed } 
//   },
//   { 
//     id: 'e3-6', 
//     source: '3', 
//     target: '6', 
//     type: 'smoothstep', 
//     markerEnd: { type: MarkerType.ArrowClosed } 
//   },
//   { 
//     id: 'e4-7', 
//     source: '4', 
//     target: '7', 
//     type: 'smoothstep', 
//     markerEnd: { type: MarkerType.ArrowClosed } 
//   },
//   { 
//     id: 'e4-8', 
//     source: '4', 
//     target: '8', 
//     type: 'smoothstep', 
//     markerEnd: { type: MarkerType.ArrowClosed } 
//   },
//   { 
//     id: 'e5-7', 
//     source: '5', 
//     target: '7', 
//     type: 'smoothstep', 
//     markerEnd: { type: MarkerType.ArrowClosed } 
//   },
//   { 
//     id: 'e5-8', 
//     source: '5', 
//     target: '8', 
//     type: 'smoothstep', 
//     markerEnd: { type: MarkerType.ArrowClosed } 
//   },
// ];

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