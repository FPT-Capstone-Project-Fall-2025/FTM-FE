import type { Familytree, FamilytreeCreationProps, FamilytreeDataResponse, FamilyMemberList, AddingNodeProps, FamilyNode, FamilytreeUpdateProps, UpdateFamilyNode, FTInvitation } from '@/types/familytree';
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
    });
  },

  getMemberTree(ftId: string): Promise<ApiResponse<FamilytreeDataResponse>> {
    return api.get(`/ftmember/member-tree?ftId=${ftId}`);
  },

  getFamilyTreeMemberById(ftId: string, memberId: string): Promise<ApiResponse<FamilyNode>> {
    return api.get(`/ftmember/${ftId}/get-by-memberid`, {
      params: {
        memberId
      }
    });
  },

  createFamilyNode(props: AddingNodeProps): Promise<ApiResponse<string>> {
    return api.post(`/ftmember/${props.ftId}`, props, {
      headers: {
        "Content-Type": "multipart/form-data"
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
