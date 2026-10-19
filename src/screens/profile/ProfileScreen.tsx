import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/Button';
import { Clock, LogOut, ChevronRight } from 'lucide-react-native';
import { isDirector } from '@/utils/roles';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

export function ProfileScreen() {
  const { user, logout } = useAuthStore();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  
  const director = isDirector(user);

  const handleLogout = () => {
    Alert.alert('Đăng xuất', 'Bạn có chắc chắn muốn đăng xuất?', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Đăng xuất', style: 'destructive', onPress: logout }
    ]);
  };

  const MenuItem = ({ icon: Icon, title, onPress, color = "#334155" }: any) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.menuIconContainer}>
        <Icon size={22} color={color} />
      </View>
      <Text style={[styles.menuTitle, { color }]}>{title}</Text>
      <ChevronRight size={20} color="#cbd5e1" />
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 + insets.bottom }}>
      
      {/* Profile Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top + 20, 40) }]}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>{user?.full_name?.charAt(0) || 'U'}</Text>
        </View>
        <Text style={styles.userName}>{user?.full_name}</Text>
        <Text style={styles.userRole}>{user?.role_name || 'Công nhân'}</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Hoạt động</Text>
        </View>
      </View>

      {/* Menu List */}
      <View style={styles.menuSection}>
        <Text style={styles.sectionTitle}>TÀI KHOẢN</Text>
        <View style={[styles.menuCard, { padding: 16, gap: 6 }]}>
          <Text style={styles.infoLine}>Tên đăng nhập: <Text style={styles.infoStrong}>{user?.username}</Text></Text>
          <Text style={styles.infoLine}>Vai trò: <Text style={styles.infoStrong}>{user?.role_name || '—'}</Text></Text>
          <Text style={styles.infoLine}>Công nhân liên kết: <Text style={styles.infoStrong}>{user?.linked_worker || 'chưa gắn'}</Text></Text>
          <Text style={styles.infoLine}>Giao diện: <Text style={styles.infoStrong}>{director ? 'Giám đốc' : 'Công nhân'}</Text></Text>
        </View>
      </View>

      <View style={styles.menuSection}>
        <Text style={styles.sectionTitle}>CÁ NHÂN</Text>
        <View style={styles.menuCard}>
          <MenuItem icon={Clock} title="Lịch ca làm việc" onPress={() => navigation.navigate('WorkSchedule')} />
          {/* Thông tin cá nhân, chấm công, giải trình, nghỉ phép, duyệt ca: tạm ẩn — dữ liệu giả, chưa có API */}
        </View>
      </View>

      <View style={styles.menuSection}>
        <Text style={styles.sectionTitle}>HỆ THỐNG</Text>
        <View style={styles.menuCard}>
          <MenuItem icon={LogOut} title="Đăng xuất" color="#ef4444" onPress={handleLogout} />
        </View>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  infoLine: { fontSize: 14, color: '#64748b' },
  infoStrong: { color: '#0f172a', fontWeight: '700' },
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#ffffff',
    alignItems: 'center',
    paddingVertical: 40,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    shadowColor: '#1d4ed8',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 5,
    marginBottom: 24,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#bfdbfe',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1d4ed8',
  },
  userName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 4,
  },
  userRole: {
    fontSize: 15,
    color: '#64748b',
    fontWeight: '500',
    marginBottom: 12,
  },
  badge: {
    backgroundColor: '#dcfce3',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: '#16a34a',
    fontSize: 12,
    fontWeight: '700',
  },
  menuSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#94a3b8',
    marginBottom: 8,
    marginLeft: 8,
  },
  menuCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  menuIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginLeft: 68,
  }
});
