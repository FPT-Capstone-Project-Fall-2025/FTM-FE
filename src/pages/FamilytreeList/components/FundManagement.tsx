import React, { useEffect, useMemo, useState } from 'react';
import { useAppSelector } from '@/hooks/redux';
import { Wallet, TrendingDown, CheckCircle, Calendar, Megaphone } from 'lucide-react';
import { toast } from 'react-toastify';
import type { Fund, FundExpense } from '@/types/fund';
import type { CreateFundPayload, CreateFundDonationPayload } from '@/types/fund';
import { useGPMember } from '@/hooks/useGPMember';
import { getDisplayNameFromGPMember } from '@/services/familyTreeMemberService';
import { getUserIdFromToken } from '@/utils/jwtUtils';
import {
  useFundManagementData,
  type CampaignCreationInput,
  type FundWithdrawalInput,
  type CampaignDetail,
} from './Fund/useFundManagementData';
import FundOverviewSection, {
  type OverviewContributor,
  type OverviewTransaction,
} from './Fund/FundOverviewSection';
import FundWithdrawalSection, { type WithdrawalFormState } from './Fund/FundWithdrawalSection';
import FundApprovalsSection from './Fund/FundApprovalsSection';
import FundHistorySection from './Fund/FundHistorySection';
import FundCampaignsSection, {
  type CampaignFilter,
  type CampaignMetricSummary,
} from './Fund/FundCampaignsSection';
import FundCampaignModal, { type CampaignFormState } from './Fund/FundCampaignModal';
import FundCampaignDetailModal from './Fund/FundCampaignDetailModal';
import FundApprovalModal from './Fund/FundApprovalModal';
import FundCreateModal, { type FundCreateForm, type BankInfo } from './Fund/FundCreateModal';
import FundDepositModal, { type FundDepositForm } from './Fund/FundDepositModal';
import { LoadingState, EmptyState } from './Fund/FundLoadingEmpty';
import bankList from '@/assets/fund/bank/json/bank.json';

type SectionKey = 'overview' | 'withdrawal' | 'approvals' | 'history' | 'campaigns';
type ExpenseStatusKey = 'pending' | 'approved' | 'rejected';
type DonationStatusKey = 'pending' | 'confirmed' | 'rejected';
type CampaignStatusKey = 'active' | 'upcoming' | 'completed' | 'cancelled';

type BankJsonEntry = {
  bankCode: string;
  bankName: string;
  fullName?: string;
  bin?: string;
};

const bankLogoModules = import.meta.glob<{ default: string }>(
  '@/assets/fund/bank/images/*.png',
  { eager: true }
);

const bankLogoMap: Record<string, string> = Object.entries(bankLogoModules).reduce(
  (acc, [path, mod]) => {
    const filename = path.split('/').pop()?.replace('.png', '');
    if (filename && mod.default) {
      acc[filename.toUpperCase()] = mod.default;
    }
    return acc;
  },
  {} as Record<string, string>
);

const currencyFormatter = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
});

const formatCurrency = (amount?: number | null) => {
  if (amount === undefined || amount === null || Number.isNaN(amount)) {
    return currencyFormatter.format(0);
  }
  return currencyFormatter.format(amount);
};

