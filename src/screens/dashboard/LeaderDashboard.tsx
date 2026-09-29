import React from 'react';
import { View, StyleSheet, ScrollView, Text } from 'react-native';
import { StatCard } from '@/components/StatCard';
import { Users, Activity, TrendingUp, AlertOctagon } from 'lucide-react-native';
import { AppHeader } from '@/components/AppHeader';

export function LeaderDashboard() {
  return (
    <View style={{ flex: 1 }}>
      <AppHeader />
      <ScrollView style={styles.container}>
      <Text style={styles.sectionTitle}>Tiến độ Tổ sản xuất</Text>
      
      <View style={styles.row}>
        <StatCard 
          title="Nhân sự" 
          value="12/15" 
          subtitle="Có mặt" 
          icon={Users} 
          color="#0369a1" 
        />
        <StatCard 
          title="Máy hoạt động" 
          value="4/5" 
          subtitle="Đang chạy" 
          icon={Activity} 
          color="#22c55e" 
        />
      </View>

      <View style={styles.row}>
        <StatCard 
          title="Tổng SL" 
          value="850" 
          subtitle="Kế hoạch: 1000" 
          icon={TrendingUp} 
          color="#8b5cf6" 
        />
        <StatCard 
          title="Cảnh báo" 
          value="2" 
          subtitle="Bảo trì máy 03" 
          icon={AlertOctagon} 
          color="#ef4444" 
        />
      </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 12,
    marginTop: 8,
  }
});
