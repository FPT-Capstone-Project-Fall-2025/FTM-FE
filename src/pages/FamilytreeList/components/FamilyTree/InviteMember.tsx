import React, { useState, useRef, useEffect } from 'react';
import { X, Check, Loader2 } from 'lucide-react';
import { useAppSelector } from '@/hooks/redux';
import type { PaginationProps } from '@/types/api';
import type { FamilyMemberList } from '@/types/familytree';
import familyTreeService from '@/services/familyTreeService';

type InviteType = 'guest' | 'family';

const MemberDropdown: React.FC<{
    value: string;
    onChange: (member: FamilyMemberList | null) => void;
}> = ({ value, onChange }) => {
    const selectedFamilyTree = useAppSelector(state => state.familyTreeMetaData.selectedFamilyTree)
    const [isOpen, setIsOpen] = useState(false);
    const [filter, setFilter] = useState(value);
    const [loading, setLoading] = useState(false);
    const [selectedMember, setSelectedMember] = useState<FamilyMemberList | null>(null);
    const [paginationData, setPaginationData] = useState<PaginationProps>({
        pageIndex: 1,
        pageSize: 100,
        propertyFilters: [
            {
                name: "FTId",
                operation: "EQUAL",
                value: selectedFamilyTree ? selectedFamilyTree.id : ''
            },
            {
                name: "isDeleted",
                operation: "EQUAL",
                value: 'false'
            }
        ],
        totalItems: 0,
        totalPages: 0,
    });
    const [familyMemberList, setFamilyMemberList] = useState<FamilyMemberList[]>([]);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const loadMembers = async () => {
        setLoading(true);
        try {
            const res = await familyTreeService.getFamilyTreeMembers(paginationData);
            setPaginationData(pre => ({
                ...pre,
                ...res.data
            }));
            setFamilyMemberList(res.data.data);
        } catch (error) {
            console.error("Failed to fetch members:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadMembers();
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredMembers = familyMemberList.filter(member =>
        member.fullname.toLowerCase().includes(filter.toLowerCase())
    );

    const handleSelectMember = (member: FamilyMemberList) => {
        setSelectedMember(member);
        setFilter(member.fullname);
        onChange(member);
        setIsOpen(false);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFilter(e.target.value);
        setIsOpen(true);
        if (!e.target.value) {
            setSelectedMember(null);
            onChange(null);
        }
    };

    return (
        <div ref={dropdownRef} className="relative w-full">
            <input
                type="text"
                value={filter}
                onChange={handleInputChange}
                onFocus={() => setIsOpen(true)}
                placeholder="Nhập tên thành viên..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-base"
            />

            {isOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                    {loading ? (
                        <div className="flex items-center justify-center py-4 text-gray-500">
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            Đang tải dữ liệu...
                        </div>
                    ) : filteredMembers.length > 0 ? (
                        filteredMembers.map(member => (
                            <div
                                key={member.id}
                                onClick={() => handleSelectMember(member)}
                                className={`flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 ${selectedMember?.id === member.id
                                        ? 'bg-black text-white hover:bg-black'
                                        : ''
                                    }`}
                            >
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-400 to-red-400 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                                    {member.fullname.charAt(0)}
                                </div>
                                <span className="flex-1 text-base">{member.fullname}</span>
                                {selectedMember?.id === member.id && (
                                    <Check size={20} className="flex-shrink-0" />
                                )}
                            </div>
                        ))
                    ) : (
                        <div className="px-4 py-3 text-gray-500 text-center">
                            Không tìm thấy thành viên
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const FamilyTreeInviteModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
    isOpen,
    onClose,
}) => {
    const [inviteType, setInviteType] = useState<InviteType>('guest');
    const [email, setEmail] = useState('');
    const [selectedMember, setSelectedMember] = useState<FamilyMemberList | null>(null);

    if (!isOpen) return null;

    const handleSendInvite = () => {
        if (inviteType === 'guest' && email) {
            console.log('Sending invite to guest:', email);
            // Handle guest invite
        } else if (inviteType === 'family' && selectedMember) {
            console.log('Sending invite to family member:', selectedMember);
            // Handle family member invite
        }
        onClose();
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
                            disabled={isInviteDisabled()}
                            className={`px-6 py-3 rounded-lg font-semibold text-base transition-colors ${isInviteDisabled()
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : 'bg-black text-white hover:bg-gray-800'
                                }`}
                        >
                            Gửi lời mời
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FamilyTreeInviteModal;
