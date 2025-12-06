import type { ApiResponse } from '../types/api';
import api from './apiService';

export interface HonorData {
  id: string;
  gpMemberId: string;
  memberFullName: string;
  memberPhotoUrl: string;
  familyTreeId: string;
  achievementTitle: string;
  // Career fields
  organizationName?: string;
  position?: string | null;
  // Academic fields
  institutionName?: string;
  degreeOrCertificate?: string | null;
  yearOfAchievement: number;
  description: string | null;
  photoUrl: string | null;
  isDisplayed: boolean;
  createdOn: string;
  lastModifiedOn: string;
}

export interface CreateHonorData {
  AchievementTitle: string;
  OrganizationName: string;
  Position?: string;
  YearOfAchievement: number;
  Description?: string;
  Photo?: File;
  IsDisplayed: boolean;
  FamilyTreeId: string;
  GPMemberId: string;
}

export interface UpdateHonorData {
  AchievementTitle?: string;
  OrganizationName?: string;
  Position?: string;
  YearOfAchievement?: number;
  Description?: string;
  Photo?: File;
  IsDisplayed?: boolean;
}

const honorBoardService = {
  // ==================== CAREER HONOR BOARD ====================
  
  // Get all career honors for a specific family tree
  getCareerHonors(familyTreeId: string, pageIndex: number = 1, pageSize: number = 100): Promise<ApiResponse<{
    pageIndex: number;
    pageSize: number;
    totalPages: number;
    totalItems: number;
    data: HonorData[];
  }>> {
    return api.get(`/careerhonor?familyTreeId=${familyTreeId}&pageIndex=${pageIndex}&pageSize=${pageSize}`, {
      headers: {
        'X-Ftid': familyTreeId,
      },
    });
  },

  // Get a specific career honor by ID
  getCareerHonorById(ftId: string, honorId: string): Promise<ApiResponse<HonorData>> {
    return api.get(`/careerhonor/${honorId}`, {
      headers: {
        'X-Ftid': ftId,
      },
    });
  },

  // Create a new career honor
  createCareerHonor(data: CreateHonorData): Promise<ApiResponse<HonorData>> {
    const formData = new FormData();
    
    formData.append('AchievementTitle', data.AchievementTitle);
    formData.append('OrganizationName', data.OrganizationName);
    formData.append('FamilyTreeId', data.FamilyTreeId);
    formData.append('GPMemberId', data.GPMemberId);
    formData.append('YearOfAchievement', data.YearOfAchievement.toString());
    formData.append('IsDisplayed', data.IsDisplayed.toString());
    
    if (data.Position) formData.append('Position', data.Position);
    if (data.Description) formData.append('Description', data.Description);
    if (data.Photo) formData.append('Photo', data.Photo);

    return api.post('/careerhonor', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'X-Ftid': data.FamilyTreeId,
      },
    });
  },

  // Update a career honor
  updateCareerHonor(ftId: string, honorId: string, data: UpdateHonorData): Promise<ApiResponse<HonorData>> {
    const formData = new FormData();
    
    if (data.AchievementTitle !== undefined) formData.append('AchievementTitle', data.AchievementTitle);
    if (data.OrganizationName !== undefined) formData.append('OrganizationName', data.OrganizationName);
    if (data.Position !== undefined) formData.append('Position', data.Position);
    if (data.YearOfAchievement !== undefined) formData.append('YearOfAchievement', data.YearOfAchievement.toString());
    if (data.Description !== undefined) formData.append('Description', data.Description);
    if (data.IsDisplayed !== undefined) formData.append('IsDisplayed', data.IsDisplayed.toString());
    if (data.Photo) formData.append('Photo', data.Photo);

    return api.put(`/careerhonor/${honorId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'X-Ftid': ftId,
      },
    });
  },

  // Delete a career honor
  deleteCareerHonor(ftId: string, honorId: string): Promise<ApiResponse<boolean>> {
    return api.delete(`/careerhonor/${honorId}`, {
      headers: {
        'X-Ftid': ftId,
      },
    });
  },

  // ==================== ACADEMIC HONOR BOARD ====================
  
  // Get all academic honors for a specific family tree
  getAcademicHonors(familyTreeId: string, pageIndex: number = 1, pageSize: number = 100): Promise<ApiResponse<{
    pageIndex: number;
    pageSize: number;
    totalPages: number;
    totalItems: number;
    data: HonorData[];
  }>> {
    return api.get(`/academichonor?familyTreeId=${familyTreeId}&pageIndex=${pageIndex}&pageSize=${pageSize}`, {
      headers: {
        'X-Ftid': familyTreeId,
      },
    });
  },

  // Get a specific academic honor by ID
  getAcademicHonorById(ftId: string, honorId: string): Promise<ApiResponse<HonorData>> {
    return api.get(`/academichonor/${honorId}`, {
      headers: {
        'X-Ftid': ftId,
      },
    });
  },

  // Create a new academic honor
  createAcademicHonor(data: CreateHonorData): Promise<ApiResponse<HonorData>> {
    const formData = new FormData();
    
    // Academic Honor uses different field names
    formData.append('InstitutionName', data.OrganizationName); // Organization -> Institution
    formData.append('DegreeOrCertificate', data.Position || ''); // Use Position field for Degree/Certificate
    formData.append('AchievementTitle', data.AchievementTitle);
    formData.append('FamilyTreeId', data.FamilyTreeId);
    formData.append('GPMemberId', data.GPMemberId);
    formData.append('YearOfAchievement', data.YearOfAchievement.toString());
    formData.append('IsDisplayed', data.IsDisplayed.toString());
    
    if (data.Description) formData.append('Description', data.Description);
    if (data.Photo) formData.append('Photo', data.Photo);

    return api.post('/academichonor', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'X-Ftid': data.FamilyTreeId,
      },
    });
  },

  // Update an academic honor
  updateAcademicHonor(ftId: string, honorId: string, data: UpdateHonorData): Promise<ApiResponse<HonorData>> {
    const formData = new FormData();
    
    if (data.AchievementTitle !== undefined) formData.append('AchievementTitle', data.AchievementTitle);
    // Academic Honor uses different field names
    if (data.OrganizationName !== undefined) formData.append('InstitutionName', data.OrganizationName);
    if (data.Position !== undefined) formData.append('DegreeOrCertificate', data.Position);
    if (data.YearOfAchievement !== undefined) formData.append('YearOfAchievement', data.YearOfAchievement.toString());
    if (data.Description !== undefined) formData.append('Description', data.Description);
    if (data.IsDisplayed !== undefined) formData.append('IsDisplayed', data.IsDisplayed.toString());
    if (data.Photo) formData.append('Photo', data.Photo);

    return api.put(`/academichonor/${honorId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'X-Ftid': ftId,
      },
    });
  },

  // Delete an academic honor
  deleteAcademicHonor(ftId: string, honorId: string): Promise<ApiResponse<boolean>> {
    return api.delete(`/academichonor/${honorId}`, {
      headers: {
        'X-Ftid': ftId,
      },
    });
  },
};

export default honorBoardService;

