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
  // MiniMap,
} from 'reactflow';
import 'reactflow/dist/style.css';
import type { FamilyMember } from '@/types/familytree';
import MemberDetailPanel from './MemberDetailPanel';
import FamilyMemberNode from './FamilyMemberNode';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';
import { setEdges, setHighlightedNode, setSelectedMember, updateNodePosition } from '@/stores/slices/familyTreeSlice';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import FamilyTreeToolbar from './FamilyTreeToolbar';
import { addHistory } from '@/stores/slices/historySlice';
import { useReactFlowZoom } from '@/hooks/useReactFlowZoom';
import SearchBar from './SearchBar';

const nodeTypes = {
  familyMember: FamilyMemberNode
};

const FamilyTreeContent = () => {

  const dispatch = useAppDispatch();
  const { focusNode } = useReactFlowZoom();
  useKeyboardShortcuts();

  const reduxNodes = useAppSelector(state => state.familyTree.nodes);
  const reduxEdges = useAppSelector(state => state.familyTree.edges);
  const members = useAppSelector(state => state.familyTree.members);
  const selectedMemberId = useAppSelector(state => state.familyTree.selectedMemberId);

  // Get selected member from members object
  const selectedMember = selectedMemberId ? members[selectedMemberId] : null;

  const [nodes, setLocalNodes, onNodesChange] = useNodesState(reduxNodes);
  const [edges, setLocalEdges, onEdgesChange] = useEdgesState(reduxEdges);

  // CRITICAL: Sync when Redux state changes (for persistence rehydration)
  useEffect(() => {
    setLocalNodes(reduxNodes);
  }, [reduxNodes, setLocalNodes]);

  useEffect(() => {
    setLocalEdges(reduxEdges);
  }, [reduxEdges, setLocalEdges]);

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
  const enhancedNodes = useMemo(() =>
    nodes.map(node => ({
      ...node,
      data: {
        ...node.data,
        onMemberClick: handleMemberClick,
      },
    })),
    [nodes, handleMemberClick]
  );

  return (
    <div className="relative w-full h-full bg-gray-50">
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
            {/* <MiniMap 
              nodeColor={(node) => {
                return node.data.gender === 'female' ? '#fbcfe8' : '#bfdbfe';
              }}
              maskColor="rgba(0, 0, 0, 0.1)"
              position='top-right'
            /> */}
          </ReactFlow>
          {/* Toolbar */}
          {/* <FamilyTreeToolbar /> */}
          {/* Search Bar */}
          {/* <div className="absolute top-4 right-4 z-10">
            <SearchBar onSelectMember={handleSearchSelect} />
          </div> */}
        </div>

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
