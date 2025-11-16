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
import FamilyTreeInviteModal from './InviteMember';

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
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isLoadingRelationships, setIsLoadingRelationships] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<FamilyMember | null>(null);
  const [selectedParent, setSelectedParent] = useState<FamilyMember | null>(null);
  // const [existingRelationships, setExistingRelationships] = useState<string[]>([]);
  const selectedMember = selectedMemberId ? members[selectedMemberId] : null;
  const [showMemberDetailModal, setShowMemberDetailModal] = useState(false);
  const [nodes, setLocalNodes, onNodesChange] = useNodesState(reduxNodes);
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

  const fetchAddableRelationships = async (ftMemberId: string) => {
    try {
      setIsLoadingRelationships(true);
      const response = await familyTreeService.getAddableRelationships(ftMemberId);
      const data = response?.data;

      if (data) {
        const mappedRelationships: (
          | "father"
          | "mother"
          | "spouse"
          | "sibling"
          | "child-son"
          | "child-daughter"
        )[] = [];

        if (data.hasFather) mappedRelationships.push("father");
        if (data.hasMother) mappedRelationships.push("mother");
        if (data.hasSiblings) mappedRelationships.push("sibling");
        if (data.hasPartner) mappedRelationships.push("spouse");
        if (data.hasChildren) mappedRelationships.push("child-son", "child-daughter");

        // setExistingRelationships(mappedRelationships);
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Không thể lấy dữ liệu mối quan hệ");
    } finally {
      setIsLoadingRelationships(false);
    }
  };

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
            fetchAddableRelationships(member.id);
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

  const fullscreenStyles = `
  .family-tree-main-container:fullscreen {
    background-color: #f9fafb;
  }
  
  .family-tree-main-container:fullscreen .react-flow {
    width: 100vw;
    height: 100vh;
  }
  
  .family-tree-main-container:fullscreen .member-detail-panel {
    position: fixed;
    right: 0;
    top: 0;
    height: 100vh;
    z-index: 50;
  }
`;

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
    <>
      <style>{fullscreenStyles}</style>
      <div className="family-tree-main-container relative w-full h-full overflow-hidden bg-gray-50">
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
              <FamilyTreeToolbar
                handleInviteUser={() => setIsInviteModalOpen(true)}
              />

              <FamilyTreeInviteModal
                isOpen={isInviteModalOpen}
                onClose={() => setIsInviteModalOpen(false)}
              />

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

          {
            isLoadingRelationships && (
              <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl p-8 shadow-2xl">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-gray-600">Đang tải thông tin...</p>
                  </div>
                </div>
              </div>
            )}

          {/* Add New Node Modal */}
          {!isLoadingRelationships && isAddingNewNode && (
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
    </>
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