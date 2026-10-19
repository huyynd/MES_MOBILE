import { apiClient } from './client';
import { DailyWorkOrder, ProductionTask } from '@/types/production';

type BackendTask = Record<string, any>;

const toProductionTask = (task: BackendTask): ProductionTask => ({
  ...task,
  task_id: task.task_id || task.id,
  task_code: task.task_code,
  step_name: task.step_name || task.stage || '',
  order_id: task.order_id || task.production_order_id,
  order_code: task.order_code || '',
  product_code: task.product_code || '',
  product_name: task.product_name || '',
  unit: task.unit || '',
  product_id: task.product_id || '',
  quantity: Number(task.quantity) || 0,
  actual_qty: Number(task.actual_qty) || 0,
  product_scrap_qty: Number(task.product_scrap_qty ?? task.scrap_qty) || 0,
});

export const productionApi = {
  getDailyWos: async (workerName: string, date?: string): Promise<DailyWorkOrder[]> => {
    const params = new URLSearchParams({ worker_name: workerName });
    if (date) params.append('date', date);
    const response = await apiClient.get<DailyWorkOrder[]>(`/scrap/daily-wos?${params.toString()}`);
    return response.data;
  },

  getDailyTasks: async (workerName: string, date: string): Promise<ProductionTask[]> => {
    const params = new URLSearchParams({ worker_name: workerName, date });
    const response = await apiClient.get<BackendTask[]>(`/scrap/daily-details?${params.toString()}`);
    return response.data.map(toProductionTask);
  },

  getExecutionTasks: async (params: Record<string, unknown> = {}): Promise<ProductionTask[]> => {
    const q = new URLSearchParams(
      Object.entries(params)
        .filter(([, value]) => value !== '' && value != null)
        .map(([key, value]) => [key, String(value)]),
    );
    const response = await apiClient.get<{ data: BackendTask[] }>(`/production/execution?${q.toString()}`);
    return (response.data.data || []).map(toProductionTask);
  },

  // PUT /production/tasks/:id only changes the operational status.
  updateTaskStatus: async (taskId: string, status: 'Chờ' | 'Đang sản xuất' | 'Dừng sản xuất') => {
    const response = await apiClient.put(`/production/tasks/${taskId}`, { status });
    return response.data;
  },

  getOrderTasks: async (orderId: string): Promise<BackendTask[]> => {
    const response = await apiClient.get<{ data?: BackendTask[] }>(`/production-orders/${orderId}/tasks`);
    return response.data.data || [];
  },

  // The backend persists actual quantities through the full task-assignment endpoint.
  // Reloading immediately before the write avoids sending stale task data from the UI.
  saveTaskProgress: async (orderId: string, taskId: string, actualQty: number) => {
    const tasks = await productionApi.getOrderTasks(orderId);
    if (!tasks.some((task) => task.id === taskId)) {
      throw new Error('Không tìm thấy công đoạn cần cập nhật.');
    }
    const response = await apiClient.put(`/production-orders/${orderId}/tasks`, {
      tasks: tasks.map((task) => task.id === taskId
        ? { ...task, actual_qty: actualQty, status: task.status === 'Chờ' ? 'Đang sản xuất' : task.status }
        : task),
    });
    return response.data;
  },

  completeTask: async (orderId: string, taskCode: string) => {
    const response = await apiClient.post(`/production-orders/${orderId}/complete-tasks`, {
      tasks: [{ task_code: taskCode }],
    });
    return response.data;
  },

  getTaskByCode: async (code: string) => {
    const response = await apiClient.get(`/production/task-by-code/${encodeURIComponent(code)}`);
    return response.data;
  },

  getMaterials: async (orderId: string) => {
    const response = await apiClient.get(`/production-orders/${orderId}/materials`);
    return response.data;
  },

  saveMaterials: async (orderId: string, lines: { material_id: string; qty: number; unit?: string }[]) => {
    const response = await apiClient.post(`/production-orders/${orderId}/materials`, { lines });
    return response.data;
  },

  // Compatibility helper for the dashboard. The backend deliberately rejects
  // actual_qty on /production/tasks/:id, so resolve its production order first
  // and use the supported full-assignment endpoint instead.
  updateTaskProgress: async (taskId: string, payload: { actual_qty: number; status?: string }) => {
    const tasks = await productionApi.getExecutionTasks();
    const task = tasks.find((item) => item.task_id === taskId);
    if (!task?.order_id) throw new Error('Không tìm thấy lệnh sản xuất của công đoạn.');
    return productionApi.saveTaskProgress(task.order_id, taskId, payload.actual_qty);
  },
};
