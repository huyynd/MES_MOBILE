import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Card } from '@/components/Card';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { scrapApi } from '@/api/scrap';
import { useAuthStore } from '@/store/authStore';
import { Calendar, User, ChevronDown, CheckCircle2 } from 'lucide-react-native';

const getToday = () => new Date().toISOString().slice(0, 10);

export function ScrapReportScreen({ navigation }: any) {
  const { user } = useAuthStore();
  
  const isManager = user?.is_admin || (user?.role_name && !user?.role_name.toLowerCase().includes('công nhân'));
  const defaultWorker = user?.linked_worker || user?.full_name || user?.username || '';
  
  const [date, setDate] = useState(getToday());
  const [selectedWorker, setSelectedWorker] = useState(defaultWorker);
  const [workers, setWorkers] = useState<string[]>([]);
  
  const [tasks, setTasks] = useState<any[]>([]);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [scrapQty, setScrapQty] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch workers if manager
  useEffect(() => {
    if (isManager) {
      scrapApi.getWorkers().then(data => {
        setWorkers(data || []);
      }).catch(err => console.log('Lỗi lấy ds công nhân', err));
    }
  }, [isManager]);

  // Fetch completed tasks for worker & date
  const loadTasks = async () => {
    if (!selectedWorker) return;
    setIsLoading(true);
    try {
      const data = await scrapApi.getDailyDetails(selectedWorker, date);
      setTasks(data || []);
      if (data && data.length > 0) {
        setSelectedTask(data[0]);
        // Default scrapQty can be empty or the previously saved one if backend returns it
        setScrapQty(data[0].product_scrap_qty ? data[0].product_scrap_qty.toString() : '');
        setReason('');
      } else {
        setSelectedTask(null);
      }
    } catch (error) {
      console.log('Lỗi lấy chi tiết ngày', error);
      Alert.alert('Lỗi', 'Không thể lấy dữ liệu sản xuất trong ngày.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, [selectedWorker, date]);

  const handleSelectTask = (t: any) => {
    setSelectedTask(t);
    setScrapQty(t.product_scrap_qty ? t.product_scrap_qty.toString() : '');
    setReason('');
  };

  const handleSubmit = async () => {
    if (!selectedTask) return;
    
    const qty = Number(scrapQty);
    if (isNaN(qty) || qty <= 0) {
      Alert.alert('Lỗi', 'Số lượng phế liệu không hợp lệ');
      return;
    }
    if (!reason.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập nguyên nhân phế');
      return;
    }

    setIsSubmitting(true);
    try {
      await scrapApi.reportScrap({
        task_id: selectedTask.task_id || 0,
        order_id: selectedTask.order_id || 0,
        order_code: selectedTask.order_code,
        product_id: selectedTask.product_id,
        scrap_qty: qty,
        reason: reason,
        reported_by: selectedWorker,
        record_date: date
      });
      
      Alert.alert('Thành công', 'Đã lưu ghi nhận phế phẩm', [
        { 
          text: 'OK', 
          onPress: () => {
             loadTasks(); // reload to get new product_scrap_qty
          }
        }
      ]);
    } catch (error: any) {
      Alert.alert('Lỗi', error.response?.data?.message || 'Không thể gửi báo cáo');
    } finally {
      setIsSubmitting(false);
    }
  };

  const pct = (s: number, a: number) => {
    const sn = Number(s) || 0;
    const an = Number(a) || 0;
    if (an === 0) return '0.00%';
    return ((sn / an) * 100).toFixed(2) + '%';
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scrollContent}>
        
        {/* LỌC THÔNG TIN */}
        <Card style={styles.filterCard}>
          <Text style={styles.sectionTitle}>CÔNG NHÂN THỰC HIỆN</Text>
          <View style={styles.inputRow}>
            <View style={styles.iconBox}>
              <User size={20} color="#64748b" />
            </View>
            <View style={styles.inputValueBox}>
              <Text style={styles.inputValue}>{selectedWorker || 'Chưa chọn'}</Text>
            </View>
            {isManager && (
               <ChevronDown size={20} color="#64748b" style={{ padding: 12 }} />
            )}
          </View>
          {isManager && workers.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
              {workers.map(w => (
                <TouchableOpacity 
                  key={w} 
                  style={[styles.workerPill, selectedWorker === w && styles.workerPillActive]}
                  onPress={() => setSelectedWorker(w)}
                >
                  <Text style={[styles.workerPillText, selectedWorker === w && styles.workerPillTextActive]}>{w}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          <View style={{ height: 16 }} />
          
          <Text style={styles.sectionTitle}>NGÀY GHI NHẬN</Text>
          <View style={styles.inputRow}>
            <View style={styles.iconBox}>
              <Calendar size={20} color="#64748b" />
            </View>
            <View style={styles.inputValueBox}>
              <Text style={styles.inputValue}>{date}</Text>
            </View>
          </View>
        </Card>

        {isLoading ? (
          <View style={styles.loadingBox}>
             <ActivityIndicator size="large" color="#ef4444" />
             <Text style={styles.loadingText}>Đang lấy dữ liệu...</Text>
          </View>
        ) : (
          <View style={styles.mainContent}>
            
            {/* DANH SÁCH LỆNH HOÀN THÀNH */}
            <View style={styles.listSection}>
              <Text style={styles.sectionHeading}>Lệnh SX hoàn thành trong ngày</Text>
              <Card style={styles.listCard}>
                {tasks.length === 0 ? (
                  <View style={styles.emptyBox}>
                    <Text style={styles.emptyText}>Không có lệnh nào được hoàn thành trong ngày này.</Text>
                  </View>
                ) : (
                  tasks.map((t, idx) => {
                    const isSelected = selectedTask?.task_id === t.task_id;
                    return (
                      <TouchableOpacity 
                        key={idx} 
                        style={[styles.taskRow, isSelected && styles.taskRowActive, idx === tasks.length -1 && { borderBottomWidth: 0 }]}
                        onPress={() => handleSelectTask(t)}
                      >
                        <View style={{ flex: 2 }}>
                          <Text style={[styles.taskCode, isSelected && styles.taskCodeActive]}>{t.order_code}</Text>
                          <Text style={styles.taskProd} numberOfLines={1}>{t.product_code} - {t.product_name}</Text>
                        </View>
                        <View style={{ flex: 1, alignItems: 'flex-end' }}>
                           <Text style={[styles.taskQty, isSelected && styles.taskCodeActive]}>{t.actual_qty} {t.unit}</Text>
                           <Text style={styles.taskScrapNote}>Đã báo phế: {t.product_scrap_qty || 0}</Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })
                )}
              </Card>
            </View>

            {/* FORM GHI NHẬN PHẾ */}
            {selectedTask && (
              <View style={styles.formSection}>
                <Text style={styles.sectionHeading}>Ghi nhận Phế Phẩm</Text>
                <Card style={styles.formCard}>
                  <Text style={styles.formProductTitle}>Sản phẩm: {selectedTask.product_name}</Text>
                  <Text style={styles.formProductSub}>Tổng thành phẩm: <Text style={styles.boldGreen}>{selectedTask.actual_qty} {selectedTask.unit}</Text></Text>

                  <View style={styles.formRow}>
                    <View style={{ flex: 1 }}>
                      <Input
                        label={`Phế ${selectedTask.product_name} (${selectedTask.unit})`}
                        keyboardType="numeric"
                        value={scrapQty}
                        onChangeText={setScrapQty}
                        placeholder="0"
                      />
                    </View>
                    <View style={styles.pctBox}>
                      <Text style={styles.pctText}>{pct(Number(scrapQty), selectedTask.actual_qty)}</Text>
                    </View>
                  </View>

                  <Input
                    label="Ghi chú thêm"
                    value={reason}
                    onChangeText={setReason}
                    placeholder="Nguyên nhân phế, lỗi kỹ thuật..."
                    multiline
                    numberOfLines={3}
                    style={styles.textArea}
                  />
                  
                  <View style={styles.buttonContainer}>
                    <Button 
                      title="Xác nhận ghi nhận" 
                      variant="primary" // The Web uses blue for this button
                      onPress={handleSubmit}
                      loading={isSubmitting}
                    />
                  </View>
                </Card>
              </View>
            )}

          </View>
        )}
        
        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    padding: 12,
  },
  filterCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    backgroundColor: '#ffffff',
  },
  iconBox: {
    padding: 12,
    borderRightWidth: 1,
    borderRightColor: '#e2e8f0',
  },
  inputValueBox: {
    flex: 1,
    padding: 12,
  },
  inputValue: {
    fontSize: 14,
    color: '#0f172a',
    fontWeight: '600',
  },
  workerPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    marginRight: 8,
  },
  workerPillActive: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#3b82f6',
  },
  workerPillText: {
    fontSize: 12,
    color: '#475569',
  },
  workerPillTextActive: {
    color: '#2563eb',
    fontWeight: '600',
  },
  loadingBox: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#64748b',
  },
  mainContent: {},
  listSection: {
    marginBottom: 16,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 12,
    marginLeft: 4,
  },
  listCard: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  emptyBox: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    color: '#64748b',
    fontStyle: 'italic',
  },
  taskRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  taskRowActive: {
    backgroundColor: '#f0fdf4', // light green to indicate selection
  },
  taskCode: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
  },
  taskCodeActive: {
    color: '#16a34a',
  },
  taskProd: {
    fontSize: 12,
    color: '#64748b',
  },
  taskQty: {
    fontSize: 14,
    fontWeight: '700',
    color: '#16a34a',
  },
  taskScrapNote: {
    fontSize: 11,
    color: '#ef4444',
    marginTop: 4,
  },
  formSection: {
    marginTop: 8,
  },
  formCard: {
    padding: 16,
    borderRadius: 12,
  },
  formProductTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
  },
  formProductSub: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 20,
  },
  boldGreen: {
    fontWeight: '700',
    color: '#16a34a',
  },
  formRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  pctBox: {
    marginLeft: 12,
    backgroundColor: '#fee2e2',
    paddingHorizontal: 12,
    height: 48,
    justifyContent: 'center',
    borderRadius: 8,
    marginTop: 18, // Align with input field below label
  },
  pctText: {
    color: '#ef4444',
    fontWeight: '700',
    fontSize: 14,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  buttonContainer: {
    marginTop: 16,
  }
});
