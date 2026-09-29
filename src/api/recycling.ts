import apiClient from './client';

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

  update: async (id: string, data: any) => {
    try {
      const response = await apiClient.put(`/recycling/${id}`, data);
      return response.data;
    } catch (error) {
      console.error(`Error updating recycling record ${id}:`, error);
      throw error;
    }
  },

  delete: async (id: string) => {
    try {
      const response = await apiClient.delete(`/recycling/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting recycling record ${id}:`, error);
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
