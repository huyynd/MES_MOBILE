import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Text, TouchableOpacity, ActivityIndicator, RefreshControl, Modal, Pressable } from 'react-native';
import { 
  Filter, Calendar, Users, FileText, 
  AlertTriangle, TrendingUp, TrendingDown,
  ChevronDown, X, Check
} from 'lucide-react-native';
import { Card } from '@/components/Card';
import { reportsApi } from '@/api/reports';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const getWeekStart = () => {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff)).toISOString().slice(0, 10);
};

const getMonthStart = () => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
};

const getToday = () => new Date().toISOString().slice(0, 10);

const formatNum = (num: any) => Number(num || 0).toLocaleString('vi-VN');

const getScrapRatio = (scrap: any, actual: any) => {
  const s = Number(scrap) || 0;
  const a = Number(actual) || 0;
  if (a === 0) return '0%';
  const ratio = (s / a) * 100;
  return ratio.toFixed(2) + '%';
};

export function PerformanceDashboard() {
  const insets = useSafeAreaInsets();
  const [workers, setWorkers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [showFilter, setShowFilter] = useState(false);
  const [timeRange, setTimeRange] = useState<'week'|'month'>('week');

  const [fromDate, setFromDate] = useState(getWeekStart());
  const [toDate, setToDate] = useState(getToday());

  const handleTimeRangeChange = (range: 'week'|'month') => {
    setTimeRange(range);
    if (range === 'week') {
      setFromDate(getWeekStart());
    } else {
      setFromDate(getMonthStart());
    }
    setToDate(getToday());
    setShowFilter(false);
  };

  const fetchWorkers = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      // Pass fromDate and toDate just like the web version
      const data = await reportsApi.getEmployees({ fromDate, toDate });
      setWorkers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.log('Error fetching workers', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchWorkers();
  }, [fromDate, toDate]);

  const onRefresh = () => {
    fetchWorkers(true);
  };

  // Calculations
  const totalWorkers = workers.length;
  const totalTasks = workers.reduce((sum, w) => sum + (Number(w.tasks_count) || 0), 0);
  const totalActual = workers.reduce((sum, w) => sum + (Number(w.actual_qty) || 0), 0);
  const totalScrap = workers.reduce((sum, w) => sum + (Number(w.scrap_qty) || 0), 0);

  const activeWorkers = workers.filter(w => Number(w.actual_qty) > 0);
  
  // Top 5 most scrap
  const mostScrap = [...activeWorkers]
    .filter(w => Number(w.scrap_qty) > 0)
    .sort((a, b) => Number(b.scrap_qty) - Number(a.scrap_qty))
    .slice(0, 5);

  // Top 5 least scrap
  const leastScrap = [...activeWorkers]
    .sort((a, b) => Number(a.scrap_qty) - Number(b.scrap_qty))
    .slice(0, 5);

  const formatDateLabel = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { height: 60 + insets.top, paddingTop: insets.top }]}>
        <Text style={styles.headerTitle}>Hiệu suất nhân viên</Text>
        <TouchableOpacity style={styles.filterBtn} onPress={() => setShowFilter(true)}>
          <Filter size={20} color="#1d4ed8" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={{ padding: 16 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1d4ed8']} />
        }
      >
        
        {/* Filters Summary */}
        <View style={styles.filterSummary}>
          <View style={styles.filterPill}>
            <Calendar size={14} color="#64748b" />
            <Text style={styles.filterPillText}>{formatDateLabel(fromDate)} - {formatDateLabel(toDate)}</Text>
          </View>
          <View style={styles.filterPill}>
            <Text style={styles.filterPillText}>Tất cả nhà máy</Text>
            <ChevronDown size={14} color="#64748b" />
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1d4ed8" />
            <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
          </View>
        ) : (
          <>
            {/* General Report */}
            <Card variant="elevated" style={styles.reportCard}>
              <View style={styles.reportIconBox}>
                <Users size={24} color="#4f46e5" />
              </View>
              <Text style={styles.reportTitle}>Báo cáo chung</Text>
              <Text style={styles.reportSubtitle}>Hiệu suất tổng quan của nhân viên</Text>
              
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Users size={16} color="#475569" />
                  <Text style={styles.statValue}>{formatNum(totalWorkers)}</Text>
                  <Text style={styles.statLabel}>Nhân viên</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <FileText size={16} color="#d97706" />
                  <Text style={styles.statValue}>{formatNum(totalTasks)}</Text>
                  <Text style={styles.statLabel}>Lệnh</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <TrendingUp size={16} color="#16a34a" />
                  <Text style={styles.statValue}>{formatNum(totalActual)}</Text>
                  <Text style={styles.statLabel}>TT</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <AlertTriangle size={16} color="#ef4444" />
                  <Text style={styles.statValue}>{formatNum(totalScrap)}</Text>
                  <Text style={styles.statLabel}>Phế</Text>
                </View>
              </View>
            </Card>

            {/* Top 5 Most Defective */}
            <Card variant="elevated" style={[styles.topCard, { borderColor: '#fee2e2', borderWidth: 1 }]}>
              <View style={styles.topCardHeader}>
                <AlertTriangle size={18} color="#ef4444" />
                <Text style={[styles.topCardTitle, { color: '#ef4444' }]}>Top 5 Nhiều phế phẩm nhất</Text>
              </View>
              {mostScrap.length > 0 ? (
                <View style={styles.topList}>
                  {mostScrap.map((w, i) => (
                    <View key={w.worker} style={styles.topListItem}>
                      <View style={styles.topListLeft}>
                        <Text style={styles.rankText}>{i + 1}</Text>
                        <View style={[styles.avatarSmall, { backgroundColor: '#ffe4e6' }]}>
                          <Text style={[styles.avatarText, { color: '#e11d48' }]}>{w.worker?.[0]?.toUpperCase()}</Text>
                        </View>
                        <View>
                          <Text style={styles.topName}>{w.worker}</Text>
                          <Text style={styles.topSub}>{w.team || w.stages || '—'}</Text>
                        </View>
                      </View>
                      <View style={styles.topListRight}>
                        <Text style={[styles.topValue, { color: '#e11d48' }]}>{formatNum(w.scrap_qty)} phế</Text>
                        <Text style={styles.topSubRight}>{getScrapRatio(w.scrap_qty, w.actual_qty)}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>Không có dữ liệu phế phẩm</Text>
                </View>
              )}
            </Card>

            {/* Top 5 Least Defective */}
            <Card variant="elevated" style={[styles.topCard, { borderColor: '#dcfce7', borderWidth: 1 }]}>
              <View style={styles.topCardHeader}>
                <TrendingDown size={18} color="#16a34a" />
                <Text style={[styles.topCardTitle, { color: '#16a34a' }]}>Top 5 Ít phế phẩm nhất</Text>
              </View>
              {leastScrap.length > 0 ? (
                <View style={styles.topList}>
                  {leastScrap.map((w, i) => (
                    <View key={w.worker} style={styles.topListItem}>
                      <View style={styles.topListLeft}>
                        <Text style={styles.rankText}>{i + 1}</Text>
                        <View style={[styles.avatarSmall, { backgroundColor: '#dcfce7' }]}>
                          <Text style={[styles.avatarText, { color: '#15803d' }]}>{w.worker?.[0]?.toUpperCase()}</Text>
                        </View>
                        <View>
                          <Text style={styles.topName}>{w.worker}</Text>
                          <Text style={styles.topSub}>{w.team || w.stages || '—'}</Text>
                        </View>
                      </View>
                      <View style={styles.topListRight}>
                        <Text style={[styles.topValue, { color: '#15803d' }]}>{formatNum(w.scrap_qty)} phế</Text>
                        <Text style={styles.topSubRight}>{getScrapRatio(w.scrap_qty, w.actual_qty)}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>Không có dữ liệu sản xuất</Text>
                </View>
              )}
            </Card>

            {/* Defect Rate List */}
            <View style={styles.listSection}>
              <Text style={styles.listSectionTitle}>Danh sách Tỷ lệ Phế / 1kg thành phẩm</Text>
              
              <Card variant="elevated" style={styles.listCard}>
                <View style={styles.listHeader}>
                  <Text style={[styles.listCol, { flex: 2 }]}>Nhân viên</Text>
                  <Text style={[styles.listCol, { flex: 1.5, textAlign: 'right' }]}>Thành phẩm</Text>
                  <Text style={[styles.listCol, { flex: 1.5, textAlign: 'right' }]}>Phế phẩm</Text>
                  <Text style={[styles.listCol, { flex: 1, textAlign: 'right' }]}>Tỷ lệ</Text>
                </View>
                
                {workers.length > 0 ? (
                  workers.map((w, i) => (
                    <View key={w.worker} style={[styles.listItem, i === workers.length - 1 && { borderBottomWidth: 0 }]}>
                      <View style={{ flex: 2 }}>
                        <Text style={styles.itemName} numberOfLines={1}>{w.worker}</Text>
                        <Text style={styles.itemSub} numberOfLines={1}>{w.team || w.stages || '—'}</Text>
                      </View>
                      <Text style={[styles.itemValue, { flex: 1.5, textAlign: 'right' }]}>{formatNum(w.actual_qty)}</Text>
                      <Text style={[styles.itemValue, { flex: 1.5, textAlign: 'right' }]}>{formatNum(w.scrap_qty)}</Text>
                      <Text style={[styles.itemRate, { flex: 1, textAlign: 'right' }]}>{getScrapRatio(w.scrap_qty, w.actual_qty)}</Text>
                    </View>
                  ))
                ) : (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyStateText}>Không có dữ liệu</Text>
                  </View>
                )}
              </Card>
            </View>
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Filter Modal */}
      <Modal
        visible={showFilter}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowFilter(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowFilter(false)}>
          <Pressable style={styles.modalContent} onPress={e => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Lọc dữ liệu</Text>
              <TouchableOpacity onPress={() => setShowFilter(false)} style={styles.closeBtn}>
                <X size={20} color="#64748b" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.filterLabel}>Thời gian</Text>
            <TouchableOpacity 
              style={[styles.filterOption, timeRange === 'week' && styles.filterOptionActive]}
              onPress={() => handleTimeRangeChange('week')}
            >
              <Text style={[styles.filterOptionText, timeRange === 'week' && styles.filterOptionTextActive]}>Tuần này</Text>
              {timeRange === 'week' && <Check size={18} color="#1d4ed8" />}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.filterOption, timeRange === 'month' && styles.filterOptionActive]}
              onPress={() => handleTimeRangeChange('month')}
            >
              <Text style={[styles.filterOptionText, timeRange === 'month' && styles.filterOptionTextActive]}>Tháng này</Text>
              {timeRange === 'month' && <Check size={18} color="#1d4ed8" />}
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  filterBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  content: {
    flex: 1,
  },
  filterSummary: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 8,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 6,
  },
  filterPillText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '500',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748b',
  },
  reportCard: {
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    borderRadius: 16,
  },
  reportIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e0e7ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
  },
  reportSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 12,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 4,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: '#64748b',
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#e2e8f0',
  },
  topCard: {
    padding: 16,
    marginBottom: 16,
    borderRadius: 12,
  },
  topCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  topCardTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  topList: {
    gap: 12,
  },
  topListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topListLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  rankText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94a3b8',
    width: 16,
  },
  avatarSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 12,
    fontWeight: '700',
  },
  topName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0f172a',
  },
  topSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  topListRight: {
    alignItems: 'flex-end',
  },
  topValue: {
    fontSize: 13,
    fontWeight: '700',
  },
  topSubRight: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  emptyState: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 13,
    color: '#94a3b8',
    fontStyle: 'italic',
  },
  listSection: {
    marginTop: 8,
  },
  listSectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 12,
  },
  listCard: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  listHeader: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  listCol: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  itemName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0f172a',
  },
  itemSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  itemValue: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '500',
  },
  itemRate: {
    fontSize: 13,
    color: '#ef4444',
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  closeBtn: {
    padding: 4,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 12,
  },
  filterOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 12,
  },
  filterOptionActive: {
    borderColor: '#1d4ed8',
    backgroundColor: '#eff6ff',
  },
  filterOptionText: {
    fontSize: 15,
    color: '#334155',
    fontWeight: '500',
  },
  filterOptionTextActive: {
    color: '#1d4ed8',
    fontWeight: '600',
  }
});
