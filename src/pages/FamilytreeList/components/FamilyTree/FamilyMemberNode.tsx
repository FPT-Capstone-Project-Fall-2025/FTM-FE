import { useAppSelector } from "@/hooks/redux";
import type { FamilyMember } from "@/types/familytree";
import { User, Plus, Trash2, HeartCrack } from "lucide-react";
import { Handle, Position, type NodeProps } from "reactflow";

interface FamilyMemberNodeData extends FamilyMember {
  onMemberClick?: (member: FamilyMember) => void;
  onAdd?: () => void;
  onDelete?: () => void;
  isDivorced?: boolean;
}

const FamilyMemberNode = ({ data, id }: NodeProps<FamilyMemberNodeData>) => {
  const highlightedNodeId = useAppSelector(state => state.familyTree.highlightedNodeId);
  const isHighlighted = highlightedNodeId === id;
  const isDeleted = data.statusCode === 4001;
  const isDivorced = data.isDivorced;

  const bgColor = data.gender === 1 ? 'bg-pink-100' : 'bg-blue-100';
  const borderColor = data.gender === 1 ? 'border-pink-300' : 'border-blue-300';
  const borderStyle = isDivorced ? 'border-dashed' : 'border-solid';

  const highlightStyles = isHighlighted
    ? 'ring-4 ring-yellow-400 ring-opacity-75 shadow-2xl scale-110 animate-pulse'
    : '';

  // Deleted styles: strikethrough, opacity, grayscale
  const deletedStyles = isDeleted
    ? 'opacity-90 grayscale'
    : '';

  const nameTextStyles = isDeleted
    ? 'text-gray-500'
    : 'text-gray-800';

  const birthdayTextStyles = isDeleted
    ? 'text-gray-400'
    : 'text-gray-600';

  const divorcedStyles = isDivorced && !isDeleted
    ? 'opacity-85'
    : '';

  return (
    <div
      className={`
        ${bgColor} ${borderColor} ${borderStyle} ${highlightStyles} ${deletedStyles} ${divorcedStyles}
        border-2 rounded-lg p-3 min-w-[140px] cursor-pointer 
        hover:shadow-lg transition-all duration-200 relative group
        ${isDeleted ? 'cursor-not-allowed' : ''}
      `}
      onClick={() => !isDeleted && data.onMemberClick?.(data)} // Disable click if deleted
    >
      <Handle type="target" position={Position.Top} className="w-2 h-2" />

      <div className="flex flex-col items-center gap-2">
        <div className={`
          w-12 h-12 rounded-full 
          ${data.gender === 1 ? 'bg-pink-300' : 'bg-blue-300'} 
          flex items-center justify-center
          ${isDeleted ? 'grayscale opacity-60' : ''}
        `}>
          {data.avatar ? (
            <img
              src={data.avatar}
              alt={data.name || ''}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <User className="w-6 h-6 text-white" />
          )}
        </div>

        <div className="text-center">
          <div className={`font-semibold text-sm ${nameTextStyles} flex items-center justify-center`}>
            {data.name || 'Unknown'}
            {isDivorced && !isDeleted && (
              <HeartCrack className="w-4 h-4 text-red-500 ml-1" />
            )}
          </div>
          {/* Always render this block to maintain consistent height */}
          <div className="text-xs h-4 flex items-center justify-center">
            {data.birthday ? (
              <span className={birthdayTextStyles}>
                {new Date(data.birthday).toLocaleDateString('en-GB')}
              </span>
            ) : (
              <span className="invisible">00/00/0000</span>
            )}
          </div>
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} className="w-2 h-2" />

      {/* Add/Delete buttons: Hide for deleted nodes */}
      {!isDeleted && (
        <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => { e.stopPropagation(); data.onAdd?.(); }}
            className="p-1 bg-green-500 text-white rounded-full hover:bg-green-600 shadow-sm"
            title="Add child"
          >
            <Plus size={16} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); data.onDelete?.(); }}
            className="p-1 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-sm"
            title="Delete member"
          >
            <Trash2 size={16} />
          </button>
        </div>
      )}
    </div>
  );
};

export default FamilyMemberNode;