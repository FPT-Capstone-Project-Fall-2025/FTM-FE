import type { ApiResponse } from '../types/api';
import type { UserProfile } from '@/types/user';
import api from './apiService';

const userService = {
  getProfileData(): Promise<ApiResponse<UserProfile>> {
    return api.get('/account/profile');
  },
};

export default userService;
