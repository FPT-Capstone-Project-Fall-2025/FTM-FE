import type { ApiResponse } from '../types/api';
import api from './apiService';

// Family Tree Member Role type
export type FTRole = 'FTMember' | 'FTOwner';

// Family Tree Member interfaces
export interface GPMember {
  id: string;
  ftId: string;
  ftRole: FTRole;
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
  ftMemberFiles: Array<{
    ftMemberId: string;
    title: string;
    content: string;
    filePath: string;
    fileType: string;
    description: string;
    thumbnail: string;
    isActive: boolean;
    createdBy: string;
    createdOn: string;
    lastModifiedBy: string;
    lastModifiedOn: string;
  }>;
}

// Cache for storing GPMemberId
let cachedGPMemberId: string | null = null;
let cacheKey: string | null = null;
// Cache for full member profiles by memberId within a specific ftId
const gpMemberCacheByMemberId: Map<string, GPMember> = new Map(); // key: `${ftId}:${memberId}`
const gpMemberCacheByUserId: Map<string, GPMember> = new Map();   // key: `${ftId}:${userId}`

/**
 * Extract avatar URL from ftMemberFiles
 * Looks for file with title containing 'Avatar'
 */
export const getAvatarFromGPMember = (gpMember: GPMember | null): string | null => {
  console.log('🔍 getAvatarFromGPMember called with:', {
    hasGPMember: !!gpMember,
    hasFiles: !!gpMember?.ftMemberFiles,
    filesCount: gpMember?.ftMemberFiles?.length || 0
  });

  if (!gpMember || !gpMember.ftMemberFiles || gpMember.ftMemberFiles.length === 0) {
    console.log('❌ No GPMember or ftMemberFiles found');
    return null;
  }

  console.log('🔍 Searching for avatar in files:', gpMember.ftMemberFiles.map(f => ({
    title: f.title,
    filePath: f.filePath,
    isActive: f.isActive,
    hasAvatar: f.title?.includes('Avatar'),
    matchesCondition: !!(f.title && f.title.includes('Avatar') && f.isActive)
  })));

  // Find the file with title containing 'Avatar' (case-sensitive)
  const avatarFile = gpMember.ftMemberFiles.find(file => {
    const hasTitle = !!file.title;
    const hasAvatarInTitle = file.title?.includes('Avatar') || false;
    
    // Handle isActive as boolean, string, or number (API might return different types)
    const isFileActive = file.isActive === true || 
                        (file.isActive as any) === "true" || 
                        (file.isActive as any) === 1 ||
                        !!file.isActive;
    
    console.log(`  Checking file:`, {
      title: file.title,
      hasTitle,
      hasAvatarInTitle,
      isActive: file.isActive,
      isActiveType: typeof file.isActive,
      isFileActive,
      matches: hasTitle && hasAvatarInTitle && isFileActive
    });
    
    return hasTitle && hasAvatarInTitle && isFileActive;
  });

  console.log('🎯 Avatar file found:', avatarFile);
  console.log('📸 Avatar URL:', avatarFile?.filePath || null);

  return avatarFile?.filePath || null;
};

/**
 * Get display name from GPMember
 */
export const getDisplayNameFromGPMember = (gpMember: GPMember | null): string | null => {
  return gpMember?.fullname || null;
};

const familyTreeMemberService = {
  /**
   * Get member role (FTRole) by ftId and memberId
   * @param ftId Family tree ID
   * @param memberId Member ID
   * @returns FTRole ('FTMember' | 'FTOwner') or null if not found
   */
  async getMemberRole(ftId: string, memberId: string): Promise<FTRole | null> {
    try {
      const member = await this.getGPMemberByMemberId(ftId, memberId);
      return member?.ftRole ?? null;
    } catch (error) {
      console.error('Error getting member role:', error);
      return null;
    }
  },

  /** Get full GPMember by ftId and memberId (group-specific profile) */
  async getGPMemberByMemberId(ftId: string, memberId: string): Promise<GPMember | null> {
    try {
      const cacheKey = `${ftId}:${memberId}`;
      if (gpMemberCacheByMemberId.has(cacheKey)) {
        return gpMemberCacheByMemberId.get(cacheKey)!;
      }
      const response: ApiResponse<GPMember> = await api.get(`/ftmember/${ftId}/get-by-memberid`, {
        params: { memberId }
      });
      const data = (response.data as any)?.data || response.data;
      if (response.status && data) {
        gpMemberCacheByMemberId.set(cacheKey, data as GPMember);
        return data as GPMember;
      }
      return null;
    } catch {
      return null;
    }
  },

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
        `/ftmember/${gpId}/get-by-userid`,
        { params: { userId } }
      );

      console.log('GPMember API response:', response);

      // Handle nested data structure
      const memberData =
        (response as any)?.data?.data ??
        (response as any)?.data ??
        (response as any);

      const isSuccess =
        response.status === true ||
        response.success === true ||
        response.statusCode === 200;

      if (isSuccess && memberData?.id) {
        // Cache the result
        cachedGPMemberId = memberData.id;
        cacheKey = currentCacheKey;
        
        console.log('GPMemberId cached successfully:', cachedGPMemberId);
        return cachedGPMemberId;
      } else {
        console.error('Failed to get GPMemberId:', response.message || response.statusCode);
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
      const cacheKey = `${gpId}:${userId}`;
      if (gpMemberCacheByUserId.has(cacheKey)) {
        return gpMemberCacheByUserId.get(cacheKey)!;
      }
      const response: ApiResponse<GPMember> = await api.get(`/ftmember/${gpId}/get-by-userid`, {
        params: { userId }
      });
      const memberData =
        (response as any)?.data?.data ??
        (response as any)?.data ??
        (response as any);
      const isSuccess =
        response.status === true ||
        response.success === true ||
        response.statusCode === 200;
      if (isSuccess && memberData) {
        gpMemberCacheByUserId.set(cacheKey, memberData as GPMember);
        return memberData as GPMember;
      }
      return null;
    } catch (error) {
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
    gpMemberCacheByMemberId.clear();
    gpMemberCacheByUserId.clear();
  },

  /**
   * Set GPMemberId manually (useful when you already have the ID from another API call)
   */
  setGPMemberId(gpId: string, userId: string, gpMemberId: string): void {
    cacheKey = `${gpId}-${userId}`;
    cachedGPMemberId = gpMemberId;
  }
};

export default familyTreeMemberService;