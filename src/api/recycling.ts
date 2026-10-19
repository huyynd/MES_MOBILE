import { apiClient } from './client';

export const recyclingApi = {
  list: async (params: any = {}) => {
    try {
      const response = await apiClient.get('/recycling', { params });
      return response.data?.data || response.data || [];
    } catch (error) {
      console.error('Error fetching recycling list:', error);
      throw error;
    }
  },
  
  get: async (id: string) => {
    try {
      const response = await apiClient.get(`/recycling/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching recycling record ${id}:`, error);
      throw error;
    }
  },

  create: async (data: any) => {
    try {
      const response = await apiClient.post('/recycling', data);
      return response.data;
    } catch (error) {
      console.error('Error creating recycling record:', error);
      throw error;
    }
  },

  weigh: async (id: string, data: any) => {
    try {
      const response = await apiClient.put(`/recycling/${id}/weigh`, data);
      return response.data;
    } catch (error) {
      console.error(`Error weighing recycling record ${id}:`, error);
      throw error;
    }
  },

  receiveRolls: async (id: string, rolls: { weight: number; pe_type?: string; unit?: string; note?: string }[]) => {
    const response = await apiClient.put(`/recycling/${id}/receive`, { rolls });
    return response.data;
  },

  complete: async (id: string, data: any) => {
    try {
      const response = await apiClient.put(`/recycling/${id}/complete`, data);
      return response.data;
    } catch (error) {
      console.error(`Error completing recycling record ${id}:`, error);
      throw error;
    }
  },
};
