import { apiClient } from './client';
import { InventoryTransaction } from '@/types/inventory';

const toInboundTransaction = (transaction: any): InventoryTransaction => ({
  id: transaction.id,
  transaction_code: transaction.ref_code || transaction.id,
  type: 'INBOUND',
  status: 'APPROVED',
  created_by: '',
  creator_name: transaction.created_by || 'Hệ thống',
  created_at: transaction.created_at,
  items: [{
    id: transaction.id,
    product_id: transaction.product_id,
    product_code: transaction.product_code,
    product_name: transaction.product_name,
    qty: Number(transaction.quantity) || 0,
    unit: transaction.unit || '',
  }],
  notes: transaction.note,
});

export const inventoryApi = {
  // MES_NGOCAN does not expose a separate inbound-approval workflow. Its source
  // of truth is the inventory ledger, so the mobile view renders confirmed receipts.
  getPendingInbound: async (): Promise<InventoryTransaction[]> => {
    const transactions = await inventoryApi.getTransactions({ trx_type: 'Nhập' });
    return transactions.map(toInboundTransaction);
  },

  getTransactions: async (params?: Record<string, string>): Promise<any[]> => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    const response = await apiClient.get(`/inventory/transactions${qs}`);
    return response.data?.data || response.data || [];
  },

  getOutboundSlips: async (params?: Record<string, string>): Promise<any[]> => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    const response = await apiClient.get(`/outbound-slips${qs}`);
    return response.data?.data || response.data || [];
  },

  createOutboundSlip: async (data: any): Promise<any> => {
    const response = await apiClient.post('/outbound-slips', data);
    return response.data;
  },

  getOutboundSlip: async (id: string): Promise<any> => {
    const response = await apiClient.get(`/outbound-slips/${id}`);
    return response.data?.data || response.data;
  },

  confirmOutboundSlip: async (id: string): Promise<any> => {
    const response = await apiClient.post(`/outbound-slips/${id}/confirm`);
    return response.data;
  },

  cancelOutboundSlip: async (id: string): Promise<any> => {
    const response = await apiClient.post(`/outbound-slips/${id}/cancel`);
    return response.data;
  },

  getLookups: async (): Promise<any> => {
    const response = await apiClient.get('/lookups');
    return response.data;
  },
};
