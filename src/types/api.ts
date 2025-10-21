// Common API response structure
export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  success?: boolean;
  status?: boolean;
  statusCode?: number;
  errors?: string;
}

// Error response
export interface ApiError {
  message: string;
  code?: string;
  details?: any;
}
