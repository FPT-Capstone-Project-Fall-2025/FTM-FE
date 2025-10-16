import { X } from "lucide-react";
import React, { useMemo } from "react";
import ReactFlow, {
  type Node,
  type Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
} from "reactflow";
import "reactflow/dist/style.css";

interface AddNewNodeProps {
  parentName?: string;
  parentBirthYear?: string;
  parentId?: string;
  onClose?: () => void;
  onSelectType?: (type: string) => void;
}

const AddNewNode = ({
  parentName = "Nguyễn Văn A",
  parentBirthYear = "1966",
  parentId = "parent-1",
  onClose,
  onSelectType,
}: AddNewNodeProps) => {
  // Define relationships in correct hierarchy order
  const relationshipConfig = [
    // Row 1: Parents (CHA, MẸ)
    {
      id: "father",
      label: "THÊM CHA",
      row: 0,
      color: "bg-blue-50",
      textColor: "text-blue-600",
      borderColor: "border-blue-300",
    },
    {
      id: "mother",
      label: "THÊM MẸ",
      row: 0,
      color: "bg-blue-50",
      textColor: "text-blue-600",
      borderColor: "border-blue-300",
    },
    // Row 2: Spouse, Siblings (VỢ/CHỒNG, ANH/EM TRAI, CHỊ/EM GÁI)
    {
      id: "spouse",
      label: "THÊM VỢ/CHỒNG",
      row: 1,
      color: "bg-gray-100",
      textColor: "text-gray-600",
      borderColor: "border-gray-300",
    },
    {
      id: "sibling-brother",
      label: "THÊM ANH/EM TRAI",
      row: 1,
      color: "bg-blue-50",
      textColor: "text-blue-600",
      borderColor: "border-blue-300",
    },
    {
      id: "sibling-sister",
      label: "THÊM CHỊ/EM GÁI",
      row: 1,
      color: "bg-pink-100",
      textColor: "text-pink-600",
      borderColor: "border-pink-300",
    },
    // Row 3: Children (CON TRAI, CON GÁI)
    {
      id: "child-son",
      label: "THÊM CON TRAI",
      row: 2,
      color: "bg-blue-50",
      textColor: "text-blue-600",
      borderColor: "border-blue-300",
    },
    {
      id: "child-daughter",
      label: "THÊM CON GÁI",
      row: 2,
      color: "bg-pink-100",
      textColor: "text-pink-600",
      borderColor: "border-pink-300",
    },
  ];

  // Group by row
  const rowGroups = useMemo(() => {
    const groups: { [key: number]: typeof relationshipConfig } = {};
    relationshipConfig.forEach((rel) => {
      if (!groups[rel.row]) {
        groups[rel.row] = [];
      }
      groups[rel.row].push(rel);
    });
    return groups;
  }, []);

  // Create node position based on row and index
  const createNodePosition = (row: number, indexInRow: number, totalInRow: number) => {
    const horizontalSpacing = 180;
    const verticalSpacing = 150;

    // Y position based on row
    const y = row * verticalSpacing;

    // X position - center nodes horizontally within row
    const totalWidth = (totalInRow - 1) * horizontalSpacing;
    const x = indexInRow * horizontalSpacing - totalWidth / 2;

    return { x, y };
  };

  // Create nodes
  const initialNodes: Node[] = [
    {
      id: parentId,
      data: {
        label: (
          <div className="text-center">
            <div className="text-sm font-semibold text-gray-900">
              {parentName}
            </div>
            <div className="text-xs text-gray-600">{parentBirthYear}</div>
          </div>
        ),
      },
      position: { x: 0, y: 150 },
      style: {
        background: "white",
        border: "2px solid #d1d5db",
        borderRadius: "8px",
        padding: "12px",
        minWidth: "140px",
        fontSize: "12px",
        zIndex: 100,
      },
      draggable: false,
    },
    ...relationshipConfig.map((rel) => {
      const sameRowCount = rowGroups[rel.row].length;
      const sameRowIndex = rowGroups[rel.row].findIndex((r) => r.id === rel.id);
      const pos = createNodePosition(rel.row, sameRowIndex, sameRowCount);

      return {
        id: rel.id,
        data: { label: rel.label },
        position: pos,
        style: {
          background: rel.color,
          border: `2px solid`,
          borderColor: rel.borderColor.replace("border-", ""),
          borderRadius: "8px",
          padding: "12px",
          minWidth: "140px",
          cursor: "pointer",
          fontSize: "10px",
          fontWeight: "bold",
          color: rel.textColor.replace("text-", ""),
          textAlign: "center" as const,
        },
        draggable: false,
      };
    }),
  ];

  // Create edges
  const initialEdges: Edge[] = relationshipConfig.map((rel) => ({
    id: `${parentId}-${rel.id}`,
    source: parentId,
    target: rel.id,
    markerEnd: { type: MarkerType.ArrowClosed },
    style: { stroke: "#6b7280", strokeWidth: 2 },
  }));

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const handleNodeClick = (nodeId: string) => {
    if (nodeId !== parentId) {
      onSelectType?.(nodeId);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl shadow-2xl w-full max-w-5xl p-8 animate-in fade-in zoom-in">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-lg font-bold text-white mb-2">Thêm thành viên</h2>
            <p className="text-sm text-gray-400">
              Hãy chọn mối quan hệ bạn muốn thêm cho{" "}
              <span className="font-semibold text-white">{parentName}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* ReactFlow Canvas */}
        <div
          className="bg-gray-800 rounded-lg border border-gray-700 mb-6"
          style={{ height: "450px" }}
        >
          <ReactFlow
            nodes={nodes.map((node) => ({
              ...node,
              data: {
                ...node.data,
                onClick: () => handleNodeClick(node.id),
              },
            }))}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            fitView
            proOptions={{ hideAttribution: true }}
          >
            <Background color="#6b7280" gap={16} />
            <Controls />
          </ReactFlow>
        </div>

        {/* Cancel Button */}
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
          >
            Hủy
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddNewNode;