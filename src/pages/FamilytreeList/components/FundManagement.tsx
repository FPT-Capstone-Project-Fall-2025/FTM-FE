import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshCw, ChevronLeft, ChevronRight, PlusCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import { useAppSelector } from '@/hooks/redux';
import FundOverviewSection, {
  type OverviewContributor,
  type OverviewTransaction,
} from './Fund/FundOverviewSection';
import { LoadingState, EmptyState } from './Fund/FundLoadingEmpty';
import { useFundManagementData } from './Fund/useFundManagementData';
import FundDepositModal, { type FundDepositForm } from './Fund/FundDepositModal';
import FundProofModal from './Fund/FundProofModal';
import fundService from '@/services/fundService';
import type { FundDonation } from '@/types/fund';
import { useGPMemberId } from '@/hooks/useGPMember';
import FundCreateModal, { type BankInfo, type FundCreateForm } from './Fund/FundCreateModal';

const currencyFormatter = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat('vi-VN', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

const normalizeStatus = (status: unknown): string => {
  if (status === null || status === undefined) return 'unknown';
  if (typeof status === 'number') {
    switch (status) {
      case 0:
        return 'pending';
      case 1:
        return 'approved';
      case 2:
        return 'rejected';
      default:
        return status.toString();
    }
  }
  if (typeof status === 'string') {
    return status.toLowerCase();
  }
  return 'unknown';
};

const getDateValue = (value?: string | null): number => {
  if (!value) return 0;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
};

const DEFAULT_BANKS: BankInfo[] = [
  {
    bankCode: '970436',
    bankName: 'Vietcombank',
    fullName: 'Ngân hàng TMCP Ngoại Thương Việt Nam',
  },
  {
    bankCode: '970418',
    bankName: 'Techcombank',
    fullName: 'Ngân hàng TMCP Kỹ Thương Việt Nam',
  },
  {
    bankCode: '970415',
    bankName: 'BIDV',
    fullName: 'Ngân hàng TMCP Đầu tư và Phát triển Việt Nam',
  },
  {
    bankCode: '970407',
    bankName: 'VietinBank',
    fullName: 'Ngân hàng TMCP Công Thương Việt Nam',
  },
  {
    bankCode: '970422',
    bankName: 'MB Bank',
    fullName: 'Ngân hàng TMCP Quân Đội',
  },
  {
    bankCode: '970432',
    bankName: 'Agribank',
    fullName: 'Ngân hàng Nông nghiệp và Phát triển Nông thôn Việt Nam',
  },
];

const BANK_LOGOS: Record<string, string> = {
  '970436': 'https://logo.clearbit.com/vietcombank.com.vn',
  '970418': 'https://logo.clearbit.com/techcombank.com.vn',
  '970415': 'https://logo.clearbit.com/bidv.com.vn',
  '970407': 'https://logo.clearbit.com/vietinbank.vn',
  '970422': 'https://logo.clearbit.com/mbbank.com.vn',
  '970432': 'https://logo.clearbit.com/agribank.com.vn',
};

const FundManagement: React.FC = () => {
  const selectedTree = useAppSelector(state => state.familyTreeMetaData.selectedFamilyTree);
  const currentUser = useAppSelector(state => state.auth.user);

  const {
    loading,
    fundDataLoading,
    error,
    funds,
    activeFund,
    setActiveFundId,
    donations,
    donationStats,
    expenses,
    refreshAll,
    refreshFundDetails,
    createFund,
    creatingFund,
  } = useFundManagementData({
    familyTreeId: selectedTree?.id ?? null,
    currentUserId: currentUser?.userId ?? null,
  });

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [fundPage, setFundPage] = useState(0);
  const itemsPerPage = 3;
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [banks] = useState<BankInfo[]>(DEFAULT_BANKS);
  const [bankLogos] = useState<Record<string, string>>(BANK_LOGOS);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [isProofModalOpen, setIsProofModalOpen] = useState(false);
  const [depositSubmitting, setDepositSubmitting] = useState(false);
  const [proofSubmitting, setProofSubmitting] = useState(false);
  const [recentDonation, setRecentDonation] = useState<FundDonation | null>(null);
  const { gpMemberId, loading: gpMemberLoading } = useGPMemberId(
    selectedTree?.id ?? null,
    currentUser?.userId ?? null
  );

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  useEffect(() => {
    if (activeFund?.id) {
      void refreshFundDetails();
    }
  }, [activeFund?.id, refreshFundDetails]);

  const formatCurrency = useCallback((value?: number | null) => {
    if (value === null || value === undefined) {
      return currencyFormatter.format(0);
    }
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
      return '—';
    }
    return currencyFormatter.format(numeric);
  }, []);

  const formatDate = useCallback((value?: string | null) => {
    if (!value) return '—';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return '—';
    }
    return dateFormatter.format(parsed);
  }, []);

  const totalIncome = useMemo(() => {
    if (donationStats?.totalReceived !== undefined && donationStats.totalReceived !== null) {
      return Number(donationStats.totalReceived) || 0;
    }
    return donations.reduce((sum, donation) => {
      const value = Number(donation.donationMoney ?? donation.donationAmount ?? 0);
      return Number.isFinite(value) ? sum + value : sum;
    }, 0);
  }, [donationStats?.totalReceived, donations]);

  const approvedExpenses = useMemo(
    () => expenses.filter(expense => normalizeStatus(expense.status) === 'approved'),
    [expenses]
  );

  const pendingExpenses = useMemo(
    () => expenses.filter(expense => normalizeStatus(expense.status) === 'pending'),
    [expenses]
  );

  const totalExpense = useMemo(
    () =>
      approvedExpenses.reduce((sum, expense) => {
        const value = Number(expense.expenseAmount ?? 0);
        return Number.isFinite(value) ? sum + value : sum;
      }, 0),
    [approvedExpenses]
  );

  const computedBalance = useMemo(() => {
    if (activeFund?.currentMoney !== undefined && activeFund?.currentMoney !== null) {
      return Number(activeFund.currentMoney) || 0;
    }
    return totalIncome - totalExpense;
  }, [activeFund?.currentMoney, totalIncome, totalExpense]);

  const uniqueContributorCount = useMemo(() => {
    if (donationStats?.totalDonations !== undefined && donationStats.totalDonations !== null) {
      return Number(donationStats.totalDonations) || 0;
    }
    const keys = donations.map(donation => donation.ftMemberId || donation.donorName || donation.id);
    return new Set(keys).size;
  }, [donationStats?.totalDonations, donations]);

  const recentContributors: OverviewContributor[] = useMemo(() => {
    if (donationStats?.recentDonors?.length) {
      return donationStats.recentDonors.map((donor, index) => ({
        id: `stat-${index}-${donor.donorName}`,
        name: donor.donorName,
        amount: Number(donor.donationMoney ?? donor.donationAmount ?? 0) || 0,
        date: donor.confirmedOn ?? '',
      }));
    }

    return donations
      .slice()
      .sort((a, b) => getDateValue(b.confirmedOn || b.createdOn) - getDateValue(a.confirmedOn || a.createdOn))
      .slice(0, 6)
      .map(donation => ({
        id: donation.id,
        name: donation.donorName || 'Ẩn danh',
        amount: Number(donation.donationMoney ?? donation.donationAmount ?? 0) || 0,
        date: donation.confirmedOn || donation.createdOn || '',
      }));
  }, [donationStats?.recentDonors, donations]);

  const transactions: OverviewTransaction[] = useMemo(() => {
    const donationTransactions: OverviewTransaction[] = donations.map(donation => ({
      id: `donation-${donation.id}`,
      type: 'income',
      amount: Number(donation.donationMoney ?? donation.donationAmount ?? 0) || 0,
      date: donation.confirmedOn || donation.createdOn || '',
      description: donation.donorName ? `Đóng góp từ ${donation.donorName}` : 'Đóng góp quỹ',
      status: normalizeStatus(donation.status),
    }));

    const expenseTransactions: OverviewTransaction[] = expenses.map(expense => ({
      id: `expense-${expense.id}`,
      type: 'expense',
      amount: Number(expense.expenseAmount ?? 0) || 0,
      date: expense.approvedOn || expense.createdOn || '',
      description: expense.expenseDescription || 'Chi tiêu quỹ',
      status: normalizeStatus(expense.status),
    }));

    return [...donationTransactions, ...expenseTransactions].sort(
      (a, b) => getDateValue(b.date) - getDateValue(a.date)
    );
  }, [donations, expenses]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refreshAll();
      if (activeFund?.id) {
        await refreshFundDetails();
      }
      toast.success('Đã làm mới dữ liệu quỹ');
    } catch (err) {
      console.error(err);
      toast.error('Không thể làm mới dữ liệu quỹ');
    } finally {
      setIsRefreshing(false);
    }
  }, [activeFund?.id, refreshAll, refreshFundDetails]);

  const handleCreateFund = useCallback(
    async (form: FundCreateForm) => {
      if (!selectedTree?.id) {
        toast.error('Không xác định được gia phả để tạo quỹ.');
        return;
      }

      try {
        await createFund({
          familyTreeId: selectedTree.id,
          fundName: form.fundName,
          description: form.description,
          bankAccountNumber: form.bankAccountNumber,
          bankCode: form.bankCode,
          bankName: form.bankName,
          accountHolderName: form.accountHolderName,
        });
        toast.success('Tạo quỹ thành công!');
        setShowCreateModal(false);
        setFundPage(0);
        await refreshAll();
      } catch (error: any) {
        console.error('Create fund failed:', error);
        const message =
          error?.response?.data?.message ||
          error?.message ||
          'Không thể tạo quỹ. Vui lòng kiểm tra lại thông tin.';
        toast.error(message);
      }
    },
    [createFund, refreshAll, selectedTree?.id]
  );

  const handleOpenDeposit = useCallback(() => {
    if (!activeFund) {
      toast.error('Vui lòng chọn quỹ để nạp.');
      return;
    }
    setIsDepositModalOpen(true);
  }, [activeFund]);

  const handleCloseDeposit = useCallback(() => {
    setIsDepositModalOpen(false);
  }, []);

  const handleCloseProof = useCallback(() => {
    setIsProofModalOpen(false);
    setRecentDonation(null);
  }, []);

  const handleSubmitDeposit = useCallback(
    async (form: FundDepositForm) => {
      if (!activeFund?.id) {
        toast.error('Không xác định được quỹ để nạp.');
        return;
      }
      if (!gpMemberId) {
        toast.error('Không xác định được thành viên gia phả để ghi nhận khoản nạp.');
        return;
      }
      if (!currentUser?.userId) {
        toast.error('Không xác định được người nạp. Vui lòng đăng nhập lại.');
        return;
      }
      if (form.amount <= 0) {
        toast.error('Số tiền cần lớn hơn 0.');
        return;
      }
      if (form.paymentMethod === 'BankTransfer') {
        toast.info('Phương thức chuyển khoản sẽ được cập nhật trong thời gian tới.');
        return;
      }

      setDepositSubmitting(true);
      try {
        const payload = {
          memberId: gpMemberId,
          donorName: currentUser.userId,
          amount: form.amount,
          paymentMethod: form.paymentMethod === 'Cash' ? '0' : form.paymentMethod,
          paymentNotes: form.paymentNotes?.trim() ? form.paymentNotes.trim() : undefined,
        };

        const response = await fundService.createFundDonation(activeFund.id, payload);
        const donation = response?.data || null;

        await refreshFundDetails();
        setIsDepositModalOpen(false);

        if (form.paymentMethod === 'Cash' && donation) {
          setRecentDonation(donation);
          setIsProofModalOpen(true);
          toast.success('Đã ghi nhận khoản nạp tiền mặt. Vui lòng tải chứng từ xác nhận.');
        } else {
          toast.success('Đã ghi nhận khoản nạp quỹ.');
        }
      } catch (error: any) {
        console.error('Deposit cash failed:', error);
        toast.error(error?.response?.data?.message || 'Không thể nạp quỹ. Vui lòng thử lại.');
      } finally {
        setDepositSubmitting(false);
      }
    },
    [activeFund?.id, currentUser?.email, currentUser?.name, currentUser?.username, gpMemberId, refreshFundDetails]
  );

  const handleSubmitProof = useCallback(
    async ({ files, note }: { files: File[]; note: string }) => {
      if (!recentDonation?.id) {
        toast.error('Thiếu thông tin khoản nạp.');
        return;
      }
      if (!gpMemberId) {
        toast.error('Không xác định được thành viên xác nhận.');
        return;
      }
      setProofSubmitting(true);
      try {
        await fundService.uploadDonationProof(recentDonation.id, files);
        await fundService.confirmDonation(recentDonation.id, {
          confirmedBy: gpMemberId,
          notes: note.trim() ? note.trim() : undefined,
        });
        toast.success('Đã tải chứng từ và xác nhận khoản nạp quỹ.');
        await refreshFundDetails();
        setRecentDonation(null);
        setIsProofModalOpen(false);
      } catch (error: any) {
        console.error('Upload proof failed:', error);
        toast.error(error?.response?.data?.message || 'Không thể tải chứng từ. Vui lòng thử lại.');
      } finally {
        setProofSubmitting(false);
      }
    },
    [gpMemberId, recentDonation?.id, refreshFundDetails]
  );

  useEffect(() => {
    if (!funds.length) {
      setFundPage(0);
      return;
    }
    const maxPage = Math.max(Math.ceil(funds.length / itemsPerPage) - 1, 0);
    setFundPage(prev => Math.min(prev, maxPage));
  }, [funds.length]);

  useEffect(() => {
    if (!activeFund) return;
    const index = funds.findIndex(fund => fund.id === activeFund.id);
    if (index === -1) return;
    const page = Math.floor(index / itemsPerPage);
    setFundPage(page);
  }, [activeFund, funds, itemsPerPage]);

  if (!selectedTree) {
    return (
      <div className="h-full overflow-y-auto bg-gray-50 p-6">
        <EmptyState
          title="Chưa chọn gia phả"
          description="Vui lòng chọn một gia phả trong danh sách để xem thông tin quỹ."
        />
      </div>
    );
  }

  if (loading && funds.length === 0) {
    return (
      <div className="h-full overflow-y-auto bg-gray-50 p-6">
        <LoadingState message="Đang tải dữ liệu quỹ gia tộc..." />
      </div>
    );
  }

  const lastUpdated = formatDate(activeFund?.lastModifiedOn || activeFund?.createdOn);
  const currentFundPurpose =
    activeFund?.description?.trim() || 'Chưa có mô tả cho mục đích sử dụng quỹ này.';
  const totalPages = Math.ceil(funds.length / itemsPerPage);
  const startIndex = fundPage * itemsPerPage;
  const visibleFunds = funds.slice(startIndex, startIndex + itemsPerPage);
  const depositButtonDisabled = !activeFund || !gpMemberId;

  return (
    <div className="h-full overflow-y-auto bg-gray-50 p-6 space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Quản lý quỹ gia tộc {selectedTree?.name ? `- ${selectedTree.name}` : ''}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Chọn một quỹ để xem chi tiết số dư, giao dịch và thông tin liên quan.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            disabled={!selectedTree?.id}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <PlusCircle className="w-4 h-4" />
            Tạo quỹ
          </button>
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing || loading}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg border border-gray-300 bg-white hover:bg-gray-100 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-blue-600' : 'text-gray-600'}`} />
            Làm mới dữ liệu
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-gray-900">Danh sách quỹ</h3>
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-sm font-semibold">
              Tổng số quỹ hiện tại: {funds.length}
            </span>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setFundPage(prev => Math.max(prev - 1, 0))}
                disabled={fundPage === 0}
                className="inline-flex items-center justify-center w-9 h-9 rounded-full border border-gray-300 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-gray-500">
                {fundPage + 1}/{totalPages}
              </span>
              <button
                type="button"
                onClick={() => setFundPage(prev => Math.min(prev + 1, totalPages - 1))}
                disabled={fundPage >= totalPages - 1}
                className="inline-flex items-center justify-center w-9 h-9 rounded-full border border-gray-300 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
        {funds.length === 0 ? (
          <EmptyState
            title="Chưa có quỹ nào"
            description="Gia phả này chưa có quỹ. Vui lòng tạo quỹ mới để bắt đầu quản lý tài chính."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {visibleFunds.map(fund => {
              const isActive = fund.id === activeFund?.id;
              return (
                <button
                  key={fund.id}
                  type="button"
                  onClick={() => setActiveFundId(fund.id)}
                  className={`relative text-left p-5 rounded-xl border transition-all duration-200 bg-white shadow-sm hover:shadow-lg ${
                    isActive ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  {isActive && (
                    <span className="absolute top-3 right-3 text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                      Đang xem
                    </span>
                  )}
                  <h4 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">{fund.fundName}</h4>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                    {fund.description || 'Chưa có mô tả cho quỹ này.'}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-700">
                    <div>
                      <p className="text-gray-500">Số dư hiện tại</p>
                      <p className="font-semibold text-gray-900">{formatCurrency(fund.currentMoney)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Lượt đóng góp</p>
                      <p className="font-semibold text-gray-900">{fund.donationCount ?? '0'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Lượt chi tiêu</p>
                      <p className="font-semibold text-gray-900">{fund.expenseCount ?? '0'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Ngày tạo</p>
                      <p className="font-semibold text-gray-900">{formatDate(fund.createdOn)}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <FundOverviewSection
        activeFund={activeFund}
        computedBalance={computedBalance}
        totalIncome={totalIncome}
        totalExpense={totalExpense}
        uniqueContributorCount={uniqueContributorCount}
        pendingExpenseCount={pendingExpenses.length}
        currentFundPurpose={currentFundPurpose}
        lastUpdated={lastUpdated}
        recentContributors={recentContributors}
        transactions={transactions}
        formatCurrency={formatCurrency}
        formatDate={formatDate}
        onNavigateHistory={() => undefined}
        loading={fundDataLoading}
        onDeposit={handleOpenDeposit}
        depositDisabled={depositButtonDisabled}
        showDepositButton
      />

      <FundCreateModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateFund}
        submitting={creatingFund}
        banks={banks}
        bankLogos={bankLogos}
      />

      <FundDepositModal
        isOpen={isDepositModalOpen}
        onClose={handleCloseDeposit}
        onSubmit={handleSubmitDeposit}
        submitting={depositSubmitting}
        donorName={currentUser?.userId || ''}
        fund={activeFund}
      />

      <FundProofModal
        isOpen={isProofModalOpen}
        onClose={handleCloseProof}
        onSubmit={handleSubmitProof}
        submitting={proofSubmitting}
        donation={recentDonation}
      />
    </div>
  );
};

export default FundManagement;
