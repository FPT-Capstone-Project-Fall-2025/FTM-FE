import { useState, useMemo } from 'react';
import ReactFlow, {
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
  type Edge,
  type Node,
} from 'reactflow';
import 'reactflow/dist/style.css';
import type { FamilyMember } from '@/types/familytree';
import MemberDetailPanel from './MemberDetailPanel';
import FamilyMemberNode from './FamilyMemberNode';

const FamilyTreeApp = () => {
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null);

  // Sample family tree data
  const sampleMembers: FamilyMember[] = [
    { id: '1', name: 'Trần Văn A', birthDate: '12/01/1970', gender: 'male' },
    { id: '2', name: 'Nguyễn Ngọc B', birthDate: '15/03/1970', gender: 'female' },
    { id: '3', name: 'Trần Văn B', birthDate: '10/04/1965', gender: 'male' },
    { id: '4', name: 'Trần Văn C', birthDate: '10/04/1968', gender: 'male' },
    { id: '5', name: 'Nguyễn Nga', birthDate: '12/01/1969', gender: 'female' },
    { id: '6', name: 'Trần Khởi', birthDate: '12/01/1980', gender: 'male' },
    { id: '7', name: 'Trần Ngọc Uyên', birthDate: '12/01/1985', gender: 'female' },
    { id: '8', name: 'Trần Ngọc Mỹ', birthDate: '12/01/1990', gender: 'female' },
    { id: '9', name: 'Trần Thắm', birthDate: '12/01/1991', gender: 'female' },
  ];

  // Create nodes with click handler
  const initialNodes: Node[] = useMemo(() =>
    sampleMembers.map((member, idx) => ({
      id: member.id,
      type: 'familyMember',
      position: {
        x: (idx % 4) * 200 + 100,
        y: Math.floor(idx / 4) * 150 + 50
      },
      data: {
        ...member,
        onMemberClick: (m: FamilyMember) => setSelectedMember(m)
      },
    })), [sampleMembers]
  );

  // Create edges (parent-child relationships)
  const initialEdges: Edge[] = [
    { id: 'e1-3', source: '1', target: '3', type: 'smoothstep', markerEnd: { type: MarkerType.ArrowClosed } },
    { id: 'e1-4', source: '1', target: '4', type: 'smoothstep', markerEnd: { type: MarkerType.ArrowClosed } },
    { id: 'e2-3', source: '2', target: '3', type: 'smoothstep', markerEnd: { type: MarkerType.ArrowClosed } },
    { id: 'e4-7', source: '4', target: '7', type: 'smoothstep', markerEnd: { type: MarkerType.ArrowClosed } },
    { id: 'e4-8', source: '4', target: '8', type: 'smoothstep', markerEnd: { type: MarkerType.ArrowClosed } },
    { id: 'e5-7', source: '5', target: '7', type: 'smoothstep', markerEnd: { type: MarkerType.ArrowClosed } },
  ];

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const nodeTypes = useMemo(() => ({ familyMember: FamilyMemberNode }), []);

  return (
    <div className="relative w-full h-full bg-gray-50">
      {/* Main Content */}
      <div className="flex h-full">
        {/* ReactFlow Canvas */}
        <div className="flex-1">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            proOptions={{ hideAttribution: true }}
            fitView
          >
            <Background />
            <Controls />
          </ReactFlow>
        </div>

        {/* Side Panel */}
        <MemberDetailPanel
          member={selectedMember}
          onClose={() => setSelectedMember(null)}
        />
      </div>
    </div>
  );
};

export default FamilyTreeApp;