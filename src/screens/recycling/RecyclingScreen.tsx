import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { ArrowLeft, RefreshCcw, Plus, Package } from 'lucide-react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { recyclingApi } from '@/api/recycling';
import { Card } from '@/components/Card';

export function RecyclingScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTickets = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);

    try {
      const data = await recyclingApi.list();
      setTickets(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching tickets', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchTickets();
    }, [])
  );

  const onRefresh = () => fetchTickets(true);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Hoàn thành': return { bg: '#dcfce7', text: '#16a34a' };
      case 'Đang tái chế': return { bg: '#e0e7ff', text: '#4f46e5' };
      case 'Chờ cân': return { bg: '#fef3c7', text: '#d97706' };
      default: return { bg: '#f1f5f9', text: '#64748b' };
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
  };

  const renderItem = ({ item }: { item: any }) => {
    const statusObj = getStatusColor(item.status);
    return (
      <Card variant="elevated" style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.headerLeft}>
            <Package size={20} color="#1d4ed8" />
            <Text style={styles.ticketCode}>{item.ticket_code}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusObj.bg }]}>
            <Text style={[styles.statusText, { color: statusObj.text }]}>{item.status}</Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.row}>
            <Text style={styles.label}>Ngày xuất:</Text>
            <Text style={styles.value}>{formatDate(item.export_date)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Kho xuất:</Text>
            <Text style={styles.value}>{item.scrap_warehouse_name || '—'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Bên thứ 3:</Text>
            <Text style={styles.value}>{item.third_party_name || '—'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Tổng (kg):</Text>
            <Text style={[styles.value, { fontWeight: '700', color: '#0f172a' }]}>
              {item.expected_qty || item.total_received_qty || 0}
            </Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <TouchableOpacity 
            style={styles.actionBtn}
            onPress={() => navigation.navigate('RecyclingDetail', { id: item.id })}
          >
            <Text style={styles.actionBtnText}>Xem chi tiết</Text>
          </TouchableOpacity>
        </View>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Quản lý Tái chế</Text>
        <TouchableOpacity 
          style={styles.addBtn}
          onPress={() => navigation.navigate('RecyclingCreate')}
        >
          <Plus size={24} color="#1d4ed8" />
        </TouchableOpacity>
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1d4ed8" />
          <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
        </View>
      ) : (
        <FlatList
          data={tickets}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1d4ed8']} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Package size={48} color="#cbd5e1" />
              <Text style={styles.emptyText}>Chưa có phiếu tái chế nào</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  addBtn: {
    padding: 4,
  },
  listContainer: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#64748b',
    fontSize: 14,
  },
  emptyContainer: {
    paddingTop: 60,
    alignItems: 'center',
  },
  emptyText: {
    marginTop: 16,
    color: '#94a3b8',
    fontSize: 14,
  },
  card: {
    marginBottom: 16,
    borderRadius: 16,
    padding: 0,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ticketCode: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  cardBody: {
    padding: 16,
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 13,
    color: '#64748b',
  },
  value: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '500',
  },
  cardFooter: {
    padding: 16,
    paddingTop: 0,
  },
  actionBtn: {
    backgroundColor: '#eff6ff',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionBtnText: {
    color: '#1d4ed8',
    fontWeight: '600',
    fontSize: 14,
  }
});
