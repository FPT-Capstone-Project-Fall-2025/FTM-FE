// Common API response structure
export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  success: boolean;
}

// Pagination
export interface PaginationResponse<T = any> {
  data: T;
  pageIndex: number;
  pageSize: number;
  totalItem: number;
  totalPages: number;
}

// Error response
export interface ApiError {
  message: string;
  code?: string;
  details?: any;
}
