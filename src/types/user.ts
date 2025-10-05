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

export interface Province {
  provinceId: string;
  code: string;
  name: string;
  nameWithType: string;
}

export interface Ward {
  wardId: string;
  code: string;
  name: string;
  nameWithType: string;
  path: string;
  pathWithType: string;
}