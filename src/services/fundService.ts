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

  async confirmDonation(donationId: string, payload: { confirmerId: string; notes?: string }) {
    return api.post<ApiResponse<boolean>>(`/donations/${donationId}/confirm`, payload);
  },

  async rejectDonation(donationId: string, payload: { rejectedBy: string; reason?: string }) {
    return api.post<ApiResponse<boolean>>(`/donations/${donationId}/reject`, payload);
  },

  async createFundDonation(fundId: string, payload: CreateFundDonationPayload) {
    return api.post<ApiResponse<FundDonation>>(`/funds/${fundId}/donate`, payload);
  },

  async createFund(payload: CreateFundPayload) {
    return api.post<ApiResponse<Fund>>(`/funds`, payload);
  },

  async fetchCampaignsByTree(treeId: string): Promise<FundCampaign[]> {
    const result = await api.get<ApiResponse<FundCampaign[]>>(`/ftcampaign/family-tree/${treeId}`);
    return normalizeArray(unwrap<FundCampaign[] | FundCampaign>(result));
  },

  async fetchCampaignById(campaignId: string): Promise<FundCampaign | null> {
    const result = await api.get<ApiResponse<FundCampaign>>(`/ftcampaign/${campaignId}`);
    return unwrap<FundCampaign | null>(result) ?? null;
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

  async createCampaignExpense(payload: CreateCampaignExpensePayload) {
    return api.post<ApiResponse<CampaignExpense>>(`/ftcampaignexpense`, payload);
  },

  async approveCampaignExpense(id: string, payload: ApproveCampaignExpensePayload) {
    return api.put<ApiResponse<boolean>>(`/ftcampaignexpense/${id}/approve`, payload);
  },

  async rejectCampaignExpense(id: string, payload: RejectCampaignExpensePayload) {
    return api.put<ApiResponse<boolean>>(`/ftcampaignexpense/${id}/reject`, payload);
  },
};

export default fundService;
