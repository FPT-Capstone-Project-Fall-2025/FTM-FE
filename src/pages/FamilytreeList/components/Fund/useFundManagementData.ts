import { useCallback, useEffect, useMemo, useState } from 'react';
import fundService from '@/services/fundService';
import type {
  Fund,
  FundDonation,
  FundDonationStats,
  FundExpense,
  FundCampaign,
  CampaignDonation,
  CampaignExpense,
  CampaignStatistics,
  CampaignFinancialSummary,
  CreateCampaignPayload,
  CreateFundExpensePayload,
  CreateFundPayload,
  CreateFundDonationPayload,
  MyPendingDonation,
} from '@/types/fund';

export type CampaignDetail = {
  campaign: FundCampaign;
  donations: CampaignDonation[];
  expenses: CampaignExpense[];
  statistics: CampaignStatistics | null;
  financialSummary: CampaignFinancialSummary | null;
};

interface CampaignPaginationState {
  page: number;
  pageSize: number;
  totalPages: number;
  totalCount: number;
  hasPrevious: boolean;
  hasNext: boolean;
}

export interface FundWithdrawalInput {
  amount: number;
  description: string;
  recipient: string;
  plannedDate?: string;
  expenseEvent?: string;
  campaignId?: string | null;
}

export interface CampaignCreationInput {
  campaignName: string;
  campaignDescription?: string;
  organizerName?: string;
  organizerContact?: string;
  campaignManagerId?: string;
  startDate?: string;
  endDate?: string;
  fundGoal?: number;
  bankAccountNumber?: string;
  bankName?: string;
  bankCode?: string;
  accountHolderName?: string;
  notes?: string;
  isPublic?: boolean;
  imageUrl?: string;
}

export interface UseFundManagementDataOptions {
  familyTreeId?: string | null;
  currentUserId?: string | null;
  currentMemberId?: string | null;
}

export interface UseFundManagementDataReturn {
  loading: boolean;
  fundDataLoading: boolean;
  actionLoading: boolean;
  campaignDetailLoading: boolean;
  campaignsLoading: boolean;
  creatingFund: boolean;
  donating: boolean;
  error: string | null;
  funds: Fund[];
  activeFund: Fund | null;
  setActiveFundId: (fundId: string) => void;
  donations: FundDonation[];
  donationStats: FundDonationStats | null;
  expenses: FundExpense[];
  campaigns: FundCampaign[];
  campaignPagination: CampaignPaginationState;
  activeCampaigns: FundCampaign[];
  activeCampaignPagination: CampaignPaginationState;
  activeCampaignsLoading: boolean;
  myPendingDonations: MyPendingDonation[];
  myPendingLoading: boolean;
  refreshAll: () => Promise<void>;
  refreshFundDetails: () => Promise<void>;
  createWithdrawal: (input: FundWithdrawalInput) => Promise<void>;
  approveExpense: (expenseId: string, notes?: string, approverId?: string) => Promise<void>;
  rejectExpense: (expenseId: string, reason?: string, rejectedBy?: string) => Promise<void>;
  createCampaign: (input: CampaignCreationInput) => Promise<void>;
  loadCampaignDetail: (campaignId: string) => Promise<CampaignDetail | null>;
  refreshCampaigns: (page?: number) => Promise<void>;
  changeCampaignPage: (page: number) => Promise<void>;
  refreshActiveCampaigns: (page?: number) => Promise<void>;
  changeActiveCampaignPage: (page: number) => Promise<void>;
  refreshMyPendingDonations: () => Promise<void>;
  createFund: (payload: CreateFundPayload) => Promise<Fund | null>;
  donateToFund: (fundId: string, payload: CreateFundDonationPayload) => Promise<void>;
}

