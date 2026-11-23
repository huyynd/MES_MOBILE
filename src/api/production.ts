import apiClient from './client';
import { DailyWorkOrder, ProductionTask } from '@/types/production';

// Chuẩn hoá 1 dòng của GET /production/execution về dạng ProductionTask dùng trong app
const fromExecutionRow = (r: any): ProductionTask => ({
  task_id: r.id,
  task_code: r.task_code,
  step_name: r.stage,
  status: r.status,
  quantity: Number(r.quantity) || 0,
  actual_qty: Number(r.actual_qty) || 0,
  order_id: r.production_order_id,
  order_code: r.order_code,
  product_code: r.product_code,
  product_name: r.product_name,
  unit: r.unit,
  machine_name: r.machine_name,
  assigned_worker: r.assigned_worker,
  assigned_worker_id: r.assigned_worker_id || null,
  shift: r.shift,
  planned_date: r.planned_date ? String(r.planned_date).slice(0, 10) : null,
  planned_end_date: r.planned_end_date ? String(r.planned_end_date).slice(0, 10) : null,
  due_date: r.due_date ? String(r.due_date).slice(0, 10) : null,
});

// Xếp 1 việc chưa xong vào nhóm theo ngày (so chuỗi YYYY-MM-DD)
const classify = (t: ProductionTask, today: string): ProductionTask['when'] => {
  if (t.status === 'Đang sản xuất') return 'running';
  const start = t.planned_date, end = t.planned_end_date || t.planned_date;
  if (!start) return 'unplanned';
  if (end && end < today) return 'overdue';
  if (start <= today) return 'today';
  return 'future';
};
const WHEN_ORDER = { running: 0, overdue: 1, today: 2, unplanned: 3, future: 4 } as const;

export const productionApi = {
  // Lấy các lệnh SX (Work Orders) của công nhân trong ngày
  // Backend route: /api/scrap/daily-wos?worker_name=...&date=...
  getDailyWos: async (workerName: string, date?: string): Promise<DailyWorkOrder[]> => {
    const params = new URLSearchParams({ worker_name: workerName });
    if (date) params.append('date', date);

    const response = await apiClient.get<DailyWorkOrder[]>(`/scrap/daily-wos?${params.toString()}`);
    return response.data;
  },

  // Các dòng phân công ĐÃ HOÀN THÀNH của worker trong ngày (dùng cho thống kê sản lượng)
  // Backend route: /api/scrap/daily-details?worker_name=...&date=...
  getDailyTasks: async (workerName: string, date: string): Promise<ProductionTask[]> => {
    const params = new URLSearchParams({ worker_name: workerName, date });
    const response = await apiClient.get<ProductionTask[]>(`/scrap/daily-details?${params.toString()}`);
    return response.data;
  },

  // Danh sách dòng phân công (có thể lọc worker/team/status/q)
  // Backend route: GET /api/production/execution
  getExecutionTasks: async (params: any = {}): Promise<ProductionTask[]> => {
    const q = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== '' && v != null).map(([k, v]) => [k, String(v)]));
    const response = await apiClient.get<{ data: any[] }>(`/production/execution?${q.toString()}`);
    return (response.data.data || []).map(fromExecutionRow);
  },

  // Việc đang mở (chưa hoàn thành) — lọc theo worker nếu có; gắn nhóm ngày (when) và xếp: đang làm → trễ → hôm nay → chưa lịch → sắp tới
  getOpenTasks: async (today: string, workerName?: string): Promise<ProductionTask[]> => {
    const all = await productionApi.getExecutionTasks(workerName ? { worker: workerName } : {});
    return all
      .filter((t) => t.status !== 'Hoàn thành' && t.status !== 'Đã hủy')
      .map((t) => ({ ...t, when: classify(t, today) }))
      .sort((a, b) => WHEN_ORDER[a.when!] - WHEN_ORDER[b.when!] || String(a.planned_date || '').localeCompare(String(b.planned_date || '')));
  },

  // "Việc hôm nay" của công nhân: đang làm + kế hoạch hôm nay + trễ hạn chưa xong + chưa lên lịch (bỏ việc ngày tới)
  getTodayTasksForWorker: async (workerName: string, today: string): Promise<ProductionTask[]> => {
    const open = await productionApi.getOpenTasks(today, workerName);
    return open.filter((t) => t.when !== 'future');
  },

  // Đổi trạng thái vận hành (Đang sản xuất / Dừng sản xuất / Chờ).
  // Backend route: PUT /api/production/tasks/:taskId — route này KHÔNG nhận SL thực / 'Hoàn thành'.
  setTaskStatus: async (taskId: string, status: 'Chờ' | 'Đang sản xuất' | 'Dừng sản xuất') => {
    const response = await apiClient.put(`/production/tasks/${taskId}`, { status });
    return response.data;
  },

  // Ghi SL thực cho 1 dòng phân công — đi đúng đường của màn chi tiết lệnh trên web:
  // đọc toàn bộ phân công của lệnh → sửa actual_qty của dòng đó → PUT lại cả danh sách.
  // Backend routes: GET + PUT /api/production-orders/:id/tasks
  setActualQty: async (orderId: string, taskCode: string, actualQty: number) => {
    const { data } = await apiClient.get<{ data: any[] }>(`/production-orders/${orderId}/tasks`);
    const rows = data.data || [];
    const target = rows.find((r) => r.task_code === taskCode);
    if (!target) throw new Error('Không tìm thấy dòng phân công — có thể lệnh vừa được sửa trên web. Hãy tải lại.');
    if (target.status === 'Hoàn thành') throw new Error('Dòng này đã Hoàn thành — không ghi thêm sản lượng được.');
    const tasks = rows.map((r) => ({
      ...r,
      actual_qty: r.task_code === taskCode ? actualQty : r.actual_qty,
      status: r.task_code === taskCode && r.status === 'Chờ' ? 'Đang sản xuất' : r.status,
    }));
    const response = await apiClient.put(`/production-orders/${orderId}/tasks`, { tasks });
    return response.data;
  },

  // GHI CUỘN NHANH (chốt 2026-11-23): mỗi số kg = 1 cuộn = 1 dòng mới có mã cuộn, hoàn thành + nhập kho ngay.
  // Dòng việc được giao (taskCode) giữ nguyên để ghi tiếp. finish = kết thúc việc (xóa dòng giao việc chưa có SL).
  // Backend route: POST /api/production-orders/:id/record-rolls
  recordRolls: async (orderId: string, taskCode: string, weights: number[], finish = false) => {
    const { data } = await apiClient.post(`/production-orders/${orderId}/record-rolls`, { task_code: taskCode, weights, finish });
    return data as { message: string; rolls: { task_code: string; roll_code: string; qty: number }[]; finished: boolean };
  },
  // Các cuộn đã ghi từ 1 dòng việc (mới nhất trước)
  listRolls: async (orderId: string, taskCode: string) => {
    const { data } = await apiClient.get(`/production-orders/${orderId}/record-rolls`, { params: { task_code: taskCode } });
    return (data?.data || []).map((r: any) => ({ ...r, qty: Number(r.qty) || 0 })) as
      { task_code: string; roll_code: string; qty: number; status: string; created_at: string }[];
  },

  // Hoàn thành 1 dòng phân công (backend tự kiểm tra đủ máy / công nhân / SL thực và ghi kho)
  // Backend route: POST /api/production-orders/:id/complete-tasks
  completeTask: async (orderId: string, taskCode: string) => {
    const response = await apiClient.post(`/production-orders/${orderId}/complete-tasks`, {
      tasks: [{ task_code: taskCode }],
    });
    return response.data;
  },
};
