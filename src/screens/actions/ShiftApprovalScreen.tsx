import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Modal, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, User, Calendar, Clock, Edit2, CheckCircle2, XCircle } from 'lucide-react-native';
import { Button } from '@/components/Button';

export function ShiftApprovalScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  
  const [requests, setRequests] = useState([
    { id: '1', employeeName: 'Nguyễn Văn A', date: '26/09/2026', shift: 'Ca Sáng (06:00 - 14:00)', status: 'pending' },
    { id: '2', employeeName: 'Trần Thị B', date: '27/09/2026', shift: 'Ca Chiều (14:00 - 22:00)', status: 'pending' },
    { id: '3', employeeName: 'Lê Văn C', date: '28/09/2026', shift: 'Ca Đêm (22:00 - 06:00)', status: 'approved' },
  ]);

  const [selectedReq, setSelectedReq] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editDate, setEditDate] = useState('');
  const [editShift, setEditShift] = useState('');

  const getStatusConfig = (status: string) => {
    switch(status) {
      case 'approved': return { text: 'Đã duyệt', color: '#16a34a', icon: <CheckCircle2 size={16} color="#16a34a" /> };
      case 'rejected': return { text: 'Từ chối', color: '#ef4444', icon: <XCircle size={16} color="#ef4444" /> };
      case 'pending': return { text: 'Chờ duyệt', color: '#eab308', icon: <Clock size={16} color="#eab308" /> };
      default: return { text: 'Không xác định', color: '#64748b', icon: <Clock size={16} color="#64748b" /> };
    }
  };

  const handleApprove = (id: string) => {
    Alert.alert('Xác nhận', 'Bạn đồng ý phê duyệt ca làm việc này?', [
      { text: 'Hủy', style: 'cancel' },
      { 
        text: 'Duyệt', 
        onPress: () => {
          setRequests(requests.map(r => r.id === id ? { ...r, status: 'approved' } : r));
          setSelectedReq(null);
          Alert.alert('Thành công', 'Đã duyệt ca làm việc');
        }
      }
    ]);
  };

  const handleReject = (id: string) => {
    Alert.alert('Xác nhận', 'Từ chối ca làm việc này?', [
      { text: 'Hủy', style: 'cancel' },
      { 
        text: 'Từ chối', 
        style: 'destructive',
        onPress: () => {
          setRequests(requests.map(r => r.id === id ? { ...r, status: 'rejected' } : r));
          setSelectedReq(null);
          Alert.alert('Thành công', 'Đã từ chối ca làm việc');
        }
      }
    ]);
  };

  const openEditModal = () => {
    setEditDate(selectedReq.date);
    setEditShift(selectedReq.shift);
    setShowEditModal(true);
  };

  const handleSaveEdit = () => {
    setRequests(requests.map(r => r.id === selectedReq.id ? { ...r, date: editDate, shift: editShift } : r));
    setSelectedReq({ ...selectedReq, date: editDate, shift: editShift });
    setShowEditModal(false);
    Alert.alert('Thành công', 'Đã cập nhật thông tin ca làm việc');
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { height: 60 + insets.top, paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Phê duyệt công ca</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {requests.map(item => {
          const config = getStatusConfig(item.status);
          return (
            <TouchableOpacity key={item.id} style={styles.card} onPress={() => setSelectedReq(item)}>
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.empNameText}>{item.employeeName}</Text>
                  <Text style={styles.dateText}>{item.date}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: config.color + '15' }]}>
                  {config.icon}
                  <Text style={[styles.statusText, { color: config.color }]}>{config.text}</Text>
                </View>
              </View>
              <Text style={styles.shiftText}>{item.shift}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Modal Chi tiết */}
      <Modal visible={!!selectedReq} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Chi tiết yêu cầu</Text>
            
            {selectedReq && (
              <View style={styles.detailCard}>
                <View style={styles.infoRow}>
                  <View style={styles.iconBox}><User size={20} color="#3b82f6" /></View>
                  <View style={styles.infoTextContainer}>
                    <Text style={styles.infoLabel}>Nhân viên</Text>
                    <Text style={styles.infoValue}>{selectedReq.employeeName}</Text>
                  </View>
                </View>

                <View style={styles.divider} />
                <View style={styles.infoRow}>
                  <View style={styles.iconBox}><Calendar size={20} color="#3b82f6" /></View>
                  <View style={styles.infoTextContainer}>
                    <Text style={styles.infoLabel}>Ngày làm việc</Text>
                    <Text style={styles.infoValue}>{selectedReq.date}</Text>
                  </View>
                </View>

                <View style={styles.divider} />
                <View style={styles.infoRow}>
                  <View style={styles.iconBox}><Clock size={20} color="#3b82f6" /></View>
                  <View style={styles.infoTextContainer}>
                    <Text style={styles.infoLabel}>Ca làm việc</Text>
                    <Text style={styles.infoValue}>{selectedReq.shift}</Text>
                  </View>
                </View>

                {selectedReq.status === 'pending' && (
                  <TouchableOpacity style={styles.editBtnBox} onPress={openEditModal}>
                    <Edit2 size={16} color="#3b82f6" />
                    <Text style={styles.editBtnText}>Sửa đổi ca</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            <View style={styles.actionButtons}>
              <Button title="Đóng" variant="outline" style={styles.flexBtn} onPress={() => setSelectedReq(null)} />
              {selectedReq?.status === 'pending' && (
                <>
                  <Button title="Từ chối" variant="outline" style={[styles.flexBtn, { borderColor: '#ef4444' }]} textStyle={{ color: '#ef4444' }} onPress={() => handleReject(selectedReq.id)} />
                  <Button title="Duyệt" style={styles.flexBtn} onPress={() => handleApprove(selectedReq.id)} />
                </>
              )}
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal Sửa */}
      <Modal visible={showEditModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Chỉnh sửa ca làm việc</Text>
            
            <Text style={styles.label}>Ngày làm việc</Text>
            <TextInput 
              style={styles.input}
              value={editDate}
              onChangeText={setEditDate}
            />

            <Text style={styles.label}>Ca làm việc</Text>
            <TextInput 
              style={styles.input}
              value={editShift}
              onChangeText={setEditShift}
            />

            <View style={styles.actionButtons}>
              <Button title="Hủy" variant="outline" style={styles.flexBtn} onPress={() => setShowEditModal(false)} />
              <Button title="Lưu thay đổi" style={styles.flexBtn} onPress={handleSaveEdit} />
            </View>
          </View>
        </View>
      </Modal>

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
  content: { padding: 16 },
  card: {
    backgroundColor: '#ffffff', borderRadius: 16, padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: '#f1f5f9',
    shadowColor: '#64748b', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  empNameText: { fontSize: 16, fontWeight: '700', color: '#0f172a', marginBottom: 4 },
  dateText: { fontSize: 13, color: '#64748b', fontWeight: '500' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, gap: 4 },
  statusText: { fontSize: 12, fontWeight: '600' },
  shiftText: { fontSize: 15, color: '#1e293b', fontWeight: '600' },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 },
  modalContent: { backgroundColor: '#ffffff', borderRadius: 24, padding: 24 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#0f172a', marginBottom: 20, textAlign: 'center' },
  detailCard: { backgroundColor: '#f8fafc', borderRadius: 16, padding: 16, marginBottom: 24, borderWidth: 1, borderColor: '#e2e8f0' },
  infoRow: { flexDirection: 'row', alignItems: 'center' },
  iconBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#eff6ff', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  infoTextContainer: { flex: 1 },
  infoLabel: { fontSize: 12, color: '#64748b', fontWeight: '600', marginBottom: 4 },
  infoValue: { fontSize: 15, color: '#0f172a', fontWeight: '600' },
  divider: { height: 1, backgroundColor: '#e2e8f0', marginVertical: 12 },
  editBtnBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 16, paddingVertical: 12, backgroundColor: '#eff6ff', borderRadius: 12, borderWidth: 1, borderColor: '#bfdbfe' },
  editBtnText: { fontSize: 14, color: '#3b82f6', fontWeight: '600' },
  actionButtons: { flexDirection: 'row', gap: 12 },
  flexBtn: { flex: 1 },
  label: { fontSize: 14, fontWeight: '600', color: '#475569', marginBottom: 8 },
  input: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 16, fontSize: 15, color: '#0f172a', marginBottom: 20 }
});
