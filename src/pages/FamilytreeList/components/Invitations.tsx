import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { Pagination } from "@/components/ui/Pagination";
import type { PaginationProps } from "@/types/api";
import { useAppSelector } from "@/hooks/redux";
import familyTreeService from "@/services/familyTreeService";
import type { FTInvitation } from "@/types/familytree";

const Invitations: React.FC = () => {
    const selectedFamilyTree = useAppSelector(state => state.familyTreeMetaData.selectedFamilyTree);
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(false);
    const [paginationData, setPaginationData] = useState<PaginationProps>({
        pageIndex: 1,
        pageSize: 10,
        propertyFilters: [
            {
                name: "FtId",
                operation: "EQUAL",
                value: selectedFamilyTree ? selectedFamilyTree.id : ''
            }
        ],
        totalItems: 0,
        totalPages: 0,
    });
    const [invitationList, setInvitationList] = useState<FTInvitation[]>([]);

    useEffect(() => {
        setLoading(true);
        const fetchInvitationsList = async () => {
            try {
                const response = await familyTreeService.getInvitationsList(paginationData);
                setPaginationData(pre => ({
                    ...pre,
                    ...response.data
                }));
                setInvitationList(response.data.data);
            } catch (error) {
                console.log(error);
            } finally {
                setLoading(false);
            }
        }
        fetchInvitationsList();
    }, [paginationData.pageIndex]);

    const handlePageChange = (page: number) => {
        setPaginationData(prev => ({
            ...prev,
            pageIndex: page,
        }));
    };

    const formatDate = (date: string | null) => {
        if (!date) return "Không rõ";
        const d = new Date(date);
        return d.toLocaleDateString("vi-VN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        });
    };

    const getStatusLabel = (status: string) => {
        return status === 'PENDING' ? "Chưa duyệt" : status === 'ACCEPTED' ? "Đã chấp nhận" : "Từ chối";
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
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Email</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Thành viên liên kết</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Ngày Mời</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Trạng Thái</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Người mời</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={5} className="text-center py-6 text-gray-500">
                                    Đang tải dữ liệu...
                                </td>
                            </tr>
                        ) : invitationList.length > 0 ? (
                            invitationList.map(invitation => (
                                <tr key={invitation.token} className="border-b border-gray-200 hover:bg-gray-50">
                                    <td className="px-6 py-4 text-sm font-medium text-blue-600">{invitation.invitedName}</td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{invitation.email}</td>
                                    <td className="px-6 py-4 text-sm">{invitation.ftMemberName}</td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{formatDate(invitation.createdOn)}</td>
                                    <td className="px-6 py-4 text-sm">
                                        <span className={
                                            invitation.status === 'ACCEPTED' ? "text-green-600" :
                                                invitation.status === 'REJECTED' ? "text-red-600" : "text-yellow-600"
                                        }>
                                            {getStatusLabel(invitation.status)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm">{invitation.inviterName}</td>
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

export default Invitations;