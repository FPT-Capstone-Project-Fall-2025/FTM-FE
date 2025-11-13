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
import FundDepositModal, {
  type FundDepositForm,
} from './Fund/FundDepositModal';
import FundProofModal from './Fund/FundProofModal';
import fundService from '@/services/fundService';
import type { FundDonation, FundExpense, CreateFundDonationPayload } from '@/types/fund';
import { useGPMember } from '@/hooks/useGPMember';
import FundCreateModal, {
  type BankInfo,
  type FundCreateForm,
} from './Fund/FundCreateModal';
import { getUserIdFromToken } from '@/utils/jwtUtils';
import FundCampaignsSection, { type CampaignFilter } from './Fund/FundCampaignsSection';
import FundCampaignDetailModal from './Fund/FundCampaignDetailModal';
import FundCampaignModal, { type CampaignFormState } from './Fund/FundCampaignModal';
import FundHistorySection from './Fund/FundHistorySection';
import FundWithdrawalSection, { type WithdrawalFormState } from './Fund/FundWithdrawalSection';
import FundApprovalsSection from './Fund/FundApprovalsSection';
import FundDonationHistorySection from './Fund/FundDonationHistorySection';
import FundPendingDonationsSection from './Fund/FundPendingDonationsSection';
import type { CampaignCreationInput, CampaignDetail, FundWithdrawalInput } from './Fund/useFundManagementData';

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

const INITIAL_WITHDRAWAL_FORM: WithdrawalFormState = {
  amount: '',
  reason: '',
  recipient: '',
  relatedEvent: '',
  date: '',
  campaignId: '',
};

const INITIAL_CAMPAIGN_FORM: CampaignFormState = {
  name: '',
  purpose: '',
  organizer: '',
  organizerContact: '',
  startDate: '',
  endDate: '',
  targetAmount: '',
  bankAccountNumber: '',
  bankName: '',
  bankCode: '',
  accountHolderName: '',
  notes: '',
  isPublic: true,
};

type FundTab = 'overview' | 'campaigns' | 'donations' | 'history' | 'withdrawal' | 'approvals';

