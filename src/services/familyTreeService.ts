import type { Familytree, FamilytreeCreationProps, FamilytreeDataResponse, FamilyMemberList, AddingNodeProps, FamilyNode, FamilytreeUpdateProps, UpdateFamilyNode, FTInvitation, FamilyNodeList } from '@/types/familytree';
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
    return api.post('/familytree', formData);
  },

  getFamilyTreeData(ftId: string): Promise<ApiResponse<FamilytreeDataResponse>> {
    return api.get('/ftmember/member-tree', {
      params: {
        ftId
      }
    });
  },

  getFamilyTreeNodes(props: PaginationProps): Promise<ApiResponse<PaginationResponse<FamilyNodeList[]>>> {
    return api.get('/ftmember/list', {
      params: {
        ...props,
        propertyFilters: JSON.stringify(props.propertyFilters)
      }
    });
  },

  getFamilyTreeMembers(props: PaginationProps): Promise<ApiResponse<PaginationResponse<FamilyMemberList[]>>> {
    return api.get('/ftmember/list-of-ftusers', {
      params: {
        ...props,
        propertyFilters: JSON.stringify(props.propertyFilters)
      }
    });
  },

  getMemberTree(ftId: string): Promise<ApiResponse<FamilytreeDataResponse>> {
    return api.get(`/ftmember/member-tree?ftId=${ftId}`);
  },

  getFamilyTreeMemberById(ftId: string, ftMemberId: string): Promise<ApiResponse<FamilyNode>> {
    return api.get(`/ftmember/${ftId}/get-by-memberid`, {
      params: {
        memberId: ftMemberId
      }
    });
  },

  createFamilyNode(props: AddingNodeProps): Promise<ApiResponse<string>> {
    // Convert to FormData to properly handle file uploads
    const formData = new FormData();
    
    // Append all properties to FormData
    Object.keys(props).forEach((key) => {
      const value = props[key as keyof AddingNodeProps];
      // Skip undefined, null values (but allow empty strings, false, 0)
      if (value === undefined || value === null) {
        return;
      }
      
      // Handle File objects (avatar)
      if (value instanceof File) {
        formData.append(key, value);
      } 
      // Handle arrays (like ftMemberFiles)
      else if (Array.isArray(value)) {
        // Convert array to JSON string for complex objects
        formData.append(key, JSON.stringify(value));
      }
      // Handle objects (convert to JSON string)
      else if (typeof value === 'object') {
        formData.append(key, JSON.stringify(value));
      }
      // Handle booleans - convert to string representation
      else if (typeof value === 'boolean') {
        formData.append(key, value.toString());
      }
      // Handle numbers
      else if (typeof value === 'number') {
        formData.append(key, value.toString());
      }
      // Handle strings (including empty strings)
      else {
        formData.append(key, String(value));
      }
    });

    return api.post(`/ftmember/${props.ftId}`, formData, {
      headers: {
        'X-FtId': props.ftId,
      }
    });
  },

  updateFamilyNode(ftId: string, props: UpdateFamilyNode): Promise<ApiResponse<FamilyNode>> {
    return api.put(`/ftmember/${ftId}`, props, {
      headers: {
        "Content-Type": "multipart/form-data"
      }
    });
  },

  getAddableRelationships(ftMemberId: string): Promise<ApiResponse<any>> {
    return api.get(`/ftmember/${ftMemberId}/relationship`);
  },

  deleteFamilyNode(ftMemberId: string): Promise<ApiResponse<string>> {
    return api.delete(`/ftmember/${ftMemberId}`);
  },

  getInvitationsList(props: PaginationProps): Promise<ApiResponse<PaginationResponse<FTInvitation[]>>> {
    return api.get(`/invitation/list`, {
      params: {
        ...props,
        propertyFilters: JSON.stringify(props?.propertyFilters)
      },
    });
  },

  inviteGuestToFamilyTree(ftId: string, invitedUserEmail: string): Promise<ApiResponse<any>> {
    return api.post(`/invitation/guest`, {
      ftId,
      invitedUserEmail
    });
  },

  inviteMemberToFamilyTree(ftId: string, ftMemberId: string, invitedUserEmail: string): Promise<ApiResponse<any>> {
    return api.post(`/invitation/member`, {
      ftId,
      ftMemberId,
      invitedUserEmail
    });
  }
}
export default familyTreeService;
