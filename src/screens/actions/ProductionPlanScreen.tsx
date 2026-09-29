import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { AppHeader } from '@/components/AppHeader';
import { FileText } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function ProductionPlanScreen() {
  const insets = useSafeAreaInsets();
  
  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 0) }]}>
      <AppHeader title="Kế hoạch sản xuất" showBack />
      <View style={styles.content}>
        <FileText size={64} color="#94a3b8" />
        <Text style={styles.title}>Tính năng đang phát triển</Text>
        <Text style={styles.subtitle}>
          Màn hình này sẽ hiển thị thông tin lấy từ Kế hoạch sản xuất trên web MES trong các bản cập nhật tới.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
  }
});