export const useFundManagementData = (
  options: UseFundManagementDataOptions
): UseFundManagementDataReturn => {
  const { familyTreeId, currentUserId, currentMemberId } = options;

  const [loading, setLoading] = useState(false);
  const [fundDataLoading, setFundDataLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [campaignDetailLoading, setCampaignDetailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [funds, setFunds] = useState<Fund[]>([]);
  const [activeFundId, setActiveFundId] = useState<string | null>(null);
  const [donations, setDonations] = useState<FundDonation[]>([]);
  const [donationStats, setDonationStats] = useState<FundDonationStats | null>(null);
  const [expenses, setExpenses] = useState<FundExpense[]>([]);
  const [campaigns, setCampaigns] = useState<FundCampaign[]>([]);
  const [campaignsLoading, setCampaignsLoading] = useState(false);
  const [campaignPagination, setCampaignPagination] = useState<CampaignPaginationState>({
    page: 1,
    pageSize: 10,
    totalPages: 1,
    totalCount: 0,
    hasPrevious: false,
    hasNext: false,
  });
  const [activeCampaigns, setActiveCampaigns] = useState<FundCampaign[]>([]);
  const [activeCampaignsLoading, setActiveCampaignsLoading] = useState(false);
  const [activeCampaignPagination, setActiveCampaignPagination] = useState<CampaignPaginationState>({
    page: 1,
    pageSize: 10,
    totalPages: 1,
    totalCount: 0,
    hasPrevious: false,
    hasNext: false,
  });
  const [myPendingDonations, setMyPendingDonations] = useState<MyPendingDonation[]>([]);
  const [myPendingLoading, setMyPendingLoading] = useState(false);
  const [creatingFund, setCreatingFund] = useState(false);
  const [donating, setDonating] = useState(false);

  const activeFund = useMemo(() => {
    if (!activeFundId) {
      return funds.length > 0 ? funds[0] : null;
    }

    return funds.find(fund => fund.id === activeFundId) ?? (funds.length > 0 ? funds[0] : null);
  }, [activeFundId, funds]);

  const loadFundDetails = useCallback(
    async (fundId: string) => {
      setFundDataLoading(true);
      setError(null);
      try {
        const [donationsRes, donationStatsRes, expensesRes] = await Promise.all([
          fundService.fetchFundDonations(fundId),
          fundService.fetchFundDonationStats(fundId),
          fundService.fetchFundExpenses(fundId),
        ]);

        setDonations(donationsRes);
        setDonationStats(donationStatsRes ?? null);
        setExpenses(expensesRes);
      } catch (err) {
        console.error('Failed to load fund details', err);
        setError('Không thể tải dữ liệu quỹ. Vui lòng thử lại.');
        if (!donations.length) {
          setDonations([]);
        }
        if (!expenses.length) {
          setExpenses([]);
        }
      } finally {
        setFundDataLoading(false);
      }
    },
    [donations.length, expenses.length]
  );

  const loadInitialData = useCallback(async () => {
    const treeId = familyTreeId;

    if (!treeId) {
      setFunds([]);
      setDonations([]);
      setExpenses([]);
      setDonationStats(null);
      setCampaigns([]);
      setActiveFundId(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const fundList = await fundService.fetchFundsByTree(treeId);

      setFunds(fundList);

      const firstFund = fundList[0];

      if (firstFund) {
        const fallbackFundId = firstFund.id;
        setActiveFundId(prev => (prev && fundList.some(f => f.id === prev) ? prev : fallbackFundId));
      } else {
        setActiveFundId(null);
      }
    } catch (err) {
      console.error('Failed to load fund management data', err);
      setError('Không thể tải dữ liệu quản lý quỹ. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }, [familyTreeId]);

  const refreshMyPendingDonations = useCallback(async () => {
    const requesterId = currentMemberId ?? currentUserId;
    if (!requesterId) {
      setMyPendingDonations([]);
      return;
    }

    setMyPendingLoading(true);
    try {
      const list = await fundService.fetchMyPendingDonations(requesterId);
      setMyPendingDonations(list);
    } catch (err) {
      console.error('Failed to load my pending donations', err);
      setError(prev => prev ?? 'Không thể tải danh sách yêu cầu nạp đang chờ.');
    } finally {
      setMyPendingLoading(false);
    }
  }, [currentMemberId, currentUserId]);

  const refreshCampaigns = useCallback(
    async (page?: number) => {
      if (!familyTreeId) {
        setCampaigns([]);
        setCampaignPagination(prev => ({
          ...prev,
          page: 1,
          totalPages: 1,
          totalCount: 0,
          hasPrevious: false,
          hasNext: false,
        }));
        return;
      }

      setCampaignsLoading(true);
      const nextPage = page ?? campaignPagination.page;
      const nextPageSize = campaignPagination.pageSize;
      try {
        const result = await fundService.fetchCampaignsByTree(familyTreeId, nextPage, nextPageSize);
        setCampaigns(result.items);
        setCampaignPagination({
          page: result.page ?? nextPage,
          pageSize: result.pageSize ?? nextPageSize,
          totalPages: result.totalPages ?? 1,
          totalCount: result.totalCount ?? result.items.length,
          hasPrevious: result.hasPrevious ?? false,
          hasNext: result.hasNext ?? false,
        });
      } catch (err) {
        console.error('Failed to refresh campaigns', err);
        setError('Không thể tải danh sách chiến dịch.');
      } finally {
        setCampaignsLoading(false);
      }
    },
    [campaignPagination.page, campaignPagination.pageSize, familyTreeId]
  );

  const changeCampaignPage = useCallback(
    async (page: number) => {
      await refreshCampaigns(page);
    },
    [refreshCampaigns]
  );

  const refreshActiveCampaigns = useCallback(
    async (page?: number) => {
      setActiveCampaignsLoading(true);
      const nextPage = page ?? activeCampaignPagination.page;
      const nextPageSize = activeCampaignPagination.pageSize;
      try {
        const result = await fundService.fetchActiveCampaigns(nextPage, nextPageSize);
        setActiveCampaigns(result.items);
        setActiveCampaignPagination({
          page: result.page ?? nextPage,
          pageSize: result.pageSize ?? nextPageSize,
          totalPages: result.totalPages ?? 1,
          totalCount: result.totalCount ?? result.items.length,
          hasPrevious: result.hasPrevious ?? false,
          hasNext: result.hasNext ?? false,
        });
      } catch (err) {
        console.error('Failed to refresh active campaigns', err);
        setError(prev => prev ?? 'Không thể tải danh sách chiến dịch đang hoạt động.');
      } finally {
        setActiveCampaignsLoading(false);
      }
    },
    [activeCampaignPagination.page, activeCampaignPagination.pageSize]
  );

  const changeActiveCampaignPage = useCallback(
    async (page: number) => {
      await refreshActiveCampaigns(page);
    },
    [refreshActiveCampaigns]
  );

  const refreshFundDetails = useCallback(async () => {
    if (!activeFund?.id) {
      setDonations([]);
      setExpenses([]);
      setDonationStats(null);
      return;
    }

    await loadFundDetails(activeFund.id);
  }, [activeFund?.id, loadFundDetails]);

  const refreshAll = useCallback(async () => {
    await loadInitialData();
    await Promise.all([
      refreshCampaigns(campaignPagination.page),
      refreshActiveCampaigns(activeCampaignPagination.page),
      refreshMyPendingDonations(),
    ]);
  }, [
    activeCampaignPagination.page,
    campaignPagination.page,
    loadInitialData,
    refreshActiveCampaigns,
    refreshCampaigns,
    refreshMyPendingDonations,
  ]);

  const createWithdrawal = useCallback(
    async (input: FundWithdrawalInput) => {
      if (!activeFund?.id) {
        throw new Error('Không xác định được quỹ hiện tại.');
      }

      setActionLoading(true);
      try {
        const payload: CreateFundExpensePayload = {
          fundId: activeFund.id,
          amount: input.amount,
          description: input.description,
          recipient: input.recipient,
        };

        if (input.expenseEvent) {
          payload.expenseEvent = input.expenseEvent;
        }

        if (input.plannedDate) {
          payload.plannedDate = input.plannedDate;
        }

        if (input.campaignId) {
          payload.campaignId = input.campaignId;
        }

        await fundService.createFundExpense(payload);

        await loadFundDetails(activeFund.id);
      } finally {
        setActionLoading(false);
      }
    },
    [activeFund?.id, loadFundDetails]
  );

  const approveExpense = useCallback(
    async (expenseId: string, notes?: string, approverId?: string) => {
      if (!activeFund?.id) {
        throw new Error('Không xác định được quỹ hiện tại.');
      }

      const approver = approverId ?? currentUserId;
      if (!approver) {
        throw new Error('Thiếu thông tin người phê duyệt.');
      }

      setActionLoading(true);
      try {
        await fundService.approveFundExpense(expenseId, {
          approverId: approver,
          notes: notes ?? null,
        });

        await loadFundDetails(activeFund.id);
      } finally {
        setActionLoading(false);
      }
    },
    [activeFund?.id, currentUserId, loadFundDetails]
  );

  const rejectExpense = useCallback(
    async (expenseId: string, reason?: string, rejectedBy?: string) => {
      if (!activeFund?.id) {
        throw new Error('Không xác định được quỹ hiện tại.');
      }

      const rejectedUser = rejectedBy ?? currentUserId;
      if (!rejectedUser) {
        throw new Error('Thiếu thông tin người từ chối.');
      }

      setActionLoading(true);
      try {
        await fundService.rejectFundExpense(expenseId, {
          rejectedBy: rejectedUser,
          reason: reason ?? null,
        });

        await loadFundDetails(activeFund.id);
      } finally {
        setActionLoading(false);
      }
    },
    [activeFund?.id, currentUserId, loadFundDetails]
  );

  const createCampaign = useCallback(
    async (input: CampaignCreationInput) => {
      if (!familyTreeId) {
        throw new Error('Thiếu thông tin gia phả.');
      }

      setActionLoading(true);
      try {
        const payload: CreateCampaignPayload = {
          familyTreeId,
          campaignName: input.campaignName,
        };

        if (input.campaignDescription) payload.campaignDescription = input.campaignDescription;
        if (input.organizerName) payload.organizerName = input.organizerName;
        if (input.organizerContact) payload.organizerContact = input.organizerContact;
        if (input.campaignManagerId) payload.campaignManagerId = input.campaignManagerId;
        if (input.startDate) payload.startDate = input.startDate;
        if (input.endDate) payload.endDate = input.endDate;
        if (input.fundGoal !== undefined) payload.fundGoal = input.fundGoal;
        if (input.bankAccountNumber) payload.bankAccountNumber = input.bankAccountNumber;
        if (input.bankName) payload.bankName = input.bankName;
        if (input.bankCode) payload.bankCode = input.bankCode;
        if (input.accountHolderName) payload.accountHolderName = input.accountHolderName;
        if (input.notes) payload.notes = input.notes;
        if (input.isPublic !== undefined) payload.isPublic = input.isPublic;
        if (input.imageUrl) payload.imageUrl = input.imageUrl;

        await fundService.createCampaign(payload);
        await changeCampaignPage(1);
      } finally {
        setActionLoading(false);
      }
    },
    [changeCampaignPage, familyTreeId]
  );

  const loadCampaignDetail = useCallback(
    async (campaignId: string): Promise<CampaignDetail | null> => {
      setCampaignDetailLoading(true);
      setError(null);
      try {
        const [campaign, donationsRes, expensesRes, statisticsRes, summaryRes] = await Promise.all([
          fundService.fetchCampaignById(campaignId),
          fundService.fetchCampaignDonations(campaignId),
          fundService.fetchCampaignExpenses(campaignId),
          fundService.fetchCampaignStatistics(campaignId),
          fundService.fetchCampaignFinancialSummary(campaignId),
        ]);

        if (!campaign) {
          return null;
        }

        return {
          campaign,
          donations: donationsRes,
          expenses: expensesRes,
          statistics: statisticsRes ?? null,
          financialSummary: summaryRes ?? null,
        };
      } catch (err) {
        console.error('Failed to load campaign detail', err);
        setError('Không thể tải chi tiết chiến dịch.');
        return null;
      } finally {
        setCampaignDetailLoading(false);
      }
    },
    []
  );

  const createFund = useCallback(
    async (payload: CreateFundPayload): Promise<Fund | null> => {
      setCreatingFund(true);
      setError(null);
      try {
        const response = await fundService.createFund(payload);
        const createdFund = response?.data ?? null;
        if (createdFund) {
          setFunds([createdFund]);
          setActiveFundId(createdFund.id);
          setDonations([]);
          setExpenses([]);
          setDonationStats(null);
          setCampaigns([]);
        }
        return createdFund;
      } catch (err) {
        console.error('Failed to create fund', err);
        throw err;
      } finally {
        setCreatingFund(false);
      }
    },
    []
  );

  const donateToFund = useCallback(
    async (fundId: string, payload: CreateFundDonationPayload) => {
      setDonating(true);
      setError(null);
      try {
        await fundService.createFundDonation(fundId, payload);
        await loadFundDetails(fundId);
      } catch (err) {
        console.error('Failed to donate to fund', err);
        throw err;
      } finally {
        setDonating(false);
      }
    },
    [loadFundDetails]
  );

  useEffect(() => {
    void loadInitialData();
  }, [loadInitialData]);

  useEffect(() => {
    if (familyTreeId) {
      void refreshCampaigns(1);
    } else {
      setCampaigns([]);
      setCampaignPagination(prev => ({
        ...prev,
        page: 1,
        totalPages: 1,
        totalCount: 0,
        hasNext: false,
        hasPrevious: false,
      }));
    }
  }, [campaignPagination.pageSize, familyTreeId, refreshCampaigns]);

  useEffect(() => {
    if (currentMemberId || currentUserId) {
      void refreshMyPendingDonations();
    } else {
      setMyPendingDonations([]);
    }
  }, [currentMemberId, currentUserId, refreshMyPendingDonations]);

  useEffect(() => {
    if (!familyTreeId) {
      setFunds([]);
      setActiveFundId(null);
    }
  }, [familyTreeId]);

  return {
    loading,
    fundDataLoading,
    actionLoading,
    campaignDetailLoading,
    campaignsLoading,
    creatingFund,
    donating,
    error,
    funds,
    activeFund: activeFund ?? null,
    setActiveFundId: setActiveFundId as (fundId: string) => void,
    donations,
    donationStats,
    expenses,
    campaigns,
  campaignPagination,
    myPendingDonations,
    myPendingLoading,
    refreshAll,
    refreshFundDetails,
    createWithdrawal,
    approveExpense,
    rejectExpense,
    createCampaign,
    loadCampaignDetail,
    refreshCampaigns,
    changeCampaignPage,
    refreshActiveCampaigns,
    changeActiveCampaignPage,
    refreshMyPendingDonations,
    createFund,
    donateToFund,
    activeCampaigns,
    activeCampaignPagination,
    activeCampaignsLoading,
  };
};
