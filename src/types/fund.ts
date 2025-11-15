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
  fundManagers?: string | null;
}

export interface FundDonation {
  id: string;
  ftFundId: string;
  ftMemberId?: string | null;
  campaignId?: string | null;
  donationMoney: number;
  donationAmount?: number | null;
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

export interface MyPendingDonation {
  id: string;
  donationMoney: number;
  donorName?: string | null;
  paymentMethod?: string | number | null;
  paymentNotes?: string | null;
  createdDate?: string | null;
  fundName?: string | null;
  fundId?: string | null;
  treeId?: string | null;
  status?: string | number | null;
  payOSOrderCode?: string | number | null;
  proofImages?: string[] | null;
}

export interface FundDonationStats {
  totalReceived?: number;
  totalPending?: number;
  totalRejected?: number;
  totalDonations?: number;
  recentDonors?: Array<{
    donorName: string;
    donationMoney: number;
    donationAmount?: number;
    confirmedOn?: string;
  }>;
  [key: string]: any;
}

export interface FundExpense {
  id: string;
  ftFundId?: string;
  fundId?: string | null;
  campaignId?: string | null;
  expenseAmount: number;
  expenseDescription?: string | null;
  expenseEvent?: string | null;
  recipient?: string | null;
  status?: string | number | null;
  approvedBy?: string | null;
  approvedOn?: string | null;
  approvalFeedback?: string | null;
  approverName?: string | null;
  plannedDate?: string | null;
  lastModifiedOn?: string | null;
  createdOn?: string | null;
  createdDate?: string | null;
  createdBy?: string | null;
  fundName?: string | null;
  campaignName?: string | null;
  receiptImages?: string | string[] | null;
  currentFundBalance?: number | null;
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
  progressPercentage?: number | null;
  totalDonations?: number | null;
  totalDonors?: number | null;
  isActive?: boolean | null;
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

export interface CampaignStatistics {
  campaignId: string;
  campaignName?: string | null;
  fundGoal?: number | null;
  currentBalance?: number | null;
  raisedAmount?: number | null;
  progressPercentage?: number | null;
  status?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  daysRemaining?: number | null;
  isActive?: boolean;
  isCompleted?: boolean;
  bankInfo?: {
    bankAccountNumber?: string | null;
    bankName?: string | null;
    bankCode?: string | null;
    accountHolderName?: string | null;
  } | null;
}

export interface CampaignFinancialSummary {
  campaignId: string;
  campaignName?: string | null;
  targetAmount?: number | null;
  totalDonations?: number | null;
  totalExpenses?: number | null;
  approvedExpenses?: number | null;
  pendingExpenses?: number | null;
  availableBalance?: number | null;
  progressPercentage?: number | null;
  totalDonors?: number | null;
  totalExpenseRequests?: number | null;
  lastDonationDate?: string | null;
  lastExpenseDate?: string | null;
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
  receiptImages?: File[];
}

export interface CreateFundExpenseResponse {
  expenseId: string;
  amount: number;
  description: string;
  status: string;
  receiptCount: number;
  receiptUrls: string[];
  warning: string | null;
}

export interface ApproveFundExpensePayload {
  approverId: string;
  notes?: string | null;
  paymentProofImages?: File[];
}

export interface ApproveFundExpenseResponse {
  id: string;
  status: string;
  approvedBy: string;
  approvedOn: string;
  deductedAmount: number;
  newFundBalance: number;
  paymentProofUrl?: string | null;
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
  paymentMethod: string | number; // "Cash" | "BankTransfer" | 0 | 1
  paymentNotes?: string;
  returnUrl?: string;
  cancelUrl?: string;
}

export interface FundDonationsResponse {
  donations: FundDonation[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface FundExpensesResponse {
  expenses: FundExpense[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface BankInfo {
  bankCode?: string | null;
  bankName?: string | null;
  accountNumber?: string | null;
  accountHolderName?: string | null;
  amount?: number | null;
  description?: string | null;
}

export interface CreateFundDonationResponse {
  donationId: string;
  orderCode?: string | null;
  qrCodeUrl?: string | null;
  bankInfo?: BankInfo | null;
  requiresManualConfirmation?: boolean;
  message?: string | null;
}

export interface ApproveCampaignExpensePayload {
  approverId: string;
  approvalNotes?: string;
}

export interface RejectCampaignExpensePayload {
  approverId: string;
  rejectionReason?: string;
}

export interface UploadDonationProofResponse {
  donationId: string;
  imageUrls?: string[] | null;
  allProofImages?: string[] | null;
  commaSeparated?: string | null;
  count?: number | null;
  totalProofs?: number | null;
}

export interface ConfirmDonationResponse {
  donationId: string;
  status?: string | null;
  statusCode?: number | null;
  amount?: number | null;
  confirmedAt?: string | null;
  proofImages?: string[] | null;
  confirmedBy?: string | null;
  newFundBalance?: number | null;
  newCampaignBalance?: number | null;
  confirmedOn?: string | null;
}

// Campaign Donation Types
export interface CreateCampaignDonationPayload {
  memberId: string;
  donorName: string;
  amount: number;
  paymentMethod: string | number; // "Cash" | "BankTransfer" | 0 | 1
  paymentNotes?: string;
  returnUrl?: string;
  cancelUrl?: string;
}

export interface CreateCampaignDonationResponse {
  donationId: string;
  orderCode?: string | number | null;
  qrCodeUrl?: string | null;
  bankInfo?: BankInfo | null;
  requiresManualConfirmation: boolean;
  message?: string | null;
}

export interface CampaignDonationProofResponse {
  donationId: string;
  imageUrls?: string[] | null;
  allProofImages?: string[] | null;
  commaSeparated?: string | null;
  count?: number | null;
  totalProofs?: number | null;
}

export interface ConfirmCampaignDonationResponse {
  donationId: string;
  status?: string | null;
  amount?: number | null;
  proofImages?: string[] | null;
  confirmedBy?: string | null;
  confirmedOn?: string | null;
  newCampaignBalance?: number | null;
}

export type FundApiResponse<T> = ApiResponse<T>;
