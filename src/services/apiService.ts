import axios from 'axios';
import type {
  AxiosError,
  AxiosInstance,
  AxiosProgressEvent,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';

// Environment variables
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'https://be.dev.familytree.io.vn/api';
const API_TIMEOUT = Number(import.meta.env.VITE_API_TIMEOUT) || 10000;

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  // This tells axios not to transform header names
  transformRequest: [(data, headers) => {
    // Don't transform FormData - let axios handle it automatically
    if (data instanceof FormData) {
      // Remove Content-Type header for FormData - axios will set it with boundary
      if (headers) {
        delete headers['Content-Type'];
        delete headers['content-type'];
      }
      return data;
    }
    // For other objects, stringify as JSON
    if (data && typeof data === 'object') {
      return JSON.stringify(data);
    }
    return data;
  }],
});

let isRedirecting = false;

// Request interceptor
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Add auth token if available
    // Get token from localStorage (redux-persist stores it here)
    const persistedState = localStorage.getItem('persist:root')

    if (persistedState) {
      try {
        const parsed = JSON.parse(persistedState)
        const authState = JSON.parse(parsed.auth) 
        const token = authState.token

        if (token && config.headers) {
          config.withCredentials = true;
          config.headers.Authorization = `Bearer ${token}`
        }
      } catch (error) {
        console.error('Error parsing token from persist:', error)
      }
    }

    // If data is FormData, remove Content-Type header to let axios set it automatically with boundary
    if (config.data instanceof FormData) {
      // Delete Content-Type header if it exists - axios will set it automatically with boundary
      if (config.headers) {
        delete config.headers['Content-Type'];
        delete config.headers['content-type'];
      }
    }

    // Ensure X-FtId header is preserved with correct casing
    // Axios normalizes header names to lowercase, but backend requires X-FtId
    // We need to manually preserve the case after axios processes it
    const headers = config.headers as any;

    // Check if X-FtId or x-ftid exists and ensure it's properly set
    if (headers['X-Ftid']) {
      const ftId = headers['X-Ftid'];
      // Delete the original and re-add to try to preserve case
      delete headers['X-Ftid'];
      // Force set with proper casing - Axios will normalize it but backend should accept both
      headers['X-Ftid'] = ftId;
      console.log('X-Ftid header set to:', ftId);
    } else if (headers['x-ftid']) {
      console.log('x-ftid header detected (normalized):', headers['x-ftid']);
    }

    // Add request timestamp
    config.metadata = { startTime: new Date().getTime() };

    return config;
  },
  (error: AxiosError) => {
    console.error('Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Log response time in development
    if (import.meta.env.DEV && response.config.metadata) {
      const duration =
        new Date().getTime() - response.config.metadata.startTime;
      console.log(`API Response: ${response.status} (${duration}ms)`);
    }

    return response;
  },
  (error: AxiosError) => {
    // Handle common error responses
    if (error.response) {
      const { status, data } = error.response;

      switch (status) {
        case 401:
          if (!isRedirecting) {
            isRedirecting = true;
            // localStorage.removeItem('auth_token');
            // Also clear persisted auth state
            // localStorage.removeItem('persist:root');
            // window.location.href = '/login';
          }
          break;
        case 403:
          console.error('Forbidden: Insufficient permissions');
          break;
        case 404:
          console.error('Not Found: Resource not found');
          break;
        case 422:
          console.error('Validation Error:', data);
          break;
        case 500:
          console.error('Server Error: Internal server error');
          break;
        default:
          console.error(`API Error: ${status}`, data);
      }
    } else if (error.request) {
      console.error('Network Error: No response received');
    } else {
      console.error('Request Setup Error:', error.message);
    }

    return Promise.reject(error);
  }
);

// API methods
export const api = {
  // GET request
  get: async <T = any>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<T> => {
    const response = await apiClient.get<T>(url, config);
    return response.data;
  },

  // POST request
  post: async <T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> => {
    const response = await apiClient.post<T>(url, data, config);
    return response.data;
  },

  // PUT request
  put: async <T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> => {
    const response = await apiClient.put<T>(url, data, config);
    return response.data;
  },

  // PATCH request
  patch: async <T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> => {
    const response = await apiClient.patch<T>(url, data, config);
    return response.data;
  },

  // DELETE request
  delete: async <T = any>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<T> => {
    const response = await apiClient.delete<T>(url, config);
    return response.data;
  },

  // Upload file
  upload: async <T = any>(
    url: string,
    file: File,
    onUploadProgress?: (progressEvent: AxiosProgressEvent) => void
  ): Promise<T> => {
    const formData = new FormData();
    formData.append('file', file);

    const config: AxiosRequestConfig = {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    };

    if (onUploadProgress) {
      config.onUploadProgress = onUploadProgress;
    }

    const response = await apiClient.post<T>(url, formData, config);
    return response.data;
  },
};

// Export the axios instance for advanced usage
export { apiClient };
export default api;

// Extend AxiosRequestConfig to include metadata
declare module 'axios' {
  interface InternalAxiosRequestConfig {
    metadata?: {
      startTime: number;
    };
  }
}
