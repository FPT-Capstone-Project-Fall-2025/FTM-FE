import { useEffect, useState, useCallback } from "react";
import { Search, Users, UserCheck, Eye, X, Trash2, Mail } from "lucide-react";
import { Pagination } from "@/components/ui/Pagination";
import type { PaginationProps } from "@/types/api";
import type { FamilyMemberList, FamilyNodeList } from "@/types/familytree";
import familyTreeService from "@/services/familyTreeService";
import { useAppSelector } from "@/hooks/redux";
import type { UserProfile } from "@/types/user";
import userService from "@/services/userService";
import { toast } from "react-toastify";
import { usePermissions } from "@/hooks/usePermissions";
import NoPermission from "@/components/shared/NoPermission";
import ExceptionPopup from "@/components/shared/ExceptionPopup";
import { useErrorPopup } from "@/hooks/useErrorPopup";

type ViewMode = 'member' | 'guest' | 'unlinked';

const Members: React.FC = () => {
    const permissions = usePermissions();
    const selectedFamilyTree = useAppSelector(state => state.familyTreeMetaData.selectedFamilyTree)
    const [searchTerm, setSearchTerm] = useState("");
    const [viewMode, setViewMode] = useState<ViewMode>('member');
    const [loading, setLoading] = useState(false);
    const [paginationData, setPaginationData] = useState<PaginationProps>({
        pageIndex: 1,
        pageSize: 10,
        propertyFilters: [
            {
                name: "FTId",
                operation: "EQUAL",
                value: selectedFamilyTree ? selectedFamilyTree.id : ''
            }
        ],
        totalItems: 0,
        totalPages: 0,
    });
    const [familyMemberList, setFamilyMemberList] = useState<FamilyMemberList[]>([]);
    const [unlinkedNodeList, setUnlinkedNodeList] = useState<FamilyNodeList[]>([]);
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [detailProfile, setDetailProfile] = useState<UserProfile | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [detailError, setDetailError] = useState<string | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deletingUser, setDeletingUser] = useState<FamilyMemberList | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [selectedNodeForInvite, setSelectedNodeForInvite] = useState<FamilyNodeList | null>(null);
    const [inviteEmail, setInviteEmail] = useState("");
    const [isInviting, setIsInviting] = useState(false);
    const [unlinkedNodeDetailModalOpen, setUnlinkedNodeDetailModalOpen] = useState(false);
    const [unlinkedNodeDetailProfile, setUnlinkedNodeDetailProfile] = useState<UserProfile | null>(null);
    const [unlinkedNodeDetailLoading, setUnlinkedNodeDetailLoading] = useState(false);
    const [unlinkedNodeDetailError, setUnlinkedNodeDetailError] = useState<string | null>(null);
    const { errorPopup, showError, closeError } = useErrorPopup();

    const loadMembers = useCallback(async () => {
        if (!selectedFamilyTree?.id) return;

        setLoading(true);
        try {
            if (viewMode === 'member') {
                // For members view, fetch both FTOwner and FTMember
                // We'll fetch them separately and combine the results
                const baseFilter = {
                    name: "FTId",
                    operation: "EQUAL",
                    value: selectedFamilyTree.id
                };

                // Fetch all FTOwner (usually just 1, but fetch with reasonable limit)
                const ownerRes = await familyTreeService.getFamilyTreeMembers(selectedFamilyTree.id, {
                    pageIndex: 1,
                    pageSize: 100, // Get all owners (should be just 1, but safe limit)
                    propertyFilters: [
                        baseFilter,
                        {
                            name: "FTRole",
                            operation: "EQUAL",
                            value: 'FTOwner'
                        }
                    ],
                    totalItems: 0,
                    totalPages: 0,
                });

                // Fetch all FTMember (we need all to combine properly)
                const memberRes = await familyTreeService.getFamilyTreeMembers(selectedFamilyTree.id, {
                    pageIndex: 1,
                    pageSize: 1000, // Get all members for proper pagination
                    propertyFilters: [
                        baseFilter,
                        {
                            name: "FTRole",
                            operation: "EQUAL",
                            value: 'FTMember'
                        }
                    ],
                    totalItems: 0,
                    totalPages: 0,
                });

                // Combine results: owners first, then members
                const allMembers = [...ownerRes.data.data, ...memberRes.data.data];

                // Apply client-side pagination
                const startIndex = (paginationData.pageIndex - 1) * paginationData.pageSize;
                const endIndex = startIndex + paginationData.pageSize;
                const paginatedMembers = allMembers.slice(startIndex, endIndex);

                setPaginationData(pre => ({
                    ...pre,
                    totalItems: allMembers.length,
                    totalPages: Math.ceil(allMembers.length / paginationData.pageSize)
                }));
                setFamilyMemberList(paginatedMembers);
                setUnlinkedNodeList([]);
            } else if (viewMode === 'guest') {
                // For guests view, fetch only FTGuest
                const filters = [
                    {
                        name: "FTId",
                        operation: "EQUAL",
                        value: selectedFamilyTree.id
                    },
                    {
                        name: "FTRole",
                        operation: "EQUAL",
                        value: 'FTGuest'
                    }
                ];

                const res = await familyTreeService.getFamilyTreeMembers(selectedFamilyTree.id, {
                    pageIndex: paginationData.pageIndex,
                    pageSize: paginationData.pageSize,
                    propertyFilters: filters,
                    totalItems: 0,
                    totalPages: 0,
                });
                setPaginationData(pre => ({
                    ...pre,
                    ...res.data
                }));
                setFamilyMemberList(res.data.data);
                setUnlinkedNodeList([]);
            } else {
                // For unlinked nodes view, fetch nodes without userId
                const unlinkedNodeRes = await familyTreeService.getFamilyTreeNodes(selectedFamilyTree.id, {
                    pageIndex: paginationData.pageIndex,
                    pageSize: paginationData.pageSize,
                    propertyFilters: [
                        {
                            name: "FTId",
                            operation: "EQUAL",
                            value: selectedFamilyTree.id
                        },
                    ],
                    totalItems: 0,
                    totalPages: 0,
                });

                setPaginationData(pre => ({
                    ...pre,
                    ...unlinkedNodeRes.data
                }));
                setUnlinkedNodeList(unlinkedNodeRes.data.data);
                setFamilyMemberList([]);
            }
        } catch (error) {
            console.error("Failed to fetch members:", error);
        } finally {
            setLoading(false);
        }
    }, [selectedFamilyTree?.id, viewMode, paginationData.pageIndex, paginationData.pageSize]);

    useEffect(() => {
        // Reset to page 1 when view mode or search term changes
        setPaginationData(prev => ({
            ...prev,
            pageIndex: 1
        }));
    }, [viewMode, searchTerm]);

    useEffect(() => {
        loadMembers();
    }, [loadMembers]);

    const handlePageChange = (page: number) => {
        setPaginationData(prev => ({
            ...prev,
            pageIndex: page,
        }));
    };

    const getRoleLabel = (ftRole: string) => {
        switch (ftRole) {
            case 'FTOwner':
                return 'Chủ sở hữu';
            case 'FTMember':
                return 'Thành viên';
            case 'FTGuest':
                return 'Khách';
            default:
                return ftRole;
        }
    };

    const getRoleBadgeColor = (ftRole: string) => {
        switch (ftRole) {
            case 'FTOwner':
                return 'bg-amber-100 text-amber-800 border-amber-200';
            case 'FTMember':
                return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'FTGuest':
                return 'bg-purple-100 text-purple-800 border-purple-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    // Filter members by search term
    const filteredMembers = familyMemberList.filter(member => {
        if (!searchTerm) return true;
        const searchLower = searchTerm.toLowerCase();
        return (
            member.name?.toLowerCase().includes(searchLower) ||
            member.username?.toLowerCase().includes(searchLower) ||
            member.userId?.toLowerCase().includes(searchLower)
        );
    });

    const closeDetailModal = () => {
        setDetailModalOpen(false);
        setDetailProfile(null);
        setDetailError(null);
        setDetailLoading(false);
    };

    const handleViewDetail = async (member: FamilyMemberList) => {
        if (viewMode !== 'member' || member.ftRole === 'FTGuest') return;
        if (!selectedFamilyTree?.id) return;

        const candidateId = member.userId;
        if (!candidateId) {
            setDetailError("Không tìm thấy thông tin chi tiết cho thành viên này.");
            setDetailProfile(null);
            setDetailModalOpen(true);
            return;
        }

        setDetailModalOpen(true);
        setDetailLoading(true);
        setDetailError(null);
        setDetailProfile(null);

        try {
            const res = await userService.getProfileByUserId(candidateId);
            setDetailProfile(res.data);
        } catch (error) {
            console.error("Failed to load member detail:", error);
            setDetailError("Không thể tải thông tin chi tiết. Vui lòng thử lại.");
        } finally {
            setDetailLoading(false);
        }
    };

    const getMemberDisplayName = (member: FamilyMemberList) =>
        member.name || member.username || "Không rõ";

    const handleDeleteUser = (member: FamilyMemberList) => {
        setDeletingUser(member);
        setShowDeleteConfirm(true);
    };

    const confirmDeleteUser = async () => {
        if (!deletingUser || !selectedFamilyTree?.id) return;

        setIsDeleting(true);
        try {
            await familyTreeService.deleteUserFromFamilyTree(
                selectedFamilyTree.id,
                deletingUser.userId
            );
            const roleLabel = deletingUser.ftRole === 'FTGuest' ? 'khách' : 'thành viên';
            toast.success(`Xóa ${roleLabel} thành công!`);
            // Reload the members list
            loadMembers();
        } catch (error) {
            console.error('Failed to delete user:', error);
            showError('Không thể xóa. Vui lòng thử lại.');
        } finally {
            setIsDeleting(false);
            setShowDeleteConfirm(false);
            setDeletingUser(null);
        }
    };

    const handleOpenInviteModal = (node: FamilyNodeList) => {
        setSelectedNodeForInvite(node);
        setShowInviteModal(true);
        setInviteEmail("");
    };

    const handleCloseInviteModal = () => {
        setShowInviteModal(false);
        setSelectedNodeForInvite(null);
        setInviteEmail("");
    };

    const handleSendInvite = async () => {
        if (!selectedFamilyTree?.id || !selectedNodeForInvite?.id || !inviteEmail) return;

        if (!inviteEmail.includes('@')) {
            showError('Vui lòng nhập địa chỉ email hợp lệ');
            return;
        }

        setIsInviting(true);
        try {
            await familyTreeService.inviteMemberToFamilyTree(
                selectedFamilyTree.id,
                selectedNodeForInvite.id,
                inviteEmail
            );
            toast.success(`Gửi lời mời thành công tới ${inviteEmail}`);
            handleCloseInviteModal();
        } catch (error: any) {
            const errorMessage = error?.response?.data?.message || 'Gửi lời mời thất bại. Vui lòng thử lại.';
            showError(errorMessage);
            console.error('Failed to send invite:', error);
        } finally {
            setIsInviting(false);
        }
    };

    const closeUnlinkedNodeDetailModal = () => {
        setUnlinkedNodeDetailModalOpen(false);
        setUnlinkedNodeDetailProfile(null);
        setUnlinkedNodeDetailError(null);
        setUnlinkedNodeDetailLoading(false);
    };

    const handleViewUnlinkedNodeDetail = async (node: FamilyNodeList) => {
        if (!node.userId) return;

        setUnlinkedNodeDetailModalOpen(true);
        setUnlinkedNodeDetailLoading(true);
        setUnlinkedNodeDetailError(null);
        setUnlinkedNodeDetailProfile(null);

        try {
            const res = await userService.getProfileByUserId(node.userId);
            setUnlinkedNodeDetailProfile(res.data);
        } catch (error) {
            console.error("Failed to load member detail:", error);
            setUnlinkedNodeDetailError("Không thể tải thông tin chi tiết. Vui lòng thử lại.");
        } finally {
            setUnlinkedNodeDetailLoading(false);
        }
    };

    // Show loading state while permissions are being fetched
    if (permissions.isLoading) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    // Check permissions after all hooks are called
    if (!permissions.canView('MEMBER')) {
        return <NoPermission />;
    }

    return (
        <>
            <div className="h-full overflow-hidden space-y-6 flex flex-col p-6 bg-gray-50">
                {/* Header with View Mode Toggle and Search */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    {/* View Mode Toggle */}
                    <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-200 p-1 shadow-sm">
                        <button
                            onClick={() => setViewMode('member')}
                            className={`flex items-center cursor-pointer gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${viewMode === 'member'
                                ? 'bg-blue-600 text-white shadow-sm'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                }`}
                        >
                            <Users className="w-4 h-4" />
                            Thành viên
                        </button>
                        <button
                            onClick={() => setViewMode('guest')}
                            className={`flex items-center cursor-pointer gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${viewMode === 'guest'
                                ? 'bg-purple-600 text-white shadow-sm'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                }`}
                        >
                            <UserCheck className="w-4 h-4" />
                            Khách
                        </button>
                        <button
                            onClick={() => setViewMode('unlinked')}
                            className={`flex items-center cursor-pointer gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${viewMode === 'unlinked'
                                ? 'bg-green-600 text-white shadow-sm'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                }`}
                        >
                            <Users className="w-4 h-4" />
                            Chưa liên kết
                        </button>
                    </div>

                    {/* Search */}
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm theo tên, email..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                </div>

                {/* Table */}
                <div className="flex-1 overflow-y-auto bg-white rounded-lg border border-gray-200 shadow-sm">
                    <table className="w-full">
                        <thead className="sticky top-0 bg-gray-50 z-10">
                            <tr className="border-b border-gray-200">
                                {viewMode === 'unlinked' ? (
                                    <>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Tên đầy đủ</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Giới tính</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Ngày sinh</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Trạng thái</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Thao Tác</th>
                                    </>
                                ) : (
                                    <>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Tên</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Tài khoản</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Vai trò</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Gia phả</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Thao Tác</th>
                                    </>
                                )}
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={viewMode === 'unlinked' ? 4 : 5} className="text-center py-8 text-gray-500">
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                                            <span>Đang tải dữ liệu...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : viewMode === 'unlinked' ? (
                                unlinkedNodeList.length > 0 ? (
                                    unlinkedNodeList.map(node => (
                                        <tr key={node.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center font-semibold">
                                                        {node.fullname?.charAt(0).toUpperCase() || '?'}
                                                    </div>
                                                    <span className="text-sm font-medium text-gray-900">{node.fullname || 'Không rõ'}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                {node.gender === 0 ? 'Nam' : node.gender === 1 ? 'Nữ' : 'Không xác định'}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                {node.birthday ? new Date(node.birthday).toLocaleDateString('vi-VN') : 'Không rõ'}
                                            </td>
                                            <td className="px-6 py-4">
                                                {node.userId ? (
                                                    <span className="px-3 py-1 text-xs font-medium rounded-md border bg-green-100 text-green-800 border-green-200">
                                                        Đã liên kết
                                                    </span>
                                                ) : (
                                                    <span className="px-3 py-1 text-xs font-medium rounded-md border bg-amber-100 text-amber-800 border-amber-200">
                                                        Chưa liên kết
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                {node.userId ? (
                                                    <button
                                                        onClick={() => handleViewUnlinkedNodeDetail(node)}
                                                        className="flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-all duration-200 text-sm font-medium cursor-pointer"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                        Xem chi tiết
                                                    </button>
                                                ) : (
                                                    permissions.canAdd('MEMBER') && (
                                                        <button
                                                            onClick={() => handleOpenInviteModal(node)}
                                                            className="flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-all duration-200 text-sm font-medium cursor-pointer"
                                                        >
                                                            <Mail className="w-4 h-4" />
                                                            Mời
                                                        </button>
                                                    )
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="text-center py-8 text-gray-500">
                                            <div className="flex flex-col items-center gap-2">
                                                <Users className="w-12 h-12 text-gray-300" />
                                                <span>Không có nút chưa liên kết nào</span>
                                            </div>
                                        </td>
                                    </tr>
                                )
                            ) : filteredMembers.length > 0 ? (
                                filteredMembers.map(member => (
                                    <tr key={member.userId} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center font-semibold">
                                                    {getMemberDisplayName(member).charAt(0).toUpperCase()}
                                                </div>
                                                <span className="text-sm font-medium text-gray-900">{getMemberDisplayName(member)}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{member.username || 'N/A'}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 text-xs font-medium rounded-md border ${getRoleBadgeColor(member.ftRole)}`}>
                                                {getRoleLabel(member.ftRole)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium text-gray-900">{member.ft?.name || 'N/A'}</span>
                                                {member.ft?.owner && (
                                                    <span className="text-xs text-gray-500">Chủ sở hữu: {member.ft.owner}</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {viewMode === 'member' ? (
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => handleViewDetail(member)}
                                                        className="flex items-center gap-1 text-blue-600 hover:text-blue-800 transition-colors text-sm font-medium cursor-pointer"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                        Xem chi tiết
                                                    </button>
                                                    {/* Show remove button only for FTMember role */}
                                                    {member.ftRole === 'FTMember' && permissions.canDelete('MEMBER') && (
                                                        <button
                                                            onClick={() => handleDeleteUser(member)}
                                                            className="flex items-center gap-1 text-red-600 hover:text-red-800 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-all duration-200 text-sm font-medium cursor-pointer"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                            Xóa
                                                        </button>
                                                    )}
                                                </div>
                                            ) : (
                                                permissions.canDelete('MEMBER') && (
                                                    <button
                                                        onClick={() => handleDeleteUser(member)}
                                                        className="flex items-center gap-1 text-red-600 hover:text-red-800 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-all duration-200 text-sm font-medium cursor-pointer"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                        Xóa
                                                    </button>
                                                )
                                            )}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="text-center py-8 text-gray-500">
                                        <div className="flex flex-col items-center gap-2">
                                            <Users className="w-12 h-12 text-gray-300" />
                                            <span>
                                                {searchTerm
                                                    ? `Không tìm thấy ${viewMode === 'member' ? 'thành viên' : 'khách'} nào với từ khóa "${searchTerm}"`
                                                    : `Không có ${viewMode === 'member' ? 'thành viên' : 'khách'} nào`}
                                            </span>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <Pagination
                    pageIndex={paginationData.pageIndex}
                    pageSize={paginationData.pageSize}
                    totalItems={paginationData.totalItems}
                    totalPages={paginationData.totalPages}
                    onPageChange={handlePageChange}
                />

                <MemberDetailModal
                    open={detailModalOpen}
                    loading={detailLoading}
                    profile={detailProfile}
                    error={detailError}
                    onClose={closeDetailModal}
                />

                {/* Delete Confirmation Modal */}
                {showDeleteConfirm && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
                        <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl border-2 border-gray-200 animate-scaleIn">
                            <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-red-500 to-pink-600">
                                <Trash2 size={28} className="text-white" />
                            </div>
                            <h3 className="text-2xl font-bold mb-3 text-center text-gray-800">
                                Xác nhận xóa {deletingUser?.ftRole === 'FTGuest' ? 'khách' : 'thành viên'}
                            </h3>
                            <p className="text-gray-600 mb-2 text-center leading-relaxed">
                                Bạn có chắc chắn muốn xóa {deletingUser?.ftRole === 'FTGuest' ? 'khách' : 'thành viên'} <span className="font-semibold text-gray-800">{deletingUser?.name || deletingUser?.username}</span> khỏi gia phả không?
                            </p>
                            <p className="text-sm text-gray-500 mb-6 text-center">
                                Hành động này không thể hoàn tác.
                            </p>
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => {
                                        setShowDeleteConfirm(false);
                                        setDeletingUser(null);
                                    }}
                                    disabled={isDeleting}
                                    className="px-6 py-3 font-semibold border-2 border-gray-300 rounded-xl hover:bg-gray-50 hover:shadow-lg transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Hủy
                                </button>
                                <button
                                    onClick={confirmDeleteUser}
                                    disabled={isDeleting}
                                    className="px-6 py-3 font-semibold bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-xl hover:from-red-600 hover:to-pink-700 hover:shadow-xl hover:-translate-y-1 transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isDeleting ? (
                                        <span className="flex items-center gap-2">
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            Đang xóa...
                                        </span>
                                    ) : 'Xóa'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <style>{`
                    @keyframes fadeIn {
                        from { opacity: 0; }
                        to { opacity: 1; }
                    }
                    
                    @keyframes scaleIn {
                        from {
                            opacity: 0;
                            transform: scale(0.95);
                        }
                        to {
                            opacity: 1;
                            transform: scale(1);
                        }
                    }
                    
                    .animate-fadeIn {
                        animation: fadeIn 0.3s ease-out;
                    }
                    
                    .animate-scaleIn {
                        animation: scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
                    }
                `}</style>
            </div>
            {/* Invite Modal */}
            {showInviteModal && selectedNodeForInvite && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
                    <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl border-2 border-gray-200 animate-scaleIn">
                        <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-400 to-cyan-500">
                            <Mail size={28} className="text-white" />
                        </div>
                        <h3 className="text-2xl font-bold mb-3 text-center text-gray-800">Mời người dùng</h3>
                        <p className="text-gray-600 mb-2 text-center leading-relaxed">
                            Gửi lời mời liên kết với <span className="font-semibold text-gray-800">{selectedNodeForInvite.fullname}</span>
                        </p>
                        <p className="text-sm text-gray-500 mb-6 text-center">
                            Người nhận sẽ được mời liên kết tài khoản của họ với nút này trong cây gia phả.
                        </p>

                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Email người nhận
                            </label>
                            <input
                                type="email"
                                value={inviteEmail}
                                onChange={(e) => setInviteEmail(e.target.value)}
                                placeholder="nguoidung@gmail.com"
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                                autoFocus
                            />
                        </div>

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={handleCloseInviteModal}
                                disabled={isInviting}
                                className="px-6 py-3 font-semibold border-2 border-gray-300 rounded-xl hover:bg-gray-50 hover:shadow-lg transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleSendInvite}
                                disabled={isInviting || !inviteEmail}
                                className="px-6 py-3 font-semibold bg-gradient-to-r from-blue-400 to-cyan-500 text-white rounded-xl hover:from-blue-500 hover:to-cyan-600 hover:shadow-xl hover:-translate-y-1 transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isInviting ? (
                                    <span className="flex items-center gap-2">
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        Đang gửi...
                                    </span>
                                ) : 'Gửi lời mời'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <MemberDetailModal
                open={unlinkedNodeDetailModalOpen}
                loading={unlinkedNodeDetailLoading}
                profile={unlinkedNodeDetailProfile}
                error={unlinkedNodeDetailError}
                onClose={closeUnlinkedNodeDetailModal}
            />
            <ExceptionPopup
                isOpen={errorPopup.isOpen}
                message={errorPopup.message}
                timestamp={errorPopup.timestamp}
                onClose={closeError}
            />
        </>
    );
};

export default Members;

interface MemberDetailModalProps {
    open: boolean;
    loading: boolean;
    profile: UserProfile | null;
    error: string | null;
    onClose: () => void;
}

const MemberDetailModal: React.FC<MemberDetailModalProps> = ({ open, loading, profile, error, onClose }) => {
    if (!open) return null;

    const formatDate = (date?: string | null) => {
        if (!date) return "Không rõ";
        try {
            return new Date(date).toLocaleDateString('vi-VN');
        } catch {
            return date;
        }
    };

    const genderLabel = profile?.gender === 1 ? "Nữ" : profile?.gender === 0 ? "Nam" : "Không xác định";
    const jobInfo = profile?.job || profile?.occupation || "Chưa cập nhật";
    const publicInfo = profile?.publicInfo || profile?.bio || "Chưa có thông tin công khai.";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 text-gray-500"
                >
                    <X className="w-5 h-5" />
                </button>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-12">
                        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
                        <p>Đang tải thông tin...</p>
                    </div>
                ) : error ? (
                    <div className="text-center py-10">
                        <p className="text-red-600 font-semibold mb-3">Đã xảy ra lỗi</p>
                        <p className="text-gray-600">{error}</p>
                    </div>
                ) : profile ? (
                    <div className="space-y-6">
                        <div className="flex items-center gap-6">
                            <div className="w-24 h-24 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center">
                                {profile.picture ? (
                                    <img
                                        src={profile.picture}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <span className="text-3xl font-semibold text-gray-500">
                                        {profile.name?.charAt(0) || profile.nickname?.charAt(0) || profile.email?.charAt(0) || "?"}
                                    </span>
                                )}
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">{profile.name || profile.nickname || "Thành viên"}</h2>
                                <p className="text-gray-600 mt-1">Tên hiển thị: {profile.nickname || "Chưa cập nhật"}</p>
                                <p className="text-gray-600 mt-1">Giới tính: {genderLabel}</p>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="bg-gray-50 rounded-xl p-4">
                                <h3 className="font-semibold text-gray-800 mb-2">Thông tin cá nhân</h3>
                                <p className="text-sm text-gray-600">Ngày sinh: {formatDate(profile.birthday)}</p>
                                <p className="text-sm text-gray-600 mt-1">Email: {profile.email || "Không có"}</p>
                                <p className="text-sm text-gray-600 mt-1">Số điện thoại: {profile.phoneNumber || "Không có"}</p>
                            </div>
                            <div className="bg-gray-50 rounded-xl p-4">
                                <h3 className="font-semibold text-gray-800 mb-2">Liên hệ</h3>
                                <p className="text-sm text-gray-600">Công việc/Nghề nghiệp: {jobInfo}</p>
                                <p className="text-sm text-gray-600 mt-1">Địa chỉ: {profile.address || "Chưa cập nhật"}</p>
                                {profile.province && (
                                    <p className="text-sm text-gray-600 mt-1">Tỉnh/Thành: {profile.province.nameWithType || profile.province.name}</p>
                                )}
                                {profile.ward && (
                                    <p className="text-sm text-gray-600 mt-1">Quận/Huyện: {profile.ward.nameWithType || profile.ward.name}</p>
                                )}
                            </div>
                        </div>

                        <div className="bg-gray-50 rounded-xl p-4">
                            <h3 className="font-semibold text-gray-800 mb-2">Thông tin công khai</h3>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">{publicInfo}</p>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-10 text-gray-500">Không có dữ liệu thành viên.</div>
                )}
            </div>
        </div>
    );
};
