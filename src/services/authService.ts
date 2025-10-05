import type { ApiResponse } from '@/types/api';
import type { AuthResponse, LoginProps, RegisterProps } from '@/types/auth';
import api from './apiService';

const authService = {
  register(props: RegisterProps): Promise<ApiResponse<AuthResponse>> {
    return api.post('/account/register', { ...props });
  },

  login(props: LoginProps): Promise<ApiResponse<AuthResponse>> {
    return api.post('/account/login', { ...props });
  },

  loginWithGoogle(idToken: string): Promise<ApiResponse<AuthResponse>> {
    return api.post('/account/login/google', { idToken });
  },
};

export default authService;