const parseDate = (value?: string | null): Date | null => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatDate = (value?: string | null) => {
  const date = parseDate(value);
  if (!date) return '—';

  return date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

const getExpenseStatusKey = (status: unknown): ExpenseStatusKey => {
  if (typeof status === 'string') {
    const normalized = status.toLowerCase();
    if (normalized.includes('reject')) return 'rejected';
    if (normalized.includes('approve')) return 'approved';
    return 'pending';
  }

  const numeric = Number(status);
  switch (numeric) {
    case 2:
    case 10:
      return 'approved';
    case 3:
    case 20:
      return 'rejected';
    default:
      return 'pending';
  }
};

const getExpenseStatusBadge = (expense: FundExpense) => {
  const status = getExpenseStatusKey(expense.status);
  switch (status) {
    case 'approved':
      return {
        label: 'Đã phê duyệt',
        className: 'bg-emerald-100 text-emerald-700',
      };
    case 'rejected':
      return {
        label: 'Đã từ chối',
        className: 'bg-red-100 text-red-700',
      };
    default:
      return {
        label: 'Đang chờ',
        className: 'bg-yellow-100 text-yellow-700',
      };
  }
};

const getDonationStatusKey = (status: unknown): DonationStatusKey => {
  if (typeof status === 'string') {
    const normalized = status.toLowerCase();
    if (normalized.includes('reject')) return 'rejected';
    if (normalized.includes('confirm') || normalized.includes('approve')) return 'confirmed';
    return 'pending';
  }

  const numeric = Number(status);
  switch (numeric) {
    case 2:
    case 10:
      return 'confirmed';
    case 3:
    case 20:
      return 'rejected';
    default:
      return 'pending';
  }
};

const getCampaignStatusKey = (status: unknown): CampaignStatusKey => {
  if (typeof status === 'string') {
    const normalized = status.toLowerCase();
    if (normalized.includes('cancel')) return 'cancelled';
    if (normalized.includes('complete') || normalized.includes('finish')) return 'completed';
    if (normalized.includes('upcoming') || normalized.includes('pending')) return 'upcoming';
    return 'active';
  }

  const numeric = Number(status);
  switch (numeric) {
    case 0:
    case 1:
      return 'upcoming';
    case 2:
      return 'active';
    case 3:
      return 'completed';
    case 4:
    case 5:
      return 'cancelled';
    default:
      return 'active';
  }
};

const getCampaignStatusLabel = (status: CampaignStatusKey) => {
  switch (status) {
    case 'upcoming':
      return 'Sắp diễn ra';
    case 'completed':
      return 'Hoàn thành';
    case 'cancelled':
      return 'Đã hủy';
    default:
      return 'Đang diễn ra';
  }
};

const getCampaignStatusBadgeClasses = (status: CampaignStatusKey) => {
  switch (status) {
    case 'completed':
      return 'bg-blue-100 text-blue-700';
    case 'cancelled':
      return 'bg-red-100 text-red-700';
    case 'upcoming':
      return 'bg-amber-100 text-amber-700';
    default:
      return 'bg-emerald-100 text-emerald-700';
  }
};

const getPaymentMethodLabel = (method: unknown) => {
  if (typeof method === 'string') {
    const normalized = method.toLowerCase();
    if (normalized.includes('cash') || normalized.includes('tiền mặt')) return 'Tiền mặt';
    if (normalized.includes('bank') || normalized.includes('transfer') || normalized.includes('qr')) {
      return 'Chuyển khoản';
    }
    return method;
  }

  const numeric = Number(method);
  switch (numeric) {
    case 1:
      return 'Tiền mặt';
    case 2:
      return 'Chuyển khoản';
    default:
      return 'Khác';
  }
};

const FundManagement: React.FC = () => {
  const selectedTree = useAppSelector(state => state.familyTreeMetaData.selectedFamilyTree);
  const auth = useAppSelector(state => state.auth);

  const {
    loading,
    fundDataLoading,
    actionLoading,
    campaignDetailLoading,
    campaignsLoading,
    creatingFund,
    donating,
    error,
    activeFund,
    donations,
    expenses,
    campaigns,
    createWithdrawal,
    approveExpense,
    rejectExpense,
    createCampaign,
    loadCampaignDetail,
    refreshCampaigns,
    createFund,
    donateToFund,
  } = useFundManagementData({
    familyTreeId: selectedTree?.id ?? null,
    currentUserId: auth.user?.userId ?? null,
  });

  const [activeSection, setActiveSection] = useState<SectionKey>('overview');
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [showCampaignDetailModal, setShowCampaignDetailModal] = useState(false);
  const [showCreateFundModal, setShowCreateFundModal] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [campaignDetail, setCampaignDetail] = useState<CampaignDetail | null>(null);
  const [pendingExpense, setPendingExpense] = useState<FundExpense | null>(null);
  const [approvalAction, setApprovalAction] = useState<'approve' | 'reject' | null>(null);
  const [approvalNote, setApprovalNote] = useState('');
  const [approvalSubmitting, setApprovalSubmitting] = useState(false);
  const [campaignSearch, setCampaignSearch] = useState('');
  const [campaignFilter, setCampaignFilter] = useState<CampaignFilter>('all');

  const [withdrawalForm, setWithdrawalForm] = useState<WithdrawalFormState>({
    amount: '',
    reason: '',
    recipient: '',
    relatedEvent: '',
    date: new Date().toISOString().slice(0, 10),
    campaignId: '',
  });

  const [campaignForm, setCampaignForm] = useState<CampaignFormState>({
    name: '',
    purpose: '',
    organizer: selectedTree?.owner ?? '',
    organizerContact: '',
    startDate: new Date().toISOString().slice(0, 10),
    endDate: '',
    targetAmount: '',
    bankAccountNumber: '',
    bankName: '',
    bankCode: '',
    accountHolderName: '',
    notes: '',
    isPublic: true,
  });

  useEffect(() => {
    setCampaignForm(prev => ({ ...prev, organizer: selectedTree?.owner ?? '' }));
  }, [selectedTree?.owner]);

  useEffect(() => {
    if (activeSection === 'campaigns') {
      void refreshCampaigns();
    }
  }, [activeSection, refreshCampaigns]);

  const normalizedDonations = useMemo(() => donations ?? [], [donations]);

  const confirmedDonations = useMemo(
    () => normalizedDonations.filter(donation => getDonationStatusKey(donation.status) === 'confirmed'),
    [normalizedDonations]
  );

  const totalIncome = useMemo(
    () =>
      confirmedDonations.reduce((sum, donation) => {
        const value = Number(donation.donationMoney ?? 0);
        return Number.isFinite(value) ? sum + value : sum;
      }, 0),
    [confirmedDonations]
  );

  const approvedExpenses = useMemo(
    () => expenses.filter(expense => getExpenseStatusKey(expense.status) === 'approved'),
    [expenses]
  );

  const pendingExpenses = useMemo(
    () => expenses.filter(expense => getExpenseStatusKey(expense.status) === 'pending'),
    [expenses]
  );

  const totalExpense = useMemo(
    () =>
      approvedExpenses.reduce((sum, expense) => {
        const value = expense.expenseAmount ?? 0;
        return sum + (Number.isFinite(value) ? Number(value) : 0);
      }, 0),
    [approvedExpenses]
  );

  const computedBalance = useMemo(() => {
    const apiBalance = activeFund?.currentMoney;
    if (apiBalance !== undefined && apiBalance !== null) {
      return Number(apiBalance);
    }
    return totalIncome - totalExpense;
  }, [activeFund?.currentMoney, totalIncome, totalExpense]);

  const uniqueContributorCount = useMemo(() => {
    const unique = new Set<string>();
    confirmedDonations.forEach(donation => {
      const key = donation.ftMemberId || donation.donorName || donation.id;
      if (key) unique.add(key);
    });
    return unique.size;
  }, [confirmedDonations]);

  const recentContributors = useMemo<OverviewContributor[]>(() => {
    return [...confirmedDonations]
      .sort((a, b) => {
        const aTime = parseDate(a.confirmedOn || a.createdOn)?.getTime() ?? 0;
        const bTime = parseDate(b.confirmedOn || b.createdOn)?.getTime() ?? 0;
        return bTime - aTime;
      })
      .slice(0, 6)
      .map(donation => ({
        id: donation.id,
        name: donation.donorName || 'Nhà hảo tâm ẩn danh',
        amount: Number(donation.donationMoney ?? 0),
        date: donation.confirmedOn || donation.createdOn || '',
      }));
  }, [confirmedDonations]);

  const transactions = useMemo<OverviewTransaction[]>(() => {
    const combined = [
      ...normalizedDonations.map(donation => ({
        id: `donation-${donation.id}`,
        type: 'income' as const,
        amount: Number(donation.donationMoney ?? 0),
        date: donation.confirmedOn || donation.createdOn || '',
        description: donation.paymentNotes || `Đóng góp từ ${donation.donorName || 'ẩn danh'}`,
        status: getDonationStatusKey(donation.status),
      })),
      ...expenses.map(expense => ({
        id: `expense-${expense.id}`,
        type: 'expense' as const,
        amount: expense.expenseAmount ?? 0,
        date: expense.approvedOn || expense.createdOn || expense.plannedDate || '',
        description: expense.expenseDescription || 'Chi tiêu quỹ',
        status: getExpenseStatusKey(expense.status),
      })),
    ];

    return combined
      .filter(entry => Number.isFinite(entry.amount))
      .sort((a, b) => {
        const aTime = parseDate(a.date)?.getTime() ?? 0;
        const bTime = parseDate(b.date)?.getTime() ?? 0;
        return bTime - aTime;
      })
      .slice(0, 12);
  }, [normalizedDonations, expenses]);

  const campaignMetrics = useMemo<Record<string, CampaignMetricSummary>>(() => {
    const metrics = new Map<string, { raisedAmount: number; contributors: Set<string> }>();

    campaigns.forEach(campaign => {
      metrics.set(campaign.id, {
        raisedAmount: Number(campaign.currentBalance ?? 0),
        contributors: new Set<string>(),
      });
    });

    confirmedDonations.forEach(donation => {
      if (!donation.campaignId) return;
      if (!metrics.has(donation.campaignId)) {
        metrics.set(donation.campaignId, {
          raisedAmount: 0,
          contributors: new Set<string>(),
        });
      }

      const entry = metrics.get(donation.campaignId)!;
      const value = Number(donation.donationMoney ?? 0);
      if (Number.isFinite(value)) {
        entry.raisedAmount += value;
      }
      const key = donation.ftMemberId || donation.donorName || donation.id;
      if (key) {
        entry.contributors.add(key);
      }
    });

    const record: Record<string, CampaignMetricSummary> = {};
    metrics.forEach((value, key) => {
      record[key] = {
        raisedAmount: value.raisedAmount,
        contributorCount: value.contributors.size,
      };
    });

    return record;
  }, [campaigns, confirmedDonations]);

  const currentFundPurpose =
    activeFund?.fundNote ||
    activeFund?.description ||
    'Quỹ chưa có mô tả. Hãy cập nhật thông tin để các thành viên dễ dàng hiểu mục đích sử dụng.';
  const lastUpdated = formatDate(activeFund?.lastModifiedOn || activeFund?.createdOn || null);

  const banks = useMemo<BankInfo[]>(() => {
    const map = new Map<string, BankInfo>();
    (bankList as unknown as BankJsonEntry[]).forEach(bank => {
      if (!bank.bankCode || !bank.bankName) return;
      const code = bank.bankCode.toUpperCase();
      if (!map.has(code)) {
        map.set(code, {
          bankCode: code,
          bankName: bank.bankName,
          fullName: bank.fullName,
          bin: bank.bin,
        });
      }
    });
    return Array.from(map.values()).sort((a, b) => a.bankName.localeCompare(b.bankName));
  }, []);

  const currentFamilyTreeId = selectedTree?.id ?? null;
  const tokenUserId = getUserIdFromToken(auth.token || '') || null;
  const derivedUserId = tokenUserId || auth.user?.userId || null;
  const {
    gpMemberId,
    gpMember,
    loading: gpMemberLoading,
  } = useGPMember(currentFamilyTreeId, derivedUserId);

  const donorName = useMemo(() => {
    if (gpMember) {
      const display = getDisplayNameFromGPMember(gpMember);
      if (display) return display;
    }
    return auth.user?.name || 'Thành viên';
  }, [gpMember, auth.user?.name]);

  const handleSectionChange = (section: SectionKey) => {
    setActiveSection(section);
  };

  const handleWithdrawalFormChange = (field: keyof WithdrawalFormState, value: string) => {
    setWithdrawalForm(prev => ({ ...prev, [field]: value }));
  };

  const handleCampaignFormChange = (field: keyof CampaignFormState, value: string | boolean) => {
    setCampaignForm(prev => ({ ...prev, [field]: value }));
  };

  const handleWithdrawalSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!activeFund?.id) {
      toast.error('Chưa xác định được quỹ hiện tại.');
      return;
    }

    const amount = Number(withdrawalForm.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error('Số tiền phải lớn hơn 0.');
      return;
    }

    if (amount > computedBalance) {
      toast.error('Số tiền vượt quá số dư hiện tại của quỹ.');
      return;
    }

    if (!withdrawalForm.reason.trim() || !withdrawalForm.recipient.trim()) {
      toast.error('Vui lòng điền đầy đủ lý do và người nhận.');
      return;
    }

    const payload: FundWithdrawalInput = {
      amount,
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

    try {
      await createWithdrawal(payload);
      toast.success('Yêu cầu rút tiền đã được gửi.');
      setWithdrawalForm({
        amount: '',
        reason: '',
        recipient: '',
        relatedEvent: '',
        date: new Date().toISOString().slice(0, 10),
        campaignId: '',
      });
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || 'Không thể tạo yêu cầu rút tiền.';
      toast.error(message);
    }
  };

  const handleCampaignSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedTree?.id) {
      toast.error('Chưa xác định được gia phả.');
      return;
    }

    const targetAmount = Number(campaignForm.targetAmount);

    if (!Number.isFinite(targetAmount) || targetAmount <= 0) {
      toast.error('Số tiền mục tiêu phải lớn hơn 0.');
      return;
    }

    if (!campaignForm.name.trim() || !campaignForm.purpose.trim() || !campaignForm.organizer.trim()) {
      toast.error('Vui lòng điền đầy đủ thông tin chiến dịch.');
      return;
    }

    if (!campaignForm.startDate || !campaignForm.endDate) {
      toast.error('Vui lòng chọn ngày bắt đầu và kết thúc.');
      return;
    }

    const startDateObj = parseDate(campaignForm.startDate);
    const endDateObj = parseDate(campaignForm.endDate);

    if (!startDateObj || !endDateObj) {
      toast.error('Ngày bắt đầu hoặc kết thúc không hợp lệ.');
      return;
    }

    if (endDateObj <= startDateObj) {
      toast.error('Ngày kết thúc phải sau ngày bắt đầu.');
      return;
    }

    const payload: CampaignCreationInput = {
      campaignName: campaignForm.name.trim(),
      campaignDescription: campaignForm.purpose.trim(),
      organizerName: campaignForm.organizer.trim(),
      startDate: campaignForm.startDate,
      endDate: campaignForm.endDate,
      fundGoal: targetAmount,
      isPublic: campaignForm.isPublic,
    };

    const organizerContact = campaignForm.organizerContact.trim();
    if (organizerContact) {
      payload.organizerContact = organizerContact;
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

    try {
      await createCampaign(payload);
      toast.success('Chiến dịch gây quỹ đã được tạo.');
      setShowCampaignModal(false);
      setCampaignForm({
        name: '',
        purpose: '',
        organizer: selectedTree?.owner ?? '',
        organizerContact: '',
        startDate: new Date().toISOString().slice(0, 10),
        endDate: '',
        targetAmount: '',
        bankAccountNumber: '',
        bankName: '',
        bankCode: '',
        accountHolderName: '',
        notes: '',
        isPublic: true,
      });
      await refreshCampaigns();
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || 'Không thể tạo chiến dịch mới.';
      toast.error(message);
    }
  };

  const handleApprovalRequest = (expense: FundExpense, action: 'approve' | 'reject') => {
    setPendingExpense(expense);
    setApprovalAction(action);
    setApprovalNote('');
  };

  const confirmApproval = async () => {
    if (!pendingExpense || !approvalAction) return;

    try {
      setApprovalSubmitting(true);
      if (approvalAction === 'approve') {
        await approveExpense(pendingExpense.id, approvalNote.trim() || undefined);
        toast.success('Đã phê duyệt yêu cầu rút tiền.');
      } else {
        await rejectExpense(pendingExpense.id, approvalNote.trim() || undefined);
        toast.success('Đã từ chối yêu cầu rút tiền.');
      }
      setPendingExpense(null);
      setApprovalAction(null);
      setApprovalNote('');
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || 'Không thể cập nhật trạng thái yêu cầu.';
      toast.error(message);
    } finally {
      setApprovalSubmitting(false);
    }
  };

  const handleOpenCampaignDetail = async (campaignId: string) => {
    try {
      const detail = await loadCampaignDetail(campaignId);
      if (detail) {
        setCampaignDetail(detail);
        setShowCampaignDetailModal(true);
      } else {
        toast.warn('Không tìm thấy chi tiết chiến dịch.');
      }
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || 'Không thể tải chi tiết chiến dịch.';
      toast.error(message);
    }
  };

  const handleNavigateHistory = () => {
    setActiveSection('history');
  };

  const handleFundCreation = async (form: FundCreateForm) => {
    if (!selectedTree?.id) {
      toast.error('Không xác định được gia phả.');
      return;
    }

    if (!form.fundName.trim()) {
      toast.error('Vui lòng nhập tên quỹ.');
      return;
    }

    if (!form.bankAccountNumber.trim()) {
      toast.error('Vui lòng nhập số tài khoản.');
      return;
    }

    if (!form.accountHolderName.trim()) {
      toast.error('Vui lòng nhập tên chủ tài khoản.');
      return;
    }

    if (!form.bankCode || !form.bankName) {
      toast.error('Vui lòng chọn ngân hàng.');
      return;
    }

    try {
      const payload: CreateFundPayload = {
        familyTreeId: selectedTree.id,
        fundName: form.fundName.trim(),
        bankAccountNumber: form.bankAccountNumber.trim(),
        bankCode: form.bankCode,
        bankName: form.bankName,
        accountHolderName: form.accountHolderName.trim(),
      };

      const description = form.description.trim();
      if (description) {
        payload.description = description;
      }

      await createFund(payload);
      toast.success('Tạo quỹ thành công.');
      setShowCreateFundModal(false);
      setActiveSection('overview');
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || 'Không thể tạo quỹ.';
      toast.error(message);
    }
  };

  const handleDepositSubmit = async (form: FundDepositForm) => {
    if (!activeFund?.id) {
      toast.error('Chưa xác định được quỹ hiện tại.');
      return;
    }
    if (gpMemberLoading) {
      toast.info('Đang tải thông tin thành viên. Vui lòng thử lại sau.');
      return;
    }
    if (!gpMemberId) {
      toast.error('Bạn cần tham gia gia phả để nạp tiền.');
      return;
    }

    const payload: CreateFundDonationPayload = {
      memberId: gpMemberId,
      donorName,
      amount: form.amount,
      paymentMethod: form.paymentMethod,
      returnUrl: window.location.href,
      cancelUrl: window.location.href,
    };

    if (form.paymentNotes) {
      payload.paymentNotes = form.paymentNotes;
    }

    try {
      await donateToFund(activeFund.id, payload);
      toast.success('Nạp tiền vào quỹ thành công.');
      setShowDepositModal(false);
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || 'Không thể nạp tiền vào quỹ.';
      toast.error(message);
    }
  };

  const handleOpenDeposit = () => {
    if (!activeFund) {
      toast.error('Chưa có quỹ để nạp tiền.');
      return;
    }
    if (gpMemberLoading) {
      toast.info('Đang tải thông tin thành viên. Vui lòng thử lại sau.');
      return;
    }
    if (!gpMemberId) {
      toast.error('Bạn cần tham gia gia phả để nạp tiền.');
      return;
    }
    setShowDepositModal(true);
  };

  const shouldShowCreatePrompt = !activeFund;

  const renderCreateFundPrompt = () => (
    <div className="bg-white rounded-xl shadow p-8 flex flex-col items-center justify-center text-center">
      <EmptyState
        icon={<Wallet className="w-12 h-12 text-blue-500" />}
        title="Chưa có quỹ gia phả"
        description="Mỗi gia phả chỉ có một quỹ. Hãy tạo quỹ để bắt đầu quản lý thu chi."
      />
      <button
        onClick={() => setShowCreateFundModal(true)}
        className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
        type="button"
        disabled={creatingFund}
      >
        {creatingFund ? 'Đang tạo quỹ...' : 'Tạo quỹ ngay'}
      </button>
    </div>
  );

  if (loading && !activeFund) {
    return <LoadingState message="Đang khởi tạo dữ liệu quỹ" />;
  }

  return (
    <div className="h-full overflow-hidden flex flex-col bg-gray-50">
      <div className="flex-1 overflow-hidden flex">
        <div className="w-64 bg-white border-r border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-3 px-6 py-4">
            <Wallet className="w-8 h-8 text-blue-600" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Quỹ Gia Tộc</h2>
              <p className="text-sm text-gray-600 line-clamp-1">{selectedTree?.name || 'Chưa chọn gia phả'}</p>
            </div>
          </div>
          <div className="p-4 space-y-2">
            {([
              { id: 'overview', label: 'Tổng Quan', icon: Wallet },
              { id: 'withdrawal', label: 'Tạo Yêu Cầu', icon: TrendingDown },
              { id: 'approvals', label: 'Phê Duyệt', icon: CheckCircle },
              { id: 'history', label: 'Lịch Sử Giao Dịch', icon: Calendar },
              { id: 'campaigns', label: 'Chiến Dịch', icon: Megaphone },
            ] as Array<{ id: SectionKey; label: string; icon: React.ElementType }>).map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => handleSectionChange(id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-semibold transition-all ${
                  activeSection === id ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-5 h-5" />
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          {shouldShowCreatePrompt ? (
            renderCreateFundPrompt()
          ) : (
            <>
              {activeSection === 'overview' && (
                <FundOverviewSection
                  activeFund={activeFund as Fund | null}
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
                  onNavigateHistory={handleNavigateHistory}
                  loading={fundDataLoading}
                  onDeposit={handleOpenDeposit}
                  depositDisabled={donating}
                  showDepositButton={!shouldShowCreatePrompt}
                />
              )}

              {activeSection === 'withdrawal' && (
                <FundWithdrawalSection
                  hasFund={Boolean(activeFund)}
                  computedBalance={computedBalance}
                  campaigns={campaigns}
                  formState={withdrawalForm}
                  onFormChange={handleWithdrawalFormChange}
                  onSubmit={handleWithdrawalSubmit}
                  actionLoading={actionLoading}
                  formatCurrency={formatCurrency}
                />
              )}

              {activeSection === 'approvals' && (
                <FundApprovalsSection
                  pendingExpenses={pendingExpenses}
                  formatCurrency={formatCurrency}
                  formatDate={formatDate}
                  getStatusBadge={getExpenseStatusBadge}
                  onRequestAction={handleApprovalRequest}
                />
              )}

              {activeSection === 'history' && (
                <FundHistorySection
                  approvedExpenses={approvedExpenses}
                  formatCurrency={formatCurrency}
                  formatDate={formatDate}
                />
              )}

              {activeSection === 'campaigns' && (
                campaignsLoading ? (
                  <LoadingState message="Đang tải danh sách chiến dịch" />
                ) : (
                  <FundCampaignsSection
                    campaigns={campaigns}
                    campaignSearch={campaignSearch}
                    campaignFilter={campaignFilter}
                    onSearchChange={setCampaignSearch}
                    onFilterChange={setCampaignFilter}
                    onRequestCreate={() => setShowCampaignModal(true)}
                    onOpenDetail={handleOpenCampaignDetail}
                    formatCurrency={formatCurrency}
                    formatDate={formatDate}
                    getCampaignStatusKey={getCampaignStatusKey}
                    getCampaignStatusLabel={getCampaignStatusLabel}
                    getCampaignStatusBadgeClasses={getCampaignStatusBadgeClasses}
                    metrics={campaignMetrics}
                  />
                )
              )}
            </>
          )}
        </div>
      </div>

      <FundCampaignModal
        isOpen={showCampaignModal}
        formState={campaignForm}
        onClose={() => setShowCampaignModal(false)}
        onFormChange={handleCampaignFormChange}
        onSubmit={handleCampaignSubmit}
        submitting={actionLoading}
      />

      <FundCampaignDetailModal
        isOpen={showCampaignDetailModal}
        detail={campaignDetail}
        onClose={() => {
          setShowCampaignDetailModal(false);
          setCampaignDetail(null);
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

      <FundApprovalModal
        isOpen={Boolean(approvalAction && pendingExpense)}
        action={approvalAction}
        expense={pendingExpense}
        note={approvalNote}
        onNoteChange={setApprovalNote}
        onCancel={() => {
          setPendingExpense(null);
          setApprovalAction(null);
          setApprovalNote('');
        }}
        onConfirm={confirmApproval}
        submitting={approvalSubmitting}
        formatCurrency={formatCurrency}
      />

      <FundCreateModal
        isOpen={showCreateFundModal}
        banks={banks}
        bankLogos={bankLogoMap}
        onClose={() => setShowCreateFundModal(false)}
        onSubmit={handleFundCreation}
        submitting={creatingFund}
      />

      <FundDepositModal
        isOpen={showDepositModal}
        onClose={() => setShowDepositModal(false)}
        onSubmit={handleDepositSubmit}
        submitting={donating}
        donorName={donorName}
        fund={activeFund ?? null}
      />
    </div>
  );
};

export default FundManagement;

