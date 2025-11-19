import type { FTAuth, FTAuthList } from '@/types/familytree';
import type { ApiResponse, PaginationProps, PaginationResponse } from './../types/api';
import api from './apiService';
import axios from 'axios';

const ftauthorizationService = {
  getFTAuths(ftId?: string, props?: PaginationProps): Promise<ApiResponse<PaginationResponse<FTAuthList[]>>> {
    return api.get('/ftauthorization/list', {
      params: {
        ...props,
        propertyFilters: JSON.stringify(props?.propertyFilters)
      },
      headers: {
        'X-FtId': ftId,
      }
    });
  },

  getMyFTAuths(ftId: string, ftMemberId: string): Promise<ApiResponse<PaginationResponse<FTAuthList[]>>> {
    return api.get(`/ftauthorization/${ftId}/member/${ftMemberId}/list`, {
      headers: {
        'X-FtId': ftId,
      }
    });
  },

  addFTAuth(props: FTAuth): Promise<ApiResponse<FTAuth>> {
    return api.post('/ftauthorization', props, {
      headers: {
        'X-FtId': props.ftId,
      }
    });
  },

  updateFTAuth(props: FTAuth): Promise<ApiResponse<FTAuth>> {
    return api.put('/ftauthorization', props, {
      headers: {
        'X-FtId': props.ftId,
      }
    });
  },

  deleteFTAuth(ftId: string, ftMemberId: string): Promise<ApiResponse<void>> {
    return api.delete(`/ftauthorization/${ftId}/member/${ftMemberId}`, {
      headers: {
        'X-FtId': ftId,
      }
    });
  },

  testFTAuth(ftId: string, token: string): Promise<ApiResponse<any>> {
    return axios.get(`https://be.dev.familytree.io.vn/authorization/owner`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'X-FtId': ftId,
      }
    });
  }
};

export default ftauthorizationService;