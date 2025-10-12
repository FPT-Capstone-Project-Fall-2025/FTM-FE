import type { BiographyDesc, BiographyEntry } from '@/types/biography';
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
};

export default biographyService;
