import apiClient from './client';
import { InventoryTransaction } from '@/types/inventory';

const INBOUND_NOT_READY = 'Chức năng duyệt nhập kho chưa có API backend.';

export const inventoryApi = {
  // Nhập kho chờ duyệt: backend CHƯA có API (/inventory/inbound không tồn tại).
  // Không trả dữ liệu giả — màn hình hiển thị "chưa có" cho tới khi có API.
  INBOUND_API_READY: false,
  getPendingInbound: async (): Promise<InventoryTransaction[]> => {
    throw new Error(INBOUND_NOT_READY);
  },
  approveInbound: async (_transactionId: string): Promise<void> => {
    throw new Error(INBOUND_NOT_READY);
  },

  // GET /inventory/transactions
  getTransactions: async (params?: any): Promise<any[]> => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    const response = await apiClient.get(`/inventory/transactions${qs}`);
    return response.data?.data || response.data || [];
  },

  // GET /outbound-slips
  getOutboundSlips: async (params?: any): Promise<any[]> => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    const response = await apiClient.get(`/outbound-slips${qs}`);
    return response.data?.data || response.data || [];
  },

  // POST /outbound-slips
  createOutboundSlip: async (data: any): Promise<any> => {
    const response = await apiClient.post('/outbound-slips', data);
    return response.data;
  },

  // GET /outbound-slips/:id
  getOutboundSlip: async (id: string): Promise<any> => {
    const response = await apiClient.get(`/outbound-slips/${id}`);
    return response.data?.data || response.data;
  },

  // POST /outbound-slips/:id/confirm
  confirmOutboundSlip: async (id: string): Promise<any> => {
    const response = await apiClient.post(`/outbound-slips/${id}/confirm`);
    return response.data;
  },

  // POST /outbound-slips/:id/cancel
  cancelOutboundSlip: async (id: string): Promise<any> => {
    const response = await apiClient.post(`/outbound-slips/${id}/cancel`);
    return response.data;
  },

  // Lấy các danh mục hỗ trợ chọn kho/sản phẩm
  // Mô phỏng /inventory/tree (nhưng trong mobile thường sẽ gọi 1 hàm lookups)
  getLookups: async (): Promise<any> => {
    try {
      const [productsRes, locationsRes, lookupsRes, warehousesRes] = await Promise.all([
        apiClient.get('/products').catch(() => ({ data: [] })),
        apiClient.get('/locations').catch(() => ({ data: [] })),
        apiClient.get('/lookups').catch(() => ({ data: {} })),
        apiClient.get('/warehouses').catch(() => ({ data: [] }))
      ]);
      return {
        products: productsRes.data || [],
        locations: locationsRes.data || [],
        warehouses: lookupsRes.data?.warehouses || warehousesRes.data?.data || warehousesRes.data || []
      };
    } catch (e) {
      return { products: [], locations: [], warehouses: [] };
    }
  }
};
