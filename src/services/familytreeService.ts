import type { Familytree } from '@/types/familytree';
import type { ApiResponse, PaginationResponse } from './../types/api';
import api from './apiService';

const familytreeService = {

  getFamilytrees(): Promise<ApiResponse<PaginationResponse<Familytree[]>>> {
    return api.get('/familytree');
  },

  getFamilytreeById(id: string): Promise<ApiResponse<Familytree>> {
    return api.get(`/familytree/${id}`);
  },
    
  getMyFamilytrees(): Promise<ApiResponse<Familytree[]>> {
    return api.get('/familytree/my-family-trees');
  },

  createFamilyTree(): Promise<ApiResponse<Familytree>> {
    return api.post('/familytree/add');
  },

};

export default familytreeService;
