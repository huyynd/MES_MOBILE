import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Package } from 'lucide-react-native';

export function MaterialUsageScreen() {
  return (
    <View style={styles.container}>
      <Package size={48} color="#94a3b8" />
      <Text style={styles.text}>Tính năng Ghi nhận Nguyên vật liệu thực tế đang được phát triển.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 24,
  },
  text: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    fontWeight: '500',
  }
});
