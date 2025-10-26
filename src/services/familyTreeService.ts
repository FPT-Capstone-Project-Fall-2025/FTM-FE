import type { Familytree, FamilytreeCreationProps, FamilytreeDataResponse, FamilyMemberList, AddingNodeProps, FamilyNode, FamilytreeUpdateProps } from '@/types/familytree';
import type { ApiResponse, PaginationProps, PaginationResponse } from './../types/api';
import api from './apiService';

export interface PaginatedFamilyTreeResponse {
  pageIndex: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
  data: Familytree[];
}

const familyTreeService = {
  getAllFamilyTrees(pageIndex: number = 1, pageSize: number = 10): Promise<ApiResponse<PaginatedFamilyTreeResponse>> {
    return api.get(`/familytree/my-family-trees?pageIndex=${pageIndex}&pageSize=${pageSize}`);
  },

  getFamilyTreeById(id: string): Promise<ApiResponse<Familytree>> {
    return api.get(`/familytree/${id}`);
  },

  updateFamilyTree(id: string, data: FamilytreeUpdateProps): Promise<ApiResponse<Familytree>> {
    return api.put(`/familytree/${id}`, data, {
      headers: {
          "Content-Type": "multipart/form-data"
        }
    });
  },

  deleteFamilyTree(id: string): Promise<ApiResponse<boolean>> {
    return api.delete(`/familytree/${id}`);
  },

  getFamilytrees(props: PaginationProps): Promise<ApiResponse<PaginationResponse<Familytree[]>>> {
    return api.get('/familytree', { 
      params: props
    });
  },

  getFamilytreeById(id: string): Promise<ApiResponse<Familytree>> {
    return api.get(`/familytree/${id}`);
  },
    
  getMyFamilytrees(): Promise<ApiResponse<PaginationResponse<Familytree[]>>> {
    return api.get('/familytree/my-family-trees');
  },

  createFamilyTree(props: FamilytreeCreationProps): Promise<ApiResponse<Familytree>> {
    const formData = new FormData();
    formData.append('Name', props.name);
    formData.append('OwnerId', props.ownerId);
    formData.append('Description', props.description);
    props.file && formData.append('File', props.file);
    formData.append('GPModeCode', props.gpModecode.toString());
    return api.post('/familytree', formData, {
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

  getFamilyTreeMembers(props: PaginationProps): Promise<ApiResponse<PaginationResponse<FamilyMemberList[]>>> {
    return api.get('/ftmember/list', {
      params: {
        ...props,
        propertyFilters: JSON.stringify(props.propertyFilters)
      }
<<<<<<< HEAD
    });
  },

  /**
   * Get member tree for event tagging
   * This returns all members in a family tree for the event member tagging feature
   */
  getMemberTree(ftId: string): Promise<ApiResponse<FamilytreeDataResponse>> {
    return api.get(`/ftmember/member-tree?ftId=${ftId}`);
  },

  // [{"name":"name","operation":"EQUAL","value":"a8ab2642-8fb3-4496-8444-2d704011f938"}]
  getFamilyTreeMemberById(ftId: string, memberId: string): Promise<ApiResponse<FamilyNode>> {
    return api.get(`/ftmember/${ftId}/get-by-memberid`, {
      params: {
        memberId
      }
=======
>>>>>>> 41dcd28 (implementing v2)
    });
  },

  getFamilyTreeMemberById(ftId: string, memberId: string): Promise<ApiResponse<FamilyNode>> {
    return api.get(`/ftmember/${ftId}/get-by-memberid`, {
      params: {
        memberId
      }
    });
  },

  createFamilyNode(props: AddingNodeProps): Promise<ApiResponse<string>> {

    const formData = new FormData();
    
    // Append all non-file fields
    Object.entries(props).forEach(([key, value]) => {
      if (key !== 'ftMemberFiles' && value !== undefined && value !== null) {
        formData.append(key, value.toString());
      }
    });

    // Append files if present
    if (props.ftMemberFiles && props.ftMemberFiles.length > 0) {
      props.ftMemberFiles.forEach((fileProp, index) => {
        if (fileProp.file) {
          formData.append(`ftMemberFiles[${index}]`, fileProp.file); // Append the actual File object
          if (fileProp.title) formData.append(`ftMemberFilesTitles[${index}]`, fileProp.title);
          if (fileProp.fileType) formData.append(`ftMemberFilesTypes[${index}]`, fileProp.fileType);
          // Append other FileProps fields if needed, e.g., description, content, thumbnail
        }
      });
    }
    return api.post(`/ftmember/${props.ftId}`, formData, {
      headers: {
          "Content-Type": "multipart/form-data"
        }
    });
<<<<<<< HEAD
  },
  
  updateFamilyNode(ftId: string, props: FamilyNode): Promise<ApiResponse<string>> {
    return api.put(`/ftmember/${ftId}`, props);
  },

  deleteFamilyNode(ftMemberId: string): Promise<ApiResponse<string>> {
    return api.delete(`/ftmember/${ftMemberId}`);
=======
>>>>>>> 41dcd28 (implementing v2)
  },
  
  updateFamilyNode(ftId: string, props: FamilyNode): Promise<ApiResponse<string>> {
    return api.put(`/ftmember/${ftId}`, props);
  },

  deleteFamilyNode(ftMemberId: string): Promise<ApiResponse<string>> {
    return api.delete(`/ftmember/${ftMemberId}`);
  },
};

export default familyTreeService;
