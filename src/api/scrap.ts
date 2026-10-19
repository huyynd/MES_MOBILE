import { apiClient } from './client';
import { ScrapReportPayload, ScrapReportResponse } from '@/types/scrap';

export const scrapApi = {
  // Lấy danh sách công nhân
  getWorkers: async (): Promise<string[]> => {
    const response = await apiClient.get<(string | { name?: string })[]>('/scrap/workers');
    return response.data
      .map((worker) => typeof worker === 'string' ? worker : worker.name)
      .filter((worker): worker is string => Boolean(worker));
  },

  // Lấy dữ liệu phế phẩm đã ghi nhận trong ngày của 1 công nhân
  getScrapRecords: async (workerName: string, date: string): Promise<any> => {
    const params = new URLSearchParams({ worker_name: workerName, date });
    const response = await apiClient.get<any>(`/scrap/records?${params.toString()}`);
    return response.data;
  },

  // Lấy danh sách lệnh hoàn thành trong ngày
  getDailyDetails: async (workerName: string, date: string): Promise<any[]> => {
    const params = new URLSearchParams({ worker_name: workerName, date });
    const response = await apiClient.get<any[]>(`/scrap/daily-details?${params.toString()}`);
    return response.data;
  },

  // Gửi báo cáo phế liệu
  reportScrap: async (payload: ScrapReportPayload & { record_date?: string }): Promise<ScrapReportResponse> => {
    try {
      const backendPayload = {
        worker_name: payload.reported_by,
        record_date: payload.record_date || new Date().toISOString().split('T')[0],
        note: payload.reason,
        scrap_qty: payload.scrap_qty,
      };

      const response = await apiClient.post<any>('/scrap/records', backendPayload);
      return {
        success: true,
        message: response.data.message || 'Báo cáo phế liệu thành công',
        scrap_id: response.data.recordId
      };
    } catch (error: any) {
      throw error;
    }
  },
};
