import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Clock, ClipboardList, Users, ChevronRight, CalendarOff } from 'lucide-react-native';
import { AppHeader } from '@/components/AppHeader';
import { Card } from '@/components/Card';
import { C, SectionTitle, Stat, StatRow, StateView, Badge } from '@/components/ui';
import { useAuthStore } from '@/store/authStore';
import { teamApi, TeamRoster } from '@/api/team';
import { productionApi } from '@/api/production';
import { reportsApi } from '@/api/reports';
import { ProductionTask } from '@/types/production';
import { todayLocal, shortDate } from '@/utils/date';
import { num } from '@/utils/format';
import { errMsg } from '@/utils/errors';
import { WHEN_BADGE } from '@/screens/home/WorkerHome';

/* Trang chủ tablet TỔ TRƯỞNG (chốt 2026-11-21): tổng quan HÔM NAY của cả tổ —
   ca làm việc, chấm công (ai đã vào / đang làm / đã ra / chưa chấm), sản xuất (việc, trễ hạn, sản lượng, phế). */

const hhmm = (iso: string) => new Date(iso).toLocaleTimeString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit', hour12: false });
const todayText = () => new Date().toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });

export function LeaderHome({ initial }: { initial?: TeamRoster | null }) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { user } = useAuthStore();
  const [team, setTeam] = useState<TeamRoster | null>(initial || null);
  const [tasks, setTasks] = useState<ProductionTask[]>([]);
  const [output, setOutput] = useState({ actual: 0, scrap: 0 });
  const [loading, setLoading] = useState(!initial);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    setError(null);
    const today = todayLocal();
    try {
      const [roster, open, report] = await Promise.all([
        teamApi.roster(),
        productionApi.getOpenTasks(today),
        reportsApi.getEmployees({ fromDate: today, toDate: today }).catch(() => []),
      ]);
      const ids = new Set(roster.employees.map((e) => e.id));
      const names = new Set(roster.employees.map((e) => e.name.trim().toLowerCase()));
      setTeam(roster);
      setTasks(open.filter((t) => t.when !== 'future' && ((t.assigned_worker_id && ids.has(t.assigned_worker_id))
        || (!t.assigned_worker_id && names.has(String(t.assigned_worker || '').trim().toLowerCase())))));
      const mine = (Array.isArray(report) ? report : []).filter((w: any) => ids.has(w.employee_id));
      setOutput({
        actual: mine.reduce((s: number, w: any) => s + (Number(w.actual_qty) || 0), 0),
        scrap: mine.reduce((s: number, w: any) => s + (Number(w.scrap_qty) || 0), 0),
      });
    } catch (e) {
      setError(errMsg(e, 'Không tải được tổng quan của tổ.'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const emps = team?.employees || [];
  const last = (e: (typeof emps)[number]) => e.today[e.today.length - 1];
  const working = emps.filter((e) => last(e)?.direction === 'IN');
  const left = emps.filter((e) => last(e)?.direction === 'OUT');
  const notYet = emps.filter((e) => !e.today.length);
  const overdue = tasks.filter((t) => t.when === 'overdue');
  const running = tasks.filter((t) => t.when === 'running');
  const highlight = [...overdue, ...running].slice(0, 6);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <AppHeader />
      <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />}>
        <Card variant="elevated">
          <Text style={styles.hello}>Xin chào, {user?.full_name || user?.username}</Text>
          <Text style={styles.unit}>Tổ trưởng {team?.unit_name || '…'} · {emps.length} công nhân</Text>
          <View style={styles.line}>
            <Clock size={14} color={C.sub} />
            <Text style={styles.sub}>
              {todayText()} · {team?.shift ? `${team.shift.name} (${team.shift.start}–${team.shift.end})` : 'Tổ chưa chọn ca làm việc'}
            </Text>
          </View>
          {team && team.work_today === false && (
            <View style={[styles.line, styles.offDay]}>
              <CalendarOff size={14} color={C.amber} />
              <Text style={[styles.sub, { color: '#92400e' }]}>Hôm nay là ngày nghỉ của tổ</Text>
            </View>
          )}
        </Card>

        {(loading || error) ? <StateView loading={loading} error={error} onRetry={() => load()} /> : (
          <>
            <SectionTitle icon={<Users size={18} color={C.blue} />} title="Chấm công hôm nay"
              right={<TouchableOpacity onPress={() => navigation.navigate('TeamAttendance')}><Text style={styles.link}>Chấm công →</Text></TouchableOpacity>} />
            <StatRow>
              <Stat label="Đang làm" value={num(working.length)} sub={`/${emps.length} người`} tone="green" />
              <Stat label="Đã ra" value={num(left.length)} sub="về trong ngày" tone="blue" />
              <Stat label="Chưa chấm" value={num(notYet.length)} sub="chưa vào ca" tone={notYet.length ? 'amber' : 'gray'} />
            </StatRow>
            {notYet.length > 0 && (
              <Card variant="outlined" style={styles.box}>
                <Text style={styles.boxTitle}>Chưa chấm công</Text>
                <Text style={styles.names}>{notYet.map((e) => e.name).join(' · ')}</Text>
              </Card>
            )}
            {working.length > 0 && (
              <Card variant="outlined" style={styles.box}>
                <Text style={styles.boxTitle}>Đang làm</Text>
                <Text style={styles.names}>{working.map((e) => `${e.name} (vào ${hhmm(e.today.find((p) => p.direction === 'IN')!.at)})`).join(' · ')}</Text>
              </Card>
            )}

            <SectionTitle icon={<ClipboardList size={18} color={C.blue} />} title="Sản xuất hôm nay của tổ"
              right={<TouchableOpacity onPress={() => navigation.navigate('WorkOrder')}><Text style={styles.link}>Công việc →</Text></TouchableOpacity>} />
            <StatRow>
              <Stat label="Việc hôm nay" value={num(tasks.length)} sub={`${running.length} đang làm`} tone="blue" />
              <Stat label="Trễ hạn" value={num(overdue.length)} sub="chưa xong" tone={overdue.length ? 'red' : 'gray'} />
            </StatRow>
            <StatRow>
              <Stat label="Sản lượng" value={num(output.actual, 1)} sub="cả tổ hôm nay" tone="green" />
              <Stat label="Phế" value={num(output.scrap, 1)} sub="cả tổ hôm nay" tone="amber" />
            </StatRow>

            {highlight.length > 0 && (
              <>
                <SectionTitle title="Cần chú ý (trễ hạn / đang làm)" />
                {highlight.map((t) => (
                  <TouchableOpacity key={t.task_id} onPress={() => navigation.navigate('WorkOrder', { screen: 'WorkOrderDetail', params: { task: t, actor: t.assigned_worker } })}>
                    <Card variant="outlined" style={styles.item}>
                      <View style={{ flex: 1 }}>
                        <View style={styles.taskHead}>
                          <Text style={styles.code}>{t.order_code} · {t.step_name}</Text>
                          <Badge {...WHEN_BADGE[t.when || 'today']} />
                        </View>
                        <Text style={styles.product} numberOfLines={1}>{t.product_name}</Text>
                        <Text style={styles.meta}>{t.assigned_worker || '—'} · {num((t.actual_qty || 0) + (t.roll_qty || 0), 2)} / {num(t.quantity, 2)} {t.unit} · KH {shortDate(t.planned_date)}</Text>
                      </View>
                      <ChevronRight color={C.muted} size={18} />
                    </Card>
                  </TouchableOpacity>
                ))}
              </>
            )}
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
  hello: { fontSize: 17, fontWeight: '700', color: C.text },
  unit: { fontSize: 14, fontWeight: '600', color: C.blue, marginTop: 4 },
  line: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  sub: { color: C.sub, fontSize: 13, flexShrink: 1, textTransform: 'none' },
  offDay: { backgroundColor: C.amberBg, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, alignSelf: 'flex-start' },
  link: { color: C.blue, fontWeight: '700', fontSize: 13 },
  box: { marginVertical: 4, gap: 4 },
  boxTitle: { fontSize: 13, fontWeight: '700', color: C.sub },
  names: { fontSize: 14, color: C.text, lineHeight: 21 },
  taskHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  code: { fontSize: 15, fontWeight: '800', color: C.blue, flexShrink: 1 },
  product: { fontSize: 14, color: C.text, marginTop: 4 },
  meta: { fontSize: 12, color: C.sub, marginTop: 4 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: 4 },
});
