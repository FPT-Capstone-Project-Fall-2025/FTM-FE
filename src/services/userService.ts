import type { ApiResponse } from '../types/api';
import type { EditUserProfile, UserProfile } from '@/types/user';
import api from './apiService';

const userService = {
  getProfileData(): Promise<ApiResponse<UserProfile>> {
    return api.get('/account/profile');
  },

  updateProfileData(props: EditUserProfile): Promise<ApiResponse<UserProfile>> {
    return api.put('/account/profile', { ...props });
  },
};

export default userService;
