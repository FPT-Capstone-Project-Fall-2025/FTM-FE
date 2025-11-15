import React, { useState, useEffect, useMemo } from 'react';
import { TrendingDown, ArrowDownLeft, ArrowUpRight, Download, Filter, X, ChevronLeft, ChevronRight } from 'lucide-react';
import type { FundDonation } from '@/types/fund';
import { fundService } from '@/services/fundService';
import { EmptyState } from './FundLoadingEmpty';
import { Loader2 } from 'lucide-react';

interface FundHistorySectionProps {
  fundId: string | null;
  formatCurrency: (value?: number | null) => string;
  formatDate: (value?: string | null) => string;
  getPaymentMethodLabel?: (method: unknown) => string;
}

type SortOption = 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc' | 'donor-asc' | 'donor-desc';
type StatusFilter = 'all' | 'Completed' | 'Pending' | 'Rejected';

const FundHistorySection: React.FC<FundHistorySectionProps> = ({
  fundId,
  formatCurrency,
  formatDate,
  getPaymentMethodLabel,
}) => {
  const [donations, setDonations] = useState<FundDonation[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  
  // Filters
  const [memberFilter, setMemberFilter] = useState<string>('');
  const [sortOption, setSortOption] = useState<SortOption>('date-desc');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Fetch donations
  useEffect(() => {
    if (!fundId) {
      setDonations([]);
      setTotalCount(0);
      return;
    }

    const fetchDonations = async () => {
      setLoading(true);
      try {
        const response = await fundService.fetchFundDonations(fundId, page, pageSize);
        setDonations(response.donations || []);
        setTotalCount(response.totalCount || 0);
        setTotalPages(response.totalPages || 1);
      } catch (error) {
        console.error('Failed to fetch donations:', error);
        setDonations([]);
        setTotalCount(0);
      } finally {
        setLoading(false);
      }
    };

    fetchDonations();
  }, [fundId, page, pageSize]);

  // Get unique donor names for filter
  const uniqueDonors = useMemo(() => {
    const donors = new Set<string>();
    donations.forEach(d => {
      if (d.donorName) {
        donors.add(d.donorName);
      }
    });
    return Array.from(donors).sort();
  }, [donations]);

  // Filter and sort donations
  const filteredAndSortedDonations = useMemo(() => {
    let filtered = [...donations];

    // Filter by member
    if (memberFilter) {
      filtered = filtered.filter(d => 
        d.donorName?.toLowerCase().includes(memberFilter.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(d => {
        const status = typeof d.status === 'string' ? d.status : 
                       d.status === 0 ? 'Pending' : 
                       d.status === 1 ? 'Completed' : 
                       d.status === 2 ? 'Rejected' : 'Pending';
        return status === statusFilter;
      });
    }

    // Sort
    filtered.sort((a, b) => {
      // Handle both createdOn and createdDate fields
      const getDate = (d: FundDonation) => {
        const dateField = (d as any).createdDate || d.createdOn || '';
        return new Date(dateField).getTime();
      };
      const getConfirmedDate = (d: FundDonation) => {
        return new Date(d.confirmedOn || '').getTime();
      };
      
      switch (sortOption) {
        case 'date-desc':
          const aDate = getConfirmedDate(a) || getDate(a);
          const bDate = getConfirmedDate(b) || getDate(b);
          return bDate - aDate;
        case 'date-asc':
          const aDateAsc = getConfirmedDate(a) || getDate(a);
          const bDateAsc = getConfirmedDate(b) || getDate(b);
          return aDateAsc - bDateAsc;
        case 'amount-desc':
          return (b.donationMoney || 0) - (a.donationMoney || 0);
        case 'amount-asc':
          return (a.donationMoney || 0) - (b.donationMoney || 0);
        case 'donor-asc':
          return (a.donorName || '').localeCompare(b.donorName || '');
        case 'donor-desc':
          return (b.donorName || '').localeCompare(a.donorName || '');
        default:
          return 0;
      }
    });

    return filtered;
  }, [donations, memberFilter, sortOption, statusFilter]);

  // Export to Excel (CSV format)
  const handleExportExcel = () => {
    const headers = [
      'STT',
      'Ngày tạo',
      'Ngày xác nhận',
      'Người đóng góp',
      'Số tiền',
      'Phương thức thanh toán',
      'Ghi chú',
      'Trạng thái',
      'Người xác nhận',
      'Ghi chú xác nhận',
      'Mã đơn PayOS'
    ];

      const rows = filteredAndSortedDonations.map((donation, index) => {
      const status = typeof donation.status === 'string' ? donation.status : 
                     donation.status === 0 ? 'Pending' : 
                     donation.status === 1 ? 'Completed' : 
                     donation.status === 2 ? 'Rejected' : 'Pending';
      
      // Handle both createdOn and createdDate fields
      const createdDate = (donation as any).createdDate || donation.createdOn;
      // Handle both confirmedBy and confirmerName fields
      const confirmerName = (donation as any).confirmerName || donation.confirmedBy;
      
      return [
        index + 1,
        formatDate(createdDate),
        formatDate(donation.confirmedOn),
        donation.donorName || '',
        donation.donationMoney || 0,
        getPaymentMethodLabel ? getPaymentMethodLabel(donation.paymentMethod) : String(donation.paymentMethod || ''),
        donation.paymentNotes || '',
        status,
        confirmerName || '',
        donation.confirmationNotes || '',
        donation.payOSOrderCode || ''
      ];
    });

    // Create CSV content
    const csvContent = [
      headers.join(','),
      ...rows.map(row => 
        row.map(cell => {
          // Escape commas and quotes
          const cellStr = String(cell || '');
          if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
            return `"${cellStr.replace(/"/g, '""')}"`;
          }
          return cellStr;
        }).join(',')
      )
    ].join('\n');

    // Add BOM for Excel UTF-8 support
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = `lich-su-dong-gop-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (!fundId) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <EmptyState
          icon={<TrendingDown className="w-12 h-12 text-gray-300" />}
          title="Chưa chọn quỹ"
          description="Vui lòng chọn quỹ để xem lịch sử giao dịch."
        />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">Lịch sử giao dịch</h3>
          <p className="text-sm text-gray-500 mt-1">
            {totalCount > 0 ? `${totalCount} giao dịch` : 'Chưa có giao dịch nào'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg border border-gray-300 bg-white hover:bg-gray-50 transition-colors"
          >
            <Filter className="w-4 h-4" />
            Lọc
            {showFilters && (memberFilter || statusFilter !== 'all' || sortOption !== 'date-desc') && (
              <span className="ml-1 px-1.5 py-0.5 bg-blue-100 text-blue-600 rounded text-xs">
                {[
                  memberFilter ? '1' : '',
                  statusFilter !== 'all' ? '1' : '',
                  sortOption !== 'date-desc' ? '1' : ''
                ].filter(Boolean).length}
              </span>
            )}
          </button>
          {filteredAndSortedDonations.length > 0 && (
            <button
              type="button"
              onClick={handleExportExcel}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              Xuất Excel
            </button>
          )}
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-gray-900">Bộ lọc</h4>
            <button
              type="button"
              onClick={() => {
                setMemberFilter('');
                setStatusFilter('all');
                setSortOption('date-desc');
              }}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Xóa tất cả
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Member Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lọc theo thành viên
              </label>
              <select
                value={memberFilter}
                onChange={(e) => setMemberFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Tất cả thành viên</option>
                {uniqueDonors.map(donor => (
                  <option key={donor} value={donor}>{donor}</option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Trạng thái
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Tất cả</option>
                <option value="Completed">Đã xác nhận</option>
                <option value="Pending">Đang chờ</option>
                <option value="Rejected">Đã từ chối</option>
              </select>
            </div>

            {/* Sort Option */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sắp xếp
              </label>
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value as SortOption)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="date-desc">Thời gian (Mới nhất)</option>
                <option value="date-asc">Thời gian (Cũ nhất)</option>
                <option value="amount-desc">Giá trị (Cao → Thấp)</option>
                <option value="amount-asc">Giá trị (Thấp → Cao)</option>
                <option value="donor-asc">Người đóng góp (A-Z)</option>
                <option value="donor-desc">Người đóng góp (Z-A)</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
        </div>
      ) : filteredAndSortedDonations.length === 0 ? (
        <EmptyState
          icon={<TrendingDown className="w-12 h-12 text-gray-300" />}
          title="Chưa có giao dịch nào"
          description={
            memberFilter || statusFilter !== 'all'
              ? "Không tìm thấy giao dịch phù hợp với bộ lọc."
              : "Những giao dịch nạp tiền thành công sẽ hiển thị ở đây."
          }
        />
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-gray-600">
                  <th className="px-4 py-3 font-semibold">Ngày</th>
                  <th className="px-4 py-3 font-semibold">Người đóng góp</th>
                  <th className="px-4 py-3 font-semibold">Số tiền</th>
                  <th className="px-4 py-3 font-semibold">Phương thức</th>
                  <th className="px-4 py-3 font-semibold">Ghi chú</th>
                  <th className="px-4 py-3 font-semibold">Trạng thái</th>
                  <th className="px-4 py-3 font-semibold">Người xác nhận</th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedDonations.map(donation => {
                  const status = typeof donation.status === 'string' ? donation.status : 
                                 donation.status === 0 ? 'Pending' : 
                                 donation.status === 1 ? 'Completed' : 
                                 donation.status === 2 ? 'Rejected' : 'Pending';
                  
                  const statusConfig = {
                    'Completed': { label: 'Đã xác nhận', className: 'bg-green-100 text-green-700' },
                    'Pending': { label: 'Đang chờ', className: 'bg-yellow-100 text-yellow-700' },
                    'Rejected': { label: 'Đã từ chối', className: 'bg-red-100 text-red-700' },
                  }[status] || { label: status, className: 'bg-gray-100 text-gray-700' };

                  return (
                    <tr key={donation.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-700">
                        <div className="space-y-1">
                          <div className="text-xs text-gray-500">
                            Tạo: {formatDate((donation as any).createdDate || donation.createdOn)}
                          </div>
                          {donation.confirmedOn && (
                            <div className="text-xs text-gray-500">Xác nhận: {formatDate(donation.confirmedOn)}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-700 font-medium">
                        {donation.donorName || 'Ẩn danh'}
                      </td>
                      <td className="px-4 py-3 font-bold text-emerald-600">
                        {formatCurrency(donation.donationMoney)}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {getPaymentMethodLabel ? getPaymentMethodLabel(donation.paymentMethod) : String(donation.paymentMethod || '')}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {donation.paymentNotes || '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${statusConfig.className}`}>
                          {statusConfig.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-700 text-sm">
                        {(donation as any).confirmerName || donation.confirmedBy || '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
              <div className="text-sm text-gray-600">
                Trang {page} / {totalPages} ({totalCount} giao dịch)
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1}
                  className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (page <= 3) {
                      pageNum = i + 1;
                    } else if (page >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = page - 2 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        type="button"
                        onClick={() => handlePageChange(pageNum)}
                        className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                          page === pageNum
                            ? 'bg-blue-600 text-white'
                            : 'border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                <button
                  type="button"
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page === totalPages}
                  className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default FundHistorySection;
