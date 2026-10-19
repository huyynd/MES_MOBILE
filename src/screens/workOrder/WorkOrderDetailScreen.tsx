import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { productionApi } from '@/api/production';
import { ProductionTask } from '@/types/production';
import { Play, Pause, Trash2, CheckCircle2 } from 'lucide-react-native';

export function WorkOrderDetailScreen({ route, navigation }: any) {
  const { task } = route.params as { task: ProductionTask };
  const [taskStatus, setTaskStatus] = useState(task.status || (task.actual_qty > 0 ? 'Đang sản xuất' : 'Chờ'));
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateStatus = async (status: 'Đang sản xuất' | 'Dừng sản xuất') => {
    setIsSubmitting(true);
    try {
      await productionApi.updateTaskStatus(task.task_id, status);
      setTaskStatus(status);
    } catch (error: any) {
      Alert.alert('Lỗi', error.response?.data?.message || error.message || 'Không thể cập nhật trạng thái công đoạn.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleComplete = () => {
    Alert.alert('Xác nhận', 'Hoàn thành công đoạn này? Hệ thống sẽ kiểm tra máy, công nhân và sản lượng thực tế trước khi nhập kho.', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Hoàn thành',
        onPress: async () => {
          setIsSubmitting(true);
          try {
            let taskCode = task.task_code;
            if (!taskCode) {
              const tasks = await productionApi.getOrderTasks(task.order_id);
              taskCode = tasks.find((item) => item.id === task.task_id)?.task_code;
            }
            if (!taskCode) throw new Error('Không xác định được mã công đoạn để hoàn thành.');
            await productionApi.completeTask(task.order_id, taskCode);
            setTaskStatus('Hoàn thành');
            Alert.alert('Thành công', 'Công đoạn đã hoàn thành.');
            navigation.goBack();
          } catch (error: any) {
            Alert.alert('Không thể hoàn thành', error.response?.data?.message || error.message || 'Không thể hoàn thành công đoạn.');
          } finally {
            setIsSubmitting(false);
          }
        },
      },
    ]);
  };

  const plannedQty = Number(task.quantity) || 0;
  const actualQty = Number(task.actual_qty) || 0;
  const canOperate = taskStatus !== 'Hoàn thành' && taskStatus !== 'Đã hủy';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Card variant="elevated" style={styles.card}>
        <View style={styles.headerRow}>
          <Text style={styles.orderCode}>{task.order_code}</Text>
          <View style={[styles.statusBadge, taskStatus === 'Đang sản xuất' && styles.statusActive, taskStatus === 'Hoàn thành' && styles.statusDone]}>
            <Text style={styles.statusText}>{taskStatus}</Text>
          </View>
        </View>
        <View style={styles.divider} />
        <Info label="Sản phẩm" value={task.product_name} />
        <Info label="Công đoạn" value={task.step_name} />
        <Info label="Máy" value={task.machine_name || 'Chưa phân công'} />
        <View style={styles.divider} />
        <Info label="Kế hoạch" value={`${plannedQty} ${task.unit}`} highlight="blue" />
        <Info label="Đã sản xuất" value={`${actualQty} ${task.unit}`} highlight="green" />
        <Info label="Còn lại" value={`${Math.max(plannedQty - actualQty, 0)} ${task.unit}`} highlight="orange" />
      </Card>

      {canOperate && (
        <View style={styles.actionContainer}>
          {taskStatus !== 'Đang sản xuất' ? (
            <Button title={taskStatus === 'Dừng sản xuất' ? 'TIẾP TỤC' : 'BẮT ĐẦU'} onPress={() => updateStatus('Đang sản xuất')} loading={isSubmitting} icon={<Play color="#fff" size={20} />} />
          ) : (
            <Button title="TẠM DỪNG" variant="secondary" onPress={() => updateStatus('Dừng sản xuất')} loading={isSubmitting} icon={<Pause color="#334155" size={20} />} />
          )}
          <Button title="GHI NHẬN NVL" variant="outline" onPress={() => navigation.navigate('MaterialUsage', { orderId: task.order_id })} />
          <Button title="GHI NHẬN PHẾ" variant="danger" onPress={() => navigation.navigate('ScrapReport', { task })} icon={<Trash2 color="#fff" size={20} />} />
          <View style={styles.completeSpace} />
          <Button title="HOÀN THÀNH CÔNG ĐOẠN" variant="outline" onPress={handleComplete} loading={isSubmitting} icon={<CheckCircle2 color="#1d4ed8" size={20} />} />
        </View>
      )}
    </ScrollView>
  );
}

function Info({ label, value, highlight }: { label: string; value: string; highlight?: 'blue' | 'green' | 'orange' }) {
  return <View style={styles.infoRow}><Text style={styles.label}>{label}</Text><Text style={[styles.value, highlight === 'blue' && styles.blue, highlight === 'green' && styles.green, highlight === 'orange' && styles.orange]}>{value}</Text></View>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' }, content: { padding: 16 }, card: { padding: 24 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, orderCode: { fontSize: 22, fontWeight: '900', color: '#0f172a' },
  statusBadge: { backgroundColor: '#cbd5e1', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }, statusActive: { backgroundColor: '#fef08a' }, statusDone: { backgroundColor: '#bbf7d0' }, statusText: { fontSize: 12, fontWeight: '700', color: '#334155' },
  divider: { height: 1, backgroundColor: '#e2e8f0', marginVertical: 16 }, infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }, label: { fontSize: 15, color: '#64748b', fontWeight: '500' }, value: { fontSize: 16, fontWeight: '700', color: '#1e293b', flexShrink: 1, textAlign: 'right' }, blue: { color: '#1d4ed8' }, green: { color: '#16a34a' }, orange: { color: '#ea580c' },
  actionContainer: { marginTop: 16, marginBottom: 24 }, completeSpace: { height: 16 },
});
