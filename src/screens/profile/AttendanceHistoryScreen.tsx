import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, Clock, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react-native';

export function AttendanceHistoryScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  // Mock data
  const historyData = [
    { id: '1', date: '20/09/2026', shift: 'Ca Sáng (06:00 - 14:00)', checkIn: '05:50', checkOut: '14:05', status: 'on_time' },
    { id: '2', date: '19/09/2026', shift: 'Ca Sáng (06:00 - 14:00)', checkIn: '06:15', checkOut: '14:00', status: 'late' },
    { id: '3', date: '18/09/2026', shift: 'Ca Chiều (14:00 - 22:00)', checkIn: '13:55', checkOut: '21:30', status: 'early_leave' },
    { id: '4', date: '17/09/2026', shift: 'Ca Sáng (06:00 - 14:00)', checkIn: '05:45', checkOut: '14:10', status: 'on_time' },
    { id: '5', date: '16/09/2026', shift: 'Ca Đêm (22:00 - 06:00)', checkIn: '22:10', checkOut: '06:05', status: 'late' },
  ];

  const getStatusConfig = (status: string) => {
    switch(status) {
      case 'on_time': return { text: 'Đúng giờ', color: '#16a34a', icon: <CheckCircle2 size={16} color="#16a34a" /> };
      case 'late': return { text: 'Đi muộn', color: '#eab308', icon: <AlertTriangle size={16} color="#eab308" /> };
      case 'early_leave': return { text: 'Về sớm', color: '#ef4444', icon: <XCircle size={16} color="#ef4444" /> };
      default: return { text: 'Không xác định', color: '#64748b', icon: <Clock size={16} color="#64748b" /> };
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { height: 60 + insets.top, paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lịch sử chấm công</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {historyData.map((item) => {
          const config = getStatusConfig(item.status);
          return (
            <View key={item.id} style={styles.historyCard}>
              <View style={styles.cardHeader}>
                <Text style={styles.dateText}>{item.date}</Text>
                <View style={[styles.statusBadge, { backgroundColor: config.color + '15' }]}>
                  {config.icon}
                  <Text style={[styles.statusText, { color: config.color }]}>{config.text}</Text>
                </View>
              </View>

              <Text style={styles.shiftText}>{item.shift}</Text>

              <View style={styles.timeContainer}>
                <View style={styles.timeBlock}>
                  <Text style={styles.timeLabel}>VÀO CA</Text>
                  <Text style={styles.timeValue}>{item.checkIn}</Text>
                </View>
                <View style={styles.timeDivider} />
                <View style={styles.timeBlock}>
                  <Text style={styles.timeLabel}>RA CA</Text>
                  <Text style={styles.timeValue}>{item.checkOut}</Text>
                </View>
              </View>
            </View>
          );
        })}
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
  historyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a'
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600'
  },
  shiftText: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 16,
    fontWeight: '500'
  },
  timeContainer: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center'
  },
  timeBlock: {
    flex: 1,
    alignItems: 'center'
  },
  timeLabel: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '600',
    marginBottom: 4
  },
  timeValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a'
  },
  timeDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#e2e8f0'
  }
});
