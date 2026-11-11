import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import { BrandLogo } from '@/components/BrandLogo';
import { useAuthStore } from '@/store/authStore';
import { useNavigation } from '@react-navigation/native';

interface AppHeaderProps {
  title?: string;
  showBack?: boolean;
}

export function AppHeader({ title = "NGỌC AN THƯ MES", showBack }: AppHeaderProps) {
  const { user } = useAuthStore();
  const navigation = useNavigation<any>();

  return (
    <View style={styles.headerContainer}>
      <View style={styles.logoGroup}>
        {showBack ? (
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <ChevronLeft color="#1e293b" size={24} />
          </TouchableOpacity>
        ) : (
          <View style={styles.logoIconContainer}>
            <BrandLogo variant="mark" size={34} />
          </View>
        )}
        <Text style={styles.headerTitle}>{title}</Text>
      </View>
      
      <View style={styles.headerRightIcons}>
        {/* Chat / Thông báo: tạm ẩn — chưa có API (dữ liệu và số đếm cũ là giả). Màn vẫn giữ code. */}
        <TouchableOpacity style={styles.avatarIconBtn} onPress={() => navigation.navigate('Profile')}>
          <Text style={styles.avatarIconText}>{user?.full_name?.charAt(0) || 'U'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  logoGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoIconContainer: {
    width: 40,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  backBtn: {
    padding: 4,
    marginRight: 8,
    marginLeft: -4,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1e293b',
  },
  headerRightIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bellIconBtn: {
    marginRight: 16,
    position: 'relative',
  },
  bellBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#ef4444',
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
  bellBadgeText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#fff',
  },
  avatarIconBtn: {
    width: 32,
    height: 32,
    backgroundColor: '#1d4ed8',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarIconText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
