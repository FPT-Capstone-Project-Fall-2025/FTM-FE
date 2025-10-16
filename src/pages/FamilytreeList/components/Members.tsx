import { ChevronDown, Search } from "lucide-react";
import { useEffect, useState } from "react";

interface FamilyMember {
    id: number;
    name: string;
    description: string;
    yearOfBirth: string;
    relationship: string;
    status: 'Hoạt động' | 'Không hoạt động';
}

const Members: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);

    const generateMembers = (): FamilyMember[] => {
        const members: FamilyMember[] = [];
        const statuses: FamilyMember['status'][] = ['Hoạt động', 'Không hoạt động'];

        for (let i = 1; i <= 97; i++) {
            const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
            members.push({
                id: i,
                name: i === 1 ? 'Nguyễn Văn A' : `Sample Name`,
                description: 'Lorem ipsum istrisque',
                yearOfBirth: i % 3 === 0 ? 'dd/mm/yyyy' : '04 Tháng Tám 1992',
                relationship: 'dd/mm/yyyy hh:ss:mm',
                status: randomStatus ? randomStatus : 'Không hoạt động'
            });
        }
        return members;
    };

    const allMembers = generateMembers();

    const getStatusDot = (status: string) => {
        return status === 'Hoạt động' ? 'bg-green-500' : 'bg-gray-400';
    };

    const filteredMembers = allMembers.filter(member =>
        member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalItems = filteredMembers.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentMembers = filteredMembers.slice(startIndex, endIndex);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    const handlePageChange = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    const getVisiblePageNumbers = () => {
        const visiblePages: (number | string)[] = [];
        const maxVisiblePages = 5;

        if (totalPages <= maxVisiblePages) {
            for (let i = 1; i <= totalPages; i++) {
                visiblePages.push(i);
            }
        } else {
            if (currentPage <= 3) {
                for (let i = 1; i <= 4; i++) {
                    visiblePages.push(i);
                }
                visiblePages.push('...');
                visiblePages.push(totalPages);
            } else if (currentPage >= totalPages - 2) {
                visiblePages.push(1);
                visiblePages.push('...');
                for (let i = totalPages - 3; i <= totalPages; i++) {
                    visiblePages.push(i);
                }
            } else {
                visiblePages.push(1);
                visiblePages.push('...');
                for (let i = currentPage - 1; i <= currentPage + 1; i++) {
                    visiblePages.push(i);
                }
                visiblePages.push('...');
                visiblePages.push(totalPages);
            }
        }

        return visiblePages;
    };

    return (
        <div className="space-y-6 flex flex-col">
            {/* Header with Search and Action Buttons */}
            <div className="shrink-0 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Tìm kiếm..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>

                <div className="flex gap-2">
                    <button className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                        Quay lại
                    </button>
                    <button className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                        Chia sẻ
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-y-auto bg-white rounded-lg overflow-hidden border border-gray-200">
                <table className="w-full">
                    <thead className="sticky top-0">
                        <tr className="border-b border-gray-200 bg-gray-50">
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Họ Tên</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Mô Tả</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Năm Sinh</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Ngày Cập Nhật</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Mối Quan Hệ Trực Tiếp</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Trạng Thái</th>
                        </tr>
                    </thead>
                    <tbody className="">
                        {currentMembers.map((member) => (
                            <tr key={member.id} className="border-b border-gray-200 hover:bg-gray-50">
                                <td className="px-6 py-4 text-sm">
                                    <div className="flex items-center gap-3">
                                        <img
                                            src={`https://ui-avatars.com/api/?name=${member.name}&background=random&size=32`}
                                            alt={member.name}
                                            className="w-8 h-8 rounded-full"
                                        />
                                        <span className="text-blue-600 font-medium">{member.name}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-600">{member.description}</td>
                                <td className="px-6 py-4 text-sm text-gray-600">{member.yearOfBirth}</td>
                                <td className="px-6 py-4 text-sm text-gray-600">{member.relationship}</td>
                                <td className="px-6 py-4 text-sm text-gray-600">
                                    <span className="inline-flex items-center gap-2">
                                        <span className={`w-2 h-2 rounded-full ${getStatusDot(member.status)}`}></span>
                                        {member.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-sm">
                                    <button className="flex items-center gap-1 text-gray-700 hover:text-gray-900">
                                        <ChevronDown className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination - Centered */}
            <div className="shrink-0 flex flex-col items-center gap-4">
                <p className="text-sm text-gray-600">
                    Hiển thị <span className="font-medium">{startIndex + 1}</span>-<span className="font-medium">{Math.min(endIndex, totalItems)}</span> bản ghi trên tổng số <span className="font-medium">{totalItems}</span> ghi nó
                </p>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="px-3 py-1 border border-gray-300 rounded text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Prev
                    </button>

                    {getVisiblePageNumbers().map((pageNum, index) => (
                        pageNum === '...' ? (
                            <span key={`ellipsis-${index}`} className="px-2 text-gray-500">
                                ...
                            </span>
                        ) : (
                            <button
                                key={pageNum}
                                onClick={() => handlePageChange(pageNum as number)}
                                className={`px-3 py-1 border rounded text-sm font-medium transition-colors ${currentPage === pageNum
                                        ? 'bg-gray-900 text-white border-gray-900'
                                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                                    }`}
                            >
                                {pageNum}
                            </button>
                        )
                    ))}

                    <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1 border border-gray-300 rounded text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Next
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Members; 