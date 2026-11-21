import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TextInput } from 'react-native';
import { errMsg } from '@/utils/errors';
import { num } from '@/utils/format';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { productionApi } from '@/api/production';
import { ProductionTask } from '@/types/production';
import { Play, Pause, CheckSquare, CheckCircle2 } from 'lucide-react-native';

export function WorkOrderDetailScreen({ route, navigation }: any) {
  const { task, actor } = route.params as { task: ProductionTask; actor?: string }; // actor: tablet tổ trưởng — công nhân đang điền kết quả
  
  // Trạng thái lấy từ backend ('Chờ' | 'Đang sản xuất' | 'Dừng sản xuất' | 'Hoàn thành')
  const [taskStatus, setTaskStatus] = useState<string>(
    task.status || (task.actual_qty > 0 ? 'Đang sản xuất' : 'Chờ')
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actual, setActual] = useState<number>(Number(task.actual_qty) || 0);
  const [addQty, setAddQty] = useState('');

  // Ghi thêm sản lượng: SL thực mới = SL hiện tại + số vừa nhập (cùng đường với màn chi tiết lệnh trên web)
  const handleAddQty = async () => {
    if (!task.task_code) return Alert.alert('Lỗi', 'Thiếu mã dòng phân công — hãy mở lại từ danh sách việc.');
    const add = Number(String(addQty).replace(',', '.'));
    if (!(add > 0)) return Alert.alert('Lỗi', 'Nhập số lượng lớn hơn 0.');
    setIsSubmitting(true);
    try {
      await productionApi.setActualQty(task.order_id, task.task_code, actual + add);
      setActual(actual + add);
      setAddQty('');
      if (taskStatus === 'Chờ') setTaskStatus('Đang sản xuất');
      Alert.alert('Đã ghi nhận', `+${num(add, 2)} ${task.unit || ''}`);
    } catch (error) {
      Alert.alert('Lỗi', errMsg(error, 'Không ghi được sản lượng.'));
    } finally {
      setIsSubmitting(false);
    }
  };
  const notStarted = taskStatus === 'Chờ' || taskStatus === 'Dừng sản xuất';
  const plan = Number(task.quantity) || 0;

  const changeStatus = async (status: 'Đang sản xuất' | 'Dừng sản xuất') => {
    setIsSubmitting(true);
    try {
      await productionApi.setTaskStatus(task.task_id, status);
      setTaskStatus(status);
    } catch (error: any) {
      Alert.alert('Lỗi', errMsg(error, 'Không thể đổi trạng thái'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStart = () => changeStatus('Đang sản xuất');
  const handlePause = () => changeStatus('Dừng sản xuất');

  const handleComplete = async () => {
    if (!task.task_code) return Alert.alert('Lỗi', 'Thiếu mã dòng phân công — hãy mở lại từ danh sách việc.');
    Alert.alert('Xác nhận', 'Bạn có chắc chắn muốn hoàn thành công đoạn này? Sau khi hoàn thành sẽ bị khóa, không sửa được.', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Hoàn thành',
        style: 'default',
        onPress: async () => {
          setIsSubmitting(true);
          try {
            await productionApi.completeTask(task.order_id, task.task_code!);
            setTaskStatus('Hoàn thành');
            Alert.alert('Thành công', 'Đã hoàn thành công đoạn');
            navigation.goBack();
          } catch (error: any) {
            Alert.alert('Lỗi', errMsg(error, 'Không thể hoàn thành'));
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
            taskStatus === 'Đang sản xuất' ? styles.statusActive :
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
        
        {(actor || task.assigned_worker) && (
          <View style={styles.infoRow}>
            <Text style={styles.label}>Người làm</Text>
            <Text style={[styles.value, { fontWeight: "800" }]}>{actor || task.assigned_worker}</Text>
          </View>
        )}

        <View style={styles.infoRow}>
          <Text style={styles.label}>Công đoạn</Text>
          <Text style={styles.value}>{task.step_name}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.label}>Máy</Text>
          <Text style={styles.value}>{task.machine_name || '— (chưa gán)'}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <Text style={styles.label}>Kế hoạch</Text>
          <Text style={styles.valueHighlight}>{plan ? plan.toLocaleString('vi-VN') : '—'} {task.unit}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.label}>Đã sản xuất</Text>
          <Text style={styles.valueSuccess}>{num(actual, 2)} {task.unit}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.label}>Còn lại</Text>
          <Text style={styles.valueWarning}>
            {plan ? num(Math.max(plan - actual, 0), 2) : '—'} {task.unit}
          </Text>
        </View>

      </Card>

      {/* Các nút thao tác */}
      <View style={styles.actionContainer}>
        {taskStatus === 'Hoàn thành' ? null : notStarted ? (
          <Button
            title="BẮT ĐẦU"
            onPress={handleStart}
            loading={isSubmitting}
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
            
            <TextInput style={styles.qtyInput} value={addQty} onChangeText={setAddQty}
              placeholder={`+ Số lượng vừa làm (${task.unit || 'kg'})`} keyboardType="decimal-pad" />
            <Button
              title="GHI NHẬN SẢN LƯỢNG"
              onPress={handleAddQty}
              loading={isSubmitting}
              icon={<CheckSquare color="#fff" size={20} />}
              style={{ backgroundColor: '#22c55e' }}
            />
            {/* Ghi phế: tạm ẩn — ngoài phạm vi mobile (web ghi phế theo công nhân/ngày) */}

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
  qtyInput: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, paddingHorizontal: 14, height: 48, fontSize: 16, backgroundColor: '#fff' },
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
