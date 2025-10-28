import { AlertTriangle, X } from 'lucide-react';
import type { FamilyMember } from '@/types/familytree';

interface DeleteConfirmModalProps {
  member: FamilyMember | null;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting?: boolean;
}

const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  member,
  onConfirm,
  onCancel,
  isDeleting = false
}) => {
  if (!member) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="bg-red-500 text-white p-6 flex items-center gap-4">
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold">Xác nhận xóa</h2>
            <p className="text-sm text-white/90">Hành động này không thể hoàn tác</p>
          </div>
          <button
            onClick={onCancel}
            disabled={isDeleting}
            className="p-1 hover:bg-white/20 rounded-full transition-colors disabled:opacity-50"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 overflow-hidden">
              {member.avatar ? (
                <img 
                  src={member.avatar} 
                  alt={member.name || ''} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-2xl font-bold text-gray-500">
                  {member.name?.charAt(0).toUpperCase() || '?'}
                </span>
              )}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg text-gray-900">{member.name}</h3>
              <p className="text-sm text-gray-600">Ngày sinh: {member.birthday || 'Không rõ'}</p>
            </div>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-gray-800 mb-2">
              Bạn có chắc chắn muốn xóa <span className="font-semibold">{member.name}</span> khỏi cây gia phả không?
            </p>
            <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
              <li>Tất cả thông tin của thành viên này sẽ bị xóa vĩnh viễn</li>
              <li>Các mối quan hệ gia đình sẽ bị ảnh hưởng</li>
              <li>Hình ảnh và câu chuyện liên quan sẽ bị mất</li>
            </ul>
          </div>

          <p className="text-sm text-gray-500 italic">
            Lưu ý: Hành động này không thể hoàn tác. Hãy cân nhắc kỹ trước khi xóa.
          </p>
        </div>

        {/* Actions */}
        <div className="bg-gray-50 px-6 py-4 flex gap-3 justify-end">
          <button
            onClick={onCancel}
            disabled={isDeleting}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors font-medium text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Hủy
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDeleting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Đang xóa...
              </>
            ) : (
              <>
                <AlertTriangle className="w-4 h-4" />
                Xác nhận xóa
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;