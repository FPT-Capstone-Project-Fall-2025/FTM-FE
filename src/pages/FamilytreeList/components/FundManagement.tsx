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
import FundDepositQRModal from './Fund/FundDepositQRModal';
import FundProofModal from './Fund/FundProofModal';
import type {
  FundDonation,
  FundExpense,
  FundCampaign,
  CreateFundDonationPayload,
  CreateFundDonationResponse,
} from '@/types/fund';
import { useGPMember } from '@/hooks/useGPMember';
import { getDisplayNameFromGPMember } from '@/services/familyTreeMemberService';
import familyTreeMemberService, { type FTRole } from '@/services/familyTreeMemberService';
import fundService from '@/services/fundService';
import FundCreateModal, {
  type BankInfo,
  type FundCreateForm,
} from './Fund/FundCreateModal';
import FundEditModal, {
  type FundEditForm,
} from './Fund/FundEditModal';
import { getUserIdFromToken } from '@/utils/jwtUtils';
import FundCampaignsSection, {
  type CampaignFilter,
} from './Fund/FundCampaignsSection';
import FundCampaignDetailModal from './Fund/FundCampaignDetailModal';
import FundCampaignModal, {
  type CampaignFormState,
} from './Fund/FundCampaignModal';
import CampaignDonateModal from './Fund/CampaignDonateModal';
import FundHistorySection from './Fund/FundHistorySection';
import {
  type WithdrawalFormState,
} from './Fund/FundWithdrawalSection';
import FundWithdrawalModal from './Fund/FundWithdrawalModal';
import FundApprovalsSection from './Fund/FundApprovalsSection';
import FundDonationHistorySection from './Fund/FundDonationHistorySection';
import FundPendingDonationsSection from './Fund/FundPendingDonationsSection';
import FundPendingDonationsManagerSection from './Fund/FundPendingDonationsManagerSection';
import FundApprovalModal from './Fund/FundApprovalModal';
import type {
  CampaignCreationInput,
  CampaignDetail,
  FundWithdrawalInput,
} from './Fund/useFundManagementData';

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

const getInitialWithdrawalForm = (): WithdrawalFormState => {
  const today = new Date();
  const formattedDate = today.toISOString().split('T')[0] || ''; // YYYY-MM-DD format
  return {
    amount: '',
    reason: '',
    recipient: '',
    relatedEvent: '',
    date: formattedDate, // Set to current date
    campaignId: '',
    receiptImages: [],
  };
};

const INITIAL_WITHDRAWAL_FORM = getInitialWithdrawalForm();

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

type FundTab =
  | 'overview'
  | 'donations'
  | 'history'
  | 'withdrawal'
  | 'approvals';

const FUND_TAB_ITEMS: Array<{ key: FundTab; label: string; requiresOwner?: boolean }> = [
  { key: 'overview', label: 'Tổng quan quỹ' },
  { key: 'donations', label: 'Đóng góp & yêu cầu của tôi' },
  { key: 'history', label: 'Lịch sử giao dịch' },
  { key: 'approvals', label: 'Phê duyệt yêu cầu', requiresOwner: true },
];

