import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, User, Phone, MapPin, Calendar, Home, Search, Filter } from 'lucide-react-native';
import { useAuthStore } from '@/store/authStore';

export function PersonalInfoScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { user } = useAuthStore();
  const isManager = user?.is_admin || user?.role_name?.toLowerCase().includes('quản lý') || user?.role_name?.toLowerCase().includes('manager');

  const [searchQuery, setSearchQuery] = useState('');

  // Mock data for missing fields
  const mockProfile = {
    phone: '0901234567',
    hometown: 'Thanh Hóa',
    currentAddress: 'Quận 9, TP. Hồ Chí Minh',
    joinDate: '15/03/2021',
  };

  const employeesData = [
    { id: '1', name: 'Nguyễn Văn A', code: 'NV001', role: 'Vận hành máy', phone: '0912345678', avatar: 'N' },
    { id: '2', name: 'Trần Thị B', code: 'NV002', role: 'Kiểm tra chất lượng', phone: '0987654321', avatar: 'T' },
    { id: '3', name: 'Lê Văn C', code: 'NV003', role: 'Bảo trì', phone: '0909090909', avatar: 'L' },
  ];

  const filteredEmployees = employeesData.filter(e => e.name.toLowerCase().includes(searchQuery.toLowerCase()) || e.code.toLowerCase().includes(searchQuery.toLowerCase()));

  const InfoRow = ({ icon: Icon, label, value }: any) => (
    <View style={styles.infoRow}>
      <View style={styles.iconContainer}>
        <Icon size={20} color="#1d4ed8" />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{value}</Text>
      </View>
    </View>
  );

  const renderManagerView = () => (
    <View style={{ flex: 1 }}>
      <View style={styles.toolbar}>
        <View style={styles.searchBox}>
          <Search size={18} color="#64748b" />
          <TextInput 
            placeholder="Tìm kiếm nhân viên..." 
            style={styles.searchInput} 
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity style={styles.filterBtn}>
          <Filter size={18} color="#1d4ed8" />
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {filteredEmployees.map(emp => (
          <TouchableOpacity key={emp.id} style={styles.empCard}>
            <View style={styles.avatarCircleSmall}>
              <Text style={styles.avatarTextSmall}>{emp.avatar}</Text>
            </View>
            <View style={styles.empInfoBox}>
              <Text style={styles.empNameText}>{emp.name} ({emp.code})</Text>
              <Text style={styles.empRoleText}>{emp.role}</Text>
              <View style={styles.empPhoneBox}>
                <Phone size={12} color="#64748b" />
                <Text style={styles.empPhoneText}>{emp.phone}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderWorkerView = () => (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <View style={styles.avatarSection}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>{user?.full_name?.charAt(0) || 'U'}</Text>
        </View>
        <Text style={styles.nameText}>{user?.full_name}</Text>
        <Text style={styles.roleText}>{user?.role_name || 'Công nhân'}</Text>
      </View>

      <View style={styles.card}>
        <InfoRow icon={User} label="Họ và tên" value={user?.full_name} />
        <View style={styles.divider} />
        <InfoRow icon={Phone} label="Số điện thoại" value={mockProfile.phone} />
        <View style={styles.divider} />
        <InfoRow icon={Home} label="Địa chỉ quê quán" value={mockProfile.hometown} />
        <View style={styles.divider} />
        <InfoRow icon={MapPin} label="Địa chỉ hiện tại" value={mockProfile.currentAddress} />
        <View style={styles.divider} />
        <InfoRow icon={Calendar} label="Ngày vào làm" value={mockProfile.joinDate} />
      </View>
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      <View style={[styles.header, { height: 60 + insets.top, paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isManager ? 'Quản lý nhân viên' : 'Thông tin cá nhân'}</Text>
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
  toolbar: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12, backgroundColor: '#ffffff' },
  searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9', borderRadius: 12, paddingHorizontal: 12, height: 44, gap: 8 },
  searchInput: { flex: 1, fontSize: 15, color: '#0f172a' },
  filterBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#eff6ff', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#bfdbfe' },
  scrollContent: { padding: 16, paddingBottom: 40 },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 16,
  },
  avatarCircle: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: '#eff6ff',
    justifyContent: 'center', alignItems: 'center', marginBottom: 12,
    borderWidth: 2, borderColor: '#bfdbfe'
  },
  avatarText: { fontSize: 32, fontWeight: '800', color: '#1d4ed8' },
  nameText: { fontSize: 20, fontWeight: '700', color: '#0f172a', marginBottom: 4 },
  roleText: { fontSize: 14, color: '#64748b', fontWeight: '500' },
  card: {
    backgroundColor: '#ffffff', borderRadius: 16, padding: 16,
    shadowColor: '#64748b', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  empCard: {
    flexDirection: 'row', backgroundColor: '#ffffff', borderRadius: 16, padding: 16, marginBottom: 12,
    alignItems: 'center', shadowColor: '#64748b', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  avatarCircleSmall: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: '#eff6ff',
    justifyContent: 'center', alignItems: 'center', marginRight: 16,
  },
  avatarTextSmall: { fontSize: 18, fontWeight: '700', color: '#1d4ed8' },
  empInfoBox: { flex: 1 },
  empNameText: { fontSize: 16, fontWeight: '700', color: '#0f172a', marginBottom: 2 },
  empRoleText: { fontSize: 13, color: '#64748b', fontWeight: '500', marginBottom: 6 },
  empPhoneBox: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  empPhoneText: { fontSize: 12, color: '#64748b', fontWeight: '500' },
  infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  iconContainer: {
    width: 40, height: 40, borderRadius: 10, backgroundColor: '#eff6ff',
    justifyContent: 'center', alignItems: 'center', marginRight: 16,
  },
  textContainer: { flex: 1 },
  label: { fontSize: 12, color: '#64748b', fontWeight: '600', marginBottom: 4 },
  value: { fontSize: 15, color: '#0f172a', fontWeight: '500' },
  divider: { height: 1, backgroundColor: '#f1f5f9', marginLeft: 56 }
});
