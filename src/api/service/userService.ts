import type { CreateUserData, User } from '@/types/user';
import apiClient from '../client';
import type { ApiResponse } from '@/types/api';

export const userService = {
    getUsers: async (): Promise<User[]> => {
        const response = await apiClient.get<ApiResponse<User[]>>('/users');
        return response.data.data;
    },

    getUserById: async (id: number): Promise<User> => {
        const response = await apiClient.get<ApiResponse<User>>(`/users/${id}`);
        return response.data.data;
    },

    createUser: async (userData: CreateUserData): Promise<User> => {
        const response = await apiClient.post<ApiResponse<User>>('/users', userData);
        return response.data.data;
    },

    updateUser: async (id: number, userData: Partial<CreateUserData>): Promise<User> => {
        const response = await apiClient.put<ApiResponse<User>>(`/users/${id}`, userData);
        return response.data.data;
    },

    deleteUser: async (id: number): Promise<void> => {
        await apiClient.delete(`/users/${id}`);
    },
};