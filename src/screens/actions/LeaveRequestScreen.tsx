import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Modal, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, Plus, Clock, CheckCircle2, XCircle, Calendar as CalendarIcon, FileText } from 'lucide-react-native';
import { Button } from '@/components/Button';
import { useAuthStore } from '@/store/authStore';

export function LeaveRequestScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { user } = useAuthStore();
  const isManager = user?.is_admin || user?.role_name?.toLowerCase().includes('quản lý') || user?.role_name?.toLowerCase().includes('manager');

  const [showForm, setShowForm] = useState(false);
  const [selectedReason, setSelectedReason] = useState('');
  const [otherReason, setOtherReason] = useState('');

  // Stats
  const stats = {
    total: 12,
    used: 4,
    remaining: 8
  };

  // Mock data for lists
  const [requests, setRequests] = useState([
    { id: '1', name: 'Nguyễn Văn A', from: '20/08/2026', to: '21/08/2026', reason: 'Nghỉ phép năm', status: 'approved', managerReason: '' },
    { id: '2', name: 'Trần Thị B', from: '05/09/2026', to: '05/09/2026', reason: 'Ốm đau', status: 'rejected', managerReason: 'Cần người trực gấp' },
    { id: '3', name: 'Lê Văn C', from: '26/09/2026', to: '28/09/2026', reason: 'Việc gia đình', status: 'pending', managerReason: '' },
  ]);

  const reasons = ['Nghỉ phép do ốm', 'Nghỉ do thực hiện quy định nghỉ phép', 'Lý do khác'];

  const getStatusConfig = (status: string) => {
    switch(status) {
      case 'approved': return { text: 'Đã duyệt', color: '#16a34a', icon: <CheckCircle2 size={16} color="#16a34a" /> };
      case 'rejected': return { text: 'Từ chối', color: '#ef4444', icon: <XCircle size={16} color="#ef4444" /> };
      case 'pending': return { text: 'Chờ duyệt', color: '#eab308', icon: <Clock size={16} color="#eab308" /> };
      default: return { text: 'Không xác định', color: '#64748b', icon: <Clock size={16} color="#64748b" /> };
    }
  };

  const handleAction = (id: string, action: 'approved' | 'rejected') => {
    if (action === 'rejected') {
      Alert.prompt('Từ chối', 'Nhập lý do từ chối:', [
        { text: 'Hủy', style: 'cancel' },
        { 
          text: 'Từ chối', 
          style: 'destructive',
          onPress: (text?: string) => {
            setRequests(requests.map(r => r.id === id ? { ...r, status: 'rejected', managerReason: text || 'Không có lý do' } : r));
            Alert.alert('Thành công', 'Đã từ chối đơn nghỉ phép');
          }
        }
      ]);
    } else {
      Alert.alert('Xác nhận', 'Bạn có chắc muốn duyệt đơn này?', [
        { text: 'Hủy', style: 'cancel' },
        { 
          text: 'Duyệt', 
          onPress: () => {
            setRequests(requests.map(r => r.id === id ? { ...r, status: 'approved' } : r));
            Alert.alert('Thành công', 'Đã duyệt đơn nghỉ phép');
          }
        }
      ]);
    }
  };

  const handleSubmit = () => {
    if (!selectedReason) {
      Alert.alert('Lỗi', 'Vui lòng chọn lý do nghỉ');
      return;
    }
    Alert.alert('Xác nhận', 'Bạn có chắc chắn muốn gửi đơn xin nghỉ phép?', [
      { text: 'Hủy', style: 'cancel' },
      { 
        text: 'Gửi duyệt', 
        onPress: () => {
          setShowForm(false);
          Alert.alert('Thành công', 'Đã gửi đơn nghỉ phép. Vui lòng chờ quản lý duyệt.');
        }
      }
    ]);
  };

  const renderManagerView = () => (
    <ScrollView contentContainerStyle={styles.content}>
      {requests.map((item) => {
        const config = getStatusConfig(item.status);
        return (
          <View key={item.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.empName}>{item.name}</Text>
                <View style={styles.dateBox}>
                  <CalendarIcon size={14} color="#64748b" />
                  <Text style={styles.dateText}>{item.from} - {item.to}</Text>
                </View>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: config.color + '15' }]}>
                {config.icon}
                <Text style={[styles.statusText, { color: config.color }]}>{config.text}</Text>
              </View>
            </View>
            <View style={styles.reasonBox}>
              <FileText size={16} color="#64748b" />
              <Text style={styles.reasonValue}>{item.reason}</Text>
            </View>
            {item.status === 'rejected' && item.managerReason && (
              <View style={[styles.reasonBox, { backgroundColor: '#fef2f2', marginTop: 8 }]}>
                <Text style={[styles.reasonValue, { color: '#ef4444' }]}>Lý do từ chối: {item.managerReason}</Text>
              </View>
            )}
            
            {item.status === 'pending' && (
              <View style={styles.managerActions}>
                <TouchableOpacity style={[styles.actionBtn, styles.rejectBtn]} onPress={() => handleAction(item.id, 'rejected')}>
                  <Text style={styles.rejectBtnText}>Từ chối</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, styles.approveBtn]} onPress={() => handleAction(item.id, 'approved')}>
                  <Text style={styles.approveBtnText}>Duyệt</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        );
      })}
    </ScrollView>
  );

  const renderWorkerView = () => (
    <>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.total}</Text>
            <Text style={styles.statLabel}>Tổng ngày</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#ef4444' }]}>{stats.used}</Text>
            <Text style={styles.statLabel}>Đã dùng</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#16a34a' }]}>{stats.remaining}</Text>
            <Text style={styles.statLabel}>Còn lại</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Lịch sử nghỉ phép</Text>

        {requests.map((item) => {
          const config = getStatusConfig(item.status);
          return (
            <View key={item.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.dateBox}>
                  <CalendarIcon size={16} color="#64748b" />
                  <Text style={styles.dateText}>{item.from} - {item.to}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: config.color + '15' }]}>
                  {config.icon}
                  <Text style={[styles.statusText, { color: config.color }]}>{config.text}</Text>
                </View>
              </View>
              <View style={styles.reasonBox}>
                <FileText size={16} color="#64748b" />
                <Text style={styles.reasonValue}>{item.reason}</Text>
              </View>
              {item.status === 'rejected' && item.managerReason && (
                <View style={[styles.reasonBox, { backgroundColor: '#fef2f2', marginTop: 8 }]}>
                  <Text style={[styles.reasonValue, { color: '#ef4444' }]}>Lý do từ chối: {item.managerReason}</Text>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>

      <TouchableOpacity 
        style={[styles.fab, { bottom: 20 + insets.bottom }]} 
        onPress={() => setShowForm(true)}
      >
        <Plus size={24} color="#ffffff" />
      </TouchableOpacity>

      <Modal visible={showForm} animationType="slide">
        <View style={[styles.modalContainer, { paddingTop: insets.top }]}>
          <View style={styles.modalHeader}>
            <TouchableOpacity style={styles.backBtn} onPress={() => setShowForm(false)}>
              <ArrowLeft size={24} color="#0f172a" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Tạo đơn nghỉ phép</Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView contentContainerStyle={styles.modalContent}>
            <View style={styles.formRow}>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.label}>Từ ngày</Text>
                <View style={styles.fakeInput}>
                  <Text style={styles.fakeInputText}>26/09/2026</Text>
                  <CalendarIcon size={20} color="#94a3b8" />
                </View>
              </View>
              <View style={{ width: 16 }} />
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.label}>Đến ngày</Text>
                <View style={styles.fakeInput}>
                  <Text style={styles.fakeInputText}>27/09/2026</Text>
                  <CalendarIcon size={20} color="#94a3b8" />
                </View>
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Lý do nghỉ</Text>
              <View style={styles.reasonChips}>
                {reasons.map((r) => (
                  <TouchableOpacity 
                    key={r} 
                    style={[styles.chip, selectedReason === r && styles.chipActive]}
                    onPress={() => setSelectedReason(r)}
                  >
                    <Text style={[styles.chipText, selectedReason === r && styles.chipTextActive]}>{r}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {selectedReason === 'Lý do khác' && (
              <View style={styles.formGroup}>
                <Text style={styles.label}>Nhập lý do khác</Text>
                <TextInput
                  style={styles.textInputArea}
                  multiline
                  numberOfLines={4}
                  placeholder="Nhập lý do chi tiết..."
                  value={otherReason}
                  onChangeText={setOtherReason}
                />
              </View>
            )}
          </ScrollView>

          <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
            <Button title="GỬI DUYỆT" onPress={handleSubmit} style={{ height: 56 }} />
          </View>
        </View>
      </Modal>
    </>
  );

  return (
    <View style={styles.container}>
      <View style={[styles.header, { height: 60 + insets.top, paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isManager ? "Duyệt nghỉ phép" : "Nghỉ phép"}</Text>
        <View style={{ width: 40 }} />
      </View>

      {isManager ? renderManagerView() : renderWorkerView()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9'
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
  content: { padding: 16, paddingBottom: 100 },
  statsCard: {
    flexDirection: 'row', backgroundColor: '#ffffff', borderRadius: 16, padding: 20, marginBottom: 24,
    shadowColor: '#1d4ed8', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 4
  },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: '800', color: '#0f172a', marginBottom: 4 },
  statLabel: { fontSize: 12, color: '#64748b', fontWeight: '600' },
  statDivider: { width: 1, height: 40, backgroundColor: '#e2e8f0', alignSelf: 'center' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a', marginBottom: 16 },
  card: {
    backgroundColor: '#ffffff', borderRadius: 16, padding: 16, marginBottom: 16,
    borderWidth: 1, borderColor: '#f1f5f9',
    shadowColor: '#64748b', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  empName: { fontSize: 16, fontWeight: '700', color: '#0f172a', marginBottom: 4 },
  dateBox: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dateText: { fontSize: 13, fontWeight: '600', color: '#64748b' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, gap: 4 },
  statusText: { fontSize: 12, fontWeight: '600' },
  reasonBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', padding: 12, borderRadius: 12, gap: 8 },
  reasonValue: { fontSize: 14, color: '#475569', fontWeight: '500', flex: 1 },
  managerActions: { flexDirection: 'row', gap: 12, marginTop: 12 },
  actionBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  rejectBtn: { backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fecaca' },
  rejectBtnText: { color: '#ef4444', fontWeight: '600' },
  approveBtn: { backgroundColor: '#1d4ed8' },
  approveBtnText: { color: '#ffffff', fontWeight: '600' },
  fab: {
    position: 'absolute', right: 24, width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#1d4ed8', justifyContent: 'center', alignItems: 'center',
    shadowColor: '#1d4ed8', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5
  },
  modalContainer: { flex: 1, backgroundColor: '#ffffff' },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9'
  },
  modalContent: { padding: 16, paddingBottom: 40 },
  formRow: { flexDirection: 'row' },
  formGroup: { marginBottom: 24 },
  label: { fontSize: 14, fontWeight: '600', color: '#475569', marginBottom: 12 },
  fakeInput: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 16 
  },
  fakeInputText: { fontSize: 15, color: '#0f172a', fontWeight: '500' },
  reasonChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: {
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20,
    backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#e2e8f0'
  },
  chipActive: { backgroundColor: '#1d4ed8', borderColor: '#1d4ed8' },
  chipText: { fontSize: 14, color: '#475569', fontWeight: '500' },
  chipTextActive: { color: '#ffffff', fontWeight: '600' },
  textInputArea: {
    backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0',
    borderRadius: 12, padding: 16, fontSize: 15, color: '#0f172a', textAlignVertical: 'top', height: 100
  },
  footer: { padding: 16, backgroundColor: '#ffffff', borderTopWidth: 1, borderTopColor: '#f1f5f9' }
});
