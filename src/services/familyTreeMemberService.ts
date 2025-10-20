import type { ApiResponse } from '../types/api';
import api from './apiService';

// Family Tree Member interfaces
export interface GPMember {
  id: string;
  ftId: string;
  ftRole: string;
  createdBy: string;
  createdOn: string;
  lastModifiedBy: string;
  lastModifiedOn: string;
  isActive: boolean;
  isRoot: boolean;
  privacyData: string;
  fullname: string;
  gender: number;
  birthday: string;
  statusCode: number;
  isDeath: boolean;
  deathDescription: string;
  deathDate: string | null;
  burialAddress: string;
  burialWardId: string;
  burialProvinceId: string;
  identificationType: string;
  identificationNumber: string;
  ethnicId: string;
  religionId: string;
  address: string;
  wardId: string;
  provinceId: string;
  email: string;
  phoneNumber: string;
  picture: string;
  content: string;
  storyDescription: string;
  userId: string;
  ethnic: {
    code: string;
    name: string;
  };
  religion: {
    code: string;
    name: string;
  };
  ward: {
    code: string;
    name: string;
    type: string;
    slug: string;
    nameWithType: string;
    path: string;
    pathWithType: string;
  };
  province: {
    code: string;
    name: string;
    type: string;
    slug: string;
    nameWithType: string;
  };
  burialWard: {
    code: string;
    name: string;
    type: string;
    slug: string;
    nameWithType: string;
    path: string;
    pathWithType: string;
  };
  burialProvince: {
    code: string;
    name: string;
    type: string;
    slug: string;
    nameWithType: string;
  };
  ftMemberFiles: any[];
}

// Cache for storing GPMemberId
let cachedGPMemberId: string | null = null;
let cacheKey: string | null = null;

const familyTreeMemberService = {
  /**
   * Get GPMemberId (family tree member ID) by GPId (family tree ID) and userId
   * This function will cache the result to avoid unnecessary API calls
   */
  async getGPMemberIdByUserId(gpId: string, userId: string): Promise<string | null> {
    try {
      // Create cache key
      const currentCacheKey = `${gpId}-${userId}`;
      
      // Return cached result if available and cache key matches
      if (cachedGPMemberId && cacheKey === currentCacheKey) {
        console.log('Using cached GPMemberId:', cachedGPMemberId);
        return cachedGPMemberId;
      }

      console.log('Fetching GPMemberId from API...');
      const response: ApiResponse<GPMember> = await api.get(
        `/ftmember/${gpId}/get-by-userid?userId=${userId}`
      );

      console.log('GPMember API response:', response);

      // Handle nested data structure
      const memberData = response.data?.data || response.data;

      if (response.status && memberData?.id) {
        // Cache the result
        cachedGPMemberId = memberData.id;
        cacheKey = currentCacheKey;
        
        console.log('GPMemberId cached successfully:', cachedGPMemberId);
        return cachedGPMemberId;
      } else {
        console.error('Failed to get GPMemberId:', response.message);
        return null;
      }
    } catch (error) {
      console.error('Error getting GPMemberId:', error);
      return null;
    }
  },

  /**
   * Get full GPMember information by GPId and userId
   */
  async getGPMemberByUserId(gpId: string, userId: string): Promise<GPMember | null> {
    try {
      const response: ApiResponse<GPMember> = await api.get(
        `/ftmember/${gpId}/get-by-userid?userId=${userId}`
      );

      console.log('getGPMemberByUserId API response:', response);

      // Handle nested data structure
      const memberData = response.data?.data || response.data;

      if (response.status && memberData) {
        return memberData as GPMember;
      } else {
        console.error('Failed to get GPMember:', response.message);
        return null;
      }
    } catch (error) {
      console.error('Error getting GPMember:', error);
      return null;
    }
  },

  /**
   * Get cached GPMemberId without making API call
   */
  getCachedGPMemberId(): string | null {
    return cachedGPMemberId;
  },

  /**
   * Clear cached GPMemberId
   */
  clearGPMemberIdCache(): void {
    cachedGPMemberId = null;
    cacheKey = null;
    console.log('GPMemberId cache cleared');
  },

  /**
   * Set GPMemberId manually (useful when you already have the ID from another API call)
   */
  setGPMemberId(gpId: string, userId: string, gpMemberId: string): void {
    cacheKey = `${gpId}-${userId}`;
    cachedGPMemberId = gpMemberId;
    console.log('GPMemberId set manually:', gpMemberId);
  }
};

export default familyTreeMemberService;