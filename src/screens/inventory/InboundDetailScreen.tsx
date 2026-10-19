import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Card } from '@/components/Card';
import { InventoryTransaction } from '@/types/inventory';

export function InboundDetailScreen({ route }: any) {
  const { transaction } = route.params as { transaction: InventoryTransaction };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Text style={styles.label}>Mã giao dịch</Text>
        <Text style={styles.value}>{transaction.transaction_code}</Text>
        <View style={styles.divider} />
        <Text style={styles.label}>Nguồn ghi nhận</Text>
        <Text style={styles.value}>{transaction.creator_name}</Text>
        <View style={styles.divider} />
        <Text style={styles.label}>Ghi chú</Text>
        <Text style={styles.value}>{transaction.notes || 'Không có ghi chú'}</Text>
      </Card>

      <Text style={styles.sectionTitle}>Mặt hàng đã nhập</Text>
      {transaction.items.map((item, index) => (
        <Card key={item.id || index.toString()} style={styles.itemCard}>
          <Text style={styles.itemName}>{item.product_name}</Text>
          <Text style={styles.itemCode}>Mã: {item.product_code}</Text>
          <Text style={styles.itemQty}>Số lượng: <Text style={styles.qtyHighlight}>{item.qty} {item.unit}</Text></Text>
        </Card>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', padding: 16 },
  card: { padding: 20, marginBottom: 24 },
  label: { fontSize: 14, color: '#64748b', marginBottom: 4 },
  value: { fontSize: 16, fontWeight: '600', color: '#0f172a' },
  divider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 12 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#0369a1', marginBottom: 12 },
  itemCard: { padding: 16, marginBottom: 12 },
  itemName: { fontSize: 16, fontWeight: 'bold', color: '#1e293b', marginBottom: 4 },
  itemCode: { fontSize: 14, color: '#64748b', marginBottom: 8 },
  itemQty: { fontSize: 15, color: '#334155' },
  qtyHighlight: { fontWeight: 'bold', color: '#22c55e' },
});
