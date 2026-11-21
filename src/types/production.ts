export interface DailyWorkOrder {
  order_id: string;
  order_code: string;
  product_id: string;
  product_name: string;
  product_code: string;
  unit: string;
  total_qty: number;
  last_completed_at: string;
}

export interface ProductionTask {
  task_id: string;
  step_name: string; // stage in db
  actual_qty: number;
  order_id: string;
  order_code: string;
  product_code: string;
  product_name: string;
  unit: string;
  product_id?: string;
  product_scrap_qty?: number;
  // Có khi lấy từ /production/execution (cần để ghi SL thực / hoàn thành)
  task_code?: string;
  status?: string; // 'Chờ' | 'Đang sản xuất' | 'Dừng sản xuất' | 'Hoàn thành'
  quantity?: number; // SL kế hoạch của dòng phân công
  machine_name?: string;
  assigned_worker?: string;
  assigned_worker_id?: string | null; // mã nhân viên (employees.id) — lọc việc theo tổ
  shift?: string | null;
  planned_date?: string | null; // YYYY-MM-DD
  planned_end_date?: string | null;
  due_date?: string | null;
  // Tính ở app: vì sao việc nằm trong "hôm nay"
  when?: 'running' | 'today' | 'overdue' | 'unplanned' | 'future';
}
