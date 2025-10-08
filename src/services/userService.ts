import type { ChangePasswordProps } from './../types/user';
import type { ApiResponse } from '../types/api';
import type { AvatarUpdateResponse, EditUserProfile, UserProfile } from '@/types/user';
import api from './apiService';

const userService = {
  getProfileData(): Promise<ApiResponse<UserProfile>> {
    return api.get('/account/profile');
  },

  updateProfileData(props: EditUserProfile): Promise<ApiResponse<UserProfile>> {
    return api.put('/account/profile', { ...props });
  },

  updateAvatar(file: File): Promise<ApiResponse<AvatarUpdateResponse>> {
    const formData = new FormData();
    formData.append('Avatar', file);
    return api.post('/account/upload-avatar', formData, {
      headers: {
        "Content-Type": "multipart/form-data"
      }
    });
  },

  changePassword(props: ChangePasswordProps): Promise<ApiResponse<boolean>> {
    return api.put('/account/change-password', { ...props });
  },
};

export default userService;
