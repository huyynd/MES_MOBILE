import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { productionApi } from '@/api/production';
import { ProductionTask } from '@/types/production';
import { Play, Pause, CheckSquare, Trash2, CheckCircle2 } from 'lucide-react-native';

export function WorkOrderDetailScreen({ route, navigation }: any) {
  const { task } = route.params as { task: ProductionTask };
  
  // Trạng thái giả định vì API trả về task có thể chỉ có actual_qty
  const [taskStatus, setTaskStatus] = useState<'Chưa bắt đầu' | 'Đang thực hiện' | 'Hoàn thành'>(
    task.actual_qty > 0 ? 'Đang thực hiện' : 'Chưa bắt đầu'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleStart = () => {
    setTaskStatus('Đang thực hiện');
    // Ở đây có thể gọi API cập nhật trạng thái nếu Backend hỗ trợ
  };

  const handlePause = () => {
    setTaskStatus('Chưa bắt đầu');
    // API tạm dừng
  };

  const handleComplete = async () => {
    Alert.alert('Xác nhận', 'Bạn có chắc chắn muốn hoàn thành Lệnh này?', [
      { text: 'Hủy', style: 'cancel' },
      { 
        text: 'Hoàn thành', 
        style: 'default',
        onPress: async () => {
          setIsSubmitting(true);
          try {
            await productionApi.updateTaskProgress(task.task_id, {
              actual_qty: task.actual_qty, // Gửi lại số lượng hiện tại
              status: 'Hoàn thành'
            });
            setTaskStatus('Hoàn thành');
            Alert.alert('Thành công', 'Lệnh đã được hoàn thành');
            navigation.goBack();
          } catch (error: any) {
            Alert.alert('Lỗi', error.response?.data?.message || 'Không thể cập nhật tiến độ');
          } finally {
            setIsSubmitting(false);
          }
        }
      }
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      
      {/* Chi tiết Lệnh */}
      <Card variant="elevated" style={styles.card}>
        <View style={styles.headerRow}>
          <Text style={styles.orderCode}>{task.order_code}</Text>
          <View style={[
            styles.statusBadge, 
            taskStatus === 'Đang thực hiện' ? styles.statusActive : 
            taskStatus === 'Hoàn thành' ? styles.statusDone : {}
          ]}>
            <Text style={styles.statusText}>{taskStatus}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <Text style={styles.label}>Sản phẩm</Text>
          <Text style={styles.value}>{task.product_name}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.label}>Công đoạn</Text>
          <Text style={styles.value}>{task.step_name}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.label}>Máy</Text>
          <Text style={styles.value}>EX-01 (Mặc định)</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <Text style={styles.label}>Kế hoạch</Text>
          <Text style={styles.valueHighlight}>1.000 {task.unit}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.label}>Đã sản xuất</Text>
          <Text style={styles.valueSuccess}>{task.actual_qty || 0} {task.unit}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.label}>Còn lại</Text>
          <Text style={styles.valueWarning}>
            {Math.max(1000 - (task.actual_qty || 0), 0)} {task.unit}
          </Text>
        </View>

      </Card>

      {/* Các nút thao tác */}
      <View style={styles.actionContainer}>
        {taskStatus === 'Chưa bắt đầu' ? (
          <Button 
            title="BẮT ĐẦU" 
            onPress={handleStart} 
            icon={<Play color="#fff" size={20} />} 
          />
        ) : (
          <>
            <Button 
              title="TẠM DỪNG" 
              variant="secondary" 
              onPress={handlePause} 
              icon={<Pause color="#334155" size={20} />} 
            />
            
            <Button 
              title="GHI NHẬN SẢN LƯỢNG" 
              onPress={() => {
                // Ở đây mở Modal hoặc chuyển trang nhập sản lượng
                Alert.alert('Chức năng', 'Sẽ điều hướng sang trang Nhập Sản Lượng');
              }} 
              icon={<CheckSquare color="#fff" size={20} />} 
              style={{ backgroundColor: '#22c55e' }}
            />
            
            <Button 
              title="GHI NHẬN PHẾ" 
              variant="danger" 
              onPress={() => navigation.navigate('ScrapReport', { task })} 
              icon={<Trash2 color="#fff" size={20} />} 
            />
            
            <View style={{ height: 16 }} />
            
            <Button 
              title="HOÀN THÀNH LỆNH" 
              variant="outline" 
              onPress={handleComplete}
              loading={isSubmitting}
              icon={<CheckCircle2 color="#1d4ed8" size={20} />} 
            />
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  card: {
    padding: 24,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderCode: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0f172a',
  },
  statusBadge: {
    backgroundColor: '#cbd5e1',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusActive: {
    backgroundColor: '#fef08a', // yellow-200
  },
  statusDone: {
    backgroundColor: '#bbf7d0', // green-200
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  divider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  label: {
    fontSize: 15,
    color: '#64748b',
    fontWeight: '500',
  },
  value: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
  },
  valueHighlight: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1d4ed8', // blue
  },
  valueSuccess: {
    fontSize: 16,
    fontWeight: '700',
    color: '#16a34a', // green
  },
  valueWarning: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ea580c', // orange
  },
  actionContainer: {
    marginTop: 16,
    marginBottom: 40,
  }
});
