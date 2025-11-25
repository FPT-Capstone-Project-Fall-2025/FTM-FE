// Common API response structure
export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  success?: boolean;
  status?: boolean;
  statusCode?: number;
  errors?: string;
}

// Pagination
export interface PaginationResponse<T = any> {
  data: T;
  pageIndex: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface PaginationProps {
  pageIndex: number;
  pageSize: number;
  propertyFilters?: Array<{
    name: string,
    operation: string,
    value: string | null
  }>;
  totalItems: number;
  totalPages: number;
}

// Error response
export interface ApiError {
  message: string;
  code?: string;
  details?: any;
}
