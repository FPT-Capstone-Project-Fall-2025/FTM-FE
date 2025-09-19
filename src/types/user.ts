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