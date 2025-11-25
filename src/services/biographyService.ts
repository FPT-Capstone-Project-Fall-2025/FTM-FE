import type { BiographyDesc, BiographyEntry, Education, WorkExperience, WorkPosition } from '@/types/biography';
import type { ApiResponse } from './../types/api';
import api from './apiService';


const biographyService = {

  getBiographyDesc(): Promise<ApiResponse<BiographyDesc>> {
    return api.get('/biography/description');
  },

  updateBiographyDesc(desc: string): Promise<ApiResponse<BiographyDesc>> {
    return api.put(`/biography/description`, { description: desc });
  },

  getBiographyEvents(): Promise<ApiResponse<BiographyEntry[]>> {
    return api.get(`/biography/events`);
  },

  addBiographyEvent(entry: BiographyEntry): Promise<ApiResponse<BiographyEntry>> {
    return api.post(`/biography/events`, { ...entry });
  },

  getBiographyEvent(eventId: string): Promise<ApiResponse<BiographyEntry>> {
    return api.get(`/biography/events/${eventId}`);
  },

  updateBiographyEvent(entry: BiographyEntry): Promise<ApiResponse<BiographyEntry>> {
    return api.put(`/biography/events/${entry.id}`, { ...entry });
  },

  deleteBiographyEvent(eventId: string): Promise<ApiResponse<string>> {
    return api.delete(`/biography/events/${eventId}`);
  },

  getEducation(): Promise<ApiResponse<Education[]>> {
    return api.get('/education');
  },

  getEducationById(id: string): Promise<ApiResponse<Education>> {
    return api.get(`/education/${id}`);
  },

  addEducation(data: Education): Promise<ApiResponse<Education>> {
    return api.post('/education', { ...data });
  },

  updateEducation(data: Education): Promise<ApiResponse<Education>> {
    return api.put(`/education/${data.id}`, { ...data });
  },

  deleteEducation(id: string): Promise<ApiResponse<void>> {
    return api.delete(`/education/${id}`);
  },

  getWork(): Promise<ApiResponse<WorkExperience[]>> {
    return api.get('/work');
  },

  getWorkById(id: string): Promise<ApiResponse<WorkExperience>> {
    return api.get(`/work/${id}`);
  },

  createWork(data: WorkExperience): Promise<ApiResponse<WorkExperience>> {
    return api.post(`/work`, { ...data });
  },

  updateWork(data: WorkExperience): Promise<ApiResponse<WorkExperience>> {
    return api.put(`/work/${data.id}`, { ...data });
  },

  createWorkPosition(workId: string, position: WorkPosition): Promise<ApiResponse<WorkExperience>> {
    return api.post(`/work/${workId}/positions`, { ...position });
  },

  updateWorkPosition(workId: string, position: WorkPosition): Promise<ApiResponse<WorkExperience>> {
    return api.put(`/work/${workId}/positions/${position.id}`, { ...position });
  },

  deleteWorkPosition(workId: string, positionId: string): Promise<ApiResponse<void>> {
    return api.delete(`/work/${workId}/positions/${positionId}`);
  },
  
  deleteWork(id: string): Promise<ApiResponse<void>> {
    return api.delete(`/work/${id}`);
  },
};

export default biographyService;
