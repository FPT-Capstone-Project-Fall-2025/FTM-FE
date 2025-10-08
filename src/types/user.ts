export type UserRole = 'admin' | 'user' | 'guest';

export interface User {
  userId: string;
  username: string;
  name: string;
  email: string;
  role: UserRole;
  phoneNumber: string | null;
  permissions: string[];
}

export interface CreateUserData {
  name: string;
  email: string;
  password: string;
}
export interface UserProfile {
  name: string;
  email: string;
  nickname: string;
  phoneNumber: string;
  job: string;
  gender: 0 | 1 | null;
  birthday: string;
  province: Province | null;
  ward: Ward | null;
  address: string;
  picture: string;
  // isActive: boolean | null;
  // roles: string[];
  // createdDate: string | null;
  // updatedDate: string | null;
}

export interface AvatarUpdateResponse {
  avatarUrl: string;
}

export type EditUserProfile = Omit<UserProfile, 'email' | 'province' | 'ward'> & {
  provinceId: string | null;
  wardId: string | null;
};

export interface ChangePasswordProps {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

export interface Province {
  id: string;
  code: string;
  name: string;
  nameWithType: string;
  slug: string;
}

export interface Ward {
  id: string;
  code: string;
  name: string;
  nameWithType: string;
  path: string;
  slug: string;
  pathWithType: string;
}