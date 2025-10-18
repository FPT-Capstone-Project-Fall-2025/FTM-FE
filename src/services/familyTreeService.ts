import type { ApiResponse } from '../types/api';
import api from './apiService';

export interface FamilyTree {
  id: string;
  name: string;
  ownerId: string;
  owner: string;
  description: string;
  picture: string;
  isActive: boolean;
  gpModeCode: number;
  createdAt: string;
  lastModifiedAt: string;
  createdBy: string;
  lastModifiedBy: string;
  memberCount: number;
}

const familyTreeService = {
  getAllFamilyTrees(): Promise<ApiResponse<FamilyTree[]>> {
    return api.get('/familytree');
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