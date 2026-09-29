import apiClient from './client';
import { DailyWorkOrder, ProductionTask } from '@/types/production';

export const productionApi = {
  // Lấy các lệnh SX (Work Orders) của công nhân trong ngày
  // Backend route: /api/scrap/daily-wos?worker_name=...&date=...
  getDailyWos: async (workerName: string, date?: string): Promise<DailyWorkOrder[]> => {
    const params = new URLSearchParams({ worker_name: workerName });
    if (date) params.append('date', date);
    
    const response = await apiClient.get<DailyWorkOrder[]>(`/scrap/daily-wos?${params.toString()}`);
    return response.data;
  },

  // Lấy các task chi tiết của worker trong ngày
  // Backend route: /api/scrap/daily-details?worker_name=...&date=...
  getDailyTasks: async (workerName: string, date: string): Promise<ProductionTask[]> => {
    const params = new URLSearchParams({ worker_name: workerName, date });
    const response = await apiClient.get<ProductionTask[]>(`/scrap/daily-details?${params.toString()}`);
    return response.data;
  },

  // Lấy danh sách task thực thi sản xuất (có thể lấy toàn bộ nếu không truyền param)
  // Backend route: GET /api/production/execution
  getExecutionTasks: async (params: any = {}): Promise<ProductionTask[]> => {
    const q = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== '' && v != null).map(([k, v]) => [k, String(v)]));
    const response = await apiClient.get<{data: ProductionTask[]}>(`/production/execution?${q.toString()}`);
    return response.data.data || [];
  },

  // Cập nhật số lượng hoàn thành của Task (Lưu ý: Route này dựa trên productionController.js)
  // Backend route: PUT /api/production/tasks/:taskId
  updateTaskProgress: async (taskId: string, payload: { actual_qty: number; status: string }) => {
    const response = await apiClient.put(`/production/tasks/${taskId}`, payload);
    return response.data;
  }
};
