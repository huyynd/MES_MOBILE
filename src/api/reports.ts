import apiClient from './client';

export const reportsApi = {
  getEmployees: async (params: any = {}) => {
    try {
      const response = await apiClient.get('/reports/employees', { params });
      return response.data?.data || response.data || [];
    } catch (error) {
      console.error('Error fetching employee reports:', error);
      throw error;
    }
  },
  
  getEmployeeTasks: async (worker: string, params: any = {}) => {
    try {
      const response = await apiClient.get(`/reports/employees/${encodeURIComponent(worker)}/tasks`, { params });
      return response.data;
    } catch (error) {
      console.error(`Error fetching tasks for ${worker}:`, error);
      throw error;
    }
  },

  getDashboard: async () => {
    try {
      const response = await apiClient.get('/dashboard');
      return response.data;
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      throw error;
    }
  }
};
