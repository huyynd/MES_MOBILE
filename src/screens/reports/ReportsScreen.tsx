import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ShoppingCart, Factory, Users, Wallet, AlertTriangle, Cpu, Package, ChevronRight } from 'lucide-react-native';
import { AppHeader } from '@/components/AppHeader';
import { Card } from '@/components/Card';
import { C, SectionTitle, Stat, StatRow, StateView, Row, Segmented, Badge } from '@/components/ui';
import { reportsApi } from '@/api/reports';
import { num, money, pct } from '@/utils/format';
import { shortDate } from '@/utils/date';
import { errMsg } from '@/utils/errors';

type Tab = 'summary' | 'production' | 'debt' | 'stock';

// Tải dữ liệu 1 tab: trả về { data, loading, error, reload }. fetcher phải là hàm cố định (khai báo ngoài component).
function useReport<T, A = undefined>(fetcher: (arg: A) => Promise<T>, arg: A) {
  const [nonce, setNonce] = useState(0);
  const key = `${String(arg)}#${nonce}`;
  // Kết quả gắn với key đã tải → "đang tải" = key hiện tại chưa có kết quả (không setState đồng bộ trong effect)
  const [result, setResult] = useState<{ key: string; data: T | null; error: string | null } | null>(null);
  useEffect(() => {
    let alive = true;
    fetcher(arg)
      .then((data) => { if (alive) setResult({ key, data, error: null }); })
      .catch((e) => { if (alive) setResult({ key, data: null, error: errMsg(e, 'Không tải được báo cáo.') }); });
    return () => { alive = false; };
  }, [fetcher, arg, key]);
  const reload = useCallback(() => setNonce((n) => n + 1), []);
  const loading = result?.key !== key;
  return { data: loading ? null : result!.data, loading, error: loading ? null : result!.error, reload };
}

const fetchDirector = (p: 'week' | 'month') => reportsApi.getDirector(p);
const fetchKpi = () => reportsApi.getKpi();
const fetchMachines = () => reportsApi.getMachines();
const fetchReceivables = () => reportsApi.getReceivables();

