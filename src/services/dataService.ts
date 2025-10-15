import type { ApiResponse } from './../types/api';
import type { Province, Ward } from '@/types/user';
import api from './apiService';

const dataService = {
  getProvinces(): Promise<ApiResponse<Province[]>> {
    return api.get('/account/provinces');
  },

  getWards(provinceId: string): Promise<ApiResponse<Ward[]>> {
    return api.get(`/account/provinces/${provinceId}/wards`);
  },
};

export default dataService;
