import type { PaginationProps } from "@/types/api";

interface CustomPaginationProp extends PaginationProps {
    onPageChange: (page: number) => void;
    showInfo?: boolean;
}

export const Pagination: React.FC<CustomPaginationProp> = ({
    pageIndex,
    pageSize,
    totalItems,
    totalPages,
    onPageChange,
    showInfo = true
}) => {
    const startIndex = (pageIndex - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, totalItems);

    const getVisiblePageNumbers = (): (number | string)[] => {
        const visiblePages: (number | string)[] = [];
        const maxVisiblePages = 5;

        if (totalPages <= maxVisiblePages) {
            for (let i = 1; i <= totalPages; i++) {
                visiblePages.push(i);
            }
        } else {
            if (pageIndex <= 3) {
                for (let i = 1; i <= 4; i++) {
                    visiblePages.push(i);
                }
                visiblePages.push('...');
                visiblePages.push(totalPages);
            } else if (pageIndex >= totalPages - 2) {
                visiblePages.push(1);
                visiblePages.push('...');
                for (let i = totalPages - 3; i <= totalPages; i++) {
                    visiblePages.push(i);
                }
            } else {
                visiblePages.push(1);
                visiblePages.push('...');
                for (let i = pageIndex - 1; i <= pageIndex + 1; i++) {
                    visiblePages.push(i);
                }
                visiblePages.push('...');
                visiblePages.push(totalPages);
            }
        }

        return visiblePages;
    };

    return (
        <div className="flex flex-col items-center gap-4">
            {showInfo && (
                <p className="text-sm text-gray-600">
                    Hiển thị <span className="font-medium">{startIndex + 1}</span>-
                    <span className="font-medium">{endIndex}</span> bản ghi trên tổng số{' '}
                    <span className="font-medium">{totalItems}</span> ghi nhớ
                </p>
            )}
            <div className="flex items-center gap-2">
                <button
                    onClick={() => onPageChange(pageIndex - 1)}
                    disabled={pageIndex === 1}
                    className="px-3 py-1 border border-gray-300 rounded text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Trước
                </button>

                {getVisiblePageNumbers().map((pageNum, index) =>
                    pageNum === '...' ? (
                        <span key={`ellipsis-${index}`} className="px-2 text-gray-500">
                            ...
                        </span>
                    ) : (
                        <button
                            key={pageNum}
                            onClick={() => onPageChange(pageNum as number)}
                            className={`px-3 py-1 border rounded text-sm font-medium transition-colors ${pageIndex === pageNum
                                ? 'bg-gray-900 text-white border-gray-900'
                                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                                }`}
                        >
                            {pageNum}
                        </button>
                    )
                )}

                <button
                    onClick={() => onPageChange(pageIndex + 1)}
                    disabled={pageIndex === totalPages}
                    className="px-3 py-1 border border-gray-300 rounded text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Sau
                </button>
            </div>
        </div>
    );
};
