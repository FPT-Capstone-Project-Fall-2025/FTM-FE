import type { ApiResponse } from '../types/api';
import api from './apiService';

export interface FamilyTree {
  id: string;
  name: string;
  ownerId: string;
  owner: string;
  description: string;
  picture: string | null;
  isActive: boolean;
  gpModeCode: number;
  createdAt: string;
  lastModifiedAt: string | null;
  createdBy: string;
  lastModifiedBy: string;
  memberCount: number;
}

export interface PaginatedFamilyTreeResponse {
  pageIndex: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
  data: FamilyTree[];
}

const familyTreeService = {
  getAllFamilyTrees(pageIndex: number = 1, pageSize: number = 10): Promise<ApiResponse<PaginatedFamilyTreeResponse>> {
    return api.get(`/familytree?pageIndex=${pageIndex}&pageSize=${pageSize}`);
  },

  getFamilyTreeById(id: string): Promise<ApiResponse<FamilyTree>> {
    return api.get(`/familytree/${id}`);
  },

  createFamilyTree(data: Partial<FamilyTree>): Promise<ApiResponse<FamilyTree>> {
    return api.post('/familytree', data);
  },

  updateFamilyTree(id: string, data: Partial<FamilyTree>): Promise<ApiResponse<FamilyTree>> {
    return api.put(`/familytree/${id}`, data);
  },

  deleteFamilyTree(id: string): Promise<ApiResponse<boolean>> {
    return api.delete(`/familytree/${id}`);
  },
};

export default familyTreeService;