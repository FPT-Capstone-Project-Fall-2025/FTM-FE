import { useMemo, useCallback, useEffect, memo, useState } from 'react';
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
import type { AddingNodeProps, FamilyMember } from '@/types/familytree';
import MemberDetailPanel from './MemberDetailPanel';
import FamilyMemberNode from './FamilyMemberNode';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';
import {
  fetchFamilyTree,
  setEdges,
  setHighlightedNode,
  setSelectedMember,
  updateNodePosition,
} from '@/stores/slices/familyTreeSlice';
import FamilyTreeToolbar from './FamilyTreeToolbar';
import { useReactFlowZoom } from '@/hooks/useReactFlowZoom';
import SearchBar from './SearchBar';
import AddNewNodeButton from './AddNewNodeButton';
import AddNewNode from './AddNewNode';
import familyTreeService from '@/services/familyTreeService';
import DeleteConfirmModal from './DeleteConfirmModal';
import { toast } from 'react-toastify';
import MemberDetailPage from '../../FamilyMemberDetail';

const nodeTypes = {
  familyMember: FamilyMemberNode,
};

// Memoized ReactFlow wrapper to prevent unnecessary re-renders
const MemoizedReactFlow = memo(({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  nodeTypes,
}: any) => {
  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      nodeTypes={nodeTypes}
      fitView
      proOptions={{ hideAttribution: true }}
    >
      <Background />
      <Controls />
    </ReactFlow>
  );
});

MemoizedReactFlow.displayName = 'MemoizedReactFlow';

const FamilyTreeContent = () => {
  const dispatch = useAppDispatch();
  const { focusNode } = useReactFlowZoom();

  const { edges: reduxEdges, nodes: reduxNodes, loading } = useAppSelector(state => state.familyTree);
  const members = useAppSelector(state => state.familyTree.members);
  const selectedMemberId = useAppSelector(state => state.familyTree.selectedMemberId);
  const selectedFamilyTree = useAppSelector(state => state.familyTreeMetaData.selectedFamilyTree);
  const [isAddingNewNode, setIsAddingNewNode] = useState(false);
  const [isDeletingNode, setIsDeletingNode] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<FamilyMember | null>(null);
  const [selectedParent, setSelectedParent] = useState<FamilyMember | null>(null);
  const selectedMember = selectedMemberId ? members[selectedMemberId] : null;
  const [showMemberDetailModal, setShowMemberDetailModal] = useState(false);

  const [nodes, setLocalNodes, onNodesChange] = useNodesState(reduxNodes);
  const [edges, setLocalEdges, onEdgesChange] = useEdgesState(reduxEdges);

  // CRITICAL: Sync when Redux state changes (for persistence rehydration)
  useEffect(() => {
    if (reduxNodes.length > 0) {
      setLocalNodes(reduxNodes);
    }
  }, [reduxNodes, setLocalNodes]);

  useEffect(() => {
    if (reduxEdges.length > 0) {
      setLocalEdges(reduxEdges);
    }
  }, [reduxEdges, setLocalEdges]);

  useEffect(() => {
    if (selectedFamilyTree?.id) {
      dispatch(fetchFamilyTree(selectedFamilyTree.id));
    }
  }, [selectedFamilyTree?.id, dispatch]);

  // Handle search selection - Focus and highlight node
  const handleSearchSelect = useCallback((memberId: string) => {
    dispatch(setHighlightedNode(memberId));
    focusNode(memberId, 1.5);
    dispatch(setSelectedMember(memberId));

    setTimeout(() => {
      dispatch(setHighlightedNode(null));
    }, 3000);
  }, [dispatch, focusNode]);

  // Optimized: Only save history on drag END, not during dragging
  const handleNodesChange: OnNodesChange = useCallback((changes) => {
    const isDragEnd = changes.some(c =>
      c.type === 'position' &&
      c.dragging === false &&
      c.position
    );

    if (isDragEnd) {
      // Batch update Redux for all position changes at once
      const positionChanges = changes.filter(c => c.type === 'position' && c.position);
      positionChanges.forEach(change => {
        if (change.type === 'position' && change.position) {
          dispatch(updateNodePosition({
            id: change.id,
            position: change.position,
          }));
        }
      });
    }

    // Apply changes to local state (this happens during dragging)
    onNodesChange(changes);
  }, [onNodesChange, dispatch, nodes, edges]);

  // Sync to Redux when edges change
  const handleEdgesChange: OnEdgesChange = useCallback((changes) => {
    onEdgesChange(changes);
  }, [onEdgesChange]);

  // Handle new connections
  const onConnect: OnConnect = useCallback((connection) => {
    const newEdges = addReactFlowEdge(connection, edges);
    setLocalEdges(newEdges);
    dispatch(setEdges(newEdges));
  }, [edges, nodes, dispatch, setLocalEdges]);

  // Handle member click - memoized to prevent recreating
  const handleMemberClick = useCallback((member: FamilyMember) => {
    dispatch(setSelectedMember(member.id));
  }, [dispatch]);

  // Handle close panel
  const handleClosePanel = useCallback(() => {
    dispatch(setSelectedMember(null));
  }, [dispatch]);

  const handleAddNewNode = useCallback(async (formData: AddingNodeProps) => {
    try {
      const response = await familyTreeService.createFamilyNode({
        ...formData,
        ftId: selectedFamilyTree?.id || "",
      });
      console.log("API Response:", response);
      toast.success(response.message)
      // Re-fetch the family tree to sync with the new node
      dispatch(fetchFamilyTree(selectedFamilyTree!.id));
    } catch (error: any) {
      console.error("Error adding new node:", error);
      toast.error(error?.response?.data?.message)
    } finally {
      setIsAddingNewNode(false);
      setSelectedParent(null);
    }
  }, [dispatch, selectedFamilyTree?.id]);

  // Handle delete node confirmation
  const handleDeleteNodeConfirm = useCallback(async () => {
    if (!memberToDelete?.id) return;
    
    setIsDeletingNode(true);
    try {
      const response = await familyTreeService.deleteFamilyNode(memberToDelete.id);
      toast.success(response.message)
      // Close the detail panel if the deleted member was selected
      if (selectedMemberId === memberToDelete.id) {
        dispatch(setSelectedMember(null));
      }
      
      // Re-fetch the family tree to sync with the deleted node
      if (selectedFamilyTree?.id) {
        await dispatch(fetchFamilyTree(selectedFamilyTree.id));
      }
      
      // Close the modal
      setMemberToDelete(null);
    } catch (error: any) {
      console.error("Error deleting node:", error);
      toast.error(error?.response?.data?.Message);
    } finally {
      setIsDeletingNode(false);
    }
  }, [memberToDelete, selectedFamilyTree?.id, selectedMemberId, dispatch]);

  // Handle delete node cancel
  const handleDeleteNodeCancel = useCallback(() => {
    setMemberToDelete(null);
    setIsDeletingNode(false);
  }, []);

  // Memoize enhanced nodes - only recreate when nodes or handler changes
  const enhancedNodes = useMemo(() => {
    return nodes.map(node => ({
      ...node,
      data: {
        ...node.data,
        onMemberClick: handleMemberClick,
        onAdd: () => {
          const member = members[node.id];
          if (member) {
            setSelectedParent(member);
            setIsAddingNewNode(true);
          }
        },
        onDelete: () => {
          const member = members[node.id];
          if (member) {
            setMemberToDelete(member);
          }
        }
      },
    }));
  }, [nodes, handleMemberClick, members]);

  const handleOpenMemberDetailPage = () => {
    setShowMemberDetailModal(true)
  }

  const handleCloseMemberDetailPage = () => {
    setShowMemberDetailModal(false)
  }

  // Memoize nodeTypes to prevent recreation
  const memoizedNodeTypes = useMemo(() => nodeTypes, []);

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
        <>
          {/* ReactFlow Canvas */}
          <div className="flex-1 relative">
            <MemoizedReactFlow
              nodes={enhancedNodes}
              edges={edges}
              onNodesChange={handleNodesChange}
              onEdgesChange={handleEdgesChange}
              onConnect={onConnect}
              nodeTypes={memoizedNodeTypes}
            />

            {/* Toolbar */}
            <FamilyTreeToolbar />

            {/* Search Bar */}
            <div className="absolute top-4 right-4 z-10">
              <SearchBar onSelectMember={handleSearchSelect} />
            </div>
          </div>

          {/* Side Panel */}
          <MemberDetailPanel
            member={selectedMember}
            onClose={handleClosePanel}
            onShowMemberDetail={handleOpenMemberDetailPage}
          />
        </>

        {/* Add New Node - Outside ReactFlow to prevent re-renders */}
        {nodes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <AddNewNodeButton onOpen={() => setIsAddingNewNode(true)} />
          </div>
        )}
        
        {/* Add New Node Modal */}
        {isAddingNewNode && (
          <AddNewNode
            ftId={selectedFamilyTree?.id || ""}
            isFirstNode={nodes.length === 0}
            parentMember={selectedParent}
            existingRelationships={[]}
            onSelectType={handleAddNewNode}
            onClose={() => {
              setIsAddingNewNode(false);
              setSelectedParent(null);
            }}
          />
        )}
        
        {/* Member Detail Modal */}
        {showMemberDetailModal && (
          <MemberDetailPage
            ftId={selectedFamilyTree?.id}
            memberId={selectedMember?.id}
            onClose={handleCloseMemberDetailPage}
          />
        )}

        {/* Delete Confirmation Modal */}
        {memberToDelete && (
          <DeleteConfirmModal
            member={memberToDelete}
            onConfirm={handleDeleteNodeConfirm}
            onCancel={handleDeleteNodeCancel}
            isDeleting={isDeletingNode}
          />
        )}
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