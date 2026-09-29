import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { productionApi } from '@/api/production';
import { ProductionTask } from '@/types/production';
import { useAuthStore } from '@/store/authStore';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { LoadingScreen } from '@/components/LoadingScreen';
import { ClipboardList } from 'lucide-react-native';

export function WorkOrderListScreen({ navigation }: any) {
  const { user } = useAuthStore();
  const [tasks, setTasks] = useState<ProductionTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchTasks = async () => {
    if (!user) return;
    try {
      let data: ProductionTask[] = [];
      const isManager = user.is_admin || (user.role_name && !user.role_name.toLowerCase().includes('công nhân'));

      if (isManager) {
        // Quản lý: Lấy tất cả các lệnh đang thực thi
        const allData = await productionApi.getExecutionTasks({});
        // Chỉ hiển thị các task đang hoạt động hoặc chờ xử lý
        data = allData.filter((t: any) => t.status !== 'Hoàn thành' && t.status !== 'Đã hủy');
      } else {
        // Công nhân: Lấy các công việc được giao trong ngày
        const today = new Date().toISOString().split('T')[0];
        const workerName = user.linked_worker || user.full_name || user.username;
        data = await productionApi.getDailyTasks(workerName, today);
      }

      setTasks(data || []);
    } catch (error) {
      console.error('Failed to fetch tasks', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchTasks();
  };

  if (isLoading) return <LoadingScreen message="Đang tải danh sách công việc..." />;

  const renderItem = ({ item }: { item: ProductionTask }) => (
    <Card variant="elevated" style={styles.card}>
      <Text style={styles.orderCode}>{item.order_code}</Text>
      <Text style={styles.detailText}>Sản phẩm: <Text style={styles.strong}>{item.product_name}</Text></Text>
      <Text style={styles.detailText}>Công đoạn: <Text style={styles.strong}>{item.step_name}</Text></Text>
      <Text style={styles.detailText}>Đã làm: <Text style={styles.strong}>{item.actual_qty || 0} {item.unit}</Text></Text>
      
      <View style={styles.actionRow}>
        <Button 
          title="XEM CHI TIẾT" 
          variant="secondary"
          onPress={() => navigation.navigate('WorkOrderDetail', { task: item })}
          style={styles.detailBtn}
        />
      </View>
    </Card>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>CÔNG VIỆC HÔM NAY</Text>
      </View>
      
      {tasks.length === 0 ? (
        <View style={styles.emptyContainer}>
          <ClipboardList size={48} color="#cbd5e1" style={{ marginBottom: 16 }} />
          <Text style={styles.emptyText}>Hôm nay bạn chưa được phân công công việc nào.</Text>
        </View>
      ) : (
        <FlatList
          data={tasks}
          keyExtractor={(item, index) => item.task_id || index.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={['#1d4ed8']} />}
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
  header: {
    padding: 16,
    paddingTop: 48,
    backgroundColor: '#1d4ed8',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff',
  },
  listContent: {
    padding: 16,
  },
  card: {
    padding: 20,
    marginBottom: 16,
  },
  orderCode: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 12,
  },
  detailText: {
    fontSize: 15,
    color: '#475569',
    marginBottom: 6,
  },
  strong: {
    fontWeight: '700',
    color: '#0f172a',
  },
  actionRow: {
    marginTop: 16,
  },
  detailBtn: {
    height: 48,
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
    fontWeight: '500',
  }
});