function Summary() {
  const [period, setPeriod] = useState<'week' | 'month'>('month');
  const r = useReport<any, 'week' | 'month'>(fetchDirector, period);
  const d = r.data;
  const s = d?.sales, p = d?.production, w = d?.workforce, rc = d?.receivables;
  return (
    <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={false} onRefresh={r.reload} />}>
      <Segmented options={[{ key: 'week', label: 'Tuần này' }, { key: 'month', label: 'Tháng này' }]} value={period} onChange={setPeriod} />
      <StateView loading={r.loading} error={r.error} onRetry={r.reload} />
      {!r.loading && !r.error && d && (
        <>
          <Text style={styles.period}>Từ {shortDate(d.from)} đến {shortDate(d.to)}{d.can_view_amounts ? '' : ' · (bạn không có quyền xem số tiền)'}</Text>

          <SectionTitle icon={<ShoppingCart size={18} color={C.blue} />} title="Bán hàng" />
          <StatRow>
            <Stat label="Đơn hàng" value={num(s?.order_count)} sub={`${num(s?.shipped_count)} đã giao · ${num(s?.fully_count)} giao đủ`} tone="blue" />
            <Stat label="Giá trị đơn" value={money(s?.total_value)} />
          </StatRow>
          <StatRow>
            <Stat label="Đã giao (tiền)" value={money(s?.delivered_value)} tone="green" />
            <Stat label="Chưa giao (tiền)" value={money(s?.undelivered_value)} tone="amber" />
          </StatRow>

          <SectionTitle icon={<Factory size={18} color={C.blue} />} title="Sản xuất" />
          {/* Cùng định nghĩa với web (Báo cáo giám đốc, 11/2026):
              - Thành phẩm = làm ra TRONG KỲ ở công đoạn cuối, kể cả lệnh tạo trước kỳ (actual)
              - Tiến độ / còn lại = theo các lệnh TẠO trong kỳ (progress, remaining)
              - Tỷ lệ phế = phế ÷ (thành phẩm + phế) */}
          <StatRow>
            <Stat label="SL thành phẩm" value={num(p?.output?.actual, 1)} sub="kg làm ra trong kỳ" tone="green" />
            <Stat label="Phế" value={num(p?.output?.scrap, 1)}
              sub={`tỷ lệ phế ${p?.output?.scrap_rate == null ? '—' : pct(p?.output?.scrap_rate)}`} tone="amber" />
          </StatRow>
          <Card variant="outlined">
            <Text style={styles.cardTitle}>Tiến độ lệnh tạo trong kỳ</Text>
            <Row label="Kế hoạch" value={`${num(p?.output?.plan, 1)} kg`} />
            <Row label="Đã làm" value={`${num(p?.output?.progress ?? p?.output?.actual, 1)} kg`} tone="green" />
            <Row label="Đạt" value={p?.output?.plan > 0 ? pct(((p?.output?.progress ?? p?.output?.actual) || 0) / p.output.plan * 100, 0) : '—'} />
            {p?.output?.over > 0
              ? <Row label="Vượt kế hoạch" value={`${num(p.output.over, 1)} kg`} tone="blue" />
              : <Row label="Còn lại" value={`${num(p?.output?.remaining, 1)} kg`} tone="amber" />}
          </Card>
          <Card variant="outlined">
            <Row label="Tổng lệnh" value={num(p?.orders?.total)} />
            <Row label="Hoàn thành" value={num(p?.orders?.done)} tone="green" />
            <Row label="Đang chạy" value={num(p?.orders?.running)} tone="blue" />
            <Row label="Chờ NVL" value={num(p?.orders?.wait_nvl)} tone="amber" />
            <Row label="Chưa bắt đầu" value={num(p?.orders?.not_started)} />
            <Row label="Trễ hạn" value={num(p?.orders?.overdue)} tone={p?.orders?.overdue ? 'red' : undefined} />
          </Card>

          {(p?.shortages || []).length > 0 && (
            <>
              <SectionTitle icon={<AlertTriangle size={18} color={C.red} />} title={`Thiếu nguyên vật liệu (${p.shortages.length})`} />
              <Card variant="outlined">
                {p.shortages.slice(0, 8).map((x: any) => (
                  <Row key={x.code} label={`${x.code} · ${x.name}`} value={`thiếu ${num(x.short, 1)} ${x.unit || ''}`} tone="red" />
                ))}
              </Card>
            </>
          )}
          {(p?.low_stock || []).length > 0 && (
            <>
              <SectionTitle icon={<Package size={18} color={C.amber} />} title={`Tồn kho thấp (${p.low_stock.length})`} />
              <Card variant="outlined">
                {p.low_stock.slice(0, 8).map((x: any, i: number) => (
                  <Row key={x.code || i} label={`${x.code || ''} ${x.name || ''}`} value={`${num(x.on_hand, 1)} / tối thiểu ${num(x.min_qty, 1)} ${x.unit || ''}`} tone="amber" />
                ))}
              </Card>
            </>
          )}

          <SectionTitle icon={<Users size={18} color={C.blue} />} title="Nhân sự" />
          <StatRow>
            <Stat label="Đi làm" value={`${num(w?.active_count)}/${num(w?.worker_count)}`} sub="công nhân có sản lượng" tone="blue" />
            <Stat label="Sản lượng" value={num(w?.total_output, 1)} sub={`${num(w?.avg_per_hour, 1)} kg/giờ TB`} tone="green" />
          </StatRow>
          <StatRow>
            <Stat label="Phế / 1 kg TP (TB)" value={w?.scrap_ratio == null ? '—' : num(w.scrap_ratio, 3)} sub="kg phế ÷ kg thành phẩm" tone="amber" />
            <Stat label="Tổng phế" value={num(w?.total_scrap, 1)} sub="kg" />
          </StatRow>
          {(w?.top || []).length > 0 && (
            <Card variant="outlined">
              <Text style={styles.cardTitle}>Năng suất cao nhất</Text>
              {w.top.map((t: any, i: number) => <Row key={t.worker} label={`${i + 1}. ${t.worker}`} value={`${num(t.per_hour, 1)} kg/giờ`} />)}
            </Card>
          )}

          <SectionTitle icon={<Wallet size={18} color={C.blue} />} title="Công nợ" />
          <StatRow>
            <Stat label="Tổng nợ" value={money(rc?.total_debt)} sub={`${num(rc?.customer_count)} khách`} tone="red" />
            <Stat label={`Quá ${num(rc?.overdue_days)} ngày`} value={money(rc?.overdue_amount)} sub={`${num(rc?.bad_count)} khách nợ xấu`} tone="amber" />
          </StatRow>
          <StatRow>
            <Stat label="Đã thu (kỳ)" value={money(s?.collected)} tone="green" />
            <Stat label="Còn nợ (kỳ)" value={money(s?.debt)} />
          </StatRow>
        </>
      )}
      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

function Production() {
  const kpi = useReport<any>(fetchKpi, undefined);
  const mc = useReport<any>(fetchMachines, undefined);
  const reload = () => { kpi.reload(); mc.reload(); };
  const k = kpi.data?.kpi;
  const machines: any[] = mc.data?.machine_stats || [];
  return (
    <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={false} onRefresh={reload} />}>
      <StateView loading={kpi.loading} error={kpi.error} onRetry={kpi.reload} />
      {k && (
        <>
          <SectionTitle icon={<Factory size={18} color={C.blue} />} title="KPI sản xuất" />
          <StatRow>
            <Stat label="Tổng lệnh" value={num(k.total_production_orders)} />
            <Stat label="Đang chạy" value={num(k.active_production_orders)} tone="green" />
          </StatRow>
          <StatRow>
            <Stat label="Máy hoạt động" value={num(k.active_machines)} tone="blue" />
            {/* Backend mới: tồn theo từng đơn vị (inventory_by_unit); bản cũ: 1 tổng total_inventory_items */}
            <Stat label="Tồn kho"
              value={Array.isArray(k.inventory_by_unit) && k.inventory_by_unit.length
                ? `${num(k.inventory_by_unit[0].qty)} ${k.inventory_by_unit[0].unit || ''}` : num(k.total_inventory_items)}
              sub={Array.isArray(k.inventory_by_unit) && k.inventory_by_unit.length > 1
                ? k.inventory_by_unit.slice(1).map((x: any) => `${num(x.qty)} ${x.unit || ''}`).join(' · ') : 'tổng số lượng'} />
          </StatRow>
          {(kpi.data?.charts?.trend || []).length > 0 && (
            <Card variant="outlined">
              <Text style={styles.cardTitle}>7 ngày gần nhất (kế hoạch / thực tế)</Text>
              {kpi.data.charts.trend.map((t: any) => (
                <Row key={t.date} label={shortDate(t.date)} value={`${num(t.plan_qty, 1)} / ${num(t.actual_qty, 1)}`}
                  tone={Number(t.actual_qty) >= Number(t.plan_qty) ? 'green' : 'amber'} />
              ))}
            </Card>
          )}
        </>
      )}
      <SectionTitle icon={<Cpu size={18} color={C.blue} />} title={`Máy móc (${machines.length})`} />
      <StateView loading={mc.loading} error={mc.error} onRetry={mc.reload} empty={!mc.loading && !mc.error && !machines.length ? 'Chưa có dữ liệu máy.' : null} />
      {machines.map((m) => (
        <Card key={m.id} variant="outlined" style={styles.machine}>
          <View style={{ flex: 1 }}>
            <Text style={styles.mName}>{m.name} <Text style={styles.mSub}>· {m.factory || ''}</Text></Text>
            <Text style={styles.mSub}>Việc: {num(m.tasks_done)}/{num(m.tasks_total)} · Sản lượng {num(m.total_actual_qty, 1)}</Text>
          </View>
          <Badge text={m.status || '—'} tone={m.status === 'Hoạt động' ? 'green' : m.status === 'Bảo trì' ? 'red' : 'gray'} />
        </Card>
      ))}
      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

function Debt() {
  const r = useReport<any>(fetchReceivables, undefined);
  const rows: any[] = (r.data?.data || []).slice().sort((a: any, b: any) => Number(b.debt) - Number(a.debt));
  const total = rows.reduce((t, x) => t + (Number(x.debt) || 0), 0);
  const overdue = rows.reduce((t, x) => t + (Number(x.overdue_debt) || 0), 0);
  return (
    <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={false} onRefresh={r.reload} />}>
      <StateView loading={r.loading} error={r.error} onRetry={r.reload} empty={!r.loading && !r.error && !rows.length ? 'Không có công nợ.' : null} />
      {!r.loading && !r.error && rows.length > 0 && (
        <>
          <StatRow>
            <Stat label="Tổng còn nợ" value={money(total)} sub={`${rows.filter((x) => Number(x.debt) > 0).length} khách`} tone="red" />
            <Stat label={`Quá ${num(r.data?.settings?.bad_days)} ngày`} value={money(overdue)} tone="amber" />
          </StatRow>
          {rows.some((x) => Number(x.credit) > 0) && (
            <StatRow>
              <Stat label="Khách trả trước" value={money(rows.reduce((t, x) => t + (Number(x.credit) || 0), 0))}
                sub={`${rows.filter((x) => Number(x.credit) > 0).length} khách — tự trừ khi giao phiếu mới`} tone="green" />
            </StatRow>
          )}
          {rows.map((x) => (
            <Card key={x.customer_id} variant="outlined" style={styles.machine}>
              <View style={{ flex: 1 }}>
                <Text style={styles.mName} numberOfLines={1}>{x.customer_name}</Text>
                <Text style={styles.mSub}>Đã giao {money(x.billed)} · đã thu {money(x.paid)}{x.oldest_days ? ` · nợ lâu nhất ${num(x.oldest_days)} ngày` : ''}</Text>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 4 }}>
                <Text style={[styles.mName, { color: Number(x.debt) > 0 ? C.red : C.green }]}>{money(x.debt)}</Text>
                {Number(x.credit) > 0 ? <Text style={styles.mSub}>trả trước {money(x.credit)}</Text> : null}
                {x.is_bad ? <Badge text="Nợ xấu" tone="red" /> : x.over_limit ? <Badge text="Vượt hạn mức" tone="amber" /> : null}
              </View>
            </Card>
          ))}
        </>
      )}
      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

function Stock() {
  const navigation = useNavigation<any>();
  return (
    <View style={styles.content}>
      <TouchableOpacity onPress={() => navigation.navigate('WarehouseOverview')}>
        <Card variant="outlined" style={styles.machine}>
          <Package color={C.blue} size={22} />
          <View style={{ flex: 1 }}>
            <Text style={styles.mName}>Tổng quan kho</Text>
            <Text style={styles.mSub}>Giao dịch nhập/xuất gần đây, phiếu chờ xuất</Text>
          </View>
          <ChevronRight color={C.muted} size={18} />
        </Card>
      </TouchableOpacity>
    </View>
  );
}

export function ReportsScreen() {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<Tab>('summary');
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <AppHeader title="BÁO CÁO" />
      <View style={{ paddingHorizontal: 16 }}>
        <Segmented<Tab>
          options={[{ key: 'summary', label: 'Tổng hợp' }, { key: 'production', label: 'Sản xuất' }, { key: 'debt', label: 'Công nợ' }, { key: 'stock', label: 'Kho' }]}
          value={tab} onChange={setTab} />
      </View>
      {tab === 'summary' && <Summary />}
      {tab === 'production' && <Production />}
      {tab === 'debt' && <Debt />}
      {tab === 'stock' && <Stock />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  content: { padding: 16, paddingTop: 4 },
  period: { color: C.sub, fontSize: 12, marginTop: 4 },
  cardTitle: { fontSize: 13, fontWeight: '700', color: C.sub, marginBottom: 4 },
  machine: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 4 },
  mName: { fontSize: 14, fontWeight: '700', color: C.text },
  mSub: { fontSize: 12, color: C.sub, marginTop: 2, fontWeight: '400' },
});
