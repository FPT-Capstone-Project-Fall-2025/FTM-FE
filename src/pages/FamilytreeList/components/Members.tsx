import { useEffect, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import { Pagination } from "@/components/ui/Pagination";
import type { PaginationProps } from "@/types/api";
import type { FamilyMemberList } from "@/types/familytree";
import familyTreeService from "@/services/familyTreeService";
import { useAppSelector } from "@/hooks/redux";

const Members: React.FC = () => {

    const selectedFamilyTree = useAppSelector(state => state.familyTreeMetaData.selectedFamilyTree)
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(false);
    const [paginationData, setPaginationData] = useState<PaginationProps>({
        pageIndex: 1,
        pageSize: 10,
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
    }, [searchTerm]);

    useEffect(() => {
        loadMembers();
    }, [paginationData.pageIndex]);

    const handlePageChange = (page: number) => {
        setPaginationData(prev => ({
            ...prev,
            pageIndex: page,
        }));
    };

    const formatBirthday = (birthday: string | null) => {
        if (!birthday) return "Không rõ";
        const date = new Date(birthday);
        return date.toLocaleDateString("vi-VN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        });
    };

    const getGenderLabel = (gender: number) => {
        return gender === 0 ? "Nam" : "Nữ";
    };

    /**
     * Get avatar URL from member's ftMemberFiles or fallback to filePath
     */
    const getMemberAvatar = (member: FamilyMemberList): string | null => {
        // Priority 1: Extract from ftMemberFiles (GPMember data)
        // Check title contains 'Avatar' (case-sensitive) and isActive = true
        if (member.ftMemberFiles && member.ftMemberFiles.length > 0) {
            const avatarFile = member.ftMemberFiles.find(file => 
                file.title && 
                file.title.includes('Avatar') && 
                file.isActive
            );
            if (avatarFile) {
                return avatarFile.filePath;
            }
        }
        
        // Priority 2: Fallback to filePath (may be from global user profile)
        if (member.filePath) {
            return member.filePath;
        }
        
        // Priority 3: No avatar
        return null;
    };

    return (
        <div className="h-full overflow-hidden space-y-6 flex flex-col p-6 bg-gray-50">
            {/* Header with Search */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Tìm kiếm..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-y-auto bg-white rounded-lg border border-gray-200">
                <table className="w-full">
                    <thead className="sticky top-0">
                        <tr className="border-b border-gray-200 bg-gray-50">
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Họ Tên</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Giới Tính</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Ngày Sinh</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Ảnh</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Thao Tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={5} className="text-center py-6 text-gray-500">
                                    Đang tải dữ liệu...
                                </td>
                            </tr>
                        ) : familyMemberList.length > 0 ? (
                            familyMemberList.map(member => (
                                <tr key={member.id} className="border-b border-gray-200 hover:bg-gray-50">
                                    <td className="px-6 py-4 text-sm font-medium text-blue-600">{member.fullname}</td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{getGenderLabel(member.gender)}</td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{formatBirthday(member.birthday)}</td>
                                    <td className="px-6 py-4 text-sm">
                                        {(() => {
                                            const avatarUrl = getMemberAvatar(member);
                                            return avatarUrl ? (
                                                <img
                                                    src={avatarUrl}
                                                    alt={member.fullname}
                                                    className="w-10 h-10 rounded-full object-cover"
                                                    onError={(e) => {
                                                        console.log('Failed to load avatar for', member.fullname, ':', avatarUrl);
                                                        // Fallback to UI Avatars
                                                        (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                                            member.fullname
                                                        )}&background=random&size=64`;
                                                    }}
                                                />
                                            ) : (
                                                <img
                                                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                                                        member.fullname
                                                    )}&background=random&size=64`}
                                                    alt={member.fullname}
                                                    className="w-10 h-10 rounded-full"
                                                />
                                            );
                                        })()}
                                    </td>
                                    <td className="px-6 py-4 text-sm">
                                        <button className="flex items-center gap-1 text-gray-700 hover:text-gray-900">
                                            <ChevronDown className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={5} className="text-center py-6 text-gray-500">
                                    Không có dữ liệu
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
        </div>
    );
};

export default Members;
