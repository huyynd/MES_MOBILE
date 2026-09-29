import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, Search, QrCode, FileText, Box, Package, Calendar, User } from 'lucide-react-native';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { CameraView, useCameraPermissions } from 'expo-camera';

export function WOSearchScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [searchResult, setSearchResult] = useState<any>(null);

  const handleSearch = (query: string = searchQuery) => {
    if (!query) {
      Alert.alert('Lỗi', 'Vui lòng nhập mã lệnh sản xuất');
      return;
    }
    // Mock data fetch
    setSearchResult({
      woCode: query.toUpperCase(),
      status: 'Đang sản xuất',
      productName: 'Thùng carton 5 lớp IN OFFSET',
      quantity: 5000,
      completed: 2500,
      customer: 'Công ty Cổ phần Sữa Việt Nam (Vinamilk)',
      orderRef: 'PO-2026-1042',
      deliveryDate: '30/09/2026',
      startDate: '20/09/2026',
    });
  };

  const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
    setIsScanning(false);
    setSearchQuery(data);
    handleSearch(data);
  };

  const openScanner = async () => {
    if (!permission?.granted) {
      const { granted } = await requestPermission();
      if (!granted) {
        Alert.alert('Lỗi', 'Không có quyền truy cập camera để quét mã');
        return;
      }
    }
    setIsScanning(true);
  };

  if (isScanning) {
    return (
      <View style={{ flex: 1, backgroundColor: '#000' }}>
        <CameraView
          style={{ flex: 1 }}
          facing="back"
          onBarcodeScanned={handleBarCodeScanned}
        >
          <View style={[styles.scannerOverlay, { paddingTop: insets.top }]}>
            <View style={styles.scannerHeader}>
              <TouchableOpacity onPress={() => setIsScanning(false)} style={styles.backBtnWrapper}>
                <ArrowLeft size={28} color="#ffffff" />
              </TouchableOpacity>
              <Text style={styles.scannerTitle}>Quét mã Lệnh sản xuất</Text>
              <View style={{ width: 40 }} />
            </View>
            
            <View style={styles.scannerCenter}>
              <View style={styles.scannerFrame} />
              <Text style={styles.scannerHint}>Di chuyển camera đến vùng có mã QR hoặc Barcode</Text>
            </View>
          </View>
        </CameraView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { height: 60 + insets.top, paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tra cứu lệnh sản xuất</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        
        <View style={styles.searchSection}>
          <Text style={styles.sectionTitle}>Tra cứu nhanh</Text>
          <View style={styles.inputWrapper}>
            <Input
              placeholder="Nhập mã lệnh (VD: WO...)"
              value={searchQuery}
              onChangeText={setSearchQuery}
              leftIcon={<Search size={20} color="#94a3b8" />}
              autoCapitalize="characters"
            />
          </View>
          <View style={styles.actionRow}>
            <Button 
              title="Tìm kiếm" 
              onPress={() => handleSearch()} 
              style={styles.searchBtn} 
              icon={<Search size={18} color="#fff" />}
            />
            <View style={{ width: 12 }} />
            <Button 
              title="Quét mã" 
              variant="outline"
              onPress={openScanner} 
              style={styles.scanBtn} 
              icon={<QrCode size={18} color="#1d4ed8" />}
            />
          </View>
        </View>

        {searchResult && (
          <View style={styles.resultSection}>
            <Text style={styles.sectionTitle}>Thông tin cơ bản</Text>
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.woBadge}>
                  <FileText size={18} color="#1d4ed8" />
                  <Text style={styles.woCodeText}>{searchResult.woCode}</Text>
                </View>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>{searchResult.status}</Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.infoRow}>
                <View style={styles.iconCircle}><Box size={16} color="#64748b" /></View>
                <Text style={styles.infoLabel}>Sản phẩm:</Text>
                <Text style={styles.infoValue}>{searchResult.productName}</Text>
              </View>
              <View style={styles.infoRow}>
                <View style={styles.iconCircle}><Package size={16} color="#64748b" /></View>
                <Text style={styles.infoLabel}>Sản lượng:</Text>
                <Text style={styles.infoValueHighlight}>{searchResult.completed} / {searchResult.quantity}</Text>
              </View>
              <View style={styles.infoRow}>
                <View style={styles.iconCircle}><Calendar size={16} color="#64748b" /></View>
                <Text style={styles.infoLabel}>Ngày bắt đầu:</Text>
                <Text style={styles.infoValue}>{searchResult.startDate}</Text>
              </View>
            </View>

            <Text style={styles.sectionTitle}>Đơn hàng tương ứng</Text>
            <View style={styles.card}>
              <View style={styles.infoRow}>
                <View style={styles.iconCircle}><User size={16} color="#64748b" /></View>
                <Text style={styles.infoLabel}>Khách hàng:</Text>
                <Text style={styles.infoValue} numberOfLines={2}>{searchResult.customer}</Text>
              </View>
              <View style={styles.infoRow}>
                <View style={styles.iconCircle}><FileText size={16} color="#64748b" /></View>
                <Text style={styles.infoLabel}>Mã ĐH (PO):</Text>
                <Text style={styles.infoValue}>{searchResult.orderRef}</Text>
              </View>
              <View style={styles.infoRow}>
                <View style={styles.iconCircle}><Calendar size={16} color="#64748b" /></View>
                <Text style={styles.infoLabel}>Ngày giao:</Text>
                <Text style={styles.infoValue}>{searchResult.deliveryDate}</Text>
              </View>
            </View>
          </View>
        )}

      </ScrollView>
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
  content: { padding: 16, paddingBottom: 40 },
  searchSection: {
    backgroundColor: '#ffffff', borderRadius: 16, padding: 16, marginBottom: 24,
    shadowColor: '#64748b', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 3
  },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#0f172a', marginBottom: 16 },
  inputWrapper: { marginBottom: 16 },
  actionRow: { flexDirection: 'row' },
  searchBtn: { flex: 1, height: 48 },
  scanBtn: { flex: 1, height: 48 },
  resultSection: {},
  card: {
    backgroundColor: '#ffffff', borderRadius: 16, padding: 16, marginBottom: 24,
    borderWidth: 1, borderColor: '#f1f5f9',
    shadowColor: '#64748b', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  woBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#eff6ff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, gap: 8 },
  woCodeText: { fontSize: 16, fontWeight: '800', color: '#1d4ed8' },
  statusBadge: { backgroundColor: '#dcfce3', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 12, fontWeight: '700', color: '#16a34a' },
  divider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 12 },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  iconCircle: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#f8fafc', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  infoLabel: { fontSize: 14, color: '#64748b', fontWeight: '500', width: 100, marginTop: 4 },
  infoValue: { fontSize: 15, color: '#0f172a', fontWeight: '600', flex: 1, marginTop: 4 },
  infoValueHighlight: { fontSize: 15, color: '#1d4ed8', fontWeight: '700', flex: 1, marginTop: 4 },
  
  // Scanner styles
  scannerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  scannerHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, height: 60 },
  backBtnWrapper: { width: 40, height: 40, justifyContent: 'center' },
  scannerTitle: { color: '#ffffff', fontSize: 18, fontWeight: '700' },
  scannerCenter: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scannerFrame: {
    width: 250, height: 250, borderWidth: 2, borderColor: '#1d4ed8', backgroundColor: 'transparent',
    borderRadius: 16, marginBottom: 24
  },
  scannerHint: { color: '#ffffff', fontSize: 14, textAlign: 'center', paddingHorizontal: 40 }
});
