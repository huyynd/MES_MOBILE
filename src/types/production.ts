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
  task_code?: string;
  step_name: string; // stage in db
  status?: string;
  quantity?: number;
  actual_qty: number;
  order_id: string;
  order_code: string;
  product_code: string;
  product_name: string;
  unit: string;
  product_id: string;
  product_scrap_qty?: number;
  machine_name?: string;
  assigned_worker?: string;
}
