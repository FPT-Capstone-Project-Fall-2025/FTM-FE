import type { FamilyMember } from "@/types/familytree";
import { Calendar, User, X } from "lucide-react";

const MemberDetailPanel = ({
  member,
  onClose,
  onShowMemberDetail
}: {
  member: FamilyMember | null | undefined;
  onClose: () => void;
  onShowMemberDetail?: () => void;
}) => {
  const bgColor = member?.gender === 1 ? 'bg-pink-200' : 'bg-blue-200';
  return (
    <>
      {/* Backdrop overlay */}
      <div
        className={`absolute inset-0 bg-black/30 z-40 transition-opacity duration-300 ${member ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        onClick={onClose}
      />

      {/* Slide panel */}
      <div
        className={`absolute left-0 top-0 h-full w-96 ${bgColor} shadow-2xl z-50 transform transition-transform duration-300 ease-in-out overflow-y-auto ${member ? 'translate-x-0' : '-translate-x-[110%]'
          }`}
      >
        {member && (
          <div className="p-6">
            {/* Header */}
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-4">
                <div className={`w-16 h-16 rounded-full ${member.gender === 1 ? 'bg-pink-300' : 'bg-blue-300'} flex items-center justify-center`}>
                  {member.avatar ? (
                    <img src={member.avatar} alt={member.name ? member.name : ''} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <User className="w-8 h-8 text-white" />
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">{member.name}</h2>
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>Sinh: {new Date(member.birthday || '').toLocaleDateString('en-GB')}</span>
                  </div>
                  <div className="text-sm text-gray-600">Mất: -</div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1 hover:bg-white/30 rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-gray-700" />
              </button>
            </div>

            {/* Bio Section */}
            <div className="bg-white rounded-lg p-4 mb-4">
              <h3 className="font-semibold text-gray-800 mb-2">Mô tả tiểu sử</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                {member.bio || "Trống"}
              </p>
            </div>

            {/* Images Section */}
            <div className="mb-4">
              <h3 className="font-semibold text-gray-800 mb-3">Video và hình ảnh</h3>
              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <div key={i} className={`aspect-square rounded-lg ${member.gender === 1 ? 'bg-pink-300' : 'bg-blue-300'}`}>
                    {/* Placeholder for images */}
                  </div>
                ))}
              </div>
              <button 
              onClick={onShowMemberDetail}
              className="text-blue-600 text-sm mt-3 hover:underline">
                Xem thêm→
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default MemberDetailPanel;