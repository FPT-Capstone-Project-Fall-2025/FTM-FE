import type { User } from "./user"

export interface RegisterProps {
    email: string;
    phoneNumber: string;
    name: string;
    password: string;
    confirmPassword: string;
}

export interface LoginProps {
    username: string;
    password: string;
}

export interface ResetPassword {
    code: string;
    userId: string;
    password: string;
    confirmPassword: string;
}

export interface RefreshTokenProps {
    accessToken: string;
    refreshToken: string;
}

export interface AuthState {
    user: User | null
    token: string | null
    refreshToken: string | null
    isAuthenticated: boolean
    isGGLogin: boolean;
    isLoading: boolean
    error: string | null
}

export interface AuthResponse {
    userId: string;
    username: string;
    phone: string;
    email: string;
    address: string;
    roles: string[];
    accessToken: string;
    refreshToken: string;
    accountStatus: number;
    picture: string;
    fullname: string;
}
