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
    return api.get(`/familytree/${id}`, {
      headers: {
        'X-Ftid': id,
      }
    });
  },

  updateFamilyTree(id: string, data: FamilytreeUpdateProps): Promise<ApiResponse<Familytree>> {
    const formData = new FormData();
    formData.append('Name', data.Name);
    formData.append('OwnerId', data.OwnerId);
    formData.append('Description', data.Description);
    data.File && formData.append('File', data.File);
    formData.append('GPModeCode', data.GPModeCode.toString());
    return api.put(`/familytree/${id}`, formData, {
      headers: {
        'X-Ftid': id,
      }
    });
  },

  deleteFamilyTree(id: string): Promise<ApiResponse<boolean>> {
    return api.delete(`/familytree/${id}`, {
      headers: {
        'X-Ftid': id,
      }
    });
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
      },
      headers: {
        'X-Ftid': ftId,
      }
    });
  },

  getFamilyTreeNodes(ftId: string, props: PaginationProps): Promise<ApiResponse<PaginationResponse<FamilyNodeList[]>>> {
    return api.get('/ftmember/list', {
      params: {
        ...props,
        propertyFilters: JSON.stringify(props.propertyFilters)
      },
      headers: {
        'X-Ftid': ftId
      }
    });
  },

  getFamilyTreeMembers(ftId: string, props: PaginationProps): Promise<ApiResponse<PaginationResponse<FamilyMemberList[]>>> {
    return api.get('/ftmember/list-of-ftusers', {
      params: {
        ...props,
        propertyFilters: JSON.stringify(props.propertyFilters)
      },
      headers: {
        'X-Ftid': ftId
      }
    });
  },

  getMemberTree(ftId: string): Promise<ApiResponse<FamilytreeDataResponse>> {
    return api.get(`/ftmember/member-tree?ftId=${ftId}`, {
      headers: {
        'X-Ftid': ftId,
      }
    });
  },

  getFamilyTreeMemberById(ftId: string, ftMemberId: string): Promise<ApiResponse<FamilyNode>> {
    return api.get(`/ftmember/${ftId}/get-by-memberid`, {
      params: {
        memberId: ftMemberId
      },
      headers: {
        'X-Ftid': ftId,
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
        'X-Ftid': props.ftId,
      }
    });
  },

  updateFamilyNode(ftId: string, props: UpdateFamilyNode): Promise<ApiResponse<FamilyNode>> {
    // Convert to FormData to properly handle file uploads
    const formData = new FormData();

    // Append all properties to FormData
    Object.keys(props).forEach((key) => {
      const value = props[key as keyof UpdateFamilyNode];
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

    // Don't manually set Content-Type header - let the browser set it with the boundary
    return api.put(`/ftmember/${ftId}`, formData, {
      headers: {
        'X-Ftid': ftId,
      }
    });
  },

  getAddableRelationships(ftMemberId: string): Promise<ApiResponse<any>> {
    return api.get(`/ftmember/${ftMemberId}/relationship`);
  },

  deleteFamilyNode(ftId: string, ftMemberId: string): Promise<ApiResponse<string>> {
    return api.delete(`/ftmember/${ftMemberId}`, {
      headers: {
        'X-Ftid': ftId,
      }
    });
  },

  deleteUserFromFamilyTree(ftId: string, ftUserId: string): Promise<ApiResponse<string>> {
    return api.delete(`/ftmember/${ftId}/user/${ftUserId}`, {
      headers: {
        'X-Ftid': ftId,
      }
    });
  },

  leaveFamilyTree(ftId: string, userId: string): Promise<ApiResponse<string>> {
    return api.post(`/familytree/${ftId}/user/${userId}/out`, {
      headers: {
        'X-Ftid': ftId,
      }
    });
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
