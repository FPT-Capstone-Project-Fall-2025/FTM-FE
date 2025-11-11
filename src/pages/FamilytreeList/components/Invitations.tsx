import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { Pagination } from "@/components/ui/Pagination";
import type { PaginationProps } from "@/types/api";
import { useAppSelector } from "@/hooks/redux";

const mockInvitations: InvitationList[] = [
    {
        id: "1",
        fullname: "Nguyễn Văn A",
        email: "nguyenvana@example.com",
        inviteDate: "2025-11-01T10:00:00Z",
        status: 0, // Chưa duyệt (Pending)
    },
    {
        id: "2",
        fullname: "Trần Thị B",
        email: "tranthib@example.com",
        inviteDate: "2025-11-02T14:30:00Z",
        status: 1, // Đã duyệt (Approved)
    },
    {
        id: "3",
        fullname: "Lê Văn C",
        email: "levanc@example.com",
        inviteDate: "2025-11-03T09:15:00Z",
        status: 2, // Từ chối (Rejected)
    },
    {
        id: "4",
        fullname: "Phạm Thị D",
        email: "phamthid@example.com",
        inviteDate: "2025-11-04T16:45:00Z",
        status: 0, // Chưa duyệt (Pending)
    },
    {
        id: "5",
        fullname: "Hoàng Văn E",
        email: "hoangvane@example.com",
        inviteDate: "2025-11-05T12:00:00Z",
        status: 1, // Đã duyệt (Approved)
    },
    {
        id: "6",
        fullname: "Ngô Thị F",
        email: "ngothif@example.com",
        inviteDate: "2025-11-06T08:30:00Z",
        status: 2, // Từ chối (Rejected)
    },
    {
        id: "7",
        fullname: "Đỗ Văn G",
        email: "dovang@example.com",
        inviteDate: "2025-11-07T15:20:00Z",
        status: 0, // Chưa duyệt (Pending)
    },
    {
        id: "8",
        fullname: "Bùi Thị H",
        email: "buithih@example.com",
        inviteDate: "2025-11-08T13:10:00Z",
        status: 1, // Đã duyệt (Approved)
    },
    {
        id: "9",
        fullname: "Vũ Văn I",
        email: "vuvani@example.com",
        inviteDate: "2025-11-09T11:00:00Z",
        status: 0, // Chưa duyệt (Pending)
    },
    {
        id: "10",
        fullname: "Đặng Thị K",
        email: "dangthik@example.com",
        inviteDate: "2025-11-09T09:00:00Z",
        status: 2, // Từ chối (Rejected)
    },
];

// Type definition (adjust based on your needs)
interface InvitationList {
    id: string;
    fullname: string;
    email: string;
    inviteDate: string;
    status: number;
}

const Invitations: React.FC = () => {
    const selectedFamilyTree = useAppSelector(state => state.familyTreeMetaData.selectedFamilyTree);
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
        totalItems: mockInvitations.length,
        totalPages: Math.ceil(mockInvitations.length / 10),
    });
    const [invitationList, setInvitationList] = useState<InvitationList[]>(mockInvitations.slice(0, 10));

    // Simulate loading with a delay
    useEffect(() => {
        setLoading(true);
        const timer = setTimeout(() => {
            const filtered = mockInvitations.filter(invitation =>
                invitation.fullname.toLowerCase().includes(searchTerm.toLowerCase()) ||
                invitation.email.toLowerCase().includes(searchTerm.toLowerCase())
            );
            const start = (paginationData.pageIndex - 1) * paginationData.pageSize;
            const end = start + paginationData.pageSize;
            setInvitationList(filtered.slice(start, end));
            setLoading(false);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm, paginationData.pageIndex]);

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

    const getStatusLabel = (status: number) => {
        return status === 0 ? "Chưa duyệt" : status === 1 ? "Đã duyệt" : "Từ chối";
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
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Ngày Mời</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Trạng Thái</th>
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
                        ) : invitationList.length > 0 ? (
                            invitationList.map(invitation => (
                                <tr key={invitation.id} className="border-b border-gray-200 hover:bg-gray-50">
                                    <td className="px-6 py-4 text-sm font-medium text-blue-600">{invitation.fullname}</td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{invitation.email}</td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{formatDate(invitation.inviteDate)}</td>
                                    <td className="px-6 py-4 text-sm">
                                        <span className={
                                            invitation.status === 1 ? "text-green-600" :
                                                invitation.status === 2 ? "text-red-600" : "text-yellow-600"
                                        }>
                                            {getStatusLabel(invitation.status)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm">
                                        <button className="flex items-center gap-1 text-gray-700 hover:text-gray-900">
                                            <span>Xem chi tiết</span>
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
                totalItems={mockInvitations.length}
                totalPages={Math.ceil(mockInvitations.length / paginationData.pageSize)}
                onPageChange={handlePageChange}
            />
        </div>
    );
};

export default Invitations;