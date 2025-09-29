import type { FamilyMember } from "@/types/familytree";
import { User } from "lucide-react";
import { Handle, Position, type NodeProps } from "reactflow";

interface FamilyMemberNodeData extends FamilyMember {
  onMemberClick?: (member: FamilyMember) => void;
}

const FamilyMemberNode = ({ data }: NodeProps<FamilyMemberNodeData>) => {
  const bgColor = data.gender === 'female' ? 'bg-pink-100' : 'bg-blue-100';
  const borderColor = data.gender === 'female' ? 'border-pink-300' : 'border-blue-300';

  return (
    <div
      className={`${bgColor} ${borderColor} border-2 rounded-lg p-3 min-w-[140px] cursor-pointer hover:shadow-lg transition-shadow`}
      onClick={() => data.onMemberClick?.(data)}
    >
      <Handle type="target" position={Position.Top} className="w-2 h-2" />

      <div className="flex flex-col items-center gap-2">
        <div className={`w-12 h-12 rounded-full ${data.gender === 'female' ? 'bg-pink-300' : 'bg-blue-300'} flex items-center justify-center`}>
          {data.avatar ? (
            <img src={data.avatar} alt={data.name} className="w-full h-full rounded-full object-cover" />
          ) : (
            <User className="w-6 h-6 text-white" />
          )}
        </div>

        <div className="text-center">
          <div className="font-semibold text-sm text-gray-800">{data.name}</div>
          <div className="text-xs text-gray-600">{data.birthDate}</div>
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} className="w-2 h-2" />
    </div>
  );
};

export default FamilyMemberNode;