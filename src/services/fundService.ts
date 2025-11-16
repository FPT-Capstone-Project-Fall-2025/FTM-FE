import api from './apiService';
import type {
  Fund,
  FundDonationStats,
  FundExpense,
  FundCampaign,
  CampaignDonation,
  CampaignExpense,
  CreateFundExpensePayload,
  CreateFundExpenseResponse,
  ApproveFundExpensePayload,
  ApproveFundExpenseResponse,
  RejectFundExpensePayload,
  CreateCampaignPayload,
  CreateCampaignExpensePayload,
  ApproveCampaignExpensePayload,
  RejectCampaignExpensePayload,
  CreateFundPayload,
  CreateFundDonationPayload,
  CreateFundDonationResponse,
  FundDonationsResponse,
  FundExpensesResponse,
  MyPendingDonation,
  CampaignStatistics,
  CampaignFinancialSummary,
  UploadDonationProofResponse,
  ConfirmDonationResponse,
  CreateCampaignDonationPayload,
  CreateCampaignDonationResponse,
  CampaignDonationProofResponse,
  ConfirmCampaignDonationResponse,
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

  // Approve campaign expense with payment proof (manager)
  async approveCampaignExpenseWithProof(
    expenseId: string,
    payload: { approverId: string; notes?: string; paymentProofImages: File[] }
  ): Promise<{
    expenseId: string;
    status: string;
    paymentProofUrl?: string;
    approvedBy?: string;
    approvalNotes?: string;
  }> {
    if (!payload.paymentProofImages || payload.paymentProofImages.length === 0) {
      throw new Error('Payment proof image is required for approval');
    }
    const formData = new FormData();
    formData.append('ApproverId', payload.approverId);
    formData.append('Notes', payload.notes || '');
    payload.paymentProofImages.forEach(file => {
      formData.append('PaymentProofImage', file);
    });
    const response = await api.post<ApiResponse<any>>(
      `/FTCampaignExpense/${encodeURIComponent(expenseId)}/approve`,
      formData
    );
    const data = unwrap<any>(response)?.data ?? unwrap<any>(response);
    return {
      expenseId: data?.expenseId ?? expenseId,
      status: data?.status ?? 'Approved',
      paymentProofUrl: data?.paymentProofUrl,
      approvedBy: data?.approvedBy,
      approvalNotes: data?.approvalNotes,
    };
  },

  // Reject campaign expense (manager)
  async rejectCampaignExpenseManager(
    expenseId: string,
    payload: { approverId: string; notes?: string }
  ): Promise<boolean> {
    const body = {
      ApproverId: payload.approverId,
      Notes: payload.notes || '',
    };
    const response = await api.post<ApiResponse<boolean>>(
      `/FTCampaignExpense/${encodeURIComponent(expenseId)}/reject`,
      body
    );
    const data = unwrap<boolean>(response);
    return Boolean(data);
  },

  // Create campaign expense request with optional receipt images (multipart)
  async createCampaignExpense(payload: {
    campaignId: string;
    requestedById: string;
    amount: number;
    description: string;
    notes?: string;
    category?: string;
    expenseDate?: string | null;
    receipts?: File[];
  }): Promise<{
    expenseId: string;
    amount: number;
    description: string;
    status: string;
    receiptCount: number;
    receiptUrls: string[];
  }> {
    // Build form-data with exact field names per new API (see Postman screenshot)
    const form = new FormData();
    form.append('CampaignId', payload.campaignId);
    form.append('Amount', String(payload.amount));
    form.append('Description', payload.description || '');
    if (payload.category !== undefined && payload.category !== null) {
      form.append('Category', String(payload.category));
    }
    // AuthorizedBy corresponds to the requesting member id
    form.append('AuthorizedBy', payload.requestedById);
    // Append receipt images (multiple)
    (payload.receipts || []).forEach(file => {
      form.append('ReceiptImages', file);
    });
    // Do NOT manually set Content-Type so boundary is added automatically
    const response = await api.post<ApiResponse<any>>('/FTCampaignExpense', form);
    const data = unwrap<any>(response);
    const d = data?.data ?? data;
    return {
      expenseId: d?.expenseId ?? d?.id ?? '',
      amount: Number(d?.amount ?? payload.amount ?? 0),
      description: d?.description ?? payload.description ?? '',
      status: d?.status ?? 'Pending',
      receiptCount: Number(d?.receiptCount ?? (Array.isArray(d?.receiptUrls) ? d.receiptUrls.length : 0) ?? 0),
      receiptUrls:
        typeof d?.receiptUrls === 'string'
          ? d.receiptUrls.split(',').map((s: string) => s.trim()).filter(Boolean)
          : Array.isArray(d?.receiptUrls)
          ? d.receiptUrls
          : [],
    };
  },

  // Get expenses by campaign with pagination
  async fetchCampaignExpenses(campaignId: string, page = 1, pageSize = 20): Promise<{
    items: Array<{
      id: string;
      campaignId: string;
      campaignName: string | null;
      title: string | null;
      description: string | null;
      amount: number;
      category: string | null;
      categoryName: string | null;
      expenseDate: string | null;
      receiptUrls: string[];
      notes: string | null;
      status: string | null;
      requestedById: string | null;
      requestedByName: string | null;
      approvedById: string | null;
      approvedByName: string | null;
      approvedAt: string | null;
      approvalNotes: string | null;
      createdAt: string | null;
      updatedAt: string | null;
    }>;
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  }> {
    const response = await api.get<ApiResponse<any>>(
      `/FTCampaignExpense/campaign/${encodeURIComponent(campaignId)}`,
      { params: { page, pageSize } }
    );
    const data = unwrap<any>(response)?.data ?? unwrap<any>(response);
    const items = Array.isArray(data?.items) ? data.items : normalizeArray(data?.items ?? []);
    return {
      items: items.map((e: any) => ({
        id: e.id,
        campaignId: e.campaignId,
        campaignName: e.campaignName ?? null,
        title: e.title ?? null,
        description: e.description ?? null,
        amount: Number(e.amount ?? 0),
        category: e.category ?? null,
        categoryName: e.categoryName ?? null,
        expenseDate: e.expenseDate ?? null,
        receiptUrls:
          typeof e.receiptUrl === 'string'
            ? e.receiptUrl.split(',').map((s: string) => s.trim()).filter(Boolean)
            : Array.isArray(e.receiptUrl)
            ? e.receiptUrl
            : [],
        notes: e.notes ?? null,
        status: e.status ?? e.statusName ?? null,
        requestedById: e.requestedById ?? null,
        requestedByName: e.requestedByName ?? null,
        approvedById: e.approvedById ?? null,
        approvedByName: e.approvedByName ?? null,
        approvedAt: e.approvedAt ?? null,
        approvalNotes: e.approvalNotes ?? null,
        createdAt: e.createdAt ?? null,
        updatedAt: e.updatedAt ?? null,
      })),
      page: Number(data?.page ?? page),
      pageSize: Number(data?.pageSize ?? pageSize),
      totalCount: Number(data?.totalCount ?? 0),
      totalPages: Number(data?.totalPages ?? 1),
    };
  },

  // Get pending expenses for manager by memberId
  async fetchPendingCampaignExpensesForManager(
    memberId: string,
    page = 1,
    pageSize = 20
  ): Promise<{
    items: Array<{
      id: string;
      campaignId: string;
      campaignName: string | null;
      description: string | null;
      amount: number;
      receiptUrls: string[];
      status: string | null;
      requestedById: string | null;
      requestedByName: string | null;
      createdAt: string | null;
    }>;
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  }> {
    const response = await api.get<ApiResponse<any>>(
      `/FTCampaignExpense/pending/manager/${encodeURIComponent(memberId)}`,
      { params: { page, pageSize } }
    );
    const data = unwrap<any>(response)?.data ?? unwrap<any>(response);
    const items = Array.isArray(data?.items) ? data.items : normalizeArray(data?.items ?? []);
    return {
      items: items.map((e: any) => ({
        id: e.id,
        campaignId: e.campaignId,
        campaignName: e.campaignName ?? null,
        description: e.description ?? null,
        amount: Number(e.amount ?? 0),
        receiptUrls:
          typeof e.receiptUrl === 'string'
            ? e.receiptUrl.split(',').map((s: string) => s.trim()).filter(Boolean)
            : Array.isArray(e.receiptUrl)
            ? e.receiptUrl
            : [],
        status: e.status ?? e.statusName ?? null,
        requestedById: e.requestedById ?? null,
        requestedByName: e.requestedByName ?? null,
        createdAt: e.createdAt ?? null,
      })),
      page: Number(data?.page ?? page),
      pageSize: Number(data?.pageSize ?? pageSize),
      totalCount: Number(data?.totalCount ?? 0),
      totalPages: Number(data?.totalPages ?? 1),
    };
  },

  async fetchCampaignDonationsByUser(
    userId: string,
    page = 1,
    pageSize = 10
  ): Promise<{
    items: Array<{
      id: string;
      campaignId: string;
      campaignName: string | null;
      donorId: string | null;
      donorName: string | null;
      amount: number;
      message: string | null;
      isAnonymous: boolean;
      status: string | null;
      payOSOrderCode: string | number | null;
      transactionId: string | null;
      proofImages: string[];
      createdAt: string | null;
      completedAt: string | null;
      updatedAt: string | null;
    }>;
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
    hasPrevious: boolean;
    hasNext: boolean;
  }> {
    const response = await api.get<ApiResponse<any>>(
      `/ftcampaigndonation/user/${encodeURIComponent(userId)}`,
      { params: { page, pageSize } }
    );
    const data = unwrap<any>(response);
    const payload = data?.items ?? [];
    const items = Array.isArray(payload) ? payload : normalizeArray(payload);
    return {
      items: items.map((item: any) => ({
        id: item.id,
        campaignId: item.campaignId,
        campaignName: item.campaignName ?? null,
        donorId: item.donorId ?? null,
        donorName: item.donorName ?? null,
        amount: Number(item.amount ?? 0),
        message: item.message ?? null,
        isAnonymous: Boolean(item.isAnonymous),
        status: item.status ?? null,
        payOSOrderCode: item.payOSOrderCode ?? null,
        transactionId: item.transactionId ?? null,
        proofImages:
          typeof item.proofImages === 'string'
            ? item.proofImages
                .split(',')
                .map((s: string) => s.trim())
                .filter(Boolean)
            : Array.isArray(item.proofImages)
            ? item.proofImages
            : [],
        createdAt: item.createdAt ?? null,
        completedAt: item.completedAt ?? null,
        updatedAt: item.updatedAt ?? null,
      })),
      page: Number(data?.page ?? page),
      pageSize: Number(data?.pageSize ?? pageSize),
      totalCount: Number(data?.totalCount ?? items.length ?? 0),
      totalPages: Number(data?.totalPages ?? 1),
      hasPrevious: Boolean(data?.hasPrevious ?? page > 1),
      hasNext: Boolean(
        data?.hasNext ?? Number(data?.page ?? page) < Number(data?.totalPages ?? 1)
      ),
    };
  },

  async fetchFundExpenses(
    fundId: string,
    page = 1,
    pageSize = 20
  ): Promise<FundExpensesResponse> {
    const response = await api.get<ApiResponse<FundExpensesResponse>>(
      `/fund-expenses/fund/${fundId}`,
      {
        params: {
          page,
          pageSize,
        },
      }
    );
    const data = unwrap<FundExpensesResponse>(response);
    if (!data) {
      return {
        expenses: [],
        totalCount: 0,
        page: 1,
        pageSize: pageSize,
        totalPages: 1,
      };
    }
    // Handle case where response might be direct array (backward compatibility)
    if (Array.isArray(data)) {
      // Normalize expenses: map createdDate to createdOn for backward compatibility
      const normalizedExpenses = data.map((expense: any) => ({
        ...expense,
        createdOn: expense.createdOn || expense.createdDate,
      }));
      return {
        expenses: normalizedExpenses,
        totalCount: data.length,
        page: 1,
        pageSize: data.length,
        totalPages: 1,
      };
    }
    // Handle nested structure with expenses array
    if ('expenses' in data) {
      const expensesArray = Array.isArray(data.expenses) ? data.expenses : [];
      // Normalize expenses: map createdDate to createdOn for backward compatibility
      const normalizedExpenses = expensesArray.map((expense: any) => ({
        ...expense,
        createdOn: expense.createdOn || expense.createdDate,
      }));
      return {
        expenses: normalizedExpenses,
        totalCount: data.totalCount ?? expensesArray.length,
        page: data.page ?? page,
        pageSize: data.pageSize ?? pageSize,
        totalPages: data.totalPages ?? 1,
      };
    }
    // Default fallback
    return {
      expenses: [],
      totalCount: 0,
      page: page,
      pageSize: pageSize,
      totalPages: 1,
    };
  },

  async fetchPendingFundExpenses(treeId: string): Promise<FundExpense[]> {
    const result = await api.get<ApiResponse<FundExpense[]>>(`/fund-expenses/pending`, {
      params: {
        treeId,
      },
    });
    return normalizeArray(unwrap<FundExpense[] | FundExpense>(result));
  },

  async createFundExpense(payload: CreateFundExpensePayload): Promise<CreateFundExpenseResponse> {
    // Always use FormData as the API expects form-data format
    const formData = new FormData();
    
    // Required fields with exact field names as per API
    formData.append('FundId', payload.fundId);
    formData.append('Amount', payload.amount.toString());
    formData.append('Description', payload.description);
    formData.append('Recipient', payload.recipient);
    
    // Optional fields
    if (payload.campaignId) {
      formData.append('CampaignId', payload.campaignId);
    }
    if (payload.expenseEvent) {
      formData.append('ExpenseEvent', payload.expenseEvent);
    }
    if (payload.plannedDate) {
      // Format date as ISO string if needed
      const dateValue = payload.plannedDate.includes('T') 
        ? payload.plannedDate 
        : `${payload.plannedDate}T00:00:00Z`;
      formData.append('PlannedDate', dateValue);
    }
    
    // Append receipt images if provided
    if (payload.receiptImages && payload.receiptImages.length > 0) {
      payload.receiptImages.forEach(file => {
        formData.append('ReceiptImages', file);
      });
    }

    // Don't set Content-Type header manually - let axios set it automatically with boundary
    const response = await api.post<ApiResponse<CreateFundExpenseResponse>>(
      `/fund-expenses`,
      formData
    );
    
    const data = unwrap<CreateFundExpenseResponse>(response);
    if (!data) {
      throw new Error('Invalid response from server');
    }
    return data;
  },

  async approveFundExpense(id: string, payload: ApproveFundExpensePayload): Promise<ApproveFundExpenseResponse> {
    const hasImages = payload.paymentProofImages && payload.paymentProofImages.length > 0;
    
    console.log('[fundService.approveFundExpense] Approving expense:', {
      expenseId: id,
      approverId: payload.approverId,
      notes: payload.notes,
      hasPaymentProofImages: hasImages,
      imageCount: payload.paymentProofImages?.length || 0,
      imageNames: payload.paymentProofImages?.map(f => f.name) || [],
      imageTypes: payload.paymentProofImages?.map(f => f.type) || [],
      imageSizes: payload.paymentProofImages?.map(f => f.size) || [],
    });

    if (!hasImages) {
      throw new Error('Payment proof image is required for approval');
    }

    // Always use FormData (API requires payment proof images)
    const formData = new FormData();
    formData.append('ApproverId', payload.approverId);
    
    // Always append Notes (even if empty) to match API expectations
    formData.append('Notes', payload.notes || '');
    
    // Append payment proof images - API requires at least one
    // Try singular field name first (some APIs use singular for single file, plural for multiple)
    // If that doesn't work, we can try 'PaymentProofImages' (plural)
    if (payload.paymentProofImages) {
      payload.paymentProofImages.forEach(file => {
        console.log('[fundService.approveFundExpense] Appending file:', {
          name: file.name,
          size: file.size,
          type: file.type,
          isFile: file instanceof File,
          constructor: file.constructor.name,
        });
        // Try singular field name - some .NET APIs expect singular for IFormFile collections
        formData.append('PaymentProofImage', file);
      });
    }

    // Log FormData contents for debugging
    console.log('[fundService.approveFundExpense] FormData contents:');
    const formDataEntries: Array<[string, any]> = [];
    for (const [key, value] of formData.entries()) {
      formDataEntries.push([key, value]);
      if (value instanceof File) {
        console.log(`  ${key}: File(${value.name}, ${value.size} bytes, ${value.type})`);
      } else {
        console.log(`  ${key}: ${value}`);
      }
    }
    
    // Verify files are actually in FormData
    const fileEntries = formDataEntries.filter(([_, value]) => value instanceof File);
    console.log('[fundService.approveFundExpense] FormData file entries count:', fileEntries.length);
    
    if (fileEntries.length === 0) {
      console.error('[fundService.approveFundExpense] ERROR: No files found in FormData!');
      throw new Error('Payment proof images could not be added to request');
    }

    const response = await api.post<ApiResponse<ApproveFundExpenseResponse>>(
      `/fund-expenses/${id}/approve`,
      formData
    );
    
    const data = unwrap<ApproveFundExpenseResponse>(response);
    if (!data) {
      throw new Error('Invalid response from server');
    }
    return data;
  },

  async rejectFundExpense(id: string, payload: RejectFundExpensePayload) {
    return api.post<ApiResponse<boolean>>(`/fund-expenses/${id}/reject`, payload);
  },

  async fetchFundDonations(
    fundId: string,
    page = 1,
    pageSize = 20
  ): Promise<FundDonationsResponse> {
    const response = await api.get<ApiResponse<FundDonationsResponse>>(
      `/donations/fund/${fundId}`,
      {
        params: {
          page,
          pageSize,
        },
      }
    );
    const data = unwrap<FundDonationsResponse>(response);
    if (!data) {
      return {
        donations: [],
        totalCount: 0,
        page: 1,
        pageSize: pageSize,
        totalPages: 1,
      };
    }
    // Handle case where response might be direct array (backward compatibility)
    if (Array.isArray(data)) {
      return {
        donations: data,
        totalCount: data.length,
        page: 1,
        pageSize: data.length,
        totalPages: 1,
      };
    }
    // Handle nested structure with donations array
    if ('donations' in data && Array.isArray(data.donations)) {
      return {
        donations: data.donations,
        totalCount: data.totalCount ?? data.donations.length,
        page: data.page ?? page,
        pageSize: data.pageSize ?? pageSize,
        totalPages: data.totalPages ?? 1,
      };
    }
    // Default fallback
    return {
      donations: [],
      totalCount: 0,
      page: page,
      pageSize: pageSize,
      totalPages: 1,
    };
  },

  async fetchFundDonationStats(fundId: string): Promise<FundDonationStats | null> {
    const result = await api.get<ApiResponse<FundDonationStats>>(`/donations/fund/${fundId}/stats`);
    return unwrap<FundDonationStats | null>(result) ?? null;
  },

  async fetchPendingDonations(): Promise<MyPendingDonation[]> {
    const result = await api.get<ApiResponse<MyPendingDonation[]>>(`/donations/pending`);
    return normalizeArray(unwrap<MyPendingDonation[] | MyPendingDonation>(result));
  },

  async confirmDonation(
    donationId: string,
    payload: { donationId: string; confirmedBy: string; notes?: string }
  ) {
    return api.post<ApiResponse<ConfirmDonationResponse>>(`/donations/${donationId}/confirm`, payload);
  },

  async uploadDonationProof(donationId: string, files: File[]): Promise<UploadDonationProofResponse> {
    console.log('[fundService.uploadDonationProof] Starting upload proof', {
      donationId,
      filesCount: files.length,
      fileNames: files.map(f => f.name),
      fileSizes: files.map(f => f.size),
    });

    const formData = new FormData();
    // API expects 'images' key, not 'files'
    files.forEach(file => {
      formData.append('images', file);
    });

    const url = `/donations/${donationId}/upload-proof`;
    console.log('[fundService.uploadDonationProof] API URL:', url);
    console.log('[fundService.uploadDonationProof] fundDonationId:', donationId);
    console.log('[fundService.uploadDonationProof] FormData keys:', Array.from(formData.keys()));
    console.log('[fundService.uploadDonationProof] FormData entries:', Array.from(formData.entries()).map(([key, value]) => ({
      key,
      value: value instanceof File ? { name: value.name, size: value.size, type: value.type } : value,
    })));

    // Don't set Content-Type header manually - let axios set it automatically with boundary
    // Setting it manually prevents axios from adding the boundary parameter
    // When sending FormData, axios will automatically set Content-Type: multipart/form-data; boundary=...
    const response = await api.post<ApiResponse<UploadDonationProofResponse>>(
      url,
      formData
      // Don't pass headers config - let axios handle FormData automatically
    );

    console.log('[fundService.uploadDonationProof] API Response:', response);

    const data = unwrap<UploadDonationProofResponse>(response);
    console.log('[fundService.uploadDonationProof] Unwrapped data:', data);

    if (!data) {
      console.error('[fundService.uploadDonationProof] Invalid response from server');
      throw new Error('Invalid response from server');
    }

    console.log('[fundService.uploadDonationProof] Upload successful', {
      donationId: data.donationId,
      imageUrlsCount: data.imageUrls?.length || 0,
      allProofImagesCount: data.allProofImages?.length || 0,
      totalProofs: data.totalProofs,
    });

    return data;
  },

  async rejectDonation(donationId: string, payload: { rejectedBy: string; reason?: string }) {
    return api.post<ApiResponse<boolean>>(`/donations/${donationId}/reject`, payload);
  },

  async createFundDonation(
    fundId: string,
    payload: CreateFundDonationPayload
  ): Promise<CreateFundDonationResponse> {
    const response = await api.post<ApiResponse<CreateFundDonationResponse>>(
      `/funds/${fundId}/donate`,
      payload
    );
    const data = unwrap<CreateFundDonationResponse>(response);
    if (!data) {
      throw new Error('Invalid response from server');
    }
    return data;
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

  async updateFund(fundId: string, payload: {
    fundName: string;
    description?: string;
    bankAccountNumber: string;
    bankCode: string;
    bankName: string;
    accountHolderName: string;
    fundManagers?: string;
  }) {
    return api.put<ApiResponse<Fund>>(`/funds/${fundId}`, payload);
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
      // API returns status as string: "Active", "Completed", "Cancelled", etc.
      if (payload.status) {
        const statusStr = String(payload.status).toLowerCase();
        if (statusStr === 'active') return 'active';
        if (statusStr === 'completed') return 'completed';
        if (statusStr === 'cancelled') return 'cancelled';
        return 'upcoming';
      }
      // Fallback logic if status is not provided
      const now = new Date();
      const endDate = payload.endDate ? new Date(payload.endDate) : null;
      const progress = Number(payload.progressPercentage ?? 0);
      if (progress >= 100) return 'completed';
      if (payload.isActive === false && endDate && endDate < now) return 'completed';
      if (payload.isActive) return 'active';
      return 'upcoming';
    };

    // Calculate progress percentage if not provided
    const calculateProgress = (): number | null => {
      if (payload.progressPercentage !== undefined) {
        return Number(payload.progressPercentage);
      }
      if (payload.fundGoal && payload.currentBalance !== undefined) {
        const goal = Number(payload.fundGoal);
        const current = Number(payload.currentBalance);
        if (goal > 0) {
          return Math.min(100, Math.round((current / goal) * 100 * 100) / 100);
        }
      }
      return null;
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
      accountHolderName: payload.accountHolderName ?? payload.beneficiaryInfo ?? null,
      bankAccountNumber: payload.bankAccountNumber ?? null,
      bankCode: payload.bankCode ?? null,
      bankName: payload.bankName ?? null,
      progressPercentage: calculateProgress(),
      totalDonations: payload.totalDonations !== undefined ? Number(payload.totalDonations) : (payload.donations?.length ?? null),
      totalDonors: payload.totalDonors !== undefined ? Number(payload.totalDonors) : null,
      isActive: ((payload.status?.toLowerCase() === 'active') || payload.isActive) ?? null,
    };
  },

  async createCampaign(payload: CreateCampaignPayload) {
    return api.post<ApiResponse<FundCampaign>>(`/ftcampaign`, payload);
  },

  async fetchCampaignDonations(campaignId: string): Promise<CampaignDonation[]> {
    const result = await api.get<ApiResponse<CampaignDonation[]>>(`/ftcampaign/${campaignId}/donations`);
    return normalizeArray(unwrap<CampaignDonation[] | CampaignDonation>(result));
  },

  async fetchCampaignDonationsByCampaign(
    campaignId: string,
    page = 1,
    pageSize = 20
  ): Promise<{
    items: Array<{
      id: string;
      campaignId: string;
      donorName: string | null;
      amount: number;
      message: string | null;
      isAnonymous: boolean;
      status: string | null;
      payOSOrderCode: string | number | null;
      transactionId: string | null;
      proofImages: string[];
      createdAt: string | null;
      updatedAt: string | null;
      completedAt: string | null;
    }>;
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
    hasPrevious: boolean;
    hasNext: boolean;
  }> {
    const response = await api.get<ApiResponse<any>>(
      `/ftcampaigndonation/campaign/${campaignId}`,
      { params: { page, pageSize } }
    );
    const payload = unwrap<any>(response) ?? {};
    const rawItems = normalizeArray(payload?.items);
    const items = rawItems.map((item: any) => ({
      id: item.id,
      campaignId: item.campaignId,
      donorName: item.donorName ?? null,
      amount: Number(item.amount ?? 0),
      message: item.message ?? null,
      isAnonymous: Boolean(item.isAnonymous),
      status: item.status ?? null,
      payOSOrderCode: item.payOSOrderCode ?? null,
      transactionId: item.transactionId ?? null,
      proofImages: typeof item.proofImages === 'string'
        ? item.proofImages.split(',').map((s: string) => s.trim()).filter(Boolean)
        : (Array.isArray(item.proofImages) ? item.proofImages : []),
      createdAt: item.createdAt ?? null,
      updatedAt: item.updatedAt ?? null,
      completedAt: item.completedAt ?? null,
    }));

    return {
      items,
      page: payload?.page ?? page,
      pageSize: payload?.pageSize ?? pageSize,
      totalPages: payload?.totalPages ?? 1,
      totalCount: payload?.totalCount ?? items.length,
      hasPrevious: payload?.hasPrevious ?? false,
      hasNext: payload?.hasNext ?? false,
    };
  },

  async fetchPendingCampaignDonationsByTree(
    familyTreeId: string
  ): Promise<Array<{
    id: string;
    campaignId: string;
    campaignName: string | null;
    donorName: string | null;
    amount: number;
    message: string | null;
    isAnonymous: boolean;
    status: string | null;
    payOSOrderCode: string | number | null;
    transactionId: string | null;
    proofImages: string[];
    createdAt: string | null;
    updatedAt: string | null;
    completedAt: string | null;
  }>> {
    const response = await api.get<ApiResponse<any>>(
      `/ftcampaigndonation/pending`,
      { params: { familyTreeId } }
    );
    const payload = unwrap<any>(response) ?? [];
    const items = Array.isArray(payload) ? payload : normalizeArray(payload);
    return items.map((item: any) => ({
      id: item.id,
      campaignId: item.campaignId,
      campaignName: item.campaignName ?? null,
      donorName: item.donorName ?? null,
      amount: Number(item.amount ?? 0),
      message: item.message ?? null,
      isAnonymous: Boolean(item.isAnonymous),
      status: item.status ?? null,
      payOSOrderCode: item.payOSOrderCode ?? null,
      transactionId: item.transactionId ?? null,
      proofImages: typeof item.proofImages === 'string'
        ? item.proofImages.split(',').map((s: string) => s.trim()).filter(Boolean)
        : (Array.isArray(item.proofImages) ? item.proofImages : []),
      createdAt: item.createdAt ?? null,
      updatedAt: item.updatedAt ?? null,
      completedAt: item.completedAt ?? null,
    }));
  },

  async fetchCampaignExpenses(campaignId: string): Promise<CampaignExpense[]> {
    const result = await api.get<ApiResponse<CampaignExpense[]>>(`/ftcampaign/${campaignId}/expenses`);
    return normalizeArray(unwrap<CampaignExpense[] | CampaignExpense>(result));
  },

  async fetchCampaignStatistics(campaignId: string): Promise<CampaignStatistics | null> {
    const result = await api.get<ApiResponse<CampaignStatistics>>(
      `/ftcampaign/${campaignId}/statistics`
    );
    const data = unwrap<CampaignStatistics | null>(result);
    return data ?? null;
  },

  async fetchCampaignFinancialSummary(campaignId: string): Promise<CampaignFinancialSummary | null> {
    const result = await api.get<ApiResponse<CampaignFinancialSummary>>(
      `/ftcampaign/${campaignId}/financial-summary`
    );
    return unwrap<CampaignFinancialSummary | null>(result) ?? null;
  },

  // Legacy JSON variant (kept for reference; do not use)
  async createCampaignExpenseJsonLegacy(payload: CreateCampaignExpensePayload) {
    return api.post<ApiResponse<CampaignExpense>>(`/FTCampaignExpense`, payload);
  },

  async approveCampaignExpense(id: string, payload: ApproveCampaignExpensePayload) {
    return api.put<ApiResponse<boolean>>(`/FTCampaignExpense/${id}/approve`, payload);
  },

  async rejectCampaignExpense(id: string, payload: RejectCampaignExpensePayload) {
    return api.put<ApiResponse<boolean>>(`/FTCampaignExpense/${id}/reject`, payload);
  },

  // Campaign Donation APIs
  async createCampaignDonation(
    campaignId: string,
    payload: CreateCampaignDonationPayload
  ): Promise<CreateCampaignDonationResponse> {
    console.log('[fundService.createCampaignDonation] Starting donation', {
      campaignId,
      payload,
    });

    const response = await api.post<ApiResponse<CreateCampaignDonationResponse>>(
      `/ftcampaigndonation/campaign/${campaignId}/donate`,
      payload
    );

    console.log('[fundService.createCampaignDonation] API Response:', response);

    const data = unwrap<CreateCampaignDonationResponse>(response);
    console.log('[fundService.createCampaignDonation] Unwrapped data:', data);

    if (!data) {
      console.error('[fundService.createCampaignDonation] Invalid response from server');
      throw new Error('Invalid response from server');
    }

    console.log('[fundService.createCampaignDonation] Donation created successfully', {
      donationId: data.donationId,
      requiresManualConfirmation: data.requiresManualConfirmation,
    });

    return data;
  },

  async uploadCampaignDonationProof(
    donationId: string,
    files: File[]
  ): Promise<CampaignDonationProofResponse> {
    console.log('[fundService.uploadCampaignDonationProof] Starting upload proof', {
      donationId,
      filesCount: files.length,
      fileNames: files.map(f => f.name),
      fileSizes: files.map(f => f.size),
    });

    const formData = new FormData();
    // API expects 'images' key
    files.forEach(file => {
      formData.append('images', file);
    });

    const url = `/ftcampaigndonation/${donationId}/upload-proof`;
    console.log('[fundService.uploadCampaignDonationProof] API URL:', url);
    console.log('[fundService.uploadCampaignDonationProof] donationId:', donationId);
    console.log('[fundService.uploadCampaignDonationProof] FormData keys:', Array.from(formData.keys()));

    // Don't set Content-Type header manually - let axios set it automatically with boundary
    const response = await api.post<ApiResponse<CampaignDonationProofResponse>>(url, formData);

    console.log('[fundService.uploadCampaignDonationProof] API Response:', response);

    const data = unwrap<CampaignDonationProofResponse>(response);
    console.log('[fundService.uploadCampaignDonationProof] Unwrapped data:', data);

    if (!data) {
      console.error('[fundService.uploadCampaignDonationProof] Invalid response from server');
      throw new Error('Invalid response from server');
    }

    console.log('[fundService.uploadCampaignDonationProof] Upload successful', {
      donationId: data.donationId,
      imageUrlsCount: data.imageUrls?.length || 0,
      allProofImagesCount: data.allProofImages?.length || 0,
      totalProofs: data.totalProofs,
    });

    return data;
  },

  async confirmCampaignDonation(
    donationId: string,
    payload: { donationId: string; confirmedBy: string; notes?: string }
  ): Promise<ConfirmCampaignDonationResponse> {
    console.log('[fundService.confirmCampaignDonation] Starting confirmation', {
      donationId,
      payload,
    });

    const response = await api.post<ApiResponse<ConfirmCampaignDonationResponse>>(
      `/ftcampaigndonation/${donationId}/confirm`,
      payload
    );

    console.log('[fundService.confirmCampaignDonation] API Response:', response);

    const data = unwrap<ConfirmCampaignDonationResponse>(response);
    console.log('[fundService.confirmCampaignDonation] Unwrapped data:', data);

    if (!data) {
      console.error('[fundService.confirmCampaignDonation] Invalid response from server');
      throw new Error('Invalid response from server');
    }

    console.log('[fundService.confirmCampaignDonation] Confirmation successful', {
      donationId: data.donationId,
      status: data.status,
      newCampaignBalance: data.newCampaignBalance,
    });

    return data;
  },

  async fetchMyPendingCampaignDonations(gpMemberId: string): Promise<Array<{
    id: string;
    campaignId: string;
    campaignName: string | null;
    donorName: string | null;
    amount: number;
    message: string | null;
    isAnonymous: boolean;
    status: string | null;
    payOSOrderCode: string | number | null;
    transactionId: string | null;
    proofImages: string[];
    createdAt: string | null;
    updatedAt: string | null;
    completedAt: string | null;
  }>> {
    const response = await api.get<ApiResponse<any>>(
      `/ftcampaigndonation/my-pending`,
      // API expects `userId` to be the GP memberId
      { params: { userId: gpMemberId } }
    );
    const payload = unwrap<any>(response) ?? [];
    const items = Array.isArray(payload) ? payload : normalizeArray(payload);
    return items.map((item: any) => ({
      id: item.id,
      campaignId: item.campaignId,
      campaignName: item.campaignName ?? null,
      donorName: item.donorName ?? null,
      amount: Number(item.amount ?? 0),
      message: item.message ?? null,
      isAnonymous: Boolean(item.isAnonymous),
      status: item.status ?? null,
      payOSOrderCode: item.payOSOrderCode ?? null,
      transactionId: item.transactionId ?? null,
      proofImages: typeof item.proofImages === 'string'
        ? item.proofImages.split(',').map((s: string) => s.trim()).filter(Boolean)
        : (Array.isArray(item.proofImages) ? item.proofImages : []),
      createdAt: item.createdAt ?? null,
      updatedAt: item.updatedAt ?? null,
      completedAt: item.completedAt ?? null,
    }));
  },

  async rejectCampaignDonation(
    donationId: string,
    payload: { donationId: string; rejectedBy: string; reason?: string }
  ) {
    console.log('[fundService.rejectCampaignDonation] Starting rejection', {
      donationId,
      payload,
    });

    const response = await api.post<ApiResponse<boolean>>(
      `/ftcampaigndonation/${donationId}/reject`,
      payload
    );

    console.log('[fundService.rejectCampaignDonation] API Response:', response);
    return response;
  },

  async fetchCampaignDonationsHistory(
    campaignId: string,
    page = 1,
    pageSize = 10
  ): Promise<{
    items: Array<{
      id: string;
      campaignId: string;
      campaignName: string | null;
      donorId: string | null;
      donorName: string | null;
      amount: number;
      message: string | null;
      isAnonymous: boolean;
      status: string | null;
      payOSOrderCode: string | number | null;
      transactionId: string | null;
      proofImages: string[];
      createdAt: string | null;
      completedAt: string | null;
      updatedAt: string | null;
    }>;
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  }> {
    const response = await api.get<ApiResponse<any>>(
      `/ftcampaigndonation/campaign/${campaignId}`,
      { params: { page, pageSize } }
    );
    const payload = unwrap<any>(response) ?? {};
    const rawItems = normalizeArray<any>(payload?.items ?? []);
    return {
      items: rawItems.map((item: any) => ({
        id: item.id,
        campaignId: item.campaignId,
        campaignName: item.campaignName ?? null,
        donorId: item.donorId ?? null,
        donorName: item.donorName ?? null,
        amount: Number(item.amount ?? 0),
        message: item.message ?? null,
        isAnonymous: Boolean(item.isAnonymous),
        status: item.status ?? null,
        payOSOrderCode: item.payOSOrderCode ?? null,
        transactionId: item.transactionId ?? null,
        proofImages: typeof item.proofImages === 'string'
          ? item.proofImages.split(',').map((s: string) => s.trim()).filter(Boolean)
          : (Array.isArray(item.proofImages) ? item.proofImages : []),
        createdAt: item.createdAt ?? null,
        completedAt: item.completedAt ?? null,
        updatedAt: item.updatedAt ?? null,
      })),
      page: Number(payload?.page ?? page),
      pageSize: Number(payload?.pageSize ?? pageSize),
      totalCount: Number(payload?.totalCount ?? rawItems.length),
      totalPages: Number(payload?.totalPages ?? 1),
    };
  },

  async fetchCampaignExpensesHistory(
    campaignId: string,
    page = 1,
    pageSize = 10
  ): Promise<{
    items: Array<{
      id: string;
      campaignId: string;
      amount: number;
      description: string | null;
      status: string | null;
      createdAt: string | null;
      completedAt: string | null;
      updatedAt: string | null;
    }>;
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  }> {
    const response = await api.get<ApiResponse<any>>(
      `/ftcampaignexpense/campaign/${campaignId}`,
      { params: { page, pageSize} }
    );
    const payload = unwrap<any>(response) ?? {};
    const rawItems = normalizeArray<any>(payload?.items ?? []);
    return {
      items: rawItems.map((item: any) => ({
        id: item.id,
        campaignId: item.campaignId,
        amount: Number(item.amount ?? 0),
        description: item.description ?? item.message ?? null,
        status: item.status ?? null,
        createdAt: item.createdAt ?? null,
        completedAt: item.completedAt ?? null,
        updatedAt: item.updatedAt ?? null,
      })),
      page: Number(payload?.page ?? page),
      pageSize: Number(payload?.pageSize ?? pageSize),
      totalCount: Number(payload?.totalCount ?? rawItems.length),
      totalPages: Number(payload?.totalPages ?? 1),
    };
  },
};

export default fundService;