// Campaign tabs removed - now using single unified list

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

  const donorName = useMemo(
    () => getDisplayNameFromGPMember(gpMember) || authUser?.name || '',
    [gpMember, authUser?.name]
  );

  const {
    loading,
    fundDataLoading,
    actionLoading,
    campaignsLoading,
    activeCampaignsLoading,
    campaignDetailLoading,
    error,
    funds,
    activeFund,
    donations,
    donationStats,
    expenses,
    campaigns,
    campaignPagination,
    activeCampaigns,
    activeCampaignPagination,
    changeCampaignPage,
    myPendingDonations,
    myPendingLoading,
    pendingDonations,
    pendingDonationsLoading,
    refreshAll,
    refreshFundDetails,
    refreshCampaigns,
    refreshActiveCampaigns,
    refreshMyPendingDonations,
    refreshPendingDonations,
    confirmDonation,
    uploadDonationProof,
    loadCampaignDetail,
    createCampaign,
    createFund,
    creatingFund,
    donateToFund,
    createWithdrawal,
    approveExpense,
    rejectExpense,
    rejectDonation,
    pendingExpenses: apiPendingExpenses,
    refreshPendingExpenses,
  } = useFundManagementData({
    familyTreeId: selectedTree?.id ?? null,
    currentUserId: currentUserId ?? null,
    currentMemberId: gpMemberId ?? null,
  });

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [fundPage, setFundPage] = useState(0);
  const itemsPerPage = 3;
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [memberRole, setMemberRole] = useState<FTRole | null>(null);
  const [banks] = useState<BankInfo[]>(DEFAULT_BANKS);
  const [bankLogos] = useState<Record<string, string>>(BANK_LOGOS);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [isDepositQRModalOpen, setIsDepositQRModalOpen] = useState(false);
  const [depositResponse, setDepositResponse] =
    useState<CreateFundDonationResponse | null>(null);
  const [isProofModalOpen, setIsProofModalOpen] = useState(false);
  const [depositSubmitting, setDepositSubmitting] = useState(false);
  const [proofSubmitting, setProofSubmitting] = useState(false);
  const [isWithdrawalModalOpen, setIsWithdrawalModalOpen] = useState(false);
  const [isEditFundModalOpen, setIsEditFundModalOpen] = useState(false);
  const [editFundSubmitting, setEditFundSubmitting] = useState(false);
  const [recentDonation, setRecentDonation] = useState<FundDonation | null>(
    null
  );
  const [managementScope, setManagementScope] = useState<'fund' | 'campaign'>(
    'fund'
  );
  const [fundTab, setFundTab] = useState<FundTab>('overview');
  const [campaignSearch, setCampaignSearch] = useState('');
  const [campaignFilter, setCampaignFilter] = useState<CampaignFilter>('active');
  const [campaignTab, setCampaignTab] = useState<'all' | 'approvals' | 'my' | 'history'>('all');
  const [campaignDetail, setCampaignDetail] = useState<CampaignDetail | null>(
    null
  );
  const [isCampaignDetailOpen, setIsCampaignDetailOpen] = useState(false);
  const [withdrawalForm, setWithdrawalForm] = useState<WithdrawalFormState>(
    INITIAL_WITHDRAWAL_FORM
  );
  const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);
  const [campaignForm, setCampaignForm] = useState<CampaignFormState>(
    INITIAL_CAMPAIGN_FORM
  );
  const [campaignSubmitting, setCampaignSubmitting] = useState(false);
  const [isCampaignDonateOpen, setIsCampaignDonateOpen] = useState(false);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  // Campaign approvals filter removed: show all pending donations across campaigns
  const [campaignApprovalsLoading, setCampaignApprovalsLoading] = useState(false);
  const [selectedPendingCampaignDonationId, setSelectedPendingCampaignDonationId] = useState<string | null>(null);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [myCampaignPending, setMyCampaignPending] = useState<Array<{
    id: string;
    campaignId: string;
    campaignName: string | null;
    donorName: string | null;
    amount: number;
    message: string | null;
    createdAt: string | null;
    proofImages: string[];
  }>>([]);
  const [myCampaignPendingLoading, setMyCampaignPendingLoading] = useState(false);
  const [myCampaignPage, setMyCampaignPage] = useState(1);
  const [myCampaignTotalPages, setMyCampaignTotalPages] = useState(1);
  const [myCampaignTotalCount, setMyCampaignTotalCount] = useState(0);
  const [myPendingCollapsed, setMyPendingCollapsed] = useState<Record<string, boolean>>({});
  // Create expense modal state
  const [isCreateExpenseOpen, setIsCreateExpenseOpen] = useState(false);
  const [createExpenseSubmitting, setCreateExpenseSubmitting] = useState(false);
  const [createExpenseForm, setCreateExpenseForm] = useState<{
    campaignId: string | null;
    amount: string;
    description: string;
    notes: string;
    receipts: File[];
  }>({ campaignId: null, amount: '', description: '', notes: '', receipts: [] });
  const [collapsedCampaigns, setCollapsedCampaigns] = useState<Record<string, boolean>>({});
  const [historySelectedCampaignId, setHistorySelectedCampaignId] = useState<string | null>(null);
  const [historyDonations, setHistoryDonations] = useState<Array<{
    id: string;
    donorName: string | null;
    amount: number;
    message: string | null;
    status: string | null;
    createdAt: string | null;
  }>>([]);
  const [historyExpenses, setHistoryExpenses] = useState<Array<{
    id: string;
    amount: number;
    description: string | null;
    status: string | null;
    createdAt: string | null;
  }>>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyDonationPage, setHistoryDonationPage] = useState(1);
  const [historyDonationTotalPages, setHistoryDonationTotalPages] = useState(1);
  const [historyExpensePage, setHistoryExpensePage] = useState(1);
  const [historyExpenseTotalPages, setHistoryExpenseTotalPages] = useState(1);
  // Optional count if needed later
  // const [campaignApprovalTotalCount, setCampaignApprovalTotalCount] = useState(0);
  const [campaignPendingDonations, setCampaignPendingDonations] = useState<Array<{
    id: string;
    campaignId: string;
    campaignName: string | null;
    donorName: string | null;
    amount: number;
    message: string | null;
    status: string | null;
    createdAt: string | null;
    proofImages: string[];
  }>>([]);

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
    void refreshActiveCampaigns(1);
  }, [refreshActiveCampaigns]);

  useEffect(() => {
    if (isWithdrawalModalOpen) {
      // Set date if not set
      if (!withdrawalForm.date) {
      const today = new Date().toISOString().slice(0, 10);
      setWithdrawalForm(prev => ({ ...prev, date: today }));
    }
      // Set recipient to current user/member name if not set
      if (!withdrawalForm.recipient.trim()) {
        const displayName = getDisplayNameFromGPMember(gpMember) || authUser?.name || '';
        if (displayName) {
          setWithdrawalForm(prev => ({ ...prev, recipient: displayName }));
        }
      }
    }
  }, [isWithdrawalModalOpen, withdrawalForm.date, withdrawalForm.recipient, gpMember, authUser?.name]);

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
    if (!Array.isArray(donations)) {
      return 0;
    }
    return donations.reduce((sum, donation) => {
      const value = Number(
        donation.donationMoney ?? donation.donationAmount ?? 0
      );
      return Number.isFinite(value) ? sum + value : sum;
    }, 0);
  }, [donationStats?.totalReceived, donations]);

  const approvedExpenses = useMemo(
    () => {
      if (!Array.isArray(expenses)) {
        return [];
      }
      return expenses.filter(
        expense => normalizeStatus(expense.status) === 'approved'
  );
    },
    [expenses]
  );

  // Use API-fetched pending expenses instead of filtering
  // const pendingExpenses = useMemo(
  //   () => {
  //     if (!Array.isArray(expenses)) {
  //       return [];
  //     }
  //     return expenses.filter(expense => normalizeStatus(expense.status) === 'pending');
  //   },
  //   [expenses]
  // );
  const pendingExpenses = apiPendingExpenses;


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
    if (!Array.isArray(donations)) {
      return 0;
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

    if (!Array.isArray(donations)) {
      return [];
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
    const donationTransactions: OverviewTransaction[] = Array.isArray(donations)
      ? donations.map(
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
        )
      : [];

    const expenseTransactions: OverviewTransaction[] = Array.isArray(expenses)
      ? expenses.map(
      expense => ({
        id: `expense-${expense.id}`,
        type: 'expense',
        amount: Number(expense.expenseAmount ?? 0) || 0,
        date: expense.approvedOn || expense.createdOn || '',
        description: expense.expenseDescription || 'Chi tiêu quỹ',
        status: normalizeStatus(expense.status),
      })
        )
      : [];

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
      toast.error('Vui lòng chọn quỹ để đóng góp.');
      return;
    }
    setIsDepositModalOpen(true);
  }, [activeFund]);

  const handleCloseDeposit = useCallback(() => {
    setIsDepositModalOpen(false);
  }, []);

  const handleCloseDepositQR = useCallback(() => {
    setIsDepositQRModalOpen(false);
    setDepositResponse(null);
    // Refresh fund details after closing QR modal
    refreshFundDetails();
  }, [refreshFundDetails]);

  const handleOpenWithdraw = useCallback(() => {
    if (!activeFund) {
      toast.error('Vui lòng chọn quỹ để rút tiền.');
      return;
    }
    setIsWithdrawalModalOpen(true);
  }, [activeFund]);

  const handleCloseWithdraw = useCallback(() => {
    setIsWithdrawalModalOpen(false);
  }, []);

  const handleOpenEditFund = useCallback(() => {
    if (!activeFund) {
      toast.error('Vui lòng chọn quỹ để chỉnh sửa.');
      return;
    }
    setIsEditFundModalOpen(true);
  }, [activeFund]);

  const handleCloseEditFund = useCallback(() => {
    setIsEditFundModalOpen(false);
  }, []);

  const handleSubmitEditFund = useCallback(
    async (form: FundEditForm) => {
      if (!activeFund) {
        toast.error('Vui lòng chọn quỹ để chỉnh sửa.');
        return;
      }

      setEditFundSubmitting(true);
      try {
        await fundService.updateFund(activeFund.id, {
          fundName: form.fundName,
          ...(form.description ? { description: form.description } : {}),
          bankAccountNumber: form.bankAccountNumber,
          bankCode: form.bankCode,
          bankName: form.bankName,
          accountHolderName: form.accountHolderName,
          ...(form.fundManagers ? { fundManagers: form.fundManagers } : {}),
        });
        toast.success('Đã cập nhật thông tin quỹ thành công.');
        setIsEditFundModalOpen(false);
        await refreshFundDetails();
        await refreshAll();
      } catch (error: any) {
        console.error('Update fund failed:', error);
        toast.error(
          error?.response?.data?.message ||
            error?.message ||
            'Không thể cập nhật thông tin quỹ. Vui lòng thử lại.'
        );
      } finally {
        setEditFundSubmitting(false);
      }
    },
    [activeFund, refreshFundDetails, refreshAll]
  );

  const handleCloseProof = useCallback(() => {
    setIsProofModalOpen(false);
    setRecentDonation(null);
  }, []);

  const handleSubmitDeposit = useCallback(
    async (form: FundDepositForm) => {
      if (!activeFund?.id) {
        toast.error('Không xác định được quỹ để đóng góp.');
        return;
      }
      if (!gpMemberId) {
        toast.error(
          'Không xác định được thành viên gia phả để ghi nhận khoản đóng góp.'
        );
        return;
      }
      if (!donorName) {
        toast.error('Không xác định được tên người đóng góp.');
        return;
      }
      if (form.amount <= 0) {
        toast.error('Số tiền cần lớn hơn 0.');
        return;
      }

      setDepositSubmitting(true);
      try {
        // Convert payment method: Cash -> 0, BankTransfer -> "BankTransfer"
        const paymentMethod = form.paymentMethod === 'Cash' ? 0 : form.paymentMethod;
        
        const payload: CreateFundDonationPayload = {
          memberId: gpMemberId,
          donorName: donorName,
          amount: form.amount,
          paymentMethod: paymentMethod,
        };
        const trimmedNotes = form.paymentNotes?.trim();
        if (trimmedNotes) {
          payload.paymentNotes = trimmedNotes;
        }

        const response = await donateToFund(activeFund.id, payload);

        // Close deposit modal
        setIsDepositModalOpen(false);

        // Handle response based on payment method and requiresManualConfirmation
        if (form.paymentMethod === 'BankTransfer') {
          // Show QR code modal for bank transfer
          setDepositResponse(response);
          setIsDepositQRModalOpen(true);
          toast.success('Đã tạo yêu cầu đóng góp tiền. Vui lòng quét mã QR để chuyển khoản.');
        } else if (form.paymentMethod === 'Cash') {
          // For cash payment, check if manual confirmation is required
          if (response.requiresManualConfirmation) {
            // Cash payment requires manual confirmation
            // Refresh my pending donations to show the new donation
            await refreshMyPendingDonations();
            // Switch to donations tab to show pending donations section
            setFundTab('donations');
            setManagementScope('fund');
            toast.success('Đã ghi nhận khoản đóng góp tiền mặt. Vui lòng upload ảnh xác minh tại tab "Đóng góp & yêu cầu của tôi".');
            // Scroll to pending donations section after a short delay
            setTimeout(() => {
              const pendingSection = document.getElementById('my-pending-donations-section');
              if (pendingSection) {
                pendingSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }
            }, 300);
          } else {
            // Cash payment doesn't require manual confirmation (shouldn't happen, but handle it)
            await refreshFundDetails();
            toast.success('Đã ghi nhận khoản đóng góp tiền mặt.');
          }
        } else {
          // Other payment methods
          await refreshFundDetails();
          toast.success('Đã ghi nhận khoản đóng góp quỹ.');
        }
      } catch (error: any) {
        console.error('Deposit failed:', error);
        toast.error(
          error?.response?.data?.message ||
            error?.message ||
            'Không thể đóng góp quỹ. Vui lòng thử lại.'
        );
      } finally {
        setDepositSubmitting(false);
      }
    },
    [
      activeFund?.id,
      gpMemberId,
      donorName,
      donateToFund,
      refreshFundDetails,
    ]
  );

  const handleSubmitProof = useCallback(
    async ({ files, note }: { files: File[]; note: string }) => {
      if (!recentDonation?.id) {
        toast.error('Không tìm thấy thông tin khoản đóng góp trước đó.');
        return;
      }
      if (!gpMemberId) {
        toast.error('Không xác định được thành viên xác nhận.');
        return;
      }
      setProofSubmitting(true);
      try {
        await uploadDonationProof(recentDonation.id, files);
        if (!gpMemberId) {
          toast.error('Không xác định được thành viên gia phả để xác nhận.');
          return;
        }
        await confirmDonation(recentDonation.id, gpMemberId, note.trim() || undefined);
        toast.success('Đã tải xác minh và xác nhận khoản đóng góp quỹ.');
        // Refresh fund details to update balance
        await refreshFundDetails();
        await refreshAll();
        // Switch to overview tab
        setFundTab('overview');
        setManagementScope('fund');
        setRecentDonation(null);
        setIsProofModalOpen(false);
      } catch (error: any) {
        console.error('Upload proof failed:', error);
        toast.error(
          error?.response?.data?.message ||
            'Không thể tải xác minh và xác nhận khoản đóng góp quỹ. Vui lòng thử lại.'
        );
      } finally {
        setProofSubmitting(false);
      }
    },
    [gpMemberId, recentDonation?.id, refreshFundDetails, refreshAll, confirmDonation, uploadDonationProof]
  );

  const handleWithdrawalChange = useCallback(
    (field: keyof WithdrawalFormState, value: string | File[]) => {
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

      // Parse amount from string (may contain formatted value)
      const amountValue = Number(withdrawalForm.amount.replace(/\D/g, ''));
      if (!Number.isFinite(amountValue) || amountValue <= 0) {
        toast.error('Số tiền rút phải lớn hơn 0.');
        return;
      }

      // Validate against computed balance
      if (amountValue > computedBalance) {
        toast.error(`Số tiền rút không được vượt quá số dư hiện tại (${formatCurrency(computedBalance)}).`);
        return;
      }

      if (!withdrawalForm.reason.trim()) {
        toast.error('Vui lòng nhập lý do chi tiêu.');
        return;
      }

      // Validate receipt images
      if (!withdrawalForm.receiptImages || withdrawalForm.receiptImages.length === 0) {
        toast.error('Vui lòng upload ít nhất một ảnh hóa đơn/xác minh.');
        return;
      }

      // Set recipient to current user/member name if not provided
      const recipientName = withdrawalForm.recipient.trim() || 
        (() => {
          const displayName = getDisplayNameFromGPMember(gpMember) || authUser?.name || '';
          return displayName;
        })();

      if (!recipientName) {
        toast.error('Không xác định được tên người tạo yêu cầu.');
        return;
      }

      try {
        const payload: FundWithdrawalInput = {
          amount: amountValue,
          description: withdrawalForm.reason.trim(),
          recipient: recipientName,
          receiptImages: withdrawalForm.receiptImages,
        };

        const relatedEvent = withdrawalForm.relatedEvent.trim();
        if (relatedEvent) {
          payload.expenseEvent = relatedEvent;
        }

        // Always set plannedDate to current date (formatted as YYYY-MM-DD)
        // Use formState.date if available, otherwise use current date
        const today = new Date();
        const currentDate = today.toISOString().split('T')[0] ?? '';
        const plannedDate = withdrawalForm.date || currentDate;
        if (plannedDate) {
          payload.plannedDate = plannedDate;
        }

        if (withdrawalForm.campaignId) {
          payload.campaignId = withdrawalForm.campaignId;
        }

        await createWithdrawal(payload);
        toast.success('Đã gửi yêu cầu rút quỹ thành công.');
        setWithdrawalForm(getInitialWithdrawalForm()); // Reset with current date
        setIsWithdrawalModalOpen(false); // Close modal after success
        // Refresh data
        await refreshFundDetails();
        await refreshPendingExpenses();
        // Switch to approvals tab
        setFundTab('approvals');
        setManagementScope('fund');
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
      refreshPendingExpenses,
      withdrawalForm.amount,
      withdrawalForm.campaignId,
      withdrawalForm.date,
      withdrawalForm.reason,
      withdrawalForm.recipient,
      withdrawalForm.relatedEvent,
      withdrawalForm.receiptImages,
      computedBalance,
      formatCurrency,
      gpMember,
      authUser,
      getDisplayNameFromGPMember,
      setWithdrawalForm,
      setIsWithdrawalModalOpen,
      setFundTab,
      setManagementScope,
    ]
  );

  const handleRefreshCampaigns = useCallback(async () => {
    await refreshCampaigns(campaignPagination.page);
  }, [campaignPagination.page, refreshCampaigns]);

const handleRefreshActiveCampaigns = useCallback(async () => {
  await refreshActiveCampaigns(activeCampaignPagination.page);
}, [activeCampaignPagination.page, refreshActiveCampaigns]);

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
      if (normalized.includes('complete') || normalized.includes('finish'))
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
          return 'Đã kết thúc';
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

  // Campaign approvals data
  const loadCampaignApprovals = useCallback(async (familyTreeId: string) => {
    if (!familyTreeId) {
      setCampaignPendingDonations([]);
      return;
    }
    setCampaignApprovalsLoading(true);
    try {
      const items = await fundService.fetchPendingCampaignDonationsByTree(familyTreeId);
      const pending = items.filter(item => String(item.status || '').toLowerCase() === 'pending');
      setCampaignPendingDonations(
        pending.map(p => ({
          id: p.id,
          campaignId: p.campaignId,
          campaignName: p.campaignName ?? null,
          donorName: p.donorName,
          amount: p.amount,
          message: p.message,
          status: p.status,
          createdAt: p.createdAt,
          proofImages: p.proofImages,
        }))
      );
      // setCampaignApprovalTotalCount(pending.length);
    } catch (err) {
      console.error('Failed to load campaign approvals', err);
      toast.error('Không thể tải danh sách ủng hộ cần phê duyệt.');
      setCampaignPendingDonations([]);
    } finally {
      setCampaignApprovalsLoading(false);
    }
  }, []);

  // No per-campaign selection; approvals tab shows all pending donations

  useEffect(() => {
    if (managementScope === 'campaign' && campaignTab === 'approvals' && selectedTree?.id) {
      void loadCampaignApprovals(selectedTree.id);
    }
  }, [managementScope, campaignTab, selectedTree?.id, loadCampaignApprovals]);

  // Load my campaign pending donations when opening "my" tab
  useEffect(() => {
    const run = async () => {
      if (!(managementScope === 'campaign' && campaignTab === 'my')) return;
      const userIdForApi = gpMemberId || currentUserId || '';
      if (!userIdForApi) {
        setMyCampaignPending([]);
        return;
      }
      setMyCampaignPendingLoading(true);
      try {
        const items = await fundService.fetchMyPendingCampaignDonations(userIdForApi);
        setMyCampaignPending(items.map(x => ({
          id: x.id,
          campaignId: x.campaignId,
          campaignName: x.campaignName ?? null,
          donorName: x.donorName ?? null,
          amount: x.amount ?? 0,
          message: x.message ?? null,
          createdAt: x.createdAt ?? null,
          proofImages: x.proofImages ?? [],
        })));
      } catch (err) {
        console.error('Failed to load my campaign pending donations', err);
        toast.error('Không thể tải yêu cầu ủng hộ đang chờ của bạn.');
      } finally {
        setMyCampaignPendingLoading(false);
      }
    };
    void run();
  }, [managementScope, campaignTab, currentUserId, gpMemberId]);

  // History tab: default select first campaign
  useEffect(() => {
    if (managementScope !== 'campaign' || campaignTab !== 'history') return;
    if (!historySelectedCampaignId) {
      const first = campaigns[0] || null;
      if (first) setHistorySelectedCampaignId(first.id);
    }
  }, [managementScope, campaignTab, campaigns, historySelectedCampaignId]);

  const loadCampaignHistory = useCallback(async (campaignId: string, donationPage = 1, expensePage = 1) => {
    setHistoryLoading(true);
    try {
      const [donationsRes, expensesRes] = await Promise.all([
        fundService.fetchCampaignDonationsHistory(campaignId, donationPage, 10),
        fundService.fetchCampaignExpensesHistory(campaignId, expensePage, 10),
      ]);
      setHistoryDonations(donationsRes.items.map(x => ({
        id: x.id,
        donorName: x.donorName,
        amount: x.amount,
        message: x.message,
        status: x.status,
        createdAt: x.createdAt,
      })));
      setHistoryDonationPage(donationsRes.page);
      setHistoryDonationTotalPages(donationsRes.totalPages);

      setHistoryExpenses(expensesRes.items.map(x => ({
        id: x.id,
        amount: x.amount,
        description: x.description,
        status: x.status,
        createdAt: x.createdAt,
      })));
      setHistoryExpensePage(expensesRes.page);
      setHistoryExpenseTotalPages(expensesRes.totalPages);
    } catch (err) {
      console.error('Failed to load campaign history', err);
      toast.error('Không thể tải lịch sử giao dịch.');
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    if (managementScope !== 'campaign' || campaignTab !== 'history') return;
    if (!historySelectedCampaignId) return;
    void loadCampaignHistory(historySelectedCampaignId, historyDonationPage, historyExpensePage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [managementScope, campaignTab, historySelectedCampaignId, historyDonationPage, historyExpensePage]);

  // Merge and sort all campaigns by date
  const allCampaigns = useMemo(() => {
    const merged = [...campaigns, ...activeCampaigns];
    // Remove duplicates by id
    const unique = merged.reduce((acc, campaign) => {
      if (!acc.find(c => c.id === campaign.id)) {
        acc.push(campaign);
      }
      return acc;
    }, [] as FundCampaign[]);
    
    // Sort by startDate (or createdOn if no startDate), newest first
    return unique.sort((a, b) => {
      const aDate = getDateValue(a.startDate || a.createdOn);
      const bDate = getDateValue(b.startDate || b.createdOn);
      return bDate - aDate;
    });
  }, [campaigns, activeCampaigns]);



  const campaignMetrics = useMemo(() => {
    const map: Record<
      string,
      { raisedAmount: number; contributorCount: number }
    > = {};
    allCampaigns.forEach(campaign => {
      map[campaign.id] = {
        raisedAmount: Number(campaign.currentBalance ?? 0),
        contributorCount: Number(campaign.totalDonors ?? 0),
      };
    });
    return map;
  }, [allCampaigns]);

  const getExpenseStatusBadge = useCallback((expense: FundExpense) => {
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
  }, []);

  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<FundExpense | null>(null);
  const [approvalAction, setApprovalAction] = useState<'approve' | 'reject' | null>(null);
  const [approvalNote, setApprovalNote] = useState('');
  // Campaign expenses approvals (manager)
  const [campaignExpenseApprovalsLoading, setCampaignExpenseApprovalsLoading] = useState(false);
  const [campaignPendingExpenses, setCampaignPendingExpenses] = useState<Array<{
    id: string;
    campaignId: string;
    campaignName: string | null;
    description: string | null;
    amount: number;
    receiptUrls: string[];
    status: string | null;
    requestedById: string | null;
    createdAt: string | null;
  }>>([]);
  const [selectedPendingCampaignExpenseId, setSelectedPendingCampaignExpenseId] = useState<string | null>(null);
  const [expenseApprovalNotes, setExpenseApprovalNotes] = useState('');
  const [expensePaymentProofImages, setExpensePaymentProofImages] = useState<File[]>([]);

  const loadCampaignExpenseApprovals = useCallback(async (memberId: string) => {
    if (!memberId) {
      setCampaignPendingExpenses([]);
      return;
    }
    setCampaignExpenseApprovalsLoading(true);
    try {
      const res = await fundService.fetchPendingCampaignExpensesForManager(memberId, 1, 20);
      setCampaignPendingExpenses(
        (res.items || []).map(e => ({
          id: e.id,
          campaignId: e.campaignId,
          campaignName: e.campaignName ?? null,
          description: e.description ?? null,
          amount: e.amount ?? 0,
          receiptUrls: e.receiptUrls ?? [],
          status: e.status ?? null,
          requestedById: e.requestedById ?? null,
          createdAt: e.createdAt ?? null,
        }))
      );
    } catch (err) {
      console.error('Failed to load campaign expense approvals', err);
      toast.error('Không thể tải danh sách chi tiêu cần duyệt.');
      setCampaignPendingExpenses([]);
    } finally {
      setCampaignExpenseApprovalsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (managementScope === 'campaign' && campaignTab === 'approvals' && gpMemberId) {
      void loadCampaignExpenseApprovals(gpMemberId);
    }
  }, [managementScope, campaignTab, gpMemberId, loadCampaignExpenseApprovals]);

  const [approvalPaymentProofImages, setApprovalPaymentProofImages] = useState<File[]>([]);

  const handleRequestAction = useCallback(
    (expense: FundExpense, action: 'approve' | 'reject') => {
      setSelectedExpense(expense);
      setApprovalAction(action);
      setApprovalNote('');
      setApprovalPaymentProofImages([]);
      setIsApprovalModalOpen(true);
    },
    []
  );

  const handleApprovalConfirm = useCallback(
    async () => {
      if (!selectedExpense?.id || !approvalAction) {
        return;
      }
      try {
        if (approvalAction === 'approve') {
          // Validate that files are actually File objects
          const validFiles = approvalPaymentProofImages.filter(f => f instanceof File);
          
          console.log('[FundManagement.handleApprovalConfirm] Approving with:', {
            expenseId: selectedExpense.id,
            notes: approvalNote,
            approverId: gpMemberId,
            paymentProofImagesCount: approvalPaymentProofImages.length,
            validFilesCount: validFiles.length,
            paymentProofImages: approvalPaymentProofImages.map(f => ({
              name: f.name,
              size: f.size,
              type: f.type,
              isFile: f instanceof File,
              constructor: f.constructor.name,
            })),
          });
          
          if (validFiles.length === 0) {
            toast.error('Vui lòng chọn ít nhất một ảnh xác minh thanh toán.');
            return;
          }
          
          await approveExpense(
            selectedExpense.id,
            approvalNote || undefined,
            gpMemberId ?? undefined,
            validFiles
          );
          toast.success('Đã phê duyệt yêu cầu rút quỹ.');
        } else {
          await rejectExpense(selectedExpense.id, approvalNote || undefined, gpMemberId ?? undefined);
          toast.success('Đã từ chối yêu cầu rút quỹ.');
        }
        setIsApprovalModalOpen(false);
        setSelectedExpense(null);
        setApprovalAction(null);
        setApprovalNote('');
        setApprovalPaymentProofImages([]);
        await refreshFundDetails();
        await refreshPendingExpenses();
      } catch (error: any) {
        console.error('Handle request action failed:', error);
        toast.error(
          error?.response?.data?.message ||
            error?.message ||
            'Không thể xử lý yêu cầu.'
        );
      }
    },
    [approveExpense, rejectExpense, selectedExpense, approvalAction, approvalNote, approvalPaymentProofImages, gpMemberId, refreshFundDetails, refreshPendingExpenses]
  );

  const handleApprovalCancel = useCallback(() => {
    setIsApprovalModalOpen(false);
    setSelectedExpense(null);
    setApprovalAction(null);
    setApprovalNote('');
    setApprovalPaymentProofImages([]);
  }, []);

  const handleRefreshMyPending = useCallback(async () => {
    await refreshMyPendingDonations();
  }, [refreshMyPendingDonations]);

  const handleOpenCampaignModal = useCallback(() => {
    if (!selectedTree?.id) {
      toast.error('Vui lòng chọn gia phả để tạo chiến dịch.');
      return;
    }
    const organizerName = getDisplayNameFromGPMember(gpMember) || gpMember?.fullname || authUser?.name || '';
    setCampaignForm(prev => ({
      ...prev,
      organizer: organizerName,
    }));
    setIsCampaignModalOpen(true);
  }, [gpMember, authUser?.name, selectedTree?.id, getDisplayNameFromGPMember]);

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
               // Refresh campaigns to show the newly created campaign
               await refreshCampaigns(1);
               setManagementScope('campaign');
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
             setManagementScope,
             createCampaign,
             gpMemberId,
             handleCloseCampaignModal,
             selectedTree?.id,
             refreshCampaigns,
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

  // Fetch member role
  useEffect(() => {
    const fetchMemberRole = async () => {
      if (!selectedTree?.id || !gpMemberId) {
        setMemberRole(null);
        return;
      }
      try {
        const role = await familyTreeMemberService.getMemberRole(selectedTree.id, gpMemberId);
        setMemberRole(role);
      } catch (error) {
        console.error('Failed to fetch member role:', error);
        setMemberRole(null);
      }
    };
    void fetchMemberRole();
  }, [selectedTree?.id, gpMemberId]);

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
  const depositButtonDisabled = false;

  return (
    <div className="h-full overflow-y-auto bg-gray-50 space-y-3">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-sm font-semibold text-gray-700" htmlFor="management-scope">
            Chế độ quản lý
          </label>
          <select
            id="management-scope"
            value={managementScope}
            onChange={event => {
              const value = event.target.value as 'fund' | 'campaign';
              setManagementScope(value);
              if (value === 'fund') {
                setFundTab('overview');
              }
              // Campaign scope doesn't need tab switching anymore
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          >
            <option value="fund">Quỹ</option>
            <option value="campaign">Chiến dịch gây quỹ</option>
          </select>
        </div>

               {managementScope === 'fund' ? (
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
               ) : (
                 <div className="flex flex-wrap items-center gap-3">
                   <button
                     type="button"
                     onClick={handleOpenCampaignModal}
                     disabled={!selectedTree?.id}
                     className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                   >
                     <PlusCircle className="w-4 h-4" />
                     Tạo chiến dịch
                   </button>
                   <button
                     type="button"
                     onClick={async () => {
                       await handleRefreshCampaigns();
                       await handleRefreshActiveCampaigns();
                     }}
                     disabled={campaignsLoading || activeCampaignsLoading}
                     className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg border border-gray-300 bg-white hover:bg-gray-100 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                   >
                     <RefreshCw
                       className={`w-4 h-4 ${
                         (campaignsLoading || activeCampaignsLoading)
                           ? 'animate-spin text-blue-600'
                           : 'text-gray-600'
                       }`}
                     />
                     Làm mới
                   </button>
                 </div>
               )}
      </div>

      {/* Create Campaign Expense Modal */}
      {isCreateExpenseOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Tạo yêu cầu rút tiền</h3>
              <button
                type="button"
                className="px-2 py-1 text-sm rounded hover:bg-gray-100"
                onClick={() => setIsCreateExpenseOpen(false)}
                disabled={createExpenseSubmitting}
              >
                Đóng
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Chiến dịch</label>
                {createExpenseForm.campaignId ? (
                  <div className="px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-800">
                    {campaigns.find(c => c.id === createExpenseForm.campaignId)?.campaignName || '—'}
                  </div>
                ) : (
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    value={createExpenseForm.campaignId ?? ''}
                    onChange={e => setCreateExpenseForm(f => ({ ...f, campaignId: e.target.value || null }))}
                  >
                    <option value="">-- Chọn chiến dịch --</option>
                    {campaigns.map(c => (
                      <option key={c.id} value={c.id}>{c.campaignName}</option>
                    ))}
                  </select>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Số tiền (VND)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={createExpenseForm.amount}
                  onChange={e => {
                    const digits = e.target.value.replace(/\D/g, '');
                    setCreateExpenseForm(f => ({ ...f, amount: digits }));
                  }}
                  placeholder="Nhập số tiền"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Mô tả</label>
                <textarea
                  rows={3}
                  value={createExpenseForm.description}
                  onChange={e => setCreateExpenseForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="Chi phí chi tiết..."
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Ghi chú (tuỳ chọn)</label>
                <input
                  type="text"
                  value={createExpenseForm.notes}
                  onChange={e => setCreateExpenseForm(f => ({ ...f, notes: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Ảnh hoá đơn/xác minh</label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={e => {
                    const files = e.target.files ? Array.from(e.target.files) : [];
                    setCreateExpenseForm(f => ({ ...f, receipts: files }));
                  }}
                />
                {createExpenseForm.receipts.length > 0 && (
                  <p className="text-xs text-gray-600 mt-1">{createExpenseForm.receipts.length} ảnh được chọn</p>
                )}
              </div>
            </div>
            <div className="px-6 py-4 border-t flex items-center justify-end gap-2">
              <button
                type="button"
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                onClick={() => setIsCreateExpenseOpen(false)}
                disabled={createExpenseSubmitting}
              >
                Hủy
              </button>
              <button
                type="button"
                className="px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-60"
                disabled={createExpenseSubmitting}
                onClick={async () => {
                  try {
                    if (!createExpenseForm.campaignId) {
                      toast.error('Vui lòng chọn chiến dịch.');
                      return;
                    }
                    if (!gpMemberId && !currentUserId) {
                      toast.error('Không xác định được người yêu cầu.');
                      return;
                    }
                    const amountNum = Number(createExpenseForm.amount);
                    if (!Number.isFinite(amountNum) || amountNum <= 0) {
                      toast.error('Số tiền không hợp lệ.');
                      return;
                    }
                    setCreateExpenseSubmitting(true);
                    await fundService.createCampaignExpense({
                      campaignId: createExpenseForm.campaignId,
                      requestedById: gpMemberId || currentUserId || '',
                      amount: amountNum,
                      description: createExpenseForm.description.trim(),
                      notes: createExpenseForm.notes.trim() || undefined,
                      receipts: createExpenseForm.receipts,
                    });
                    toast.success('Đã tạo yêu cầu rút tiền (đang chờ phê duyệt).');
                    setIsCreateExpenseOpen(false);
                    setCreateExpenseForm({ campaignId: null, amount: '', description: '', notes: '', receipts: [] });
                  } catch (err: any) {
                    console.error('Create campaign expense failed:', err);
                    const apiMsg = err?.response?.data?.message || err?.response?.data?.error || err?.message;
                    toast.error(apiMsg || 'Không thể tạo yêu cầu rút tiền.');
                  } finally {
                    setCreateExpenseSubmitting(false);
                  }
                }}
              >
                {createExpenseSubmitting ? 'Đang tạo...' : 'Tạo yêu cầu'}
              </button>
            </div>
          </div>
        </div>
      )}
      {managementScope === 'fund' && (
        <div className="bg-white rounded-lg shadow px-4 py-2 flex flex-wrap items-center gap-2">
          {FUND_TAB_ITEMS.filter(tab => {
            // Hide tab if it requires owner role and user is not owner
            if (tab.requiresOwner && memberRole !== 'FTOwner') {
              return false;
            }
            return true;
          }).map(tab => {
            const isApprovalsTab = tab.key === 'approvals';
            const isActive = fundTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setFundTab(tab.key)}
                className={`px-3 py-2 text-sm font-semibold rounded-md transition-colors ${
                  isActive
                    ? isApprovalsTab && memberRole === 'FTOwner'
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg'
                      : 'bg-blue-600 text-white'
                    : isApprovalsTab && memberRole === 'FTOwner'
                      ? 'text-purple-600 hover:text-purple-700 hover:bg-purple-50'
                      : 'text-gray-600 hover:text-blue-600'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      )}

             {/* Campaign tabs removed - using unified list */}

      {managementScope === 'fund' && (
        <>
          {fundTab === 'overview' && (
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
                <div className="space-y-6">
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
                    onWithdraw={handleOpenWithdraw}
                    withdrawDisabled={depositButtonDisabled}
                    showWithdrawButton
                    onEdit={handleOpenEditFund}
                    isOwner={memberRole === 'FTOwner'}
                  />
                </div>
              )}
            </div>
          )}

          {fundTab === 'donations' && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow p-6">
                {fundDataLoading ? (
                  <LoadingState message="Đang tải lịch sử đóng góp quỹ..." />
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
              <div id="my-pending-donations-section">
                <FundPendingDonationsSection
                  pendingDonations={myPendingDonations}
                  loading={myPendingLoading}
                  onRefresh={handleRefreshMyPending}
                  onUploadProof={async (donationId, files) => {
                    console.log('[FundManagement.onUploadProof] Starting upload proof', {
                      donationId,
                      fundDonationId: donationId,
                      filesCount: files.length,
                      fileNames: files.map(f => f.name),
                      myPendingDonations: myPendingDonations.map(d => ({ id: d.id, status: d.status })),
                    });

                    try {
                      // Always refresh myPendingDonations first to ensure we have the latest data
                      console.log('[FundManagement.onUploadProof] Refreshing myPendingDonations to get latest data...');
                      await handleRefreshMyPending();
                      
                      // Wait a bit for state to update
                      await new Promise(resolve => setTimeout(resolve, 300));
                      
                      // Now upload proof - API will validate if donation exists
                      console.log('[FundManagement.onUploadProof] Calling uploadDonationProof with donationId:', donationId);
                      await uploadDonationProof(donationId, files);
                      console.log('[FundManagement.onUploadProof] Upload successful');
                      toast.success('Đã upload ảnh xác minh thành công. Vui lòng chờ quản trị viên xác nhận.');
                      await handleRefreshMyPending();
                    } catch (error: any) {
                      console.error('[FundManagement.onUploadProof] Upload proof failed:', {
                        error,
                        donationId,
                        fundDonationId: donationId,
                        errorResponse: error?.response,
                        errorMessage: error?.response?.data?.message || error?.message,
                        errorStatus: error?.response?.status,
                        errorUrl: error?.config?.url,
                        errorMethod: error?.config?.method,
                        myPendingDonationIds: myPendingDonations.map(d => d.id),
                      });
                      
                      let errorMessage = error?.response?.data?.message || error?.message || 'Không thể upload ảnh xác minh. Vui lòng thử lại.';
                      
                      // Handle 404 specifically - donation not found
                      if (error?.response?.status === 404) {
                        errorMessage = `Không tìm thấy yêu cầu đóng góp quỹ (ID: ${donationId}). Yêu cầu có thể đã bị xóa hoặc không thuộc về bạn. Vui lòng refresh trang và thử lại.`;
                        console.log('[FundManagement.onUploadProof] 404 error, refreshing donations...');
                        await handleRefreshMyPending();
                      } else if (error?.response?.status === 400 && errorMessage.includes('not found')) {
                        console.log('[FundManagement.onUploadProof] Donation not found (400), refreshing...');
                        await handleRefreshMyPending();
                        errorMessage = 'Vui lòng đợi vài giây rồi thử lại upload ảnh xác minh.';
                      }
                      
                      toast.error(errorMessage);
                      throw error;
                    }
                  }}
                  formatCurrency={formatCurrency}
                  formatDate={formatDate}
                  getPaymentMethodLabel={getPaymentMethodLabel}
                />
              </div>
            </div>
          )}

          {fundTab === 'history' && (
            <div>
              {fundDataLoading ? (
                <div className="bg-white rounded-lg shadow p-6">
                  <LoadingState message="Đang tải lịch sử giao dịch..." />
                </div>
              ) : (
                <FundHistorySection
                  fundId={activeFund?.id ?? null}
                  formatCurrency={formatCurrency}
                  formatDate={formatDate}
                  getPaymentMethodLabel={getPaymentMethodLabel}
                />
              )}
            </div>
          )}

          {fundTab === 'approvals' && (
            <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 ${
              memberRole === 'FTOwner' 
                ? 'bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 p-6 rounded-lg border border-purple-200' 
                : ''
            }`}>
              {/* Column 1: Đóng góp */}
              <div className="flex flex-col min-h-0">
                <FundPendingDonationsManagerSection
                  pendingDonations={pendingDonations}
                  loading={pendingDonationsLoading}
                  confirming={actionLoading}
                  rejecting={actionLoading}
                  onRefresh={refreshPendingDonations}
                  onConfirm={async (donationId, confirmationNotes) => {
                    if (!gpMemberId) {
                      toast.error('Không xác định được thành viên gia phả để xác nhận.');
                      return;
                    }
                    try {
                      await confirmDonation(donationId, gpMemberId, confirmationNotes);
                      toast.success('Đã xác nhận đóng góp quỹ thành công.');
                      // Refresh fund details to update balance
                      await refreshFundDetails();
                      await refreshAll();
                      // Switch to overview tab
                      setFundTab('overview');
                      setManagementScope('fund');
                    } catch (error: any) {
                      console.error('Confirm donation failed:', error);
                      toast.error(
                        error?.response?.data?.message ||
                          error?.message ||
                          'Không thể xác nhận đóng góp. Vui lòng thử lại.'
                      );
                      throw error;
                    }
                  }}
                  onReject={async (donationId, reason) => {
                    if (!gpMemberId) {
                      toast.error('Không xác định được thành viên gia phả để từ chối.');
                      return;
                    }
                    try {
                      await rejectDonation(donationId, gpMemberId, reason);
                      toast.success('Đã từ chối đóng góp quỹ thành công.');
                      // Refresh data after rejection
                      await refreshPendingDonations();
                      await refreshMyPendingDonations();
                    } catch (error: any) {
                      console.error('Reject donation failed:', error);
                      toast.error(
                        error?.response?.data?.message ||
                          error?.message ||
                          'Không thể từ chối đóng góp. Vui lòng thử lại.'
                      );
                      throw error;
                    }
                  }}
                  formatCurrency={formatCurrency}
                  formatDate={formatDate}
                  getPaymentMethodLabel={getPaymentMethodLabel}
                  confirmerId={gpMemberId ?? ''}
                />
              </div>

              {/* Column 2: Rút tiền */}
              <div className="flex flex-col min-h-0">
                {fundDataLoading ? (
                  <div className="bg-white rounded-lg shadow p-6">
                    <LoadingState message="Đang tải yêu cầu rút tiền..." />
                  </div>
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
            </div>
          )}
        </>
      )}

             {managementScope === 'campaign' && (
               <>
                 {/* Campaign Tabs */}
                 <div className="bg-white rounded-lg shadow px-4 py-2 flex flex-wrap items-center gap-2">
                         <button
                           type="button"
                     onClick={() => setCampaignTab('all')}
                     className={`px-3 py-2 text-sm font-semibold rounded-md transition-colors ${
                       campaignTab === 'all'
                         ? 'bg-blue-600 text-white'
                         : 'text-gray-600 hover:text-blue-600'
                     }`}
                   >
                     Tất cả chiến dịch
                         </button>
                         <button
                           type="button"
                     onClick={() => setCampaignTab('my')}
                     className={`px-3 py-2 text-sm font-semibold rounded-md transition-colors ${
                       campaignTab === 'my'
                         ? 'bg-blue-600 text-white'
                         : 'text-gray-600 hover:text-blue-600'
                     }`}
                   >
                     Ủng hộ chiến dịch & yêu cầu của tôi
                         </button>
                   <button
                     type="button"
                     onClick={() => setCampaignTab('history')}
                     className={`px-3 py-2 text-sm font-semibold rounded-md transition-colors ${
                       campaignTab === 'history'
                         ? 'bg-blue-600 text-white'
                         : 'text-gray-600 hover:text-blue-600'
                     }`}
                   >
                     Lịch sử giao dịch
                   </button>
                   {memberRole === 'FTOwner' && (
                     <button
                       type="button"
                       onClick={() => setCampaignTab('approvals')}
                       className={`px-3 py-2 text-sm font-semibold rounded-md transition-colors ${
                         campaignTab === 'approvals'
                           ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white'
                           : 'text-purple-700 hover:text-purple-800'
                       }`}
                     >
                       Phê duyệt yêu cầu
                     </button>
                   )}
                 </div>

                {campaignTab === 'all' ? (
                   <>
                     {campaignsLoading ? (
                       <div className="bg-white rounded-lg shadow p-6">
                         <LoadingState message="Đang tải danh sách chiến dịch..." />
                       </div>
                     ) : (
                     <FundCampaignsSection
                         campaigns={campaigns}
                       campaignSearch={campaignSearch}
                       campaignFilter={campaignFilter}
                       onSearchChange={setCampaignSearch}
                       onFilterChange={setCampaignFilter}
                       onOpenDetail={handleOpenCampaignDetail}
                         onDonate={(id) => {
                           // Open donation modal from campaign list
                           setSelectedCampaignId(id);
                           setIsCampaignDonateOpen(true);
                         }}
                       formatCurrency={formatCurrency}
                       formatDate={formatDate}
                       getCampaignStatusLabel={getCampaignStatusLabel}
                       getCampaignStatusBadgeClasses={getCampaignStatusBadgeClasses}
                       metrics={campaignMetrics}
                         currentPage={campaignPagination.page}
                         totalPages={campaignPagination.totalPages}
                         totalCount={campaignPagination.totalCount}
                         pageSize={campaignPagination.pageSize}
                         onPageChange={changeCampaignPage}
                         title="Tất cả chiến dịch"
                         subtitle="Danh sách tất cả các chiến dịch gây quỹ"
                       showCreateButton={false}
                         showStatusFilter={true}
                       />
                     )}
                   </>
               ) : campaignTab === 'my' ? (
                 <div className="space-y-4">
                    <div className="bg-white rounded-lg shadow p-4 overflow-x-auto">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-base font-bold text-gray-900">Lịch sử ủng hộ của tôi</h3>
                      </div>
                     {myCampaignPendingLoading ? (
                       <LoadingState message="Đang tải ủng hộ của bạn..." />
                     ) : myCampaignPending.length === 0 ? (
                       <EmptyState title="Chưa có ủng hộ" description="Bạn chưa có giao dịch ủng hộ nào." />
                     ) : (
                       <>
                         <table className="w-full text-sm">
                           <thead>
                             <tr className="border-b border-gray-200 text-left text-gray-600">
                               <th className="px-4 py-3 font-semibold">Số tiền</th>
                               <th className="px-4 py-3 font-semibold">Chiến dịch</th>
                               <th className="px-4 py-3 font-semibold">Người đóng góp</th>
                               <th className="px-4 py-3 font-semibold">Phương thức</th>
                               <th className="px-4 py-3 font-semibold">Ghi chú</th>
                               <th className="px-4 py-3 font-semibold">Trạng thái</th>
                               <th className="px-4 py-3 font-semibold">Thời gian</th>
                             </tr>
                           </thead>
                           <tbody>
                             {myCampaignPending.map(row => {
                               const method = row.proofImages.length > 0 ? 'Tiền mặt' : 'VietQR';
                               const statusKey = String((row as any).status || '').toLowerCase();
                               const statusLabel =
                                 statusKey === 'completed'
                                   ? 'Đã xác nhận'
                                   : statusKey === 'rejected'
                                   ? 'Đã từ chối'
                                   : 'Đang chờ';
                               const statusClass =
                                 statusKey === 'completed'
                                   ? 'bg-emerald-100 text-emerald-700'
                                   : statusKey === 'rejected'
                                   ? 'bg-red-100 text-red-600'
                                   : 'bg-amber-100 text-amber-700';
                               return (
                                 <tr key={row.id} className="border-b border-gray-100 hover:bg-gray-50">
                                   <td className="px-4 py-3 font-bold text-emerald-600">
                                     {formatCurrency(row.amount)}
                                   </td>
                                   <td className="px-4 py-3 text-gray-700">
                                     {row.campaignName || '—'}
                                   </td>
                                   <td className="px-4 py-3 text-gray-700">{row.donorName || 'Ẩn danh'}</td>
                                   <td className="px-4 py-3 text-gray-700">{method}</td>
                                   <td className="px-4 py-3 text-gray-600">{row.message || '—'}</td>
                                   <td className="px-4 py-3">
                                     <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusClass}`}>
                                       {statusLabel}
                                     </span>
                                   </td>
                                   <td className="px-4 py-3 text-gray-600">{formatDate(row.createdAt)}</td>
                                 </tr>
                               );
                             })}
                           </tbody>
                         </table>
                         {myCampaignTotalPages > 1 && (
                           <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
                             <div className="text-sm text-gray-600">
                               Trang {myCampaignPage} / {myCampaignTotalPages} ({myCampaignTotalCount} mục)
                             </div>
                             <div className="flex items-center gap-2">
                               <button
                                 type="button"
                                 onClick={() => setMyCampaignPage(Math.max(1, myCampaignPage - 1))}
                                 disabled={myCampaignPage === 1}
                                 className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                               >
                                 ‹
                               </button>
                               <button
                                 type="button"
                                 onClick={() => setMyCampaignPage(Math.min(myCampaignTotalPages, myCampaignPage + 1))}
                                 disabled={myCampaignPage === myCampaignTotalPages}
                                 className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                               >
                                 ›
                               </button>
                             </div>
                           </div>
                         )}
                       </>
                     )}
                   </div>

                    {/* Yêu cầu nạp của tôi - danh sách các khoản đang chờ xác minh */}
                    <div className="bg-white rounded-lg shadow p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">Yêu cầu nạp của tôi</h3>
                          <p className="text-sm text-gray-500">Các khoản ủng hộ đang chờ quản trị viên xác minh</p>
                        </div>
                        <button
                          type="button"
                          onClick={async () => {
                            const userIdForApi = gpMemberId || currentUserId || '';
                            if (!userIdForApi) return;
                            try {
                              setMyCampaignPendingLoading(true);
                              const items = await fundService.fetchMyPendingCampaignDonations(userIdForApi);
                              setMyCampaignPending(items.map(x => ({
                                id: x.id,
                                campaignId: x.campaignId,
                                campaignName: x.campaignName ?? null,
                                donorName: x.donorName ?? null,
                                amount: x.amount ?? 0,
                                message: x.message ?? null,
                                createdAt: x.createdAt ?? null,
                                proofImages: x.proofImages ?? [],
                              })));
                            } finally {
                              setMyCampaignPendingLoading(false);
                            }
                          }}
                          disabled={myCampaignPendingLoading}
                          className="inline-flex items-center gap-2 px-3 py-1 text-sm font-semibold rounded-lg border border-gray-300 bg-white hover:bg-gray-100 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          Làm mới
                        </button>
                      </div>
                      {myCampaignPendingLoading ? (
                        <div className="bg-white rounded-lg">
                          <LoadingState message="Đang tải yêu cầu nạp của bạn..." />
                        </div>
                      ) : myCampaignPending.length === 0 ? (
                        <EmptyState title="Không có yêu cầu nạp đang chờ" description="Bạn chưa có yêu cầu nạp nào cần xác minh." />
                      ) : (
                        <div className="space-y-4">
                          {(() => {
                            const sorted = myCampaignPending
                              .slice()
                              .sort((a, b) => {
                                const an = (a.campaignName || '').localeCompare(b.campaignName || '');
                                if (an !== 0) return an;
                                const ad = getDateValue(a.createdAt);
                                const bd = getDateValue(b.createdAt);
                                return bd - ad;
                              });
                            const groups = sorted.reduce<Record<string, typeof sorted>>((acc, item) => {
                              const key = item.campaignId || 'unknown';
                              if (!acc[key]) acc[key] = [];
                              acc[key].push(item);
                              return acc;
                            }, {});
                            return Object.values(groups).map(group => {
                              if (!group.length) return null;
                              const first = group[0];
                              const groupKey = first?.campaignId || 'unknown';
                              const collapsed = myPendingCollapsed[groupKey] ?? true; // default collapsed
                              return (
                                <div key={groupKey} className="rounded-lg border bg-white shadow-sm overflow-hidden">
                                  <button
                                    type="button"
                                    className="w-full px-4 py-3 border-b bg-gray-50 flex items-center justify-between hover:bg-gray-100"
                                    onClick={() => {
                                      setMyPendingCollapsed(prev => ({
                                        ...prev,
                                        [groupKey]: !(prev[groupKey] ?? true),
                                      }));
                                    }}
                                  >
                                    <p className="text-sm font-semibold text-gray-900 text-left">
                                      {first?.campaignName || '—'}
                                    </p>
                                    <div className="flex items-center gap-2">
                                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700">
                                        {group.length} yêu cầu
                                      </span>
                                      <span className="text-gray-500 text-base">
                                        {collapsed ? '▸' : '▾'}
                                      </span>
                                    </div>
                                  </button>
                                  {!collapsed && (
                                    <div className="divide-y">
                                      {group.map(item => (
                                        <div key={item.id} className="p-4 hover:bg-gray-50 cursor-pointer flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                                          <div>
                                            <p className="font-semibold text-gray-900">{item.donorName || 'Bạn'}</p>
                                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                              <span className="text-sm font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                                                {formatCurrency(item.amount)}
                                              </span>
                                              <span className="text-xs text-gray-500">{formatDate(item.createdAt)}</span>
                                            </div>
                                            {item.message && <p className="text-xs text-gray-600 mt-1">{item.message}</p>}
                                            {item.proofImages.length > 0 ? (
                                              <div className="flex gap-2 mt-2 flex-wrap">
                                                {item.proofImages.map((url, idx) => (
                                                  <a key={idx} href={url} target="_blank" rel="noreferrer" className="text-xs text-blue-600 underline">
                                                    Xác minh {idx + 1}
                                                  </a>
                                                ))}
                                              </div>
                                            ) : (
                                              <p className="text-xs text-gray-500 mt-2">Chưa có ảnh xác minh thanh toán</p>
                                            )}
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <label className="px-3 py-2 bg-blue-50 text-blue-700 text-sm font-semibold rounded-lg hover:bg-blue-100 transition-colors cursor-pointer">
                                              Tải ảnh xác minh
                                              <input
                                                type="file"
                                                multiple
                                                accept="image/*"
                                                className="hidden"
                                                onChange={async (e) => {
                                                  const files = e.target.files ? Array.from(e.target.files) : [];
                                                  e.currentTarget.value = '';
                                                  if (!files.length) return;
                                                  try {
                                                    await fundService.uploadCampaignDonationProof(item.id, files);
                                                    toast.success('Đã upload ảnh xác minh. Vui lòng chờ quản trị viên xác nhận.');
                                                    const userIdForApi = gpMemberId || currentUserId || '';
                                                    if (userIdForApi) {
                                                      const items = await fundService.fetchMyPendingCampaignDonations(userIdForApi);
                                                      setMyCampaignPending(items.map(x => ({
                                                        id: x.id,
                                                        campaignId: x.campaignId,
                                                        campaignName: x.campaignName ?? null,
                                                        donorName: x.donorName ?? null,
                                                        amount: x.amount ?? 0,
                                                        message: x.message ?? null,
                                                        createdAt: x.createdAt ?? null,
                                                        proofImages: x.proofImages ?? [],
                                                      })));
                                                    }
                                                  } catch (err: any) {
                                                    console.error('Upload campaign donation proof failed:', err);
                                                    toast.error(err?.response?.data?.message || err?.message || 'Không thể upload ảnh xác minh.');
                                                  }
                                                }}
                                              />
                                            </label>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            });
                          })()}
                        </div>
                      )}
                    </div>
                 </div>
               ) : campaignTab === 'history' ? (
                  <div className="space-y-4">
                    <div className="bg-white rounded-lg shadow p-4 flex flex-wrap items-center gap-3">
                      <label className="text-sm font-semibold text-gray-700">Chọn chiến dịch</label>
                      <select
                        value={historySelectedCampaignId ?? ''}
                        onChange={e => {
                          const id = e.target.value || null;
                          setHistorySelectedCampaignId(id);
                          setHistoryDonationPage(1);
                          setHistoryExpensePage(1);
                        }}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      >
                        <option value="">-- Chọn chiến dịch --</option>
                        {campaigns.map(c => (
                          <option key={c.id} value={c.id}>{c.campaignName}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        className="px-3 py-2 text-sm font-semibold rounded-lg border border-gray-300 hover:bg-gray-50"
                        disabled={!historySelectedCampaignId || historyLoading}
                        onClick={() => {
                          if (historySelectedCampaignId) {
                            void loadCampaignHistory(historySelectedCampaignId, 1, 1);
                            setHistoryDonationPage(1);
                            setHistoryExpensePage(1);
                          }
                        }}
                      >
                        Làm mới
                      </button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div className="bg-white rounded-lg shadow p-4">
                        <h4 className="text-sm font-bold text-gray-900 mb-3">Đóng góp</h4>
                        {historyLoading ? (
                          <LoadingState message="Đang tải đóng góp..." />
                        ) : historySelectedCampaignId ? (
                          historyDonations.length === 0 ? (
                            <EmptyState title="Chưa có đóng góp" description="Không có dữ liệu để hiển thị." />
                          ) : (
                            <div className="space-y-3">
                              {historyDonations.map(d => (
                                <div key={d.id} className="p-3 border rounded-lg">
                                  <div className="flex items-center justify-between">
                                    <p className="font-semibold text-gray-900">{d.donorName || 'Ẩn danh'}</p>
                                    <span className="text-sm font-semibold text-emerald-700">{formatCurrency(d.amount)}</span>
                                  </div>
                                  <div className="flex items-center justify-between mt-1 text-xs text-gray-500">
                                    <span>{d.status || '—'}</span>
                                    <span>{formatDate(d.createdAt)}</span>
                                  </div>
                                  {d.message && <p className="text-xs text-gray-600 mt-1 line-clamp-2">{d.message}</p>}
                                </div>
                              ))}
                              <div className="flex items-center justify-between pt-2">
                                <button
                                  type="button"
                                  className="px-3 py-1.5 text-sm rounded border border-gray-300 disabled:opacity-50"
                                  disabled={historyDonationPage <= 1 || historyLoading || !historySelectedCampaignId}
                                  onClick={() => {
                                    if (historySelectedCampaignId && historyDonationPage > 1) {
                                      setHistoryDonationPage(p => p - 1);
                                    }
                                  }}
                                >
                                  ← Trước
                                </button>
                                <span className="text-xs text-gray-500">Trang {historyDonationPage}/{historyDonationTotalPages}</span>
                                <button
                                  type="button"
                                  className="px-3 py-1.5 text-sm rounded border border-gray-300 disabled:opacity-50"
                                  disabled={historyDonationPage >= historyDonationTotalPages || historyLoading || !historySelectedCampaignId}
                                  onClick={() => {
                                    if (historySelectedCampaignId && historyDonationPage < historyDonationTotalPages) {
                                      setHistoryDonationPage(p => p + 1);
                                    }
                                  }}
                                >
                                  Sau →
                                </button>
                              </div>
                            </div>
                          )
                        ) : (
                          <EmptyState title="Chưa chọn chiến dịch" description="Vui lòng chọn chiến dịch để xem lịch sử." />
                        )}
                      </div>

                      <div className="bg-white rounded-lg shadow p-4">
                        <h4 className="text-sm font-bold text-gray-900 mb-3">Chi tiêu</h4>
                        {historyLoading ? (
                          <LoadingState message="Đang tải chi tiêu..." />
                        ) : historySelectedCampaignId ? (
                          historyExpenses.length === 0 ? (
                            <EmptyState title="Chưa có chi tiêu" description="Không có dữ liệu để hiển thị." />
                          ) : (
                            <div className="space-y-3">
                              {historyExpenses.map(e => (
                                <div key={e.id} className="p-3 border rounded-lg">
                                  <div className="flex items-center justify-between">
                                    <p className="font-semibold text-gray-900">{e.description || 'Chi tiêu'}</p>
                                    <span className="text-sm font-semibold text-red-700">-{formatCurrency(e.amount)}</span>
                                  </div>
                                  <div className="flex items-center justify-between mt-1 text-xs text-gray-500">
                                    <span>{e.status || '—'}</span>
                                    <span>{formatDate(e.createdAt)}</span>
                                  </div>
                                </div>
                              ))}
                              <div className="flex items-center justify-between pt-2">
                                <button
                                  type="button"
                                  className="px-3 py-1.5 text-sm rounded border border-gray-300 disabled:opacity-50"
                                  disabled={historyExpensePage <= 1 || historyLoading || !historySelectedCampaignId}
                                  onClick={() => {
                                    if (historySelectedCampaignId && historyExpensePage > 1) {
                                      setHistoryExpensePage(p => p - 1);
                                    }
                                  }}
                                >
                                  ← Trước
                                </button>
                                <span className="text-xs text-gray-500">Trang {historyExpensePage}/{historyExpenseTotalPages}</span>
                                <button
                                  type="button"
                                  className="px-3 py-1.5 text-sm rounded border border-gray-300 disabled:opacity-50"
                                  disabled={historyExpensePage >= historyExpenseTotalPages || historyLoading || !historySelectedCampaignId}
                                  onClick={() => {
                                    if (historySelectedCampaignId && historyExpensePage < historyExpenseTotalPages) {
                                      setHistoryExpensePage(p => p + 1);
                                    }
                                  }}
                                >
                                  Sau →
                                </button>
                              </div>
                            </div>
                          )
                        ) : (
                          <EmptyState title="Chưa chọn chiến dịch" description="Vui lòng chọn chiến dịch để xem lịch sử." />
                        )}
                      </div>
                    </div>

                    {/* Right column: Campaign expense approvals (manager) */}
                    <div className="bg-white rounded-lg shadow p-4 flex flex-col gap-3">
                      <div className="flex flex-wrap items-center gap-3">
                        <h4 className="text-sm font-bold text-gray-900 mr-auto">Yêu cầu chi tiêu</h4>
                        <button
                          type="button"
                          onClick={() => {
                            if (gpMemberId) {
                              void loadCampaignExpenseApprovals(gpMemberId);
                            }
                          }}
                          disabled={!gpMemberId || campaignExpenseApprovalsLoading}
                          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg border border-gray-300 bg-white hover:bg-gray-100 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          Làm mới
                        </button>
                      </div>

                      {campaignExpenseApprovalsLoading ? (
                        <div className="bg-white rounded-lg">
                          <LoadingState message="Đang tải danh sách chi tiêu cần duyệt..." />
                        </div>
                      ) : selectedPendingCampaignExpenseId ? (
                        (() => {
                          const item = campaignPendingExpenses.find(x => x.id === selectedPendingCampaignExpenseId);
                          if (!item) {
                            return <EmptyState title="Không tìm thấy yêu cầu" description="Vui lòng trở về danh sách." />;
                          }
                          return (
                            <div className="space-y-4">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedPendingCampaignExpenseId(null);
                                  setExpenseApprovalNotes('');
                                  setExpensePaymentProofImages([]);
                                }}
                                className="text-sm text-blue-600 hover:underline"
                              >
                                ← Trở về
                              </button>
                              <div className="border rounded-lg p-4 space-y-2">
                                <p className="text-xs text-gray-500">{item.campaignName || '—'}</p>
                                <h4 className="text-lg font-semibold text-gray-900">{item.description || 'Chi tiêu'}</h4>
                                <p className="text-gray-700">Số tiền: <span className="font-semibold">{formatCurrency(item.amount)}</span></p>
                                <p className="text-sm text-gray-500">Thời gian: {formatDate(item.createdAt)}</p>
                                {item.receiptUrls.length > 0 && (
                                  <div className="flex gap-2 mt-2 flex-wrap">
                                    {item.receiptUrls.map((url, idx) => (
                                      <a key={idx} href={url} target="_blank" rel="noreferrer" className="text-xs text-blue-600 underline">
                                        Hoá đơn {idx + 1}
                                      </a>
                                    ))}
                                  </div>
                                )}
                              </div>
                              <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700">Ghi chú</label>
                                <textarea
                                  value={expenseApprovalNotes}
                                  onChange={e => setExpenseApprovalNotes(e.target.value)}
                                  rows={3}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                  placeholder="Ghi chú phê duyệt / từ chối"
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700">Ảnh xác minh thanh toán</label>
                                <input
                                  type="file"
                                  accept="image/*"
                                  multiple
                                  onChange={e => {
                                    const files = e.target.files ? Array.from(e.target.files) : [];
                                    setExpensePaymentProofImages(files);
                                  }}
                                />
                                {expensePaymentProofImages.length > 0 && (
                                  <p className="text-xs text-gray-500">{expensePaymentProofImages.length} ảnh đã chọn</p>
                                )}
                              </div>
                              <div className="flex items-center gap-3">
                                <button
                                  type="button"
                                  onClick={async () => {
                                    if (!gpMemberId) {
                                      toast.error('Không xác định được người phê duyệt.');
                                      return;
                                    }
                                    if (expensePaymentProofImages.length === 0) {
                                      toast.error('Vui lòng chọn ít nhất một ảnh xác minh thanh toán.');
                                      return;
                                    }
                                    try {
                                      await fundService.approveCampaignExpenseWithProof(item.id, {
                                        approverId: gpMemberId,
                                        notes: expenseApprovalNotes.trim() || undefined,
                                        paymentProofImages: expensePaymentProofImages,
                                      });
                                      toast.success('Đã phê duyệt chi tiêu chiến dịch.');
                                      setSelectedPendingCampaignExpenseId(null);
                                      setExpenseApprovalNotes('');
                                      setExpensePaymentProofImages([]);
                                      if (gpMemberId) await loadCampaignExpenseApprovals(gpMemberId);
                                    } catch (err: any) {
                                      console.error('Approve campaign expense failed:', err);
                                      toast.error(err?.response?.data?.message || err?.message || 'Không thể phê duyệt chi tiêu.');
                                    }
                                  }}
                                  className="px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700 transition-colors"
                                >
                                  Phê duyệt
                                </button>
                                <button
                                  type="button"
                                  onClick={async () => {
                                    if (!gpMemberId) {
                                      toast.error('Không xác định được người từ chối.');
                                      return;
                                    }
                                    try {
                                      await fundService.rejectCampaignExpenseManager(item.id, {
                                        approverId: gpMemberId,
                                        notes: expenseApprovalNotes.trim() || undefined,
                                      });
                                      toast.success('Đã từ chối chi tiêu chiến dịch.');
                                      setSelectedPendingCampaignExpenseId(null);
                                      setExpenseApprovalNotes('');
                                      setExpensePaymentProofImages([]);
                                      if (gpMemberId) await loadCampaignExpenseApprovals(gpMemberId);
                                    } catch (err: any) {
                                      console.error('Reject campaign expense failed:', err);
                                      toast.error(err?.response?.data?.message || err?.message || 'Không thể từ chối chi tiêu.');
                                    }
                                  }}
                                  className="px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 transition-colors"
                                >
                                  Từ chối
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedPendingCampaignExpenseId(null);
                                    setExpenseApprovalNotes('');
                                    setExpensePaymentProofImages([]);
                                  }}
                                  className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                  Hủy
                                </button>
                              </div>
                            </div>
                          );
                        })()
                      ) : campaignPendingExpenses.length === 0 ? (
                        <EmptyState
                          title="Không có yêu cầu chi tiêu cần duyệt"
                          description="Thử làm mới để cập nhật danh sách."
                        />
                      ) : (
                        <div className="space-y-3">
                          {campaignPendingExpenses.map(exp => (
                            <div key={exp.id} className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                              onClick={() => setSelectedPendingCampaignExpenseId(exp.id)}>
                              <p className="text-xs text-gray-500">{exp.campaignName || '—'}</p>
                              <p className="font-semibold text-gray-900">{exp.description || 'Chi tiêu'}</p>
                              <p className="text-sm text-gray-600">{formatCurrency(exp.amount)}</p>
                              <p className="text-xs text-gray-500">{formatDate(exp.createdAt)}</p>
                              {exp.receiptUrls.length > 0 ? (
                                <div className="flex gap-2 mt-2 flex-wrap">
                                  {exp.receiptUrls.map((url, idx) => (
                                    <a key={idx} href={url} target="_blank" rel="noreferrer" className="text-xs text-blue-600 underline" onClick={e => e.stopPropagation()}>
                                      Hoá đơn {idx + 1}
                                    </a>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-xs text-gray-500 mt-2">Chưa có hoá đơn đính kèm</p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  // Approvals tab
                  <div className="space-y-4">
                    <div className="bg-white rounded-lg shadow p-4 flex flex-col gap-3">
                      <div className="flex flex-wrap items-center gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            if (selectedTree?.id) {
                              void loadCampaignApprovals(selectedTree.id);
                            }
                          }}
                          disabled={!selectedTree?.id || campaignApprovalsLoading}
                          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg border border-gray-300 bg-white hover:bg-gray-100 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          Làm mới
                        </button>
                      </div>

                      {campaignApprovalsLoading ? (
                        <div className="bg-white rounded-lg">
                          <LoadingState message="Đang tải danh sách ủng hộ cần duyệt..." />
                        </div>
                      ) : selectedPendingCampaignDonationId ? (
                        (() => {
                          const sorted = campaignPendingDonations
                            .slice()
                            .sort((a, b) => {
                              const an = (a.campaignName || '').localeCompare(b.campaignName || '');
                              if (an !== 0) return an;
                              const ad = getDateValue(a.createdAt);
                              const bd = getDateValue(b.createdAt);
                              return bd - ad;
                            });
                          const item = sorted.find(x => x.id === selectedPendingCampaignDonationId);
                          if (!item) {
                            return (
                              <EmptyState title="Không tìm thấy yêu cầu" description="Vui lòng trở về danh sách." />
                            );
                          }
                          return (
                            <div className="space-y-4">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedPendingCampaignDonationId(null);
                                  setApprovalNotes('');
                                }}
                                className="text-sm text-blue-600 hover:underline"
                              >
                                ← Trở về
                              </button>
                              <div className="border rounded-lg p-4 space-y-2">
                                <p className="text-xs text-gray-500">{item.campaignName || '—'}</p>
                                <h4 className="text-lg font-semibold text-gray-900">{item.donorName || 'Ẩn danh'}</h4>
                                <p className="text-gray-700">Số tiền: <span className="font-semibold">{formatCurrency(item.amount)}</span></p>
                                <p className="text-sm text-gray-500">Thời gian: {formatDate(item.createdAt)}</p>
                                {item.message && <p className="text-sm text-gray-600">Ghi chú: {item.message}</p>}
                                {item.proofImages.length > 0 && (
                                  <div className="flex gap-2 mt-2 flex-wrap">
                                    {item.proofImages.map((url, idx) => (
                                      <a key={idx} href={url} target="_blank" rel="noreferrer" className="text-xs text-blue-600 underline">
                                        Xác minh {idx + 1}
                                      </a>
                                    ))}
                                  </div>
                                )}
                              </div>
                              <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700">Ghi chú</label>
                                <textarea
                                  value={approvalNotes}
                                  onChange={e => setApprovalNotes(e.target.value)}
                                  rows={3}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                  placeholder="Ghi chú phê duyệt / từ chối (không bắt buộc)"
                                />
                              </div>
                              <div className="flex items-center gap-3">
                                <button
                                  type="button"
                                  onClick={async () => {
                                    if (!gpMemberId) {
                                      toast.error('Không xác định được người xác nhận.');
                                      return;
                                    }
                                    try {
                                      const payload: { donationId: string; confirmedBy: string; notes?: string } = { donationId: item.id, confirmedBy: gpMemberId };
                                      const n = approvalNotes.trim();
                                      if (n) payload.notes = n;
                                      await fundService.confirmCampaignDonation(item.id, payload);
                                      toast.success('Đã xác nhận ủng hộ chiến dịch.');
                                      setSelectedPendingCampaignDonationId(null);
                                      setApprovalNotes('');
                                      if (selectedTree?.id) {
                                        await loadCampaignApprovals(selectedTree.id);
                                      }
                                      // Refresh campaigns to update progress/raised amounts in the list
                                      await refreshCampaigns(1);
                                    } catch (err: any) {
                                      console.error('Confirm campaign donation failed:', err);
                                      toast.error(err?.response?.data?.message || err?.message || 'Không thể xác nhận ủng hộ.');
                                    }
                                  }}
                                  className="px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700 transition-colors"
                                >
                                  Phê duyệt
                                </button>
                                <button
                                  type="button"
                                  onClick={async () => {
                                    if (!gpMemberId) {
                                      toast.error('Không xác định được người từ chối.');
                                      return;
                                    }
                                    try {
                                      const payload: { donationId: string; rejectedBy: string; reason?: string } = { donationId: item.id, rejectedBy: gpMemberId };
                                      const r = approvalNotes.trim();
                                      if (r) payload.reason = r;
                                      await fundService.rejectCampaignDonation(item.id, payload);
                                      toast.success('Đã từ chối ủng hộ chiến dịch.');
                                      setSelectedPendingCampaignDonationId(null);
                                      setApprovalNotes('');
                                      if (selectedTree?.id) {
                                        await loadCampaignApprovals(selectedTree.id);
                                      }
                                    } catch (err: any) {
                                      console.error('Reject campaign donation failed:', err);
                                      toast.error(err?.response?.data?.message || err?.message || 'Không thể từ chối ủng hộ.');
                                    }
                                  }}
                                  className="px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 transition-colors"
                                >
                                  Từ chối
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedPendingCampaignDonationId(null);
                                    setApprovalNotes('');
                                  }}
                                  className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                  Hủy
                                </button>
                              </div>
                            </div>
                          );
                        })()
                      ) : campaignPendingDonations.length === 0 ? (
                        <EmptyState
                          title="Không có yêu cầu cần phê duyệt"
                          description="Chọn chiến dịch khác hoặc thử làm mới."
                        />
                      ) : (
                        <div className="space-y-4">
                          {(() => {
                            const sorted = campaignPendingDonations
                              .slice()
                              .sort((a, b) => {
                                const an = (a.campaignName || '').localeCompare(b.campaignName || '');
                                if (an !== 0) return an;
                                const ad = getDateValue(a.createdAt);
                                const bd = getDateValue(b.createdAt);
                                return bd - ad;
                              });
                            const groups = sorted.reduce<Record<string, typeof sorted>>((acc, item) => {
                              const key = item.campaignId || 'unknown';
                              if (!acc[key]) acc[key] = [];
                              acc[key].push(item);
                              return acc;
                            }, {});
                            return Object.values(groups).map(group => {
                              if (!group.length) return null;
                              const first = group[0];
                              const showHeaderOnce = group.length >= 1;
                              return (
                                <div key={`${first?.campaignId || 'unknown'}`} className="rounded-lg border bg-white shadow-sm overflow-hidden">
                                  {showHeaderOnce && (
                                    <button
                                      type="button"
                                      className="w-full px-4 py-3 border-b bg-gray-50 flex items-center justify-between hover:bg-gray-100"
                                      onClick={() => {
                                        const key = first?.campaignId || 'unknown';
                                        setCollapsedCampaigns(prev => ({
                                          ...prev,
                                          [key]: !((prev[key] ?? true)),
                                        }));
                                      }}
                                    >
                                      <p className="text-sm font-semibold text-gray-900 text-left">
                                        {first?.campaignName || '—'}
                                      </p>
                                      <div className="flex items-center gap-2">
                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700">
                                          {group.length} yêu cầu
                                        </span>
                                        <span className="text-gray-500 text-base">
                                          {(collapsedCampaigns[first?.campaignId || 'unknown'] ?? true) ? '▸' : '▾'}
                                        </span>
                                      </div>
                                    </button>
                                  )}
                                  {!((collapsedCampaigns[first?.campaignId || 'unknown'] ?? true)) && (
                                  <div className="divide-y">
                                    {group.map(item => (
                                      <div
                                        key={item.id}
                                        className="p-4 hover:bg-gray-50 cursor-pointer"
                                        onClick={() => setSelectedPendingCampaignDonationId(item.id)}
                                      >
                                        <div className="flex items-start gap-4">
                                          <div className="flex-1 min-w-0">
                                            {!showHeaderOnce && (
                                              <p className="text-xs text-gray-500 mb-1">{item.campaignName || '—'}</p>
                                            )}
                                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                              <p className="font-semibold text-gray-900 truncate max-w-[280px]">
                                                {item.donorName || 'Ẩn danh'}
                                              </p>
                                              <span className="text-sm font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                                                {formatCurrency(item.amount)}
                                              </span>
                                              <span className="text-xs text-gray-500">{formatDate(item.createdAt)}</span>
                                            </div>
                                            {item.message && (
                                              <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                                                {item.message}
                                              </p>
                                            )}
                                            {item.proofImages.length > 0 ? (
                                              <div className="flex gap-2 mt-2">
                                                {item.proofImages.slice(0, 3).map((url, idx) => (
                                                  <a
                                                    key={idx}
                                                    href={url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    onClick={e => e.stopPropagation()}
                                                    className="block w-12 h-12 rounded border overflow-hidden bg-gray-100"
                                                    aria-label={`Xem xác minh ${idx + 1}`}
                                                  >
                                                    <img src={url} alt="" className="w-full h-full object-cover" />
                                                  </a>
                                                ))}
                                                {item.proofImages.length > 3 && (
                                                  <span className="text-xs text-gray-500 self-center">+{item.proofImages.length - 3}</span>
                                                )}
                                              </div>
                                            ) : (
                                              <p className="text-xs text-gray-500 mt-2">
                                                Chưa có ảnh xác minh thanh toán
                                              </p>
                                            )}
                                          </div>
                                          <div className="self-center text-gray-400 text-base">›</div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                  )}
                                </div>
                              );
                            });
                          })()}
                        </div>
                      )}
                    </div>
                  </div>
                 )}
               </>
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

      <FundWithdrawalModal
        isOpen={isWithdrawalModalOpen}
        onClose={handleCloseWithdraw}
        hasFund={hasAnyFund}
        computedBalance={computedBalance}
        campaigns={campaigns}
        formState={withdrawalForm}
        onFormChange={handleWithdrawalChange}
        onSubmit={handleSubmitWithdrawal}
        actionLoading={actionLoading}
        formatCurrency={formatCurrency}
      />

      <FundEditModal
        isOpen={isEditFundModalOpen}
        fund={activeFund}
        ftId={selectedTree?.id ?? null}
        bankLogos={bankLogos}
        onClose={handleCloseEditFund}
        onSubmit={handleSubmitEditFund}
        submitting={editFundSubmitting}
      />

      <FundDepositQRModal
        isOpen={isDepositQRModalOpen}
        onClose={handleCloseDepositQR}
        donationResponse={depositResponse}
        onCheckStatus={async () => {
          await refreshFundDetails();
          await refreshMyPendingDonations();
          // If donation requires manual confirmation, switch to donations tab
          if (depositResponse?.requiresManualConfirmation) {
            setFundTab('donations');
            setManagementScope('fund');
            setIsDepositQRModalOpen(false);
            setTimeout(() => {
              const pendingSection = document.getElementById('my-pending-donations-section');
              if (pendingSection) {
                pendingSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }
            }, 300);
          }
        }}
      />

      <FundProofModal
        isOpen={isProofModalOpen}
        onClose={handleCloseProof}
        onSubmit={handleSubmitProof}
        submitting={proofSubmitting}
        donation={recentDonation}
      />

      <FundApprovalModal
        isOpen={isApprovalModalOpen}
        action={approvalAction}
        expense={selectedExpense}
        note={approvalNote}
        onNoteChange={setApprovalNote}
        paymentProofImages={approvalPaymentProofImages}
        onPaymentProofImagesChange={setApprovalPaymentProofImages}
        onCancel={handleApprovalCancel}
        onConfirm={handleApprovalConfirm}
        submitting={actionLoading}
        formatCurrency={formatCurrency}
      />

      <FundCampaignDetailModal
        isOpen={isCampaignDetailOpen}
        detail={campaignDetail}
        onClose={handleCloseCampaignDetail}
        onDonate={(id) => {
          setSelectedCampaignId(id);
          setIsCampaignDonateOpen(true);
        }}
        onCreateExpense={(id) => {
          setCreateExpenseForm(prev => ({
            ...prev,
            campaignId: id,
          }));
          setIsCreateExpenseOpen(true);
          setIsCampaignDetailOpen(false);
        }}
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
        organizerName={getDisplayNameFromGPMember(gpMember) || gpMember?.fullname || authUser?.name || ''}
        onClose={handleCloseCampaignModal}
        onFormChange={handleCampaignFormChange}
        onSubmit={handleSubmitCampaign}
        submitting={campaignSubmitting}
      />

      <CampaignDonateModal
        isOpen={isCampaignDonateOpen}
        campaignId={selectedCampaignId}
        memberId={gpMemberId ?? null}
        donorName={donorName}
        onClose={() => {
          setIsCampaignDonateOpen(false);
          setSelectedCampaignId(null);
        }}
      />
    </div>
  );
};

export default FundManagement;
