import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Modal, TextInput, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, Plus, Clock, CheckCircle2, XCircle, AlertCircle, Camera, Image as ImageIcon, CheckSquare, Square } from 'lucide-react-native';
import { Button } from '@/components/Button';
import { useAuthStore } from '@/store/authStore';
import * as ImagePicker from 'expo-image-picker';

export function AttendanceAppealScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { user } = useAuthStore();
  const isManager = user?.is_admin || user?.role_name?.toLowerCase().includes('quản lý') || user?.role_name?.toLowerCase().includes('manager');

  const [showForm, setShowForm] = useState(false);
  const [selectedReason, setSelectedReason] = useState('');
  const [otherReason, setOtherReason] = useState('');
  const [proofImage, setProofImage] = useState<string | null>(null);

  const missingShifts = [
    '26/09/2026 - Ca Sáng (06:00 - 14:00)',
    '25/09/2026 - Ca Chiều (14:00 - 22:00)',
    '24/09/2026 - Ca Đêm (22:00 - 06:00)'
  ];
  const [selectedShift, setSelectedShift] = useState(missingShifts[0]);
  const [showShiftPicker, setShowShiftPicker] = useState(false);

  // Mock data for lists
  const [appeals, setAppeals] = useState([
    { id: '1', name: 'Nguyễn Văn A', date: '21/09/2026', shift: 'Ca Sáng (06:00 - 14:00)', reason: 'Quên chấm công lúc về', status: 'pending' },
    { id: '2', name: 'Trần Thị B', date: '22/09/2026', shift: 'Ca Chiều (14:00 - 22:00)', reason: 'Nghỉ có việc gấp', status: 'pending' },
    { id: '3', name: 'Lê Văn C', date: '23/09/2026', shift: 'Ca Đêm (22:00 - 06:00)', reason: 'Đổi ca với nhân viên khác', status: 'approved' },
  ]);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const reasons = ['Quên chấm công', 'Đổi ca', 'Chưa đăng ký ca làm', 'Nghỉ có việc gấp', 'Lý do khác'];

  const getStatusConfig = (status: string) => {
    switch(status) {
      case 'approved': return { text: 'Đã duyệt', color: '#16a34a', icon: <CheckCircle2 size={16} color="#16a34a" /> };
      case 'rejected': return { text: 'Từ chối', color: '#ef4444', icon: <XCircle size={16} color="#ef4444" /> };
      case 'pending': return { text: 'Chờ duyệt', color: '#eab308', icon: <Clock size={16} color="#eab308" /> };
      default: return { text: 'Không xác định', color: '#64748b', icon: <AlertCircle size={16} color="#64748b" /> };
    }
  };

  const closeForm = () => {
    setShowForm(false);
    setSelectedReason('');
    setOtherReason('');
    setProofImage(null);
    setSelectedShift(missingShifts[0]);
    setShowShiftPicker(false);
  };

  const handleImagePick = async (type: 'camera' | 'gallery') => {
    try {
      if (type === 'camera') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Lỗi', 'Cần cấp quyền truy cập camera để chụp ảnh');
          return;
        }
        const result = await ImagePicker.launchCameraAsync({
          mediaTypes: ['images'],
          quality: 0.7,
        });
        if (!result.canceled) {
          setProofImage(result.assets[0].uri);
        }
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Lỗi', 'Cần cấp quyền truy cập thư viện ảnh để chọn ảnh');
          return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          quality: 0.7,
        });
        if (!result.canceled) {
          setProofImage(result.assets[0].uri);
        }
      }
    } catch (error) {
      console.log('Error picking image:', error);
      Alert.alert('Lỗi', 'Không thể chọn ảnh. Vui lòng thử lại.');
    }
  };

  const handleSubmit = () => {
    if (!selectedReason) {
      Alert.alert('Lỗi', 'Vui lòng chọn lý do giải trình');
      return;
    }
    Alert.alert('Xác nhận', 'Bạn có chắc chắn muốn gửi phiếu giải trình công này?', [
      { text: 'Hủy', style: 'cancel' },
      { 
        text: 'Gửi duyệt', 
        onPress: () => {
          closeForm();
          Alert.alert('Thành công', 'Đã gửi phiếu giải trình. Vui lòng chờ quản lý duyệt.');
        }
      }
    ]);
  };

  const toggleSelectAll = () => {
    const pendingIds = appeals.filter(a => a.status === 'pending').map(a => a.id);
    if (selectedIds.length === pendingIds.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(pendingIds);
    }
  };

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) setSelectedIds(selectedIds.filter(i => i !== id));
    else setSelectedIds([...selectedIds, id]);
  };

  const handleBulkApprove = () => {
    if (selectedIds.length === 0) return;
    Alert.alert('Xác nhận', `Duyệt ${selectedIds.length} yêu cầu giải trình?`, [
      { text: 'Hủy', style: 'cancel' },
      { 
        text: 'Duyệt', 
        onPress: () => {
          setAppeals(appeals.map(a => selectedIds.includes(a.id) ? { ...a, status: 'approved' } : a));
          setSelectedIds([]);
          Alert.alert('Thành công', 'Đã duyệt hàng loạt');
        }
      }
    ]);
  };

  const renderManagerView = () => {
    const pendingAppeals = appeals.filter(a => a.status === 'pending');
    const isAllSelected = pendingAppeals.length > 0 && selectedIds.length === pendingAppeals.length;

    return (
      <>
        {pendingAppeals.length > 0 && (
          <View style={styles.bulkActionRow}>
            <TouchableOpacity style={styles.selectAllBtn} onPress={toggleSelectAll}>
              {isAllSelected ? <CheckSquare size={20} color="#1d4ed8" /> : <Square size={20} color="#64748b" />}
              <Text style={styles.selectAllText}>Chọn tất cả</Text>
            </TouchableOpacity>
            {selectedIds.length > 0 && (
              <Button title={`Duyệt (${selectedIds.length})`} style={styles.bulkBtn} onPress={handleBulkApprove} />
            )}
          </View>
        )}
        <ScrollView contentContainerStyle={styles.content}>
          {appeals.map((item) => {
            const config = getStatusConfig(item.status);
            const isSelected = selectedIds.includes(item.id);
            return (
              <View key={item.id} style={[styles.card, isSelected && styles.cardSelected]}>
                <View style={styles.cardHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                    {item.status === 'pending' && (
                      <TouchableOpacity onPress={() => toggleSelect(item.id)} style={{ marginRight: 12 }}>
                        {isSelected ? <CheckSquare size={24} color="#1d4ed8" /> : <Square size={24} color="#cbd5e1" />}
                      </TouchableOpacity>
                    )}
                    <View>
                      <Text style={styles.empName}>{item.name}</Text>
                      <Text style={styles.dateText}>{item.date}</Text>
                    </View>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: config.color + '15' }]}>
                    {config.icon}
                    <Text style={[styles.statusText, { color: config.color }]}>{config.text}</Text>
                  </View>
                </View>
                <Text style={styles.shiftText}>{item.shift}</Text>
                <View style={styles.reasonBox}>
                  <Text style={styles.reasonLabel}>Lý do:</Text>
                  <Text style={styles.reasonValue}>{item.reason}</Text>
                </View>
              </View>
            );
          })}
        </ScrollView>
      </>
    );
  };

  const renderWorkerView = () => (
    <>
      <ScrollView contentContainerStyle={styles.content}>
        {appeals.map((item) => {
          const config = getStatusConfig(item.status);
          return (
            <View key={item.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.dateText}>{item.date}</Text>
                <View style={[styles.statusBadge, { backgroundColor: config.color + '15' }]}>
                  {config.icon}
                  <Text style={[styles.statusText, { color: config.color }]}>{config.text}</Text>
                </View>
              </View>
              <Text style={styles.shiftText}>{item.shift}</Text>
              <View style={styles.reasonBox}>
                <Text style={styles.reasonLabel}>Lý do:</Text>
                <Text style={styles.reasonValue}>{item.reason}</Text>
              </View>
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
            <TouchableOpacity style={styles.backBtn} onPress={closeForm}>
              <ArrowLeft size={24} color="#0f172a" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Tạo phiếu giải trình</Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView contentContainerStyle={styles.modalContent}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Ngày / Ca giải trình</Text>
              <TouchableOpacity style={styles.fakeInput} onPress={() => setShowShiftPicker(true)}>
                <Text style={styles.fakeInputText}>{selectedShift}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Lý do giải trình</Text>
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

            <View style={styles.formGroup}>
              <Text style={styles.label}>Hình ảnh minh chứng</Text>
              <View style={styles.imagePickerContainer}>
                {proofImage ? (
                  <View style={styles.imagePreviewContainer}>
                    <Image source={{ uri: proofImage }} style={styles.previewImage} />
                    <TouchableOpacity style={styles.removeImageBtn} onPress={() => setProofImage(null)}>
                      <XCircle size={24} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.imagePickerButtons}>
                    <TouchableOpacity style={styles.imagePickerBtn} onPress={() => handleImagePick('camera')}>
                      <Camera size={24} color="#1d4ed8" />
                      <Text style={styles.imagePickerBtnText}>Chụp ảnh</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.imagePickerBtn} onPress={() => handleImagePick('gallery')}>
                      <ImageIcon size={24} color="#1d4ed8" />
                      <Text style={styles.imagePickerBtnText}>Chọn ảnh</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
          </ScrollView>

          <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
            <Button title="GỬI DUYỆT" onPress={handleSubmit} style={{ height: 56 }} />
          </View>
        </View>
      </Modal>

      <Modal visible={showShiftPicker} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.pickerModalContent}>
            <Text style={styles.pickerModalTitle}>Chọn Ngày / Ca giải trình</Text>
            {missingShifts.map((shift, index) => (
              <TouchableOpacity 
                key={index} 
                style={[styles.pickerItem, selectedShift === shift && styles.pickerItemActive]}
                onPress={() => {
                  setSelectedShift(shift);
                  setShowShiftPicker(false);
                }}
              >
                <Text style={[styles.pickerItemText, selectedShift === shift && styles.pickerItemTextActive]}>{shift}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.pickerCloseBtn} onPress={() => setShowShiftPicker(false)}>
              <Text style={styles.pickerCloseBtnText}>Đóng</Text>
            </TouchableOpacity>
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
        <Text style={styles.headerTitle}>{isManager ? "Phê duyệt giải trình" : "Giải trình công"}</Text>
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
  bulkActionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 16 },
  selectAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  selectAllText: { fontSize: 14, fontWeight: '600', color: '#0f172a' },
  bulkBtn: { paddingHorizontal: 16, height: 40, borderRadius: 8 },
  card: {
    backgroundColor: '#ffffff', borderRadius: 16, padding: 16, marginBottom: 16,
    borderWidth: 1, borderColor: '#f1f5f9',
    shadowColor: '#64748b', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2
  },
  cardSelected: { borderColor: '#1d4ed8', backgroundColor: '#eff6ff' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  empName: { fontSize: 16, fontWeight: '700', color: '#0f172a', marginBottom: 2 },
  dateText: { fontSize: 14, fontWeight: '600', color: '#64748b' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, gap: 4 },
  statusText: { fontSize: 12, fontWeight: '600' },
  shiftText: { fontSize: 14, color: '#64748b', marginBottom: 12, fontWeight: '500' },
  reasonBox: { backgroundColor: '#f8fafc', padding: 12, borderRadius: 12 },
  reasonLabel: { fontSize: 12, color: '#64748b', fontWeight: '600', marginBottom: 4 },
  reasonValue: { fontSize: 14, color: '#0f172a', fontWeight: '500' },
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
  formGroup: { marginBottom: 24 },
  label: { fontSize: 14, fontWeight: '600', color: '#475569', marginBottom: 12 },
  fakeInput: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 16 },
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
  imagePickerContainer: {
    marginTop: 8,
  },
  imagePickerButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  imagePickerBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderStyle: 'dashed',
    gap: 8,
  },
  imagePickerBtnText: {
    color: '#1d4ed8',
    fontWeight: '600',
    fontSize: 14,
  },
  imagePreviewContainer: {
    position: 'relative',
    width: '100%',
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  removeImageBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#ffffff',
    borderRadius: 12,
  },
  footer: { padding: 16, backgroundColor: '#ffffff', borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 },
  pickerModalContent: { backgroundColor: '#ffffff', borderRadius: 16, padding: 20 },
  pickerModalTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a', marginBottom: 16, textAlign: 'center' },
  pickerItem: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  pickerItemActive: { backgroundColor: '#eff6ff', borderRadius: 8, paddingHorizontal: 12, borderBottomWidth: 0 },
  pickerItemText: { fontSize: 15, color: '#334155' },
  pickerItemTextActive: { color: '#1d4ed8', fontWeight: '600' },
  pickerCloseBtn: { marginTop: 20, paddingVertical: 14, backgroundColor: '#f1f5f9', borderRadius: 12, alignItems: 'center' },
  pickerCloseBtnText: { color: '#475569', fontWeight: '600', fontSize: 15 }
});
