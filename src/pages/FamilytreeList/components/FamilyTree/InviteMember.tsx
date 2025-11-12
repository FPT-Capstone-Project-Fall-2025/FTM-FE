import React, { useState } from 'react';
import { X, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import type { FamilyMemberList } from '@/types/familytree';
import familyTreeService from '@/services/familyTreeService';
import { useAppSelector } from '@/hooks/redux';
import MemberDropdown from './MemberDropDown';

type InviteType = 'guest' | 'family';
type ToastType = 'success' | 'error' | null;

const FamilyTreeInviteModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
    isOpen,
    onClose,
}) => {
    const selectedFamilyTree = useAppSelector(state => state.familyTreeMetaData.selectedFamilyTree);
    const [inviteType, setInviteType] = useState<InviteType>('guest');
    const [email, setEmail] = useState('');
    const [selectedMember, setSelectedMember] = useState<FamilyMemberList | null>(null);
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState<{ type: ToastType; message: string }>({ type: null, message: '' });

    if (!isOpen) return null;

    const showToast = (type: ToastType, message: string) => {
        setToast({ type, message });
        setTimeout(() => setToast({ type: null, message: '' }), 3000);
    };

    const handleSendInvite = async () => {
        if (!selectedFamilyTree?.id) {
            showToast('error', 'Chưa chọn cây gia phả');
            return;
        }

        setLoading(true);
        try {
            if (inviteType === 'guest' && email) {
                console.log('Sending invite to guest:', email);
                await familyTreeService.inviteGuestToFamilyTree(selectedFamilyTree.id, email);
                showToast('success', `Gửi lời mời thành công tới ${email}`);
                setEmail('');
            } else if (inviteType === 'family' && selectedMember) {
                console.log('Sending invite to family member:', selectedMember);
                await familyTreeService.inviteMemberToFamilyTree(selectedFamilyTree.id, selectedMember.id, email);
                showToast('success', `Gửi lời mời thành công tới ${selectedMember.fullname}`);
                setEmail('');
                setSelectedMember(null);
            }
            onClose();
        } catch (error: any) {
            const errorMessage = error?.response?.data?.message || 'Gửi lời mời thất bại. Vui lòng thử lại.';
            showToast('error', errorMessage);
            console.error('Failed to send invite:', error);
        } finally {
            setLoading(false);
        }
    };

    const isInviteDisabled = () => {
        if (inviteType === 'guest') {
            return !email || !email.includes('@');
        }
        return !selectedMember;
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-2xl p-8 relative">
                {/* Header */}
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">
                            Mời thành viên tham gia cây gia phả
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="cursor-pointer text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Invite Type Selection */}
                <div className="mb-6">
                    <h3 className="text-base font-semibold text-gray-900 mb-4">
                        Thêm thành viên mới:
                    </h3>

                    {/* Guest Member Option */}
                    <div className="mb-4">
                        <label className="flex items-start cursor-pointer group">
                            <input
                                type="radio"
                                name="inviteType"
                                value="guest"
                                checked={inviteType === 'guest'}
                                onChange={(e) => setInviteType(e.target.value as InviteType)}
                                className="mt-1 w-5 h-5 text-blue-500 flex-shrink-0"
                            />
                            <div className="ml-3 flex-1">
                                <div className="font-semibold text-gray-900 text-base">Thành viên khách</div>
                                <div className="text-gray-500 text-sm mt-1">
                                    Không có kết nối cây gia phả và không thể chỉnh sửa thông tin gia phả
                                </div>
                            </div>
                        </label>
                    </div>

                    {/* Family Member Option */}
                    <div>
                        <label className="flex items-start cursor-pointer group">
                            <input
                                type="radio"
                                name="inviteType"
                                value="family"
                                checked={inviteType === 'family'}
                                onChange={(e) => setInviteType(e.target.value as InviteType)}
                                className="mt-1 w-5 h-5 text-blue-500 flex-shrink-0"
                            />
                            <div className="ml-3 flex-1">
                                <div className="font-semibold text-gray-900 text-base">Thành viên gia phả</div>
                                <div className="text-gray-500 text-sm mt-1 mb-1">
                                    Kết nối với thông tin có sẵn trên cây gia phả của
                                </div>
                                {inviteType === 'family' && (
                                    <MemberDropdown
                                        value=""
                                        onChange={setSelectedMember}
                                    />
                                )}
                            </div>
                        </label>

                    </div>
                </div>

                {/* Email Input Section */}
                <div className="mb-6">
                    <h3 className="text-base font-semibold text-gray-900 mb-3">
                        Gửi lời mời tham gia cây gia phả tới:
                    </h3>
                    <div className="flex gap-4">
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="user@gmail.com"
                            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-base"
                        />
                        <button
                            onClick={handleSendInvite}
                            disabled={isInviteDisabled() || loading}
                            className={`px-6 py-3 rounded-lg font-semibold text-base transition-colors flex items-center gap-2 ${isInviteDisabled() || loading
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : 'bg-black text-white hover:bg-gray-800'
                                }`}
                        >
                            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                            <span>{loading ? 'Đang gửi...' : 'Gửi lời mời'}</span>
                        </button>
                    </div>
                </div>

                {/* Toast Notification */}
                {toast.type && (
                    <div className={`mt-4 p-4 rounded-lg flex items-center gap-3 ${toast.type === 'success'
                            ? 'bg-green-50 border border-green-200'
                            : 'bg-red-50 border border-red-200'
                        }`}>
                        {toast.type === 'success' ? (
                            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                        ) : (
                            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                        )}
                        <span className={`text-sm font-medium ${toast.type === 'success' ? 'text-green-800' : 'text-red-800'
                            }`}>
                            {toast.message}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FamilyTreeInviteModal;
