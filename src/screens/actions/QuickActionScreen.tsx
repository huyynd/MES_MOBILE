import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { QrCode, PlayCircle, Trash2, Fingerprint, Search, Activity, ClipboardCheck, Users, Factory, AlertTriangle, Package, UserCheck, Recycle } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '@/store/authStore';

export function QuickActionScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuthStore();
  const isManager = user?.is_admin || (user?.role_name && !user?.role_name.toLowerCase().includes('công nhân'));

  const handleAction = (actionName: string) => {
    Alert.alert('Thao tác', `Chức năng "${actionName}" sẽ được mở`);
  };

  const renderManagerView = () => (
    <View>
      <TouchableOpacity 
        style={[styles.actionCard, { backgroundColor: '#0f172a' }]} 
        onPress={() => navigation.navigate('WOSearch')}
        activeOpacity={0.8}
      >
        <QrCode color="#ffffff" size={40} />
        <View style={styles.actionTextContainer}>
          <Text style={[styles.actionTitle, { color: '#ffffff' }]}>Scan QR / Barcode</Text>
          <Text style={[styles.actionDesc, { color: '#94a3b8' }]}>Quét WO • Máy • NVL • Vị trí</Text>
        </View>
      </TouchableOpacity>

      <View style={styles.grid}>
        <TouchableOpacity style={styles.gridItem} onPress={() => navigation.navigate('WorkOrder')} activeOpacity={0.7}>
          <View style={[styles.iconBox, { backgroundColor: '#e0e7ff' }]}>
            <Activity color="#1d4ed8" size={32} />
          </View>
          <Text style={styles.gridTitle}>Theo dõi sản lượng</Text>
          <Text style={styles.gridDesc}>Tiến độ sx</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.gridItem} onPress={() => navigation.navigate('ScrapReport')} activeOpacity={0.7}>
          <View style={[styles.iconBox, { backgroundColor: '#fee2e2' }]}>
            <Trash2 color="#ef4444" size={32} />
          </View>
          <Text style={styles.gridTitle}>Xử lý/duyệt phế</Text>
          <Text style={styles.gridDesc}>Phế phẩm</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.gridItem} onPress={() => navigation.navigate('ProductionPlan')} activeOpacity={0.7}>
          <View style={[styles.iconBox, { backgroundColor: '#fef3c7' }]}>
            <ClipboardCheck color="#d97706" size={32} />
          </View>
          <Text style={styles.gridTitle}>Duyệt kế hoạch</Text>
          <Text style={styles.gridDescHighlight}>Chờ duyệt: 03</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.gridItem} onPress={() => navigation.navigate('WorkSchedule')} activeOpacity={0.7}>
          <View style={[styles.iconBox, { backgroundColor: '#dcfce3' }]}>
            <Users color="#16a34a" size={32} />
          </View>
          <Text style={styles.gridTitle}>Phân bổ nhân sự</Text>
          <Text style={styles.gridDesc}>Giao việc</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.gridItem} onPress={() => navigation.navigate('WorkOrder')} activeOpacity={0.7}>
          <View style={[styles.iconBox, { backgroundColor: '#f3e8ff' }]}>
            <Factory color="#9333ea" size={32} />
          </View>
          <Text style={styles.gridTitle}>Duyệt Work Order</Text>
          <Text style={styles.gridDescHighlight}>Chờ duyệt: 05</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.gridItem} onPress={() => navigation.navigate('Recycling')} activeOpacity={0.7}>
          <View style={[styles.iconBox, { backgroundColor: '#dcfce7' }]}>
            <Recycle color="#16a34a" size={32} />
          </View>
          <Text style={styles.gridTitle}>Quản lý Tái chế</Text>
          <Text style={styles.gridDesc}>Theo dõi phiếu</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.gridItem} onPress={() => navigation.navigate('Warehouse')} activeOpacity={0.7}>
          <View style={[styles.iconBox, { backgroundColor: '#e0f2fe' }]}>
            <Package color="#0284c7" size={32} />
          </View>
          <Text style={styles.gridTitle}>Kiểm tra kho</Text>
          <Text style={styles.gridDesc}>Tồn kho/Vị trí</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.gridItem} onPress={() => navigation.navigate('ShiftApproval')} activeOpacity={0.7}>
          <View style={[styles.iconBox, { backgroundColor: '#fce7f3' }]}>
            <UserCheck color="#db2777" size={32} />
          </View>
          <Text style={styles.gridTitle}>Duyệt nhân sự</Text>
          <Text style={styles.gridDesc}>Nghỉ/giải trình</Text>
        </TouchableOpacity>
      </View>

    </View>
  );

  const renderWorkerView = () => (
    <View>
      <TouchableOpacity 
        style={[styles.actionCard, { backgroundColor: '#0f172a' }]} 
        onPress={() => navigation.navigate('WOSearch')}
        activeOpacity={0.8}
      >
        <QrCode color="#ffffff" size={40} />
        <View style={styles.actionTextContainer}>
          <Text style={[styles.actionTitle, { color: '#ffffff' }]}>Scan QR / Barcode</Text>
          <Text style={[styles.actionDesc, { color: '#94a3b8' }]}>Quét mã Lệnh, Máy, Nguyên vật liệu, Vị trí</Text>
        </View>
      </TouchableOpacity>

      <View style={styles.grid}>
        <TouchableOpacity style={styles.gridItem} onPress={() => navigation.navigate('WorkOrder')} activeOpacity={0.7}>
          <View style={[styles.iconBox, { backgroundColor: '#e0e7ff' }]}>
            <PlayCircle color="#1d4ed8" size={32} />
          </View>
          <Text style={styles.gridTitle}>Ghi sản lượng</Text>
          <Text style={styles.gridDesc}>Cập nhật tiến độ</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.gridItem} onPress={() => navigation.navigate('ScrapReport')} activeOpacity={0.7}>
          <View style={[styles.iconBox, { backgroundColor: '#fee2e2' }]}>
            <Trash2 color="#ef4444" size={32} />
          </View>
          <Text style={styles.gridTitle}>Ghi nhận phế</Text>
          <Text style={styles.gridDesc}>Báo cáo sự cố</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.gridItem} onPress={() => navigation.navigate('CheckIn')} activeOpacity={0.7}>
          <View style={[styles.iconBox, { backgroundColor: '#dcfce3' }]}>
            <Fingerprint color="#22c55e" size={32} />
          </View>
          <Text style={styles.gridTitle}>Chấm công</Text>
          <Text style={styles.gridDesc}>Check-in / out</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.gridItem} onPress={() => navigation.navigate('WOSearch')} activeOpacity={0.7}>
          <View style={[styles.iconBox, { backgroundColor: '#f1f5f9' }]}>
            <Search color="#475569" size={32} />
          </View>
          <Text style={styles.gridTitle}>Tra cứu</Text>
          <Text style={styles.gridDesc}>Tìm kiếm WO</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      
      <View style={styles.header}>
        <Text style={styles.title}>THAO TÁC NHANH</Text>
        <Text style={styles.subtitle}>
          {isManager ? 'Công cụ điều hành sản xuất' : 'Công cụ hỗ trợ công nhân trên công xưởng'}
        </Text>
      </View>

      {isManager ? renderManagerView() : renderWorkerView()}

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    marginTop: 40,
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: '#0f172a',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
    borderRadius: 20,
    marginBottom: 20,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  actionTextContainer: {
    marginLeft: 16,
    flex: 1,
  },
  actionTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  actionDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridItem: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  iconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  gridTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
    textAlign: 'center',
  },
  gridDesc: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
  },
  gridDescHighlight: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ea580c',
    textAlign: 'center',
  }
});
