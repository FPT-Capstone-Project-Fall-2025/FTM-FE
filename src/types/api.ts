// Common API response structure
export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  success: boolean;
}

// Error response
export interface ApiError {
  message: string;
  code?: string;
  details?: any;
}
