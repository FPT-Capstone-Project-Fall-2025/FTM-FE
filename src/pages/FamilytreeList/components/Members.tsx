import { useEffect, useState, useCallback } from "react";
import { ChevronDown, Search, Users, UserCheck, Eye, X } from "lucide-react";
import { Pagination } from "@/components/ui/Pagination";
import type { PaginationProps } from "@/types/api";
import type { FamilyMemberList } from "@/types/familytree";
import familyTreeService from "@/services/familyTreeService";
import { useAppSelector } from "@/hooks/redux";
import type { UserProfile } from "@/types/user";
import userService from "@/services/userService";

type ViewMode = 'member' | 'guest';

const Members: React.FC = () => {

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
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [detailProfile, setDetailProfile] = useState<UserProfile | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [detailError, setDetailError] = useState<string | null>(null);

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
                const ownerRes = await familyTreeService.getFamilyTreeMembers({
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
                const memberRes = await familyTreeService.getFamilyTreeMembers({
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
            } else {
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

                const res = await familyTreeService.getFamilyTreeMembers({
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

    return (
        <div className="h-full overflow-hidden space-y-6 flex flex-col p-6 bg-gray-50">
            {/* Header with View Mode Toggle and Search */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                {/* View Mode Toggle */}
                <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-200 p-1 shadow-sm">
                    <button
                        onClick={() => setViewMode('member')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${viewMode === 'member'
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                            }`}
                    >
                        <Users className="w-4 h-4" />
                        Thành viên
                    </button>
                    <button
                        onClick={() => setViewMode('guest')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${viewMode === 'guest'
                            ? 'bg-purple-600 text-white shadow-sm'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                            }`}
                    >
                        <UserCheck className="w-4 h-4" />
                        Khách
                    </button>
                </div>

                {/* Search */}
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Tìm kiếm theo tên, username..."
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
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Tên</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Username</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Vai trò</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Gia phả</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Thao Tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={5} className="text-center py-8 text-gray-500">
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                                        <span>Đang tải dữ liệu...</span>
                                    </div>
                                </td>
                            </tr>
                        ) : filteredMembers.length > 0 ? (
                            filteredMembers.map(member => (
                                <tr key={member.userId} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            {member.ft?.filePath ? (
                                                <img
                                                    src={member.ft.filePath}
                                                    alt={getMemberDisplayName(member)}
                                                    crossOrigin="anonymous"
                                                    className="w-10 h-10 rounded-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-10 h-10 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center font-semibold">
                                                    {getMemberDisplayName(member).charAt(0).toUpperCase()}
                                                </div>
                                            )}
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
                                            <button
                                                onClick={() => handleViewDetail(member)}
                                                className="flex items-center gap-1 text-blue-600 hover:text-blue-800 transition-colors text-sm font-medium"
                                            >
                                                <Eye className="w-4 h-4" />
                                                Xem chi tiết
                                            </button>
                                        ) : (
                                            <span className="text-xs text-gray-400 flex items-center gap-1 justify-start">
                                                <ChevronDown className="w-3 h-3" />
                                                Không khả dụng
                                            </span>
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
        </div>
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
                                        crossOrigin="anonymous"
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
