import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Dimensions } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LineChart } from 'react-native-chart-kit';
import { BarChart2, Wallet, Factory, CalendarClock, Users, FileText } from 'lucide-react-native';
import { AppHeader } from '@/components/AppHeader';
import { Card } from '@/components/Card';
import { C, SectionTitle, Stat, StatRow, StateView, Row, Badge } from '@/components/ui';
import { reportsApi } from '@/api/reports';
import { num, money } from '@/utils/format';
import { shortDate, todayLocal } from '@/utils/date';
import { errMsg } from '@/utils/errors';

const W = Dimensions.get('window').width;

export function DirectorHome() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const [dash, setDash] = useState<any>(null);
  const [kpi, setKpi] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    setError(null);
    try {
      const [d, k] = await Promise.all([reportsApi.getDashboard(), reportsApi.getKpi().catch(() => null)]);
      setDash(d);
      setKpi(k);
    } catch (e) {
      setError(errMsg(e, 'Không tải được tổng quan.'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const trend: any[] = kpi?.charts?.trend || [];
  const fin = dash?.finance;
  const today = todayLocal();
  const busyMachines = (dash?.machines || []).filter((m: any) => m.current_task).length;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <AppHeader />
      <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />}>
        <StateView loading={loading} error={error} onRetry={() => load()} />
        {!loading && !error && dash && (
          <>
            <SectionTitle icon={<Factory size={18} color={C.blue} />} title="Sản xuất" />
            <StatRow>
              <Stat label="Đơn đang mở" value={num(dash.kpi?.open_orders)} tone="blue" />
              <Stat label="Lệnh đang chạy" value={num(dash.kpi?.po_active)} tone="green" />
            </StatRow>
            <StatRow>
              <Stat label="Lệnh hoàn thành" value={num(dash.kpi?.po_done)} />
              <Stat label="Máy đang chạy" value={`${busyMachines}/${(dash.machines || []).length}`} tone="amber" />
            </StatRow>

            {fin && (
              <>
                <SectionTitle icon={<Wallet size={18} color={C.blue} />} title="Tài chính" />
                <StatRow>
                  <Stat label="Doanh thu đã giao" value={money(fin.revenue)} tone="blue" />
                  <Stat label="Đã thu" value={money(fin.paid)} tone="green" />
                </StatRow>
                <StatRow>
                  <Stat label="Công nợ" value={money(fin.debt)} tone="red" sub={`${num(fin.unpaid_count)} phiếu chưa thu đủ`} />
                  <Stat label="Trả trước" value={money(fin.credit)} />
                </StatRow>
              </>
            )}

            {trend.length > 0 && (
              <>
                <SectionTitle icon={<BarChart2 size={18} color={C.blue} />} title="Kế hoạch vs Thực tế (7 ngày)" />
                <Card variant="elevated" style={{ paddingHorizontal: 4 }}>
                  <LineChart
                    data={{
                      labels: trend.map((t) => shortDate(t.date)),
                      datasets: [
                        { data: trend.map((t) => Number(t.actual_qty) || 0), color: (o = 1) => `rgba(29,78,216,${o})`, strokeWidth: 2 },
                        { data: trend.map((t) => Number(t.plan_qty) || 0), color: (o = 1) => `rgba(217,119,6,${o})`, strokeWidth: 2 },
                      ],
                      legend: ['Thực tế', 'Kế hoạch'],
                    }}
                    width={W - 40}
                    height={200}
                    fromZero
                    chartConfig={{
                      backgroundGradientFrom: '#fff', backgroundGradientTo: '#fff', decimalPlaces: 0,
                      color: (o = 1) => `rgba(148,163,184,${o})`, labelColor: (o = 1) => `rgba(100,116,139,${o})`,
                      propsForDots: { r: '3' },
                    }}
                    style={{ borderRadius: 8 }}
                  />
                </Card>
              </>
            )}

            <SectionTitle icon={<Factory size={18} color={C.blue} />} title={`Lệnh đang sản xuất (${(dash.in_progress || []).length})`} />
            <Card variant="outlined">
              {(dash.in_progress || []).slice(0, 6).map((o: any) => (
                <Row key={o.id} label={`${o.order_code} · ${o.product_name}${o.customer_name ? ` · ${o.customer_name}` : ''}`}
                  value={`${num(o.produced_qty, 1)}/${num(o.quantity, 1)} ${o.unit || ''}`} />
              ))}
              {!(dash.in_progress || []).length && <Text style={styles.empty}>Không có lệnh đang chạy.</Text>}
            </Card>

            <SectionTitle icon={<CalendarClock size={18} color={C.blue} />} title={`Đơn trễ / sắp đến hạn (${(dash.due_soon || []).length})`} />
            <Card variant="outlined">
              {(dash.due_soon || []).slice(0, 6).map((o: any) => {
                const late = o.due_date && String(o.due_date).slice(0, 10) < today;
                return (
                  <View key={o.id} style={styles.dueRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.dueCode}>{o.order_code}</Text>
                      <Text style={styles.dueSub} numberOfLines={1}>{o.customer_name || '—'} · {o.status}</Text>
                    </View>
                    <Badge text={`${late ? 'Trễ' : 'Hạn'} · ${shortDate(o.due_date)}`} tone={late ? 'red' : 'amber'} />
                  </View>
                );
              })}
              {!(dash.due_soon || []).length && <Text style={styles.empty}>Không có đơn sắp đến hạn.</Text>}
            </Card>

            <View style={styles.links}>
              <TouchableOpacity style={styles.linkBtn} onPress={() => navigation.navigate('Reports')}>
                <FileText color={C.blue} size={20} /><Text style={styles.linkText}>Báo cáo</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.linkBtn} onPress={() => navigation.navigate('Performance')}>
                <Users color={C.blue} size={20} /><Text style={styles.linkText}>Hiệu suất NV</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  content: { padding: 16 },
  empty: { color: C.muted, textAlign: 'center', paddingVertical: 8 },
  dueRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', gap: 8 },
  dueCode: { fontSize: 14, fontWeight: '700', color: C.text },
  dueSub: { fontSize: 12, color: C.sub, marginTop: 2 },
  links: { flexDirection: 'row', gap: 8, marginTop: 16 },
  linkBtn: { flex: 1, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: C.blueBg, borderRadius: 12, paddingVertical: 14 },
  linkText: { color: C.blue, fontWeight: '700' },
});
