import type { ApiResponse } from './../types/api';
import type { Province, Ward } from '@/types/user';
import api from './apiService';

const dataService = {
  getProvinces(): Promise<ApiResponse<Province[]>> {
    return api.get('/data/provinces');
  },

  getWards(): Promise<ApiResponse<Ward[]>> {
    return api.get('/data/wards');
  },
};

export default dataService;
