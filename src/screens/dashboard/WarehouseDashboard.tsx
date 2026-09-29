import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Text, TouchableOpacity, RefreshControl, FlatList } from 'react-native';
import { PackageCheck, PackageOpen, ArrowLeftRight, ClipboardCheck, History, Calendar } from 'lucide-react-native';
import { StatCard } from '@/components/StatCard';
import { Card } from '@/components/Card';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { inventoryApi } from '@/api/inventory';
import { AppHeader } from '@/components/AppHeader';

export function WarehouseDashboard() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  
  const [filter, setFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [loading, setLoading] = useState(false);
  
  const [allData, setAllData] = useState({
    transactions: [] as any[],
    outboundSlips: [] as any[],
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [transactionsRes, outboundRes] = await Promise.all([
        inventoryApi.getTransactions(), // fetch all recent (up to 300)
        inventoryApi.getOutboundSlips({ status: 'Chờ xuất' }),
      ]);
      setAllData({
        transactions: transactionsRes || [],
        outboundSlips: outboundRes || []
      });
    } catch (e) {
      console.warn("Lỗi tải dashboard kho:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  // Filter logic
  const isWithinFilter = (dateStr: string) => {
    if (filter === 'all' || !dateStr) return true;
    
    const date = new Date(dateStr);
    const now = new Date();
    
    if (filter === 'today') {
      return date.getDate() === now.getDate() && 
             date.getMonth() === now.getMonth() && 
             date.getFullYear() === now.getFullYear();
    }
    
    if (filter === 'week') {
      const pastWeek = new Date();
      pastWeek.setDate(now.getDate() - 7);
      return date >= pastWeek;
    }
    
    if (filter === 'month') {
      return date.getMonth() === now.getMonth() && 
             date.getFullYear() === now.getFullYear();
    }
    
    return true;
  };

  const filteredTx = allData.transactions.filter(t => isWithinFilter(t.created_at));
  const filteredOutbound = allData.outboundSlips.filter(t => isWithinFilter(t.created_at));

  const metrics = {
    inbound: filteredTx.filter(t => t.trx_type === 'Nhập').length,
    outbound: filteredTx.filter(t => t.trx_type === 'Xuất').length,
    transfer: filteredTx.filter(t => t.trx_type === 'Điều chuyển').length,
    materialRequest: filteredOutbound.length
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')} ${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`;
  };

  const renderTransaction = (item: any, index: number) => {
    let icon = <ArrowLeftRight size={20} color="#64748b" />;
    let bgColor = '#f1f5f9';
    let color = '#64748b';

    if (item.trx_type === 'Nhập') {
      icon = <PackageCheck size={20} color="#16a34a" />;
      bgColor = '#dcfce7';
      color = '#16a34a';
    } else if (item.trx_type === 'Xuất') {
      icon = <PackageOpen size={20} color="#ea580c" />;
      bgColor = '#ffedd5';
      color = '#ea580c';
    } else if (item.trx_type === 'Điều chuyển') {
      icon = <ArrowLeftRight size={20} color="#3b82f6" />;
      bgColor = '#dbeafe';
      color = '#3b82f6';
    }

    return (
      <View key={item.id || index} style={styles.txItem}>
        <View style={[styles.txIcon, { backgroundColor: bgColor }]}>
          {icon}
        </View>
        <View style={styles.txBody}>
          <View style={styles.txHeader}>
            <Text style={styles.txTitle}>{item.product_name || item.product_code}</Text>
            <Text style={[styles.txQty, { color }]}>
              {item.trx_type === 'Xuất' ? '-' : '+'}{item.quantity}
            </Text>
          </View>
          <View style={styles.txFooter}>
            <Text style={styles.txCode}>{item.ref_code || item.trx_type}</Text>
            <Text style={styles.txDate}>{formatDate(item.created_at)}</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.wrapper, { paddingTop: Math.max(insets.top, 0) }]}>
      <AppHeader />
      <ScrollView 
        style={styles.container}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadData} />}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        <View style={styles.headerRow}>
          <Text style={styles.sectionTitle}>Tổng quan Kho vận</Text>
        </View>
        
        {/* Lọc ngày */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterContainer}>
          <TouchableOpacity style={[styles.filterChip, filter === 'all' && styles.filterActive]} onPress={() => setFilter('all')}>
            <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>Tất cả</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.filterChip, filter === 'today' && styles.filterActive]} onPress={() => setFilter('today')}>
            <Text style={[styles.filterText, filter === 'today' && styles.filterTextActive]}>Hôm nay</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.filterChip, filter === 'week' && styles.filterActive]} onPress={() => setFilter('week')}>
            <Text style={[styles.filterText, filter === 'week' && styles.filterTextActive]}>7 ngày qua</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.filterChip, filter === 'month' && styles.filterActive]} onPress={() => setFilter('month')}>
            <Text style={[styles.filterText, filter === 'month' && styles.filterTextActive]}>Tháng này</Text>
          </TouchableOpacity>
        </ScrollView>

        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <StatCard 
              title="Nhập kho" 
              value={metrics.inbound.toString()} 
              subtitle="Giao dịch nhập" 
              icon={PackageCheck} 
              color="#22c55e" 
            />
          </View>
          <View style={{ flex: 1 }}>
            <StatCard 
              title="Xuất kho" 
              value={metrics.outbound.toString()} 
              subtitle="Giao dịch xuất" 
              icon={PackageOpen} 
              color="#f97316" 
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <StatCard 
              title="Điều chuyển" 
              value={metrics.transfer.toString()} 
              subtitle="Giao dịch chuyển" 
              icon={ArrowLeftRight} 
              color="#3b82f6" 
            />
          </View>
          <TouchableOpacity style={{ flex: 1 }} onPress={() => navigation.navigate('OutboundApproval')}>
            <StatCard 
              title="Yêu cầu NVL" 
              value={metrics.materialRequest.toString()} 
              subtitle="Chờ duyệt xuất" 
              icon={ClipboardCheck} 
              color="#8b5cf6" 
            />
          </TouchableOpacity>
        </View>

        <View style={styles.historySection}>
          <View style={styles.historyHeader}>
            <History size={20} color="#475569" />
            <Text style={styles.historyTitle}>Lịch sử dòng kho</Text>
          </View>
          
          <Card variant="elevated" style={styles.historyCard}>
            {filteredTx.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyText}>Không có giao dịch nào</Text>
              </View>
            ) : (
              filteredTx.slice(0, 15).map((item, index) => renderTransaction(item, index))
            )}
            
            {filteredTx.length > 15 && (
              <TouchableOpacity style={styles.viewMoreBtn}>
                <Text style={styles.viewMoreText}>Xem tất cả {filteredTx.length} giao dịch</Text>
              </TouchableOpacity>
            )}
          </Card>
        </View>

      </ScrollView>

      <TouchableOpacity 
        style={styles.fab}
        onPress={() => navigation.navigate('OutboundApproval')}
        activeOpacity={0.8}
      >
        <ClipboardCheck size={24} color="#fff" />
        <Text style={styles.fabText}>Duyệt yêu cầu</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  container: {
    flex: 1,
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  filterScroll: {
    marginBottom: 16,
  },
  filterContainer: {
    paddingRight: 16,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#e2e8f0',
  },
  filterActive: {
    backgroundColor: '#1d4ed8',
  },
  filterText: {
    fontSize: 14,
    color: '#475569',
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#ffffff',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    gap: 8,
  },
  historySection: {
    marginTop: 16,
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
  },
  historyCard: {
    padding: 0,
    overflow: 'hidden',
  },
  txItem: {
    flexDirection: 'row',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    alignItems: 'center',
    gap: 12,
  },
  txIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  txBody: {
    flex: 1,
  },
  txHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  txTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
    flex: 1,
  },
  txQty: {
    fontSize: 15,
    fontWeight: '700',
  },
  txFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  txCode: {
    fontSize: 13,
    color: '#64748b',
  },
  txDate: {
    fontSize: 13,
    color: '#94a3b8',
  },
  emptyBox: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    color: '#94a3b8',
    fontSize: 14,
  },
  viewMoreBtn: {
    padding: 12,
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  viewMoreText: {
    color: '#3b82f6',
    fontWeight: '600',
    fontSize: 14,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    backgroundColor: '#0ea5e9',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#0ea5e9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  fabText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
    marginLeft: 8,
  }
});
