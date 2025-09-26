export type UserRole = 'admin' | 'user' | 'guest';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  permissions: string[];
  createdAt: string;
}

export interface CreateUserData {
  name: string;
  email: string;
  password: string;
}

export interface UserProfile {
  fullName: string;
  nickname: string;
  email: string;
  phone: string;
  occupation: string;
  gender: string;
  birthDate: string;
  address: string;
  province: string;
  ward: string;
  picture: string;
}

export interface Province {
  code: string;
  name: string;
  slug: string;
  type: string;
  name_with_type: string;
}

export interface Ward {
  code: string;
  name: string;
  slug: string;
  type: string;
  name_with_type: string;
  parent_code: string;
}