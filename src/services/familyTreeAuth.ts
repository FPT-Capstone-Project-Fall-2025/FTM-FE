import type { FTAuth, FTAuthList } from '@/types/familytree';
import type { ApiResponse, PaginationProps, PaginationResponse } from './../types/api';
import api from './apiService';

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
};

export default ftauthorizationService;