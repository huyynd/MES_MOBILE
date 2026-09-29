export interface InventoryItem {
  id: string;
  product_id: string;
  product_code: string;
  product_name: string;
  qty: number;
  unit: string;
}

export interface InventoryTransaction {
  id: string;
  transaction_code: string;
  type: 'INBOUND' | 'OUTBOUND';
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  created_by: string;
  creator_name: string;
  created_at: string;
  items: InventoryItem[];
  notes?: string;
}
