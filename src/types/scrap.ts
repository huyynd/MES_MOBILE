export interface ScrapReportPayload {
  task_id: string; // Liên kết với Lệnh/Task hiện tại
  order_id: string;
  order_code: string;
  product_id: string;
  scrap_qty: number;
  reason: string;
  reported_by: string;
}

export interface ScrapReportResponse {
  success: boolean;
  message: string;
  scrap_id?: string;
}
