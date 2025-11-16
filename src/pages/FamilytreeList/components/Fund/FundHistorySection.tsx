import React, { useState, useEffect, useMemo } from 'react';
import { TrendingDown, Download, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import type { FundDonation, FundExpense } from '@/types/fund';
import { fundService } from '@/services/fundService';
import { EmptyState } from './FundLoadingEmpty';
import { Loader2 } from 'lucide-react';

interface FundHistorySectionProps {
  fundId: string | null;
  formatCurrency: (value?: number | null) => string;
  formatDate: (value?: string | null) => string;
  getPaymentMethodLabel?: (method: unknown) => string;
}

type TabType = 'donations' | 'expenses';
type SortOption = 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc' | 'name-asc' | 'name-desc';
type DonationStatusFilter = 'all' | 'Completed' | 'Pending' | 'Rejected';
type ExpenseStatusFilter = 'all' | 'Approved' | 'Pending' | 'Rejected';

const FundHistorySection: React.FC<FundHistorySectionProps> = ({
  fundId,
  formatCurrency,
  formatDate,
  getPaymentMethodLabel,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('donations');
  
  // Donations state
  const [donations, setDonations] = useState<FundDonation[]>([]);
  const [donationsLoading, setDonationsLoading] = useState(false);
  const [donationsPage, setDonationsPage] = useState(1);
  const [donationsTotalCount, setDonationsTotalCount] = useState(0);
  const [donationsTotalPages, setDonationsTotalPages] = useState(1);
  
  // Expenses state
  const [expenses, setExpenses] = useState<FundExpense[]>([]);
  const [expensesLoading, setExpensesLoading] = useState(false);
  const [expensesPage, setExpensesPage] = useState(1);
  const [expensesTotalCount, setExpensesTotalCount] = useState(0);
  const [expensesTotalPages, setExpensesTotalPages] = useState(1);
  
  const pageSize = 20;
  
  // Filters
  const [memberFilter, setMemberFilter] = useState<string>('');
  const [sortOption, setSortOption] = useState<SortOption>('date-desc');
  // Default filters: only show confirmed/approved by default
  const defaultDonationStatus: DonationStatusFilter = 'Completed';
  const defaultExpenseStatus: ExpenseStatusFilter = 'Approved';
  const [donationStatusFilter, setDonationStatusFilter] = useState<DonationStatusFilter>(defaultDonationStatus);
  const [expenseStatusFilter, setExpenseStatusFilter] = useState<ExpenseStatusFilter>(defaultExpenseStatus);
  const [showFilters, setShowFilters] = useState(false);

  // Fetch donations - fetch when fundId changes, not dependent on activeTab
  useEffect(() => {
    if (!fundId) {
      setDonations([]);
      setDonationsTotalCount(0);
      setDonationsTotalPages(1);
      return;
    }

    const fetchDonations = async () => {
      setDonationsLoading(true);
      try {
        const response = await fundService.fetchFundDonations(fundId, donationsPage, pageSize);
        // Ensure donations is always an array
        const donationsArray = Array.isArray(response.donations) ? response.donations : 
                              Array.isArray(response) ? response : [];
        setDonations(donationsArray);
        setDonationsTotalCount(response.totalCount || donationsArray.length || 0);
        setDonationsTotalPages(response.totalPages || 1);
      } catch (error) {
        console.error('Failed to fetch donations:', error);
        setDonations([]);
        setDonationsTotalCount(0);
        setDonationsTotalPages(1);
      } finally {
        setDonationsLoading(false);
      }
    };

    fetchDonations();
  }, [fundId, donationsPage, pageSize]);

  // Fetch expenses - fetch when fundId changes, not dependent on activeTab
  useEffect(() => {
    if (!fundId) {
      setExpenses([]);
      setExpensesTotalCount(0);
      setExpensesTotalPages(1);
      return;
    }

    const fetchExpenses = async () => {
      setExpensesLoading(true);
      try {
        const response = await fundService.fetchFundExpenses(fundId, expensesPage, pageSize);
        // Ensure expenses is always an array
        const expensesArray = Array.isArray(response.expenses) ? response.expenses : 
                             Array.isArray(response) ? response : [];
        setExpenses(expensesArray);
        setExpensesTotalCount(response.totalCount || expensesArray.length || 0);
        setExpensesTotalPages(response.totalPages || 1);
      } catch (error) {
        console.error('Failed to fetch expenses:', error);
        setExpenses([]);
        setExpensesTotalCount(0);
        setExpensesTotalPages(1);
      } finally {
        setExpensesLoading(false);
      }
    };

    fetchExpenses();
  }, [fundId, expensesPage, pageSize]);

  // Get unique donor/recipient names for filter
  const uniqueDonors = useMemo(() => {
    const donors = new Set<string>();
    donations.forEach(d => {
      if (d.donorName) {
        donors.add(d.donorName);
      }
    });
    return Array.from(donors).sort();
  }, [donations]);

  const uniqueRecipients = useMemo(() => {
    if (!Array.isArray(expenses)) {
      return [];
    }
    const recipients = new Set<string>();
    expenses.forEach(e => {
      if (e.recipient) {
        recipients.add(e.recipient);
      }
    });
    return Array.from(recipients).sort();
  }, [expenses]);

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
    if (donationStatusFilter !== 'all') {
      filtered = filtered.filter(d => {
        const status = typeof d.status === 'string' ? d.status : 
                       d.status === 0 ? 'Pending' : 
                       d.status === 1 ? 'Completed' : 
                       d.status === 2 ? 'Rejected' : 'Pending';
        return status === donationStatusFilter;
      });
    }

    // Sort
    filtered.sort((a, b) => {
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
        case 'name-asc':
          return (a.donorName || '').localeCompare(b.donorName || '');
        case 'name-desc':
          return (b.donorName || '').localeCompare(a.donorName || '');
        default:
          return 0;
      }
    });

    return filtered;
  }, [donations, memberFilter, sortOption, donationStatusFilter]);

  // Filter and sort expenses
  const filteredAndSortedExpenses = useMemo(() => {
    // Ensure expenses is always an array - multiple checks
    if (!expenses) {
      return [];
    }
    if (!Array.isArray(expenses)) {
      console.warn('Expenses is not an array:', expenses);
      return [];
    }
    if (expenses.length === 0) {
      return [];
    }
    let filtered = [...expenses];

    // Filter by recipient
    if (memberFilter) {
      filtered = filtered.filter(e => 
        e.recipient?.toLowerCase().includes(memberFilter.toLowerCase())
      );
    }

    // Filter by status
    if (expenseStatusFilter !== 'all') {
      filtered = filtered.filter(e => {
        const status = typeof e.status === 'string' ? e.status : 
                       e.status === 0 ? 'Pending' : 
                       e.status === 1 ? 'Approved' : 
                       e.status === 2 ? 'Rejected' : 'Pending';
        return status === expenseStatusFilter;
      });
    }

    // Sort
    filtered.sort((a, b) => {
      const getDate = (e: FundExpense) => {
        const dateField = (e as any).createdDate || e.createdOn || '';
        return new Date(dateField).getTime();
      };
      const getApprovedDate = (e: FundExpense) => {
        return new Date(e.approvedOn || '').getTime();
      };
      
      switch (sortOption) {
        case 'date-desc':
          const aDate = getApprovedDate(a) || getDate(a);
          const bDate = getApprovedDate(b) || getDate(b);
          return bDate - aDate;
        case 'date-asc':
          const aDateAsc = getApprovedDate(a) || getDate(a);
          const bDateAsc = getApprovedDate(b) || getDate(b);
          return aDateAsc - bDateAsc;
        case 'amount-desc':
          return (b.expenseAmount || 0) - (a.expenseAmount || 0);
        case 'amount-asc':
          return (a.expenseAmount || 0) - (b.expenseAmount || 0);
        case 'name-asc':
          return (a.recipient || '').localeCompare(b.recipient || '');
        case 'name-desc':
          return (b.recipient || '').localeCompare(a.recipient || '');
        default:
          return 0;
      }
    });

    return filtered;
  }, [expenses, memberFilter, sortOption, expenseStatusFilter]);

  // Totals for approved/confirmed items within the current (filtered) view
  const approvedDonationsTotal = useMemo(() => {
    return filteredAndSortedDonations
      .filter(d => {
        const status = typeof d.status === 'string' ? d.status : 
                       d.status === 0 ? 'Pending' : 
                       d.status === 1 ? 'Completed' : 
                       d.status === 2 ? 'Rejected' : 'Pending';
        return status === 'Completed';
      })
      .reduce((sum, d) => sum + (d.donationMoney || 0), 0);
  }, [filteredAndSortedDonations]);

  const approvedExpensesTotal = useMemo(() => {
    if (!Array.isArray(filteredAndSortedExpenses)) return 0;
    return filteredAndSortedExpenses
      .filter(e => {
        const status = typeof e.status === 'string' ? e.status : 
                       e.status === 0 ? 'Pending' : 
                       e.status === 1 ? 'Approved' : 
                       e.status === 2 ? 'Rejected' : 'Pending';
        return status === 'Approved';
      })
      .reduce((sum, e) => sum + (e.expenseAmount || 0), 0);
  }, [filteredAndSortedExpenses]);

  // Export donations to Excel
  const handleExportDonationsExcel = () => {
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
      
      const createdDate = (donation as any).createdDate || donation.createdOn;
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

    exportToCSV(headers, rows, `lich-su-dong-gop-${new Date().toISOString().split('T')[0]}.csv`);
  };

  // Export expenses to Excel
  const handleExportExpensesExcel = () => {
    if (!Array.isArray(filteredAndSortedExpenses) || filteredAndSortedExpenses.length === 0) {
      return;
    }
    
    const headers = [
      'STT',
      'Ngày tạo',
      'Ngày phê duyệt',
      'Người nhận',
      'Số tiền',
      'Mô tả',
      'Sự kiện',
      'Ngày dự kiến',
      'Trạng thái',
      'Người phê duyệt',
      'Ghi chú phê duyệt',
      'Chiến dịch'
    ];

    const rows = filteredAndSortedExpenses.map((expense, index) => {
      const status = typeof expense.status === 'string' ? expense.status : 
                     expense.status === 0 ? 'Pending' : 
                     expense.status === 1 ? 'Approved' : 
                     expense.status === 2 ? 'Rejected' : 'Pending';
      
      const createdDate = (expense as any).createdDate || expense.createdOn;
      const approverName = (expense as any).approverName || expense.approvedBy;
      const campaignName = (expense as any).campaignName || '';
      
      return [
        index + 1,
        formatDate(createdDate),
        formatDate(expense.approvedOn),
        expense.recipient || '',
        expense.expenseAmount || 0,
        expense.expenseDescription || '',
        expense.expenseEvent || '',
        formatDate(expense.plannedDate),
        status,
        approverName || '',
        expense.approvalFeedback || '',
        campaignName
      ];
    });

    exportToCSV(headers, rows, `lich-su-chi-tieu-${new Date().toISOString().split('T')[0]}.csv`);
  };

  const exportToCSV = (headers: string[], rows: any[][], filename: string) => {
    const csvContent = [
      headers.join(','),
      ...rows.map(row => 
        row.map(cell => {
          const cellStr = String(cell || '');
          if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
            return `"${cellStr.replace(/"/g, '""')}"`;
          }
          return cellStr;
        }).join(',')
      )
    ].join('\n');

    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDonationsPageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= donationsTotalPages) {
      setDonationsPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleExpensesPageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= expensesTotalPages) {
      setExpensesPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const resetFilters = () => {
    setMemberFilter('');
    setDonationStatusFilter(defaultDonationStatus);
    setExpenseStatusFilter(defaultExpenseStatus);
    setSortOption('date-desc');
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

  const currentTotalCount = activeTab === 'donations' ? donationsTotalCount : expensesTotalCount;
  const currentLoading = activeTab === 'donations' ? donationsLoading : expensesLoading;
  const hasActiveFilters = memberFilter || 
    (activeTab === 'donations' ? donationStatusFilter !== defaultDonationStatus : expenseStatusFilter !== defaultExpenseStatus) || 
    sortOption !== 'date-desc';

  return (
    <div className="bg-white rounded-lg shadow p-6">
      {/* Header with Tabs */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">Lịch sử giao dịch</h3>
          <p className="text-sm text-gray-500 mt-1">
            {currentTotalCount > 0 ? `${currentTotalCount} ${activeTab === 'donations' ? 'đóng góp' : 'chi tiêu'}` : 'Chưa có giao dịch nào'}
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
            {showFilters && hasActiveFilters && (
              <span className="ml-1 px-1.5 py-0.5 bg-blue-100 text-blue-600 rounded text-xs">
                {[
                  memberFilter ? '1' : '',
                  (activeTab === 'donations' ? donationStatusFilter !== 'all' : expenseStatusFilter !== 'all') ? '1' : '',
                  sortOption !== 'date-desc' ? '1' : ''
                ].filter(Boolean).length}
              </span>
            )}
          </button>
          {((activeTab === 'donations' && Array.isArray(filteredAndSortedDonations) && filteredAndSortedDonations.length > 0) ||
            (activeTab === 'expenses' && Array.isArray(filteredAndSortedExpenses) && filteredAndSortedExpenses.length > 0)) && (
            <button
              type="button"
              onClick={activeTab === 'donations' ? handleExportDonationsExcel : handleExportExpensesExcel}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              Xuất Excel
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          type="button"
          onClick={() => {
            setActiveTab('donations');
            resetFilters();
          }}
          className={`px-6 py-3 font-semibold text-sm transition-colors border-b-2 ${
            activeTab === 'donations'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Đóng góp ({donationsTotalCount})
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab('expenses');
            resetFilters();
          }}
          className={`px-6 py-3 font-semibold text-sm transition-colors border-b-2 ${
            activeTab === 'expenses'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Chi tiêu ({expensesTotalCount})
        </button>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-gray-900">Bộ lọc</h4>
            <button
              type="button"
              onClick={resetFilters}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Xóa tất cả
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Member/Recipient Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {activeTab === 'donations' ? 'Lọc theo thành viên' : 'Lọc theo người nhận'}
              </label>
              <select
                value={memberFilter}
                onChange={(e) => setMemberFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">
                  {activeTab === 'donations' ? 'Tất cả thành viên' : 'Tất cả người nhận'}
                </option>
                {(activeTab === 'donations' ? uniqueDonors : uniqueRecipients).map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Trạng thái
              </label>
              <select
                value={activeTab === 'donations' ? donationStatusFilter : expenseStatusFilter}
                onChange={(e) => {
                  if (activeTab === 'donations') {
                    setDonationStatusFilter(e.target.value as DonationStatusFilter);
                  } else {
                    setExpenseStatusFilter(e.target.value as ExpenseStatusFilter);
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Tất cả</option>
                {activeTab === 'donations' ? (
                  <>
                    <option value="Completed">Đã xác nhận</option>
                    <option value="Pending">Đang chờ</option>
                    <option value="Rejected">Đã từ chối</option>
                  </>
                ) : (
                  <>
                    <option value="Approved">Đã phê duyệt</option>
                    <option value="Pending">Đang chờ</option>
                    <option value="Rejected">Đã từ chối</option>
                  </>
                )}
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
                <option value="name-asc">
                  {activeTab === 'donations' ? 'Người đóng góp (A-Z)' : 'Người nhận (A-Z)'}
                </option>
                <option value="name-desc">
                  {activeTab === 'donations' ? 'Người đóng góp (Z-A)' : 'Người nhận (Z-A)'}
                </option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      {currentLoading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
        </div>
      ) : activeTab === 'donations' ? (
        filteredAndSortedDonations.length === 0 ? (
          <EmptyState
            icon={<TrendingDown className="w-12 h-12 text-gray-300" />}
            title="Chưa có đóng góp nào"
            description={
              memberFilter || donationStatusFilter !== 'all'
                ? "Không tìm thấy đóng góp phù hợp với bộ lọc."
                : "Những giao dịch đóng góp tiền thành công sẽ hiển thị ở đây."
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
                  {/* Summary row for approved donations */}
                  <tr className="bg-gray-50">
                    <td className="px-4 py-3 font-semibold text-gray-900" colSpan={2}>
                      Tổng (Đã phê duyệt)
                    </td>
                    <td className="px-4 py-3 font-bold text-emerald-700">
                      {formatCurrency(approvedDonationsTotal)}
                    </td>
                    <td className="px-4 py-3 text-gray-700" colSpan={4}></td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {donationsTotalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
                <div className="text-sm text-gray-600">
                  Trang {donationsPage} / {donationsTotalPages} ({donationsTotalCount} đóng góp)
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleDonationsPageChange(donationsPage - 1)}
                    disabled={donationsPage === 1}
                    className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, donationsTotalPages) }, (_, i) => {
                      let pageNum;
                      if (donationsTotalPages <= 5) {
                        pageNum = i + 1;
                      } else if (donationsPage <= 3) {
                        pageNum = i + 1;
                      } else if (donationsPage >= donationsTotalPages - 2) {
                        pageNum = donationsTotalPages - 4 + i;
                      } else {
                        pageNum = donationsPage - 2 + i;
                      }
                      return (
                        <button
                          key={pageNum}
                          type="button"
                          onClick={() => handleDonationsPageChange(pageNum)}
                          className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                            donationsPage === pageNum
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
                    onClick={() => handleDonationsPageChange(donationsPage + 1)}
                    disabled={donationsPage === donationsTotalPages}
                    className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )
      ) : (
        (!Array.isArray(filteredAndSortedExpenses) || filteredAndSortedExpenses.length === 0) ? (
          <EmptyState
            icon={<TrendingDown className="w-12 h-12 text-gray-300" />}
            title="Chưa có chi tiêu nào"
            description={
              memberFilter || expenseStatusFilter !== 'all'
                ? "Không tìm thấy chi tiêu phù hợp với bộ lọc."
                : "Những giao dịch chi tiêu thành công sẽ hiển thị ở đây."
            }
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-gray-600">
                    <th className="px-4 py-3 font-semibold">Ngày</th>
                    <th className="px-4 py-3 font-semibold">Người nhận</th>
                    <th className="px-4 py-3 font-semibold">Số tiền</th>
                    <th className="px-4 py-3 font-semibold">Mô tả</th>
                    <th className="px-4 py-3 font-semibold">Sự kiện</th>
                    <th className="px-4 py-3 font-semibold">Trạng thái</th>
                    <th className="px-4 py-3 font-semibold">Người phê duyệt</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.isArray(filteredAndSortedExpenses) && filteredAndSortedExpenses.map(expense => {
                    const status = typeof expense.status === 'string' ? expense.status : 
                                   expense.status === 0 ? 'Pending' : 
                                   expense.status === 1 ? 'Approved' : 
                                   expense.status === 2 ? 'Rejected' : 'Pending';
                    
                    const statusConfig = {
                      'Approved': { label: 'Đã phê duyệt', className: 'bg-green-100 text-green-700' },
                      'Pending': { label: 'Đang chờ', className: 'bg-yellow-100 text-yellow-700' },
                      'Rejected': { label: 'Đã từ chối', className: 'bg-red-100 text-red-700' },
                    }[status] || { label: status, className: 'bg-gray-100 text-gray-700' };

                    return (
                      <tr key={expense.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-700">
                          <div className="space-y-1">
                            <div className="text-xs text-gray-500">
                              Tạo: {formatDate((expense as any).createdDate || expense.createdOn)}
                            </div>
                            {expense.approvedOn && (
                              <div className="text-xs text-gray-500">Phê duyệt: {formatDate(expense.approvedOn)}</div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-700 font-medium">
                          {expense.recipient || '—'}
                        </td>
                        <td className="px-4 py-3 font-bold text-red-600">
                          {formatCurrency(expense.expenseAmount)}
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          {expense.expenseDescription || '—'}
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          {expense.expenseEvent || '—'}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${statusConfig.className}`}>
                            {statusConfig.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-700 text-sm">
                          {(expense as any).approverName || expense.approvedBy || '—'}
                        </td>
                      </tr>
                    );
                  })}
                  {/* Summary row for approved expenses */}
                  <tr className="bg-gray-50">
                    <td className="px-4 py-3 font-semibold text-gray-900" colSpan={2}>
                      Tổng (Đã phê duyệt)
                    </td>
                    <td className="px-4 py-3 font-bold text-red-700">
                      {formatCurrency(approvedExpensesTotal)}
                    </td>
                    <td className="px-4 py-3 text-gray-700" colSpan={4}></td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {expensesTotalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
                <div className="text-sm text-gray-600">
                  Trang {expensesPage} / {expensesTotalPages} ({expensesTotalCount} chi tiêu)
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleExpensesPageChange(expensesPage - 1)}
                    disabled={expensesPage === 1}
                    className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, expensesTotalPages) }, (_, i) => {
                      let pageNum;
                      if (expensesTotalPages <= 5) {
                        pageNum = i + 1;
                      } else if (expensesPage <= 3) {
                        pageNum = i + 1;
                      } else if (expensesPage >= expensesTotalPages - 2) {
                        pageNum = expensesTotalPages - 4 + i;
                      } else {
                        pageNum = expensesPage - 2 + i;
                      }
                      return (
                        <button
                          key={pageNum}
                          type="button"
                          onClick={() => handleExpensesPageChange(pageNum)}
                          className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                            expensesPage === pageNum
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
                    onClick={() => handleExpensesPageChange(expensesPage + 1)}
                    disabled={expensesPage === expensesTotalPages}
                    className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )
      )}
    </div>
  );
};

export default FundHistorySection;
