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

  // Báo cáo giám đốc: bán hàng, sản xuất, nhân sự, công nợ (tiền = null nếu không có quyền xem tiền)
  getDirector: async (period: 'week' | 'month' = 'month') => {
    const response = await apiClient.get('/reports/director', { params: { period } });
    return response.data;
  },

  // KPI sản xuất: tổng quan + xu hướng kế hoạch/thực tế 7 ngày
  getKpi: async (params: any = {}) => {
    const response = await apiClient.get('/reports/kpi', { params });
    return response.data;
  },

  // Hiệu suất máy móc
  getMachines: async () => {
    const response = await apiClient.get('/reports/machines');
    return response.data;
  },

  // Công nợ phải thu theo khách
  getReceivables: async () => {
    const response = await apiClient.get('/receivables');
    return response.data;
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
