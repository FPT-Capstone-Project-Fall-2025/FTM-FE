import type { ApiResponse } from './api';

export interface Fund {
  id: string;
  ftId: string;
  fundName: string;
  currentMoney: number;
  donationCount?: number | null;
  expenseCount?: number | null;
  fundNote?: string | null;
  description?: string | null;
  lastModifiedOn?: string | null;
  lastModifiedBy?: string | null;
  createdOn?: string | null;
  accountHolderName?: string | null;
  bankAccountNumber?: string | null;
  bankCode?: string | null;
  bankName?: string | null;
  isActive?: boolean;
}

export interface FundDonation {
  id: string;
  ftFundId: string;
  ftMemberId?: string | null;
  campaignId?: string | null;
  donationMoney: number;
  donorName?: string | null;
  paymentMethod?: string | number | null;
  paymentNotes?: string | null;
  paymentTransactionId?: string | null;
  status?: string | number | null;
  confirmedBy?: string | null;
  confirmedOn?: string | null;
  confirmationNotes?: string | null;
  payOSOrderCode?: string | number | null;
  lastModifiedOn?: string | null;
  createdOn?: string | null;
}

export interface FundDonationStats {
  totalReceived?: number;
  totalPending?: number;
  totalRejected?: number;
  totalDonations?: number;
  recentDonors?: Array<{
    donorName: string;
    donationMoney: number;
    confirmedOn?: string;
  }>;
  [key: string]: any;
}

export interface FundExpense {
  id: string;
  ftFundId: string;
  campaignId?: string | null;
  expenseAmount: number;
  expenseDescription?: string | null;
  expenseEvent?: string | null;
  recipient?: string | null;
  status?: string | number | null;
  approvedBy?: string | null;
  approvedOn?: string | null;
  approvalFeedback?: string | null;
  plannedDate?: string | null;
  lastModifiedOn?: string | null;
  createdOn?: string | null;
  createdBy?: string | null;
}

export interface FundCampaign {
  id: string;
  ftId: string;
  campaignName: string;
  campaignDescription?: string | null;
  campaignManagerId?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  fundGoal?: number | null;
  currentBalance?: number | null;
  status?: string | number | null;
  lastModifiedOn?: string | null;
  createdOn?: string | null;
  imageUrl?: string | null;
  isPublic?: boolean;
  notes?: string | null;
  accountHolderName?: string | null;
  bankAccountNumber?: string | null;
  bankCode?: string | null;
  bankName?: string | null;
}

export interface CampaignDonation {
  id: string;
  campaignId: string;
  ftMemberId?: string | null;
  donorName?: string | null;
  donationAmount?: number | null;
  donationMoney?: number | null;
  paymentMethod?: string | number | null;
  donorNotes?: string | null;
  status?: string | number | null;
  confirmedBy?: string | null;
  confirmedOn?: string | null;
  createdOn?: string | null;
}

export interface CampaignExpense {
  id: string;
  campaignId: string;
  expenseTitle?: string | null;
  expenseDescription?: string | null;
  category?: string | null;
  expenseAmount?: number | null;
  expenseDate?: string | null;
  authorizedBy?: string | null;
  paymentMethod?: string | null;
  notes?: string | null;
  approvalStatus?: string | number | null;
  approvedBy?: string | null;
  approvedOn?: string | null;
  createdOn?: string | null;
}

export interface CreateFundExpensePayload {
  fundId: string;
  campaignId?: string | null;
  amount: number;
  description: string;
  expenseEvent?: string | null;
  recipient: string;
  plannedDate?: string | null;
}

export interface ApproveFundExpensePayload {
  approverId: string;
  notes?: string | null;
}

export interface RejectFundExpensePayload {
  rejectedBy: string;
  reason?: string | null;
}

export interface CreateCampaignPayload {
  familyTreeId: string;
  campaignName: string;
  campaignDescription?: string;
  organizerName?: string;
  organizerContact?: string;
  campaignManagerId?: string;
  startDate?: string;
  endDate?: string;
  fundGoal?: number;
  mediaAttachments?: string;
  bankAccountNumber?: string;
  bankName?: string;
  bankCode?: string;
  accountHolderName?: string;
  notes?: string;
  isPublic?: boolean;
  imageUrl?: string;
}

export interface CreateCampaignExpensePayload {
  campaignId: string;
  amount: number;
  description: string;
  category?: string;
  receiptImages?: string;
  authorizedBy: string;
}

export interface CreateFundPayload {
  familyTreeId: string;
  fundName: string;
  description?: string;
  bankAccountNumber: string;
  bankCode: string;
  bankName: string;
  accountHolderName: string;
}

export interface CreateFundDonationPayload {
  memberId: string;
  donorName: string;
  amount: number;
  paymentMethod: string;
  paymentNotes?: string;
  returnUrl?: string;
  cancelUrl?: string;
}

export interface ApproveCampaignExpensePayload {
  approverId: string;
  approvalNotes?: string;
}

export interface RejectCampaignExpensePayload {
  approverId: string;
  rejectionReason?: string;
}

export type FundApiResponse<T> = ApiResponse<T>;
