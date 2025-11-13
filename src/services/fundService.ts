import api from './apiService';
import type {
  Fund,
  FundDonation,
  FundDonationStats,
  FundExpense,
  FundCampaign,
  CampaignDonation,
  CampaignExpense,
  CreateFundExpensePayload,
  ApproveFundExpensePayload,
  RejectFundExpensePayload,
  CreateCampaignPayload,
  CreateCampaignExpensePayload,
  ApproveCampaignExpensePayload,
  RejectCampaignExpensePayload,
  CreateFundPayload,
  CreateFundDonationPayload,
  MyPendingDonation,
  CampaignStatistics,
  CampaignFinancialSummary,
} from '@/types/fund';
import type { ApiResponse, PaginationResponse } from '@/types/api';

const unwrap = <T>(
  response: ApiResponse<T> | PaginationResponse<T> | T | undefined | null
): T | undefined => {
  if (!response) {
    return undefined;
  }

  if (typeof response === 'object' && 'data' in response && response.data !== undefined) {
    return response.data as T;
  }

  return response as T;
};

const normalizeArray = <T>(value: T | T[] | undefined): T[] => {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
};

export const fundService = {
  async fetchFundsByTree(treeId: string): Promise<Fund[]> {
    const result = await api.get<ApiResponse<Fund[]>>(`/funds/tree/${treeId}`);
    return normalizeArray(unwrap<Fund[] | Fund>(result));
  },

  async fetchFundExpenses(fundId: string): Promise<FundExpense[]> {
    const result = await api.get<ApiResponse<FundExpense[]>>(`/fund-expenses/fund/${fundId}`);
    return normalizeArray(unwrap<FundExpense[] | FundExpense>(result));
  },

  async fetchPendingFundExpenses(): Promise<FundExpense[]> {
    const result = await api.get<ApiResponse<FundExpense[]>>(`/fund-expenses/pending`);
    return normalizeArray(unwrap<FundExpense[] | FundExpense>(result));
  },

  async createFundExpense(payload: CreateFundExpensePayload) {
    return api.post<ApiResponse<FundExpense>>(`/fund-expenses`, payload);
  },

  async approveFundExpense(id: string, payload: ApproveFundExpensePayload) {
    return api.put<ApiResponse<boolean>>(`/fund-expenses/${id}/approve`, payload);
  },

  async rejectFundExpense(id: string, payload: RejectFundExpensePayload) {
    return api.put<ApiResponse<boolean>>(`/fund-expenses/${id}/reject`, payload);
  },

  async fetchFundDonations(fundId: string): Promise<FundDonation[]> {
    const result = await api.get<ApiResponse<FundDonation[]>>(`/donations/fund/${fundId}`);
    return normalizeArray(unwrap<FundDonation[] | FundDonation>(result));
  },

  async fetchFundDonationStats(fundId: string): Promise<FundDonationStats | null> {
    const result = await api.get<ApiResponse<FundDonationStats>>(`/donations/fund/${fundId}/stats`);
    return unwrap<FundDonationStats | null>(result) ?? null;
  },

  async confirmDonation(donationId: string, payload: { confirmedBy: string; notes?: string }) {
    return api.post<ApiResponse<boolean>>(`/donations/${donationId}/confirm`, payload);
  },

  async rejectDonation(donationId: string, payload: { rejectedBy: string; reason?: string }) {
    return api.post<ApiResponse<boolean>>(`/donations/${donationId}/reject`, payload);
  },

  async createFundDonation(fundId: string, payload: CreateFundDonationPayload) {
    return api.post<ApiResponse<FundDonation>>(`/funds/${fundId}/donate`, payload);
  },

  async fetchMyPendingDonations(userId: string): Promise<MyPendingDonation[]> {
    const result = await api.get<ApiResponse<MyPendingDonation[]>>(`/donations/my-pending`, {
      params: { userId },
    });
    return normalizeArray(unwrap<MyPendingDonation[] | MyPendingDonation>(result));
  },

  async createFund(payload: CreateFundPayload) {
    return api.post<ApiResponse<Fund>>(`/funds`, payload);
  },

  async fetchCampaignsByTree(
    treeId: string,
    page = 1,
    pageSize = 10
  ): Promise<{
    items: FundCampaign[];
    page: number;
    pageSize: number;
    totalPages: number;
    totalCount: number;
    hasPrevious: boolean;
    hasNext: boolean;
  }> {
    const response = await api.get<ApiResponse<any>>(`/ftcampaign/family-tree/${treeId}`, {
      params: {
        page,
        pageSize,
      },
    });

    const payload = unwrap<any>(response) ?? {};
    const rawItems = normalizeArray(payload?.items);

    const items: FundCampaign[] = rawItems.map((item: any) => {
      const determineStatus = (): string => {
        const now = new Date();
        const endDate = item.endDate ? new Date(item.endDate) : null;
        const progress = Number(item.progressPercentage ?? 0);
        if (progress >= 100) return 'completed';
        if (item.isActive === false && endDate && endDate < now) return 'completed';
        if (item.isActive) return 'active';
        return 'upcoming';
      };

      return {
        id: item.id,
        ftId: item.familyTreeId ?? treeId,
        campaignName: item.name ?? item.campaignName ?? '',
        campaignDescription: item.description ?? item.purpose ?? null,
        campaignManagerId: item.campaignManagerId ?? null,
        startDate: item.startDate ?? null,
        endDate: item.endDate ?? null,
        fundGoal: item.targetAmount !== undefined ? Number(item.targetAmount) : null,
        currentBalance: item.currentAmount !== undefined ? Number(item.currentAmount) : null,
        status: determineStatus(),
        lastModifiedOn: item.updatedAt ?? null,
        createdOn: item.createdAt ?? null,
        accountHolderName: item.beneficiaryInfo ?? null,
        progressPercentage:
          item.progressPercentage !== undefined ? Number(item.progressPercentage) : null,
        totalDonations: item.totalDonations !== undefined ? Number(item.totalDonations) : null,
        totalDonors: item.totalDonors !== undefined ? Number(item.totalDonors) : null,
        isActive: item.isActive ?? null,
      };
    });

    return {
      items,
      page: payload?.page ?? payload?.pageIndex ?? page,
      pageSize: payload?.pageSize ?? pageSize,
      totalPages: payload?.totalPages ?? 1,
      totalCount: payload?.totalCount ?? payload?.totalItems ?? items.length,
      hasPrevious: payload?.hasPrevious ?? false,
      hasNext: payload?.hasNext ?? false,
    };
  },

  async fetchActiveCampaigns(
    page = 1,
    pageSize = 10
  ): Promise<{
    items: FundCampaign[];
    page: number;
    pageSize: number;
    totalPages: number;
    totalCount: number;
    hasPrevious: boolean;
    hasNext: boolean;
  }> {
    const response = await api.get<ApiResponse<any>>(`/ftcampaign/active`, {
      params: {
        page,
        pageSize,
      },
    });

    const payload = unwrap<any>(response) ?? {};
    const rawItems = normalizeArray(payload?.items);

    const items: FundCampaign[] = rawItems.map((item: any) => {
      const determineStatus = (): string => {
        const now = new Date();
        const endDate = item.endDate ? new Date(item.endDate) : null;
        const progress = Number(item.progressPercentage ?? 0);
        if (progress >= 100) return 'completed';
        if (item.isActive === false && endDate && endDate < now) return 'completed';
        if (item.isActive) return 'active';
        return 'upcoming';
      };

      return {
        id: item.id,
        ftId: item.familyTreeId ?? '',
        campaignName: item.name ?? item.campaignName ?? '',
        campaignDescription: item.description ?? item.purpose ?? null,
        campaignManagerId: item.campaignManagerId ?? null,
        startDate: item.startDate ?? null,
        endDate: item.endDate ?? null,
        fundGoal: item.targetAmount !== undefined ? Number(item.targetAmount) : null,
        currentBalance: item.currentAmount !== undefined ? Number(item.currentAmount) : null,
        status: determineStatus(),
        lastModifiedOn: item.updatedAt ?? null,
        createdOn: item.createdAt ?? null,
        accountHolderName: item.beneficiaryInfo ?? null,
        progressPercentage:
          item.progressPercentage !== undefined ? Number(item.progressPercentage) : null,
        totalDonations: item.totalDonations !== undefined ? Number(item.totalDonations) : null,
        totalDonors: item.totalDonors !== undefined ? Number(item.totalDonors) : null,
        isActive: item.isActive ?? null,
      };
    });

    return {
      items,
      page: payload?.page ?? payload?.pageIndex ?? page,
      pageSize: payload?.pageSize ?? pageSize,
      totalPages: payload?.totalPages ?? 1,
      totalCount: payload?.totalCount ?? payload?.totalItems ?? items.length,
      hasPrevious: payload?.hasPrevious ?? false,
      hasNext: payload?.hasNext ?? false,
    };
  },

  async fetchCampaignById(campaignId: string): Promise<FundCampaign | null> {
    const response = await api.get<ApiResponse<any>>(`/ftcampaign/${campaignId}`);
    const payload = unwrap<any>(response);
    if (!payload) {
      return null;
    }

    const determineStatus = (): string => {
      if (payload.status) {
        return String(payload.status).toLowerCase();
      }
      const now = new Date();
      const endDate = payload.endDate ? new Date(payload.endDate) : null;
      const progress = Number(payload.progressPercentage ?? 0);
      if (progress >= 100) return 'completed';
      if (payload.isActive === false && endDate && endDate < now) return 'completed';
      if (payload.isActive) return 'active';
      return 'upcoming';
    };

    return {
      id: payload.id ?? campaignId,
      ftId: payload.ftId ?? payload.familyTreeId ?? '',
      campaignName: payload.campaignName ?? payload.name ?? '',
      campaignDescription: payload.campaignDescription ?? payload.description ?? payload.purpose ?? null,
      campaignManagerId: payload.campaignManagerId ?? null,
      startDate: payload.startDate ?? null,
      endDate: payload.endDate ?? null,
      fundGoal: payload.fundGoal !== undefined ? Number(payload.fundGoal) : null,
      currentBalance: payload.currentBalance !== undefined ? Number(payload.currentBalance) : null,
      status: determineStatus(),
      lastModifiedOn: payload.lastModifiedOn ?? payload.updatedAt ?? null,
      createdOn: payload.createdOn ?? payload.createdAt ?? null,
      imageUrl: payload.imageUrl ?? null,
      isPublic: payload.isPublic ?? null,
      notes: payload.notes ?? null,
      accountHolderName:
        payload.accountHolderName ??
        payload.bankInfo?.accountHolderName ??
        payload.beneficiaryInfo ??
        null,
      bankAccountNumber:
        payload.bankAccountNumber ?? payload.bankInfo?.bankAccountNumber ?? null,
      bankCode: payload.bankCode ?? payload.bankInfo?.bankCode ?? null,
      bankName: payload.bankName ?? payload.bankInfo?.bankName ?? null,
      progressPercentage:
        payload.progressPercentage !== undefined ? Number(payload.progressPercentage) : null,
      totalDonations:
        payload.totalDonations !== undefined ? Number(payload.totalDonations) : null,
      totalDonors: payload.totalDonors !== undefined ? Number(payload.totalDonors) : null,
      isActive: payload.isActive ?? null,
    };
  },

  async createCampaign(payload: CreateCampaignPayload) {
    return api.post<ApiResponse<FundCampaign>>(`/ftcampaign`, payload);
  },

  async fetchCampaignDonations(campaignId: string): Promise<CampaignDonation[]> {
    const result = await api.get<ApiResponse<CampaignDonation[]>>(`/ftcampaign/${campaignId}/donations`);
    return normalizeArray(unwrap<CampaignDonation[] | CampaignDonation>(result));
  },

  async fetchCampaignExpenses(campaignId: string): Promise<CampaignExpense[]> {
    const result = await api.get<ApiResponse<CampaignExpense[]>>(`/ftcampaign/${campaignId}/expenses`);
    return normalizeArray(unwrap<CampaignExpense[] | CampaignExpense>(result));
  },

  async fetchCampaignStatistics(campaignId: string): Promise<CampaignStatistics | null> {
    const result = await api.get<ApiResponse<CampaignStatistics>>(
      `/ftcampaign/${campaignId}/statistics`
    );
    return unwrap<CampaignStatistics | null>(result) ?? null;
  },

  async fetchCampaignFinancialSummary(campaignId: string): Promise<CampaignFinancialSummary | null> {
    const result = await api.get<ApiResponse<CampaignFinancialSummary>>(
      `/ftcampaign/${campaignId}/financial-summary`
    );
    return unwrap<CampaignFinancialSummary | null>(result) ?? null;
  },

  async createCampaignExpense(payload: CreateCampaignExpensePayload) {
    return api.post<ApiResponse<CampaignExpense>>(`/ftcampaignexpense`, payload);
  },

  async approveCampaignExpense(id: string, payload: ApproveCampaignExpensePayload) {
    return api.put<ApiResponse<boolean>>(`/ftcampaignexpense/${id}/approve`, payload);
  },

  async rejectCampaignExpense(id: string, payload: RejectCampaignExpensePayload) {
    return api.put<ApiResponse<boolean>>(`/ftcampaignexpense/${id}/reject`, payload);
  },

  async uploadDonationProof(donationId: string, files: File[]) {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });

    return api.post<ApiResponse<{ imageUrls?: string[]; commaSeparated?: string }>>(
      `/donations/${donationId}/upload-proof`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
  },
};

export default fundService;
