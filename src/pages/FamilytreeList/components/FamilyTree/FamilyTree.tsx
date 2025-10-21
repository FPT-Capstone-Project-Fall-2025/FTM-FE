import { useMemo, useCallback, useEffect } from 'react';
import ReactFlow, {
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  type OnNodesChange,
  type OnEdgesChange,
  type OnConnect,
  addEdge as addReactFlowEdge,
  ReactFlowProvider,
} from 'reactflow';
import 'reactflow/dist/style.css';
import type { FamilyMember } from '@/types/familytree';
import MemberDetailPanel from './MemberDetailPanel';
import FamilyMemberNode from './FamilyMemberNode';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';
import {
  fetchFamilyTree,
  setEdges,
  setHighlightedNode,
  setSelectedMember, updateNodePosition
} from '@/stores/slices/familyTreeSlice';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import FamilyTreeToolbar from './FamilyTreeToolbar';
import { addHistory } from '@/stores/slices/historySlice';
import { useReactFlowZoom } from '@/hooks/useReactFlowZoom';
import SearchBar from './SearchBar';
import AddNewNodeButton from './AddNewNodeButton';
// import AddNewNode from './AddNewNode';

const nodeTypes = {
  familyMember: FamilyMemberNode,
  // addNodeButton: AddNewNodeButton
};

const PLACEHOLDER_NODE = {
  id: "add-member-placeholder",
  type: "addNodeButton",
  position: { x: 250, y: 200 },
  data: {
    onAddMember: () => {
      console.log("Add member clicked");
    },
  },
};

const FamilyTreeContent = () => {

  const dispatch = useAppDispatch();
  const { focusNode } = useReactFlowZoom();
  useKeyboardShortcuts();

  const { edges: reduxEdges, nodes: reduxNodes, loading } = useAppSelector(state => state.familyTree);
  const members = useAppSelector(state => state.familyTree.members);
  const selectedMemberId = useAppSelector(state => state.familyTree.selectedMemberId);
  const selectedFamilyTree = useAppSelector(state => state.familyTreeMetaData.selectedFamilyTree);

  const selectedMember = selectedMemberId ? members[selectedMemberId] : null;

  const [nodes, setLocalNodes, onNodesChange] = useNodesState(reduxNodes.length ? reduxNodes : []);
  const [edges, setLocalEdges, onEdgesChange] = useEdgesState(reduxEdges);

  // CRITICAL: Sync when Redux state changes (for persistence rehydration)
  useEffect(() => {
    setLocalNodes(reduxNodes);
  }, [reduxNodes, setLocalNodes]);

  useEffect(() => {
    setLocalEdges(reduxEdges);
  }, [reduxEdges, setLocalEdges]);

  useEffect(() => {
    if (selectedFamilyTree?.id) {
      dispatch(fetchFamilyTree(selectedFamilyTree.id));
    }
  }, [selectedFamilyTree?.id, dispatch]);

  // Handle search selection - Focus and highlight node
  const handleSearchSelect = useCallback((memberId: string) => {
    // Highlight the node
    dispatch(setHighlightedNode(memberId));

    // Focus on the node with zoom
    focusNode(memberId, 1.5);

    // Open detail panel
    dispatch(setSelectedMember(memberId));

    // Remove highlight after 3 seconds
    setTimeout(() => {
      dispatch(setHighlightedNode(null));
    }, 3000);
  }, [dispatch, focusNode]);

  // Sync to Redux when nodes change
  const handleNodesChange: OnNodesChange = useCallback((changes) => {
    // Save to history before making changes (for drag operations)
    const isDragEnd = changes.some(c => c.type === 'position' && !(c as any).dragging);
    if (isDragEnd) {
      dispatch(addHistory({ nodes, edges }));
    }

    onNodesChange(changes);

    // Update Redux for position changes
    changes.forEach(change => {
      if (change.type === 'position' && change.position) {
        dispatch(updateNodePosition({
          id: change.id,
          position: change.position
        }));
      }
    });
  }, [onNodesChange, dispatch]);

  // Sync to Redux when edges change
  const handleEdgesChange: OnEdgesChange = useCallback((changes) => {
    onEdgesChange(changes);
    // Optionally sync to Redux
  }, [onEdgesChange]);

  // Handle new connections
  const onConnect: OnConnect = useCallback((connection) => {
    dispatch(addHistory({ nodes, edges }));
    setLocalEdges((eds) => addReactFlowEdge(connection, eds));
    dispatch(setEdges(addReactFlowEdge(connection, edges)));
  }, [edges, dispatch, setLocalEdges]);

  // Handle member click
  const handleMemberClick = useCallback((member: FamilyMember) => {
    dispatch(setSelectedMember(member.id));
  }, [dispatch]);

  // Handle close panel
  const handleClosePanel = useCallback(() => {
    dispatch(setSelectedMember(null));
  }, [dispatch]);

  // Create nodes with click handler
  const enhancedNodes = useMemo(() => {
    if (nodes && nodes.length > 0) {
      return nodes.map(node => ({
        ...node,
        data: {
          ...node.data,
          onMemberClick: handleMemberClick,
        },
      }));
    }
    // Return memoized placeholder
    return [PLACEHOLDER_NODE];
  }, [nodes, handleMemberClick]);

  console.log("render");

  if (loading) {
    return (
      <div className="relative w-full h-full overflow-hidden bg-gray-50 animate-pulse">
        <div className="flex h-full">
          <div className="flex-1 relative">
            <div className="absolute inset-0 bg-gray-100" />
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="h-10 w-10 rounded-full bg-gray-300"
                />
              ))}
            </div>
            <div className="absolute top-4 right-4 h-10 w-64 rounded-lg bg-gray-300" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full overflow-hidden bg-gray-50">
      {/* Main Content */}
      <div className="flex h-full">
        {/* ReactFlow Canvas */}
        <div className="flex-1">
          <ReactFlow
            nodes={enhancedNodes}
            edges={edges}
            onNodesChange={handleNodesChange}
            onEdgesChange={handleEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            fitView
            proOptions={{ hideAttribution: true }}
          >
            <Background />
            <Controls />
          </ReactFlow>
          {/* Toolbar */}
          <FamilyTreeToolbar />
          {/* Search Bar */}
          <div className="absolute top-4 right-4 z-10">
            <SearchBar onSelectMember={handleSearchSelect} />
          </div>
        </div>
        {/* <AddNewNode
          parentMember={{ id: "1", name: "Nguyễn Văn A", birthYear: "1966" }}
          existingRelationships={["father", "spouse"]} 
          onSelectType={(type) => console.log(type)}
          onClose={() => { }}
        /> */}
        {/* Side Panel */}
        <MemberDetailPanel
          member={selectedMember}
          onClose={handleClosePanel}
        />
      </div>
    </div>
  );
};

const FamilyTreeApp = () => {
  return (
    <ReactFlowProvider>
      <FamilyTreeContent />
    </ReactFlowProvider>
  );
};

export default FamilyTreeApp;
