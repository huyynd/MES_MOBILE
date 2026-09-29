import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { inventoryApi } from '@/api/inventory';
import { InventoryTransaction } from '@/types/inventory';
import { Card } from '@/components/Card';
import { LoadingScreen } from '@/components/LoadingScreen';
import { PackageOpen, ChevronRight, Clock } from 'lucide-react-native';

export function InboundListScreen({ navigation }: any) {
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchTransactions = async () => {
    try {
      const data = await inventoryApi.getPendingInbound();
      setTransactions(data || []);
    } catch (error) {
      console.error('Failed to fetch inventory transactions', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchTransactions();
    });
    return unsubscribe;
  }, [navigation]);

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchTransactions();
  };

  if (isLoading) return <LoadingScreen message="Đang tải danh sách phiếu..." />;

  const renderItem = ({ item }: { item: InventoryTransaction }) => (
    <TouchableOpacity onPress={() => navigation.navigate('InboundDetail', { transaction: item })}>
      <Card style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.titleRow}>
            <PackageOpen size={20} color="#f97316" />
            <Text style={styles.transactionCode}>{item.transaction_code}</Text>
          </View>
          <ChevronRight size={20} color="#cbd5e1" />
        </View>
        <Text style={styles.noteText} numberOfLines={1}>{item.notes || 'Không có ghi chú'}</Text>
        <View style={styles.detailsRow}>
          <Text style={styles.detailText}>Tạo bởi: {item.creator_name}</Text>
          <View style={styles.timeRow}>
            <Clock size={14} color="#64748b" style={{ marginRight: 4 }} />
            <Text style={styles.detailText}>
              {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {transactions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Không có phiếu nhập kho nào đang chờ duyệt.</Text>
        </View>
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  listContent: {
    padding: 16,
  },
  card: {
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  transactionCode: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  noteText: {
    fontSize: 15,
    color: '#334155',
    marginBottom: 12,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 12,
  },
  detailText: {
    fontSize: 13,
    color: '#64748b',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 16,
    color: '#94a3b8',
    textAlign: 'center',
  }
});
