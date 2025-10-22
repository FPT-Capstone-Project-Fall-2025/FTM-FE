import type { Familytree, FamilytreeCreationProps, FamilytreeDataResponse, FamilyMemberList } from '@/types/familytree';
import type { ApiResponse, PaginationProps, PaginationResponse } from './../types/api';
import api from './apiService';
import axios from 'axios';

const familytreeService = {

  getFamilytrees(props: PaginationProps): Promise<ApiResponse<PaginationResponse<Familytree[]>>> {
    return api.get('/familytree', { 
      params: props
    });
  },

  getFamilytreeById(id: string): Promise<ApiResponse<Familytree>> {
    return api.get(`/familytree/${id}`);
  },
    
  getMyFamilytrees(): Promise<ApiResponse<Familytree[]>> {
    return api.get('/familytree/my-family-trees');
  },

  createFamilyTree(props: FamilytreeCreationProps): Promise<ApiResponse<Familytree>> {
    const formData = new FormData();
    formData.append('Name', props.name);
    formData.append('OwnerId', props.ownerId);
    formData.append('Description', props.description);
    props.file && formData.append('File', props.file);
    formData.append('GPModeCode', props.gpModecode.toString());
    return api.post('/familytree/add', formData, {
      headers: {
          "Content-Type": "multipart/form-data"
        }
    });
  },

  getFamilyTreeData(ftId: string): Promise<ApiResponse<FamilytreeDataResponse>> {
    return api.get('/ftmember/member-tree', {
      params: {
        ftId
      }
    });
  },

  getFamilyTreeMembers(props: PaginationProps): Promise<ApiResponse<FamilytreeDataResponse>> {
    return api.get('/ftmember/list', {
      params: props
    });
  },

  // [{"name":"name","operation":"EQUAL","value":"a8ab2642-8fb3-4496-8444-2d704011f938"}]
};

export async function fetchFamilyMembers(props: PaginationProps): Promise<PaginationResponse<FamilyMemberList[]>> {
  return (await axios.get(`https://be.dev.familytree.io.vn/list`, { params: props })).data;
}

export default familytreeService;
