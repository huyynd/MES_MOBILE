import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, Search, QrCode, FileText, Box, Package, Calendar, User } from 'lucide-react-native';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { productionApi } from '@/api/production';

export function WOSearchScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [searchResult, setSearchResult] = useState<any>(null);

  const handleSearch = async (query: string = searchQuery) => {
    if (!query.trim()) return Alert.alert('Lỗi', 'Vui lòng nhập mã công đoạn sản xuất.');
    try {
      const task = await productionApi.getTaskByCode(query.trim());
      setSearchResult({
        code: task.task_code || query.toUpperCase(), status: task.status, productName: task.product_name,
        quantity: Number(task.quantity ?? task.order_quantity) || 0, completed: Number(task.actual_qty) || 0,
        customer: task.customer_name, orderRef: task.sales_order_code, dueDate: task.due_date, plannedDate: task.planned_date,
      });
    } catch (error: any) {
      setSearchResult(null);
      Alert.alert('Không tìm thấy', error.response?.data?.message || 'Không tìm thấy công đoạn theo mã đã nhập.');
    }
  };

  const openScanner = async () => {
    if (!permission?.granted && !(await requestPermission()).granted) {
      Alert.alert('Lỗi', 'Cần quyền camera để quét mã.');
      return;
    }
    setIsScanning(true);
  };

  if (isScanning) return (
    <View style={styles.scanner}>
      <CameraView style={StyleSheet.absoluteFill} facing="back" onBarcodeScanned={({ data }) => { setIsScanning(false); setSearchQuery(data); handleSearch(data); }} />
      <View style={[styles.scannerHeader, { paddingTop: insets.top }]}><TouchableOpacity onPress={() => setIsScanning(false)}><ArrowLeft size={28} color="#fff" /></TouchableOpacity><Text style={styles.scannerTitle}>Quét mã công đoạn</Text><View style={styles.placeholder} /></View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={[styles.header, { height: 60 + insets.top, paddingTop: insets.top }]}><TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}><ArrowLeft size={24} color="#0f172a" /></TouchableOpacity><Text style={styles.headerTitle}>Tra cứu công đoạn</Text><View style={styles.placeholder} /></View>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.searchSection}>
          <Text style={styles.sectionTitle}>Tra cứu nhanh</Text>
          <Input placeholder="Nhập mã công đoạn" value={searchQuery} onChangeText={setSearchQuery} leftIcon={<Search size={20} color="#94a3b8" />} autoCapitalize="characters" />
          <View style={styles.actions}><Button title="Tìm kiếm" onPress={() => handleSearch()} style={styles.flex} icon={<Search size={18} color="#fff" />} /><Button title="Quét mã" variant="outline" onPress={openScanner} style={styles.flex} icon={<QrCode size={18} color="#1d4ed8" />} /></View>
        </View>
        {searchResult && <View>
          <Text style={styles.sectionTitle}>Thông tin công đoạn</Text>
          <View style={styles.card}><View style={styles.cardTop}><Text style={styles.code}>{searchResult.code}</Text><Text style={styles.status}>{searchResult.status || '—'}</Text></View><Row icon={<Box size={16} color="#64748b" />} label="Sản phẩm" value={searchResult.productName} /><Row icon={<Package size={16} color="#64748b" />} label="Sản lượng" value={`${searchResult.completed} / ${searchResult.quantity}`} /><Row icon={<Calendar size={16} color="#64748b" />} label="Kế hoạch" value={searchResult.plannedDate || '—'} /><Row icon={<Calendar size={16} color="#64748b" />} label="Hạn giao" value={searchResult.dueDate || '—'} /></View>
          <Text style={styles.sectionTitle}>Đơn hàng</Text><View style={styles.card}><Row icon={<User size={16} color="#64748b" />} label="Khách hàng" value={searchResult.customer || '—'} /><Row icon={<FileText size={16} color="#64748b" />} label="Mã đơn" value={searchResult.orderRef || '—'} /></View>
        </View>}
      </ScrollView>
    </View>
  );
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) { return <View style={styles.row}>{icon}<Text style={styles.rowLabel}>{label}</Text><Text style={styles.rowValue}>{value}</Text></View>; }

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' }, header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }, backBtn: { width: 40, height: 40, justifyContent: 'center' }, headerTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a' }, placeholder: { width: 40 }, content: { padding: 16, paddingBottom: 40 }, searchSection: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 24 }, sectionTitle: { fontSize: 16, fontWeight: '800', color: '#0f172a', marginBottom: 14 }, actions: { flexDirection: 'row', gap: 12 }, flex: { flex: 1, height: 48 }, card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 24, gap: 12 }, cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }, code: { color: '#1d4ed8', fontSize: 17, fontWeight: '800' }, status: { color: '#166534', backgroundColor: '#dcfce7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, fontSize: 12, fontWeight: '700' }, row: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 }, rowLabel: { width: 88, color: '#64748b', fontSize: 14 }, rowValue: { flex: 1, color: '#0f172a', fontSize: 14, fontWeight: '600' }, scanner: { flex: 1, backgroundColor: '#000' }, scannerHeader: { height: 72, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(0,0,0,0.5)' }, scannerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
});
