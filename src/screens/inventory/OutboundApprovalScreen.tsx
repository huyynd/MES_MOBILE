import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { ArrowLeft, Check, Ban, PackageOpen, ChevronDown, ChevronUp } from 'lucide-react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { inventoryApi } from '@/api/inventory';
import { formatNumber } from '@/utils/formatters';

export function OutboundApprovalScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [slips, setSlips] = useState<any[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [detailMap, setDetailMap] = useState<Record<string, any>>({});

  const loadSlips = useCallback(async () => {
    setLoading(true);
    try {
      const data = await inventoryApi.getOutboundSlips({ status: 'Chờ xuất' });
      setSlips(data || []);
    } catch (e: any) {
      Alert.alert('Lỗi', e.message || 'Không thể tải danh sách phiếu chờ xuất');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadSlips();
    }, [loadSlips])
  );

  const toggleExpand = async (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(id);
    if (!detailMap[id]) {
      try {
        const detail = await inventoryApi.getOutboundSlip(id);
        setDetailMap(prev => ({ ...prev, [id]: detail }));
      } catch (e: any) {
        Alert.alert('Lỗi', e.message || 'Không thể tải chi tiết phiếu');
      }
    }
  };

  const confirmSlip = (slip: any) => {
    Alert.alert(
      'Xác nhận',
      `Xác nhận xuất kho phiếu ${slip.slip_code}?\nThao tác này sẽ TRỪ TỒN KHO.`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xác nhận',
          style: 'destructive',
          onPress: async () => {
            setBusy(true);
            try {
              const res = await inventoryApi.confirmOutboundSlip(slip.id);
              Alert.alert('Thành công', res.message || 'Đã xuất kho thành công.');
              setExpandedId(null);
              loadSlips();
            } catch (e: any) {
              Alert.alert('Lỗi xác nhận', e.response?.data?.message || e.message || 'Có lỗi xảy ra');
            } finally {
              setBusy(false);
            }
          }
        }
      ]
    );
  };

  const cancelSlip = (slip: any) => {
    Alert.alert(
      'Hủy phiếu',
      `Bạn có chắc chắn muốn hủy phiếu ${slip.slip_code}?\nLệnh sản xuất nguồn sẽ được mở khóa để yêu cầu lại.`,
      [
        { text: 'Đóng', style: 'cancel' },
        {
          text: 'Hủy phiếu',
          style: 'destructive',
          onPress: async () => {
            setBusy(true);
            try {
              const res = await inventoryApi.cancelOutboundSlip(slip.id);
              Alert.alert('Thành công', res.message || 'Đã hủy phiếu.');
              setExpandedId(null);
              loadSlips();
            } catch (e: any) {
              Alert.alert('Lỗi hủy', e.response?.data?.message || e.message || 'Có lỗi xảy ra');
            } finally {
              setBusy(false);
            }
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={[styles.headerBar, { height: 60 + insets.top, paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Phê duyệt phiếu xuất</Text>
        <View style={{ width: 40 }} />
      </View>

      {busy && (
        <View style={styles.overlay}>
          <ActivityIndicator size="large" color="#0ea5e9" />
          <Text style={styles.overlayText}>Đang xử lý...</Text>
        </View>
      )}

      <ScrollView 
        style={styles.content} 
        contentContainerStyle={styles.contentContainer}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadSlips} />}
      >
        {!loading && slips.length === 0 ? (
          <View style={styles.emptyState}>
            <PackageOpen size={64} color="#cbd5e1" />
            <Text style={styles.emptyText}>Không có phiếu nào chờ xuất.</Text>
          </View>
        ) : (
          slips.map(slip => {
            const isExpanded = expandedId === slip.id;
            const detail = detailMap[slip.id];

            return (
              <View key={slip.id} style={styles.card}>
                <TouchableOpacity 
                  style={styles.cardHeader} 
                  activeOpacity={0.7}
                  onPress={() => toggleExpand(slip.id)}
                >
                  <View style={styles.cardHeaderContent}>
                    <View style={styles.titleRow}>
                      <Text style={styles.slipCode}>{slip.slip_code}</Text>
                      <Text style={styles.purposeText}>
                        {slip.prod_order_code ? `Lệnh ${slip.prod_order_code}` : (slip.purpose || "")}
                      </Text>
                    </View>
                    <Text style={styles.subInfoText}>
                      {slip.warehouse_name ? `${slip.warehouse_name}${slip.location_name ? " · " + slip.location_name : ""} · ` : ""}
                      {slip.line_count} dòng · tổng {formatNumber(slip.total_qty || 0)}
                    </Text>
                  </View>
                  <View style={styles.expandIcon}>
                    {isExpanded ? <ChevronUp size={20} color="#64748b" /> : <ChevronDown size={20} color="#64748b" />}
                  </View>
                </TouchableOpacity>

                {isExpanded && (
                  <View style={styles.detailSection}>
                    {!detail ? (
                      <ActivityIndicator size="small" color="#94a3b8" style={{ padding: 12 }} />
                    ) : (
                      <>
                        <View style={styles.linesContainer}>
                          {(detail.lines || []).map((l: any) => {
                            const isShort = Number(l.quantity) > Number(l.on_hand);
                            return (
                              <View key={l.id} style={[styles.lineItem, isShort && styles.lineItemShort]}>
                                <Text style={styles.lineProductName}>
                                  <Text style={styles.lineProductCode}>{l.product_code}</Text> · {l.product_name}
                                </Text>
                                <View style={styles.lineDetailRow}>
                                  <View style={styles.lineInfoCol}>
                                    <Text style={styles.lineInfoLabel}>Tồn kho</Text>
                                    <Text style={[styles.lineInfoValue, isShort && styles.textError]}>
                                      {formatNumber(l.on_hand)}
                                      {isShort && <Text style={styles.shortNote}> (thiếu {formatNumber(Number(l.quantity) - Number(l.on_hand))})</Text>}
                                    </Text>
                                  </View>
                                  <View style={styles.lineInfoCol}>
                                    <Text style={styles.lineInfoLabel}>Xuất</Text>
                                    <Text style={styles.lineExportQty}>-{formatNumber(l.quantity)} <Text style={styles.lineUnit}>{l.unit}</Text></Text>
                                  </View>
                                </View>
                                {!!l.note && <Text style={styles.lineNote}>{l.note}</Text>}
                              </View>
                            );
                          })}
                        </View>
                        
                        <View style={styles.actionRow}>
                          <TouchableOpacity 
                            style={styles.cancelBtn} 
                            disabled={busy} 
                            onPress={() => cancelSlip(slip)}
                          >
                            <Ban size={18} color="#ef4444" />
                            <Text style={styles.cancelBtnText}>Hủy</Text>
                          </TouchableOpacity>
                          <TouchableOpacity 
                            style={styles.confirmBtn} 
                            disabled={busy} 
                            onPress={() => confirmSlip(slip)}
                          >
                            <Check size={18} color="#fff" />
                            <Text style={styles.confirmBtnText}>Xác nhận xuất</Text>
                          </TouchableOpacity>
                        </View>
                      </>
                    )}
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  headerBar: {
    height: 60, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0',
    zIndex: 10
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
  content: { flex: 1 },
  contentContainer: { padding: 16, paddingBottom: 32 },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyText: { marginTop: 12, fontSize: 15, color: '#94a3b8', fontWeight: '500' },
  card: {
    backgroundColor: '#fff', borderRadius: 12, marginBottom: 12,
    borderWidth: 1, borderColor: '#e2e8f0', overflow: 'hidden'
  },
  cardHeader: {
    flexDirection: 'row', padding: 16, alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#fff'
  },
  cardHeaderContent: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  slipCode: { fontSize: 16, fontWeight: '700', color: '#1e293b', marginRight: 8 },
  purposeText: { fontSize: 12, color: '#64748b', backgroundColor: '#f1f5f9', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
  subInfoText: { fontSize: 13, color: '#64748b' },
  expandIcon: { padding: 4, marginLeft: 8 },
  detailSection: {
    borderTopWidth: 1, borderTopColor: '#f1f5f9', backgroundColor: '#f8fafc'
  },
  linesContainer: {
    padding: 12,
  },
  lineItem: {
    backgroundColor: '#fff', padding: 12, borderRadius: 8, marginBottom: 8,
    borderWidth: 1, borderColor: '#e2e8f0'
  },
  lineItemShort: {
    borderColor: '#fca5a5', backgroundColor: '#fef2f2'
  },
  lineProductName: { fontSize: 14, fontWeight: '500', color: '#334155', marginBottom: 8 },
  lineProductCode: { color: '#0284c7', fontWeight: '700' },
  lineDetailRow: { flexDirection: 'row', justifyContent: 'space-between' },
  lineInfoCol: { flex: 1 },
  lineInfoLabel: { fontSize: 11, color: '#64748b', marginBottom: 2, textTransform: 'uppercase', fontWeight: '600' },
  lineInfoValue: { fontSize: 14, color: '#1e293b', fontWeight: '600' },
  textError: { color: '#ef4444' },
  shortNote: { fontSize: 11, fontWeight: '400' },
  lineExportQty: { fontSize: 15, color: '#ef4444', fontWeight: '700' },
  lineUnit: { fontSize: 12, color: '#64748b', fontWeight: '500' },
  lineNote: { fontSize: 12, color: '#94a3b8', fontStyle: 'italic', marginTop: 8 },
  actionRow: {
    flexDirection: 'row', padding: 12, borderTopWidth: 1, borderTopColor: '#e2e8f0', gap: 12,
    backgroundColor: '#fff'
  },
  cancelBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 12, borderRadius: 8, borderWidth: 1, borderColor: '#fca5a5', backgroundColor: '#fef2f2'
  },
  cancelBtnText: { color: '#ef4444', fontWeight: '600', marginLeft: 8 },
  confirmBtn: {
    flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 12, borderRadius: 8, backgroundColor: '#10b981'
  },
  confirmBtnText: { color: '#fff', fontWeight: '600', marginLeft: 8 },
  overlay: {
    position: 'absolute', left: 0, right: 0, top: 0, bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.8)',
    zIndex: 100,
    justifyContent: 'center',
    alignItems: 'center'
  },
  overlayText: {
    marginTop: 12, color: '#0ea5e9', fontWeight: '600', fontSize: 15
  }
});
