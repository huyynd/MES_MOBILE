import apiClient from './client';
import { InventoryTransaction } from '@/types/inventory';

export const inventoryApi = {
  // Lấy danh sách phiếu nhập kho chờ duyệt
  // Route backend mô phỏng: GET /api/inventory/inbound?status=PENDING
  getPendingInbound: async (): Promise<InventoryTransaction[]> => {
    try {
      const response = await apiClient.get<InventoryTransaction[]>('/inventory/inbound?status=PENDING');
      return response.data;
    } catch (e) {
      // Mock data in case API is not fully implemented on Backend yet
      return [
        {
          id: 'mock-1',
          transaction_code: 'INB-20260923-01',
          type: 'INBOUND',
          status: 'PENDING',
          created_by: 'worker_1',
          creator_name: 'Nguyễn Văn A',
          created_at: new Date().toISOString(),
          items: [
            { id: 'i1', product_id: 'p1', product_code: 'SCRAP-01', product_name: 'Phế liệu đầu mẩu', qty: 15, unit: 'kg' }
          ],
          notes: 'Nhập phế liệu ca 1'
        },
        {
          id: 'mock-2',
          transaction_code: 'INB-20260923-02',
          type: 'INBOUND',
          status: 'PENDING',
          created_by: 'worker_2',
          creator_name: 'Trần Thị B',
          created_at: new Date().toISOString(),
          items: [
            { id: 'i2', product_id: 'p2', product_code: 'PROD-05', product_name: 'Thành phẩm cuộn', qty: 200, unit: 'm' }
          ],
          notes: 'Nhập thành phẩm máy 03'
        }
      ];
    }
  },

  // Duyệt phiếu nhập kho
  // Route backend mô phỏng: POST /api/inventory/inbound/:id/approve
  approveInbound: async (transactionId: string): Promise<void> => {
    // try {
    //   await apiClient.post(`/inventory/inbound/${transactionId}/approve`);
    // } catch (e) {
    //   throw e;
    // }
    
    // Giả lập API call
    return new Promise(resolve => setTimeout(resolve, 1000));
  },

  // GET /inventory/transactions
  getTransactions: async (params?: any): Promise<any[]> => {
    try {
      const qs = params ? '?' + new URLSearchParams(params).toString() : '';
      const response = await apiClient.get(`/inventory/transactions${qs}`);
      return response.data?.data || response.data || [];
    } catch (e) {
      console.warn("getTransactions mock fallback");
      return [];
    }
  },

  // GET /outbound-slips
  getOutboundSlips: async (params?: any): Promise<any[]> => {
    try {
      const qs = params ? '?' + new URLSearchParams(params).toString() : '';
      const response = await apiClient.get(`/outbound-slips${qs}`);
      return response.data?.data || response.data || [];
    } catch (e) {
      console.warn("getOutboundSlips mock fallback");
      return [];
    }
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
