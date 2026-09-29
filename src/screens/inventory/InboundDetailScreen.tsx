import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { inventoryApi } from '@/api/inventory';
import { InventoryTransaction } from '@/types/inventory';

export function InboundDetailScreen({ route, navigation }: any) {
  const { transaction } = route.params as { transaction: InventoryTransaction };
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleApprove = async () => {
    setIsSubmitting(true);
    try {
      await inventoryApi.approveInbound(transaction.id);
      Alert.alert('Thành công', 'Đã duyệt phiếu nhập kho', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error: any) {
      Alert.alert('Lỗi', 'Không thể duyệt phiếu: ' + (error.message || 'Lỗi không xác định'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Text style={styles.label}>Mã Phiếu</Text>
        <Text style={styles.value}>{transaction.transaction_code}</Text>
        
        <View style={styles.divider} />
        
        <Text style={styles.label}>Người yêu cầu</Text>
        <Text style={styles.value}>{transaction.creator_name}</Text>
        
        <View style={styles.divider} />

        <Text style={styles.label}>Ghi chú</Text>
        <Text style={styles.value}>{transaction.notes || 'Không có ghi chú'}</Text>
      </Card>

      <Text style={styles.sectionTitle}>Danh sách mặt hàng</Text>
      {transaction.items.map((item, index) => (
        <Card key={item.id || index.toString()} style={styles.itemCard}>
          <Text style={styles.itemName}>{item.product_name}</Text>
          <Text style={styles.itemCode}>Mã: {item.product_code}</Text>
          <Text style={styles.itemQty}>
            Số lượng: <Text style={styles.qtyHighlight}>{item.qty} {item.unit}</Text>
          </Text>
        </Card>
      ))}

      <View style={styles.buttonContainer}>
        <Button 
          title="Xác nhận Nhập kho" 
          onPress={handleApprove}
          loading={isSubmitting}
        />
        <Button 
          title="Từ chối" 
          variant="danger" 
          onPress={() => Alert.alert('Thông báo', 'Chức năng từ chối sẽ gọi API reject ở Backend')}
          disabled={isSubmitting}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    padding: 16,
  },
  card: {
    padding: 20,
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0369a1',
    marginBottom: 12,
  },
  itemCard: {
    padding: 16,
    marginBottom: 12,
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  itemCode: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 8,
  },
  itemQty: {
    fontSize: 15,
    color: '#334155',
  },
  qtyHighlight: {
    fontWeight: 'bold',
    color: '#22c55e',
  },
  buttonContainer: {
    marginTop: 8,
    marginBottom: 32,
  }
});