const TAB_ITEMS: Array<{ key: FundTab; label: string }> = [
  { key: 'overview', label: 'Tổng quan quỹ' },
  { key: 'campaigns', label: 'Chiến dịch gây quỹ' },
  { key: 'donations', label: 'Nạp quỹ & yêu cầu của tôi' },
  { key: 'history', label: 'Lịch sử chi tiêu' },
  { key: 'withdrawal', label: 'Tạo yêu cầu rút tiền' },
  { key: 'approvals', label: 'Phê duyệt yêu cầu' },
];

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
  const selectedTree = useAppSelector(
    state => state.familyTreeMetaData.selectedFamilyTree
  );
  const { user: authUser, token } = useAppSelector(state => state.auth);

  const currentUserId = useMemo(
    () => authUser?.userId || (token ? getUserIdFromToken(token) : null),
    [authUser?.userId, token]
  );

  console.log('[FundManagement] selectedTree', selectedTree);
  console.log('[FundManagement] currentUserId', currentUserId);

  const {
    gpMemberId,
    gpMember,
    loading: gpMemberLoading,
    error: gpMemberError,
  } = useGPMember(selectedTree?.id ?? null, currentUserId ?? null);

  const {
    loading,
    fundDataLoading,
    actionLoading,
    campaignsLoading,
    campaignDetailLoading,
    error,
    funds,
    activeFund,
    setActiveFundId,
    donations,
    donationStats,
    expenses,
    campaigns,
    campaignPagination,
    changeCampaignPage,
    myPendingDonations,
    myPendingLoading,
    refreshAll,
    refreshFundDetails,
    refreshCampaigns,
    refreshMyPendingDonations,
    loadCampaignDetail,
    createCampaign,
    createFund,
    creatingFund,
    createWithdrawal,
    approveExpense,
    rejectExpense,
  } = useFundManagementData({
    familyTreeId: selectedTree?.id ?? null,
    currentUserId: currentUserId ?? null,
    currentMemberId: gpMemberId ?? null,
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
  const [recentDonation, setRecentDonation] = useState<FundDonation | null>(
    null
  );
  const [activeTab, setActiveTab] = useState<FundTab>('overview');
  const [campaignSearch, setCampaignSearch] = useState('');
  const [campaignFilter, setCampaignFilter] =
    useState<CampaignFilter>('all');
  const [campaignDetail, setCampaignDetail] =
    useState<CampaignDetail | null>(null);
  const [isCampaignDetailOpen, setIsCampaignDetailOpen] = useState(false);
  const [withdrawalForm, setWithdrawalForm] =
    useState<WithdrawalFormState>(INITIAL_WITHDRAWAL_FORM);
  const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);
  const [campaignForm, setCampaignForm] =
    useState<CampaignFormState>(INITIAL_CAMPAIGN_FORM);
  const [campaignSubmitting, setCampaignSubmitting] = useState(false);

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

  useEffect(() => {
    if (activeTab === 'withdrawal' && !withdrawalForm.date) {
      const today = new Date().toISOString().slice(0, 10);
      setWithdrawalForm(prev => ({ ...prev, date: today }));
    }
  }, [activeTab, withdrawalForm.date]);

  useEffect(() => {
    console.log('[FundManagement] useGPMember result', {
      selectedTreeId: selectedTree?.id,
      currentUserId,
      gpMemberId,
      gpMember,
      gpMemberLoading,
      gpMemberError,
    });
  }, [
    gpMemberId,
    gpMember,
    gpMemberLoading,
    gpMemberError,
    selectedTree?.id,
    currentUserId,
  ]);

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
    if (
      donationStats?.totalReceived !== undefined &&
      donationStats.totalReceived !== null
    ) {
      return Number(donationStats.totalReceived) || 0;
    }
    return donations.reduce((sum, donation) => {
      const value = Number(
        donation.donationMoney ?? donation.donationAmount ?? 0
      );
      return Number.isFinite(value) ? sum + value : sum;
    }, 0);
  }, [donationStats?.totalReceived, donations]);

  const approvedExpenses = useMemo(
    () =>
      expenses.filter(
        expense => normalizeStatus(expense.status) === 'approved'
      ),
    [expenses]
  );

  const pendingExpenses = useMemo(
    () =>
      expenses.filter(expense => normalizeStatus(expense.status) === 'pending'),
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
    if (
      activeFund?.currentMoney !== undefined &&
      activeFund?.currentMoney !== null
    ) {
      return Number(activeFund.currentMoney) || 0;
    }
    return totalIncome - totalExpense;
  }, [activeFund?.currentMoney, totalIncome, totalExpense]);

  const uniqueContributorCount = useMemo(() => {
    if (
      donationStats?.totalDonations !== undefined &&
      donationStats.totalDonations !== null
    ) {
      return Number(donationStats.totalDonations) || 0;
    }
    const keys = donations.map(
      donation => donation.ftMemberId || donation.donorName || donation.id
    );
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
      .sort(
        (a, b) =>
          getDateValue(b.confirmedOn || b.createdOn) -
          getDateValue(a.confirmedOn || a.createdOn)
      )
      .slice(0, 6)
      .map(donation => ({
        id: donation.id,
        name: donation.donorName || 'Ẩn danh',
        amount:
          Number(donation.donationMoney ?? donation.donationAmount ?? 0) || 0,
        date: donation.confirmedOn || donation.createdOn || '',
      }));
  }, [donationStats?.recentDonors, donations]);

  const transactions: OverviewTransaction[] = useMemo(() => {
    const donationTransactions: OverviewTransaction[] = donations.map(
      donation => ({
        id: `donation-${donation.id}`,
        type: 'income',
        amount:
          Number(donation.donationMoney ?? donation.donationAmount ?? 0) || 0,
        date: donation.confirmedOn || donation.createdOn || '',
        description: donation.donorName
          ? `Đóng góp từ ${donation.donorName}`
          : 'Đóng góp quỹ',
        status: normalizeStatus(donation.status),
      })
    );

    const expenseTransactions: OverviewTransaction[] = expenses.map(
      expense => ({
        id: `expense-${expense.id}`,
        type: 'expense',
        amount: Number(expense.expenseAmount ?? 0) || 0,
        date: expense.approvedOn || expense.createdOn || '',
        description: expense.expenseDescription || 'Chi tiêu quỹ',
        status: normalizeStatus(expense.status),
      })
    );

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
        toast.error(
          'Không xác định được thành viên gia phả để ghi nhận khoản nạp.'
        );
        return;
      }
      if (!currentUserId) {
        toast.error('Không xác định được người nạp. Vui lòng đăng nhập lại.');
        return;
      }
      if (form.amount <= 0) {
        toast.error('Số tiền cần lớn hơn 0.');
        return;
      }
      if (form.paymentMethod === 'BankTransfer') {
        toast.info(
          'Phương thức chuyển khoản sẽ được cập nhật trong thời gian tới.'
        );
        return;
      }

      setDepositSubmitting(true);
      try {
        const payload: CreateFundDonationPayload = {
          memberId: gpMemberId,
          donorName: currentUserId,
          amount: form.amount,
          paymentMethod:
            form.paymentMethod === 'Cash' ? '0' : form.paymentMethod,
        };
        const trimmedNotes = form.paymentNotes?.trim();
        if (trimmedNotes) {
          payload.paymentNotes = trimmedNotes;
        }

        const response = await fundService.createFundDonation(
          activeFund.id,
          payload
        );
        const donation = response?.data || null;

        await refreshFundDetails();
        setIsDepositModalOpen(false);

        if (form.paymentMethod === 'Cash' && donation) {
          setRecentDonation(donation);
          setIsProofModalOpen(true);
          toast.success(
            'Đã ghi nhận khoản nạp tiền mặt. Vui lòng tải chứng từ xác nhận.'
          );
        } else {
          toast.success('Đã ghi nhận khoản nạp quỹ.');
        }
      } catch (error: any) {
        console.error('Deposit cash failed:', error);
        toast.error(
          error?.response?.data?.message ||
            'Không thể nạp quỹ. Vui lòng thử lại.'
        );
      } finally {
        setDepositSubmitting(false);
      }
    },
    [activeFund?.id, currentUserId, gpMemberId, refreshFundDetails]
  );

  const handleSubmitProof = useCallback(
    async ({ files, note }: { files: File[]; note: string }) => {
      if (!recentDonation?.id) {
        toast.error('Không tìm thấy thông tin khoản nạp trước đó.');
        return;
      }
      if (!gpMemberId) {
        toast.error('Không xác định được thành viên xác nhận.');
        return;
      }
      setProofSubmitting(true);
      try {
        await fundService.uploadDonationProof(recentDonation.id, files);
        const payload: { confirmedBy: string; notes?: string } = {
          confirmedBy: gpMemberId,
        };
        const trimmedNote = note.trim();
        if (trimmedNote) {
          payload.notes = trimmedNote;
        }
        await fundService.confirmDonation(recentDonation.id, payload);
        toast.success('Đã tải chứng từ và xác nhận khoản nạp quỹ.');
        await refreshFundDetails();
        setRecentDonation(null);
        setIsProofModalOpen(false);
      } catch (error: any) {
        console.error('Upload proof failed:', error);
        toast.error(
          error?.response?.data?.message ||
            'Không thể tải chứng từ. Vui lòng thử lại.'
        );
      } finally {
        setProofSubmitting(false);
      }
    },
    [gpMemberId, recentDonation?.id, refreshFundDetails]
  );

  const handleWithdrawalChange = useCallback(
    (field: keyof WithdrawalFormState, value: string) => {
      setWithdrawalForm(prev => ({ ...prev, [field]: value }));
    },
    []
  );

  const handleSubmitWithdrawal = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (!activeFund) {
        toast.error('Vui lòng chọn quỹ trước khi tạo yêu cầu.');
        return;
      }

      const amountValue = Number(withdrawalForm.amount);
      if (!Number.isFinite(amountValue) || amountValue <= 0) {
        toast.error('Số tiền rút phải lớn hơn 0.');
        return;
      }

      if (!withdrawalForm.reason.trim()) {
        toast.error('Vui lòng nhập lý do chi tiêu.');
        return;
      }

      if (!withdrawalForm.recipient.trim()) {
        toast.error('Vui lòng nhập người nhận.');
        return;
      }

      try {
        const payload: FundWithdrawalInput = {
          amount: amountValue,
          description: withdrawalForm.reason.trim(),
          recipient: withdrawalForm.recipient.trim(),
        };

        const relatedEvent = withdrawalForm.relatedEvent.trim();
        if (relatedEvent) {
          payload.expenseEvent = relatedEvent;
        }

        if (withdrawalForm.date) {
          payload.plannedDate = withdrawalForm.date;
        }

        if (withdrawalForm.campaignId) {
          payload.campaignId = withdrawalForm.campaignId;
        }

        await createWithdrawal(payload);
        toast.success('Đã gửi yêu cầu rút quỹ thành công.');
        setWithdrawalForm(INITIAL_WITHDRAWAL_FORM);
        await refreshFundDetails();
      } catch (error: any) {
        console.error('Create withdrawal failed:', error);
        toast.error(
          error?.response?.data?.message ||
            error?.message ||
            'Không thể tạo yêu cầu rút tiền.'
        );
      }
    },
    [
      activeFund,
      createWithdrawal,
      refreshFundDetails,
      withdrawalForm.amount,
      withdrawalForm.campaignId,
      withdrawalForm.date,
      withdrawalForm.reason,
      withdrawalForm.recipient,
      withdrawalForm.relatedEvent,
    ]
  );

  const handleRefreshCampaigns = useCallback(async () => {
    await refreshCampaigns(campaignPagination.page);
  }, [campaignPagination.page, refreshCampaigns]);

  const handleCampaignPageChange = useCallback(
    async (page: number) => {
      await changeCampaignPage(page);
    },
    [changeCampaignPage]
  );

  const getCampaignStatusKey = useCallback(
    (status: unknown): 'active' | 'upcoming' | 'completed' | 'cancelled' => {
      if (status === null || status === undefined) return 'active';
      if (typeof status === 'number') {
        switch (status) {
          case 0:
            return 'upcoming';
          case 1:
            return 'active';
          case 2:
            return 'completed';
          case 3:
            return 'cancelled';
          default:
            return 'active';
        }
      }
      const normalized = String(status).toLowerCase();
      if (normalized.includes('cancel')) return 'cancelled';
      if (normalized.includes('upcoming') || normalized.includes('planned'))
        return 'upcoming';
      if (
        normalized.includes('complete') ||
        normalized.includes('finish')
      )
        return 'completed';
      return 'active';
    },
    []
  );

  const getCampaignStatusLabel = useCallback(
    (status: 'active' | 'upcoming' | 'completed' | 'cancelled') => {
      switch (status) {
        case 'active':
          return 'Đang diễn ra';
        case 'upcoming':
          return 'Sắp diễn ra';
        case 'completed':
          return 'Hoàn thành';
        case 'cancelled':
          return 'Đã hủy';
        default:
          return 'Không xác định';
      }
    },
    []
  );

  const getCampaignStatusBadgeClasses = useCallback(
    (status: 'active' | 'upcoming' | 'completed' | 'cancelled') => {
      switch (status) {
        case 'active':
          return 'bg-emerald-100 text-emerald-700';
        case 'upcoming':
          return 'bg-blue-100 text-blue-700';
        case 'completed':
          return 'bg-gray-100 text-gray-600';
        case 'cancelled':
          return 'bg-red-100 text-red-600';
        default:
          return 'bg-gray-100 text-gray-600';
      }
    },
    []
  );

  const getDonationStatusKey = useCallback(
    (status: unknown): 'pending' | 'confirmed' | 'rejected' => {
      if (status === null || status === undefined) return 'pending';
      if (typeof status === 'number') {
        switch (status) {
          case 0:
            return 'pending';
          case 1:
            return 'confirmed';
          case 2:
            return 'rejected';
          default:
            return 'pending';
        }
      }
      const normalized = String(status).toLowerCase();
      if (normalized.includes('confirm')) return 'confirmed';
      if (normalized.includes('reject')) return 'rejected';
      return 'pending';
    },
    []
  );

  const getPaymentMethodLabel = useCallback((method: unknown) => {
    if (method === null || method === undefined) return 'Không xác định';
    const normalized = String(method).toLowerCase();
    if (normalized === '0' || normalized === 'cash') return 'Tiền mặt';
    if (normalized === '1' || normalized.includes('bank'))
      return 'Chuyển khoản';
    return 'Khác';
  }, []);

  const handleOpenCampaignDetail = useCallback(
    async (campaignId: string) => {
      try {
        const detail = await loadCampaignDetail(campaignId);
        setCampaignDetail(detail);
        setIsCampaignDetailOpen(true);
      } catch (error) {
        toast.error('Không thể tải chi tiết chiến dịch.');
      }
    },
    [loadCampaignDetail]
  );

  const handleCloseCampaignDetail = useCallback(() => {
    setIsCampaignDetailOpen(false);
    setCampaignDetail(null);
  }, []);

  const campaignMetrics = useMemo(() => {
    const map: Record<
      string,
      { raisedAmount: number; contributorCount: number }
    > = {};
    campaigns.forEach(campaign => {
      map[campaign.id] = {
        raisedAmount: Number(campaign.currentBalance ?? 0),
        contributorCount: Number(campaign.totalDonors ?? 0),
      };
    });
    return map;
  }, [campaigns]);

  const getExpenseStatusBadge = useCallback(
    (expense: FundExpense) => {
      const status = normalizeStatus(expense.status);
      switch (status) {
        case 'approved':
          return {
            label: 'Đã phê duyệt',
            className: 'bg-emerald-100 text-emerald-700',
          };
        case 'pending':
          return {
            label: 'Đang chờ',
            className: 'bg-amber-100 text-amber-700',
          };
        case 'rejected':
          return {
            label: 'Đã từ chối',
            className: 'bg-red-100 text-red-600',
          };
        default:
          return {
            label: 'Không xác định',
            className: 'bg-gray-100 text-gray-600',
          };
      }
    },
    []
  );

  const handleRequestAction = useCallback(
    async (expense: FundExpense, action: 'approve' | 'reject') => {
      if (!expense?.id) {
        toast.error('Không tìm thấy yêu cầu hợp lệ.');
        return;
      }
      try {
        if (action === 'approve') {
          await approveExpense(expense.id, undefined, gpMemberId ?? undefined);
          toast.success('Đã phê duyệt yêu cầu rút quỹ.');
        } else {
          await rejectExpense(expense.id, undefined, gpMemberId ?? undefined);
          toast.success('Đã từ chối yêu cầu rút quỹ.');
        }
        await refreshFundDetails();
      } catch (error: any) {
        console.error('Handle request action failed:', error);
        toast.error(
          error?.response?.data?.message ||
            error?.message ||
            'Không thể xử lý yêu cầu.'
        );
      }
    },
    [approveExpense, gpMemberId, refreshFundDetails, rejectExpense]
  );

  const handleRefreshMyPending = useCallback(async () => {
    await refreshMyPendingDonations();
  }, [refreshMyPendingDonations]);

  const handleOpenCampaignModal = useCallback(() => {
    if (!selectedTree?.id) {
      toast.error('Vui lòng chọn gia phả để tạo chiến dịch.');
      return;
    }
    setCampaignForm(prev => ({
      ...prev,
      organizer: gpMember?.fullname || prev.organizer,
    }));
    setIsCampaignModalOpen(true);
  }, [gpMember?.fullname, selectedTree?.id]);

  const handleCloseCampaignModal = useCallback(() => {
    setIsCampaignModalOpen(false);
    setCampaignForm(INITIAL_CAMPAIGN_FORM);
    setCampaignSubmitting(false);
  }, []);

  const handleCampaignFormChange = useCallback(
    (field: keyof CampaignFormState, value: string | boolean) => {
      setCampaignForm(prev => ({
        ...prev,
        [field]: value,
      }));
    },
    []
  );

  const handleSubmitCampaign = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!selectedTree?.id) {
        toast.error('Không xác định được gia phả.');
        return;
      }

      const requiredFields: Array<[keyof CampaignFormState, string]> = [
        ['name', 'Vui lòng nhập tên chiến dịch.'],
        ['purpose', 'Vui lòng nhập mục tiêu chiến dịch.'],
        ['organizer', 'Vui lòng nhập người tổ chức.'],
        ['targetAmount', 'Vui lòng nhập số tiền mục tiêu hợp lệ.'],
        ['startDate', 'Vui lòng chọn ngày bắt đầu.'],
        ['endDate', 'Vui lòng chọn ngày kết thúc.'],
      ];

      for (const [field, message] of requiredFields) {
        const value = campaignForm[field];
        if (typeof value === 'string' ? !value.trim() : !value) {
          toast.error(message);
          return;
        }
      }

      const targetAmountNumber = Number(campaignForm.targetAmount);
      if (!Number.isFinite(targetAmountNumber) || targetAmountNumber < 0) {
        toast.error('Số tiền mục tiêu phải lớn hơn hoặc bằng 0.');
        return;
      }

      if (campaignForm.endDate && campaignForm.startDate) {
        const start = new Date(campaignForm.startDate);
        const end = new Date(campaignForm.endDate);
        if (end < start) {
          toast.error('Ngày kết thúc phải sau ngày bắt đầu.');
          return;
        }
      }

      setCampaignSubmitting(true);
      try {
        const payload: CampaignCreationInput = {
          campaignName: campaignForm.name.trim(),
          campaignDescription: campaignForm.purpose.trim(),
          organizerName: campaignForm.organizer.trim(),
          fundGoal: targetAmountNumber,
          isPublic: campaignForm.isPublic,
        };

        const organizerContact = campaignForm.organizerContact.trim();
        if (organizerContact) {
          payload.organizerContact = organizerContact;
        }

        if (gpMemberId) {
          payload.campaignManagerId = gpMemberId;
        }

        if (campaignForm.startDate) {
          payload.startDate = new Date(campaignForm.startDate).toISOString();
        }
        if (campaignForm.endDate) {
          payload.endDate = new Date(campaignForm.endDate).toISOString();
        }

        const bankAccountNumber = campaignForm.bankAccountNumber.trim();
        if (bankAccountNumber) {
          payload.bankAccountNumber = bankAccountNumber;
        }

        const bankName = campaignForm.bankName.trim();
        if (bankName) {
          payload.bankName = bankName;
        }

        const bankCode = campaignForm.bankCode.trim();
        if (bankCode) {
          payload.bankCode = bankCode;
        }

        const accountHolderName = campaignForm.accountHolderName.trim();
        if (accountHolderName) {
          payload.accountHolderName = accountHolderName;
        }

        const notes = campaignForm.notes.trim();
        if (notes) {
          payload.notes = notes;
        }

        await createCampaign(payload);
        toast.success('Đã tạo chiến dịch gây quỹ mới.');
        await changeCampaignPage(1);
        setActiveTab('campaigns');
        handleCloseCampaignModal();
      } catch (err: any) {
        console.error('Create campaign failed:', err);
        toast.error(
          err?.response?.data?.message ||
            err?.message ||
            'Không thể tạo chiến dịch. Vui lòng thử lại.'
        );
        setCampaignSubmitting(false);
      }
    },
    [
      campaignForm,
      changeCampaignPage,
      createCampaign,
      gpMemberId,
      handleCloseCampaignModal,
      selectedTree?.id,
      setActiveTab,
    ]
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

  const lastUpdated = formatDate(
    activeFund?.lastModifiedOn || activeFund?.createdOn
  );
  const hasAnyFund = funds.length > 0;
  const canCreateFund = !hasAnyFund;

  const currentFundPurpose =
    activeFund?.description?.trim() ||
    'Chưa có mô tả cho mục đích sử dụng quỹ này.';
  const totalPages = Math.ceil(funds.length / itemsPerPage);
  const startIndex = fundPage * itemsPerPage;
  const visibleFunds = funds.slice(startIndex, startIndex + itemsPerPage);
  const depositButtonDisabled = false;

  return (
    <div className="h-full overflow-y-auto bg-gray-50 space-y-3">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {canCreateFund && (
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              disabled={!selectedTree?.id}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <PlusCircle className="w-4 h-4" />
              Tạo quỹ
            </button>
          )}
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing || loading}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg border border-gray-300 bg-white hover:bg-gray-100 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <RefreshCw
              className={`w-4 h-4 ${
                isRefreshing ? 'animate-spin text-blue-600' : 'text-gray-600'
              }`}
            />
            Làm mới dữ liệu
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow px-4 py-2 flex flex-wrap items-center gap-2">
        {TAB_ITEMS.map(tab => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`px-3 py-2 text-sm font-semibold rounded-md transition-colors ${
              activeTab === tab.key
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:text-blue-600'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <>
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
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
                    onClick={() =>
                      setFundPage(prev => Math.min(prev + 1, totalPages - 1))
                    }
                    disabled={fundPage >= totalPages - 1}
                    className="inline-flex items-center justify-center w-9 h-9 rounded-full border border-gray-300 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
            {funds.length === 0 ? (
              <div className="flex flex-col items-center justify-center bg-white border border-dashed border-gray-200 rounded-xl py-10 text-center">
                <h4 className="text-lg font-semibold text-gray-800 mb-2">
                  Gia phả này chưa có quỹ
                </h4>
                <p className="text-sm text-gray-500 max-w-sm mb-4">
                  Hãy khởi tạo quỹ đầu tiên để bắt đầu quản lý tài chính và các
                  khoản đóng góp của gia đình.
                </p>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                >
                  <PlusCircle className="w-4 h-4" />
                  Tạo quỹ mới
                </button>
              </div>
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
                        isActive
                          ? 'border-blue-500 ring-2 ring-blue-200'
                          : 'border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      {isActive && (
                        <span className="absolute top-3 right-3 text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                          Đang xem
                        </span>
                      )}
                      <h4 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
                        {fund.fundName}
                      </h4>
                      <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                        {fund.description || 'Chưa có mô tả cho quỹ này.'}
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-700">
                        <div>
                          <p className="text-gray-500">Số dư hiện tại</p>
                          <p className="font-semibold text-gray-900">
                            {formatCurrency(fund.currentMoney)}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">Lượt đóng góp</p>
                          <p className="font-semibold text-gray-900">
                            {fund.donationCount ?? '0'}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">Lượt chi tiêu</p>
                          <p className="font-semibold text-gray-900">
                            {fund.expenseCount ?? '0'}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">Ngày tạo</p>
                          <p className="font-semibold text-gray-900">
                            {formatDate(fund.createdOn)}
                          </p>
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
        </>
      )}

      {activeTab === 'campaigns' && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Chiến dịch gây quỹ
            </h3>
            <button
              type="button"
              onClick={handleRefreshCampaigns}
              disabled={campaignsLoading}
              className="inline-flex items-center gap-2 px-3 py-1 text-sm font-semibold rounded-lg border border-gray-300 bg-white hover:bg-gray-100 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <RefreshCw
                className={`w-4 h-4 ${
                  campaignsLoading
                    ? 'animate-spin text-blue-600'
                    : 'text-gray-600'
                }`}
              />
              Làm mới
            </button>
          </div>
          {campaignsLoading ? (
            <LoadingState message="Đang tải danh sách chiến dịch..." />
          ) : (
            <FundCampaignsSection
              campaigns={campaigns}
              campaignSearch={campaignSearch}
              campaignFilter={campaignFilter}
              onSearchChange={setCampaignSearch}
              onFilterChange={setCampaignFilter}
              onRequestCreate={handleOpenCampaignModal}
              onOpenDetail={handleOpenCampaignDetail}
              formatCurrency={formatCurrency}
              formatDate={formatDate}
              getCampaignStatusKey={getCampaignStatusKey}
              getCampaignStatusLabel={getCampaignStatusLabel}
              getCampaignStatusBadgeClasses={getCampaignStatusBadgeClasses}
              metrics={campaignMetrics}
              currentPage={campaignPagination.page}
              totalPages={campaignPagination.totalPages}
              totalCount={campaignPagination.totalCount}
              pageSize={campaignPagination.pageSize}
              onPageChange={handleCampaignPageChange}
            />
          )}
        </div>
      )}

      {activeTab === 'donations' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            {fundDataLoading ? (
              <LoadingState message="Đang tải lịch sử nạp quỹ..." />
            ) : (
              <FundDonationHistorySection
                donations={donations}
                formatCurrency={formatCurrency}
                formatDate={formatDate}
                getPaymentMethodLabel={getPaymentMethodLabel}
                getDonationStatusKey={getDonationStatusKey}
              />
            )}
          </div>
          <FundPendingDonationsSection
            pendingDonations={myPendingDonations}
            loading={myPendingLoading}
            onRefresh={handleRefreshMyPending}
            formatCurrency={formatCurrency}
            formatDate={formatDate}
            getPaymentMethodLabel={getPaymentMethodLabel}
          />
        </div>
      )}

      {activeTab === 'history' && (
        <div className="bg-white rounded-lg shadow p-6">
          {fundDataLoading ? (
            <LoadingState message="Đang tải lịch sử chi tiêu..." />
          ) : (
            <FundHistorySection
              approvedExpenses={approvedExpenses}
              formatCurrency={formatCurrency}
              formatDate={formatDate}
            />
          )}
        </div>
      )}

      {activeTab === 'withdrawal' && (
        <div className="bg-white rounded-lg shadow p-6">
          <FundWithdrawalSection
            hasFund={hasAnyFund}
            computedBalance={computedBalance}
            campaigns={campaigns}
            formState={withdrawalForm}
            onFormChange={handleWithdrawalChange}
            onSubmit={handleSubmitWithdrawal}
            actionLoading={actionLoading}
            formatCurrency={formatCurrency}
          />
        </div>
      )}

      {activeTab === 'approvals' && (
        <div className="bg-white rounded-lg shadow p-6">
          {fundDataLoading ? (
            <LoadingState message="Đang tải yêu cầu rút tiền..." />
          ) : (
            <FundApprovalsSection
              pendingExpenses={pendingExpenses}
              formatCurrency={formatCurrency}
              formatDate={formatDate}
              getStatusBadge={getExpenseStatusBadge}
              onRequestAction={handleRequestAction}
            />
          )}
        </div>
      )}

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
      />

      <FundProofModal
        isOpen={isProofModalOpen}
        onClose={handleCloseProof}
        onSubmit={handleSubmitProof}
        submitting={proofSubmitting}
        donation={recentDonation}
      />

      <FundCampaignDetailModal
        isOpen={isCampaignDetailOpen}
        detail={campaignDetail}
        onClose={handleCloseCampaignDetail}
        loading={campaignDetailLoading}
        formatCurrency={formatCurrency}
        formatDate={formatDate}
        getCampaignStatusKey={getCampaignStatusKey}
        getCampaignStatusLabel={getCampaignStatusLabel}
        getCampaignStatusBadgeClasses={getCampaignStatusBadgeClasses}
        getDonationStatusKey={getDonationStatusKey}
        getPaymentMethodLabel={getPaymentMethodLabel}
      />

      <FundCampaignModal
        isOpen={isCampaignModalOpen}
        formState={campaignForm}
        onClose={handleCloseCampaignModal}
        onFormChange={handleCampaignFormChange}
        onSubmit={handleSubmitCampaign}
        submitting={campaignSubmitting}
      />
    </div>
  );
};

export default FundManagement;
