import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ClipboardList, Clock, UserX, ChevronRight, Save } from 'lucide-react-native';
import { AppHeader } from '@/components/AppHeader';
import { Card } from '@/components/Card';
import { C, SectionTitle, Stat, StatRow, StateView, Badge } from '@/components/ui';
import { useAuthStore } from '@/store/authStore';
import { productionApi } from '@/api/production';
import { reportsApi } from '@/api/reports';
import { scheduleApi } from '@/api/schedule';
import { ProductionTask } from '@/types/production';
import { todayLocal, shortDate } from '@/utils/date';
import { num } from '@/utils/format';
import { errMsg } from '@/utils/errors';
import { workerNameOf } from '@/utils/roles';

export const WHEN_BADGE: Record<string, { text: string; tone: 'blue' | 'red' | 'green' | 'gray' | 'amber' }> = {
  running: { text: 'Đang làm', tone: 'blue' },
  overdue: { text: 'Trễ hạn', tone: 'red' },
  today: { text: 'Hôm nay', tone: 'green' },
  unplanned: { text: 'Chưa lên lịch', tone: 'gray' },
  future: { text: 'Sắp tới', tone: 'amber' },
};

export function WorkerHome() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { user } = useAuthStore();
  const workerName = workerNameOf(user);
  const employeeCode = user?.employee_code;

  const [tasks, setTasks] = useState<ProductionTask[]>([]);
  const [shift, setShift] = useState<any>(null);
  const [mine, setMine] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addQty, setAddQty] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (!workerName) { setLoading(false); return; }
    isRefresh ? setRefreshing(true) : setLoading(true);
    setError(null);
    const today = todayLocal();
    try {
      const [list, report] = await Promise.all([
        productionApi.getTodayTasksForWorker(workerName, today),
        reportsApi.getEmployees({ fromDate: today, toDate: today }).catch(() => []),
      ]);
      setTasks(list);
      setMine((Array.isArray(report) ? report : []).find((w: any) => w.worker === workerName) || null);
      scheduleApi.getTodayShiftForEmployee(employeeCode || workerName, today).then(setShift).catch(() => setShift(null));
    } catch (e) {
      setError(errMsg(e, 'Không tải được việc hôm nay.'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [workerName, employeeCode]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const active = tasks[0] || null; // đã xếp: đang làm → trễ → hôm nay → chưa lịch

  const saveQty = async () => {
    if (!active?.task_code) return;
    const add = Number(String(addQty).replace(',', '.'));
    if (!(add > 0)) return Alert.alert('Lỗi', 'Nhập số lượng lớn hơn 0.');
    setSaving(true);
    try {
      await productionApi.setActualQty(active.order_id, active.task_code, (active.actual_qty || 0) + add);
      setAddQty('');
      Alert.alert('Đã ghi nhận', `+${num(add, 2)} ${active.unit || ''} cho ${active.task_code}`);
      load(true);
    } catch (e) {
      Alert.alert('Lỗi', errMsg(e, 'Không ghi được sản lượng.'));
    } finally {
      setSaving(false);
    }
  };

  const shiftText = shift?.name
    ? `${shift.name}${shift.start_time ? ` (${String(shift.start_time).slice(0, 5)}–${String(shift.end_time || '').slice(0, 5)})` : ''}`
    : 'Chưa có lịch ca hôm nay';

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <AppHeader />
      <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />}>
        <Card variant="elevated">
          <Text style={styles.hello}>Xin chào, {user?.full_name || user?.username}</Text>
          <View style={styles.shiftRow}>
            <Clock size={14} color={C.sub} />
            <Text style={styles.shiftText}>{shiftText}</Text>
          </View>
          {workerName ? <Text style={styles.linked}>Công nhân: {workerName}</Text> : null}
        </Card>

        {!workerName ? (
          <Card variant="outlined" style={styles.warnCard}>
            <UserX size={28} color={C.amber} />
            <Text style={styles.warnTitle}>Tài khoản chưa được gắn với công nhân</Text>
            <Text style={styles.warnText}>
              Nhờ quản lý vào web MES → Tài khoản → chọn “Công nhân liên kết” cho tài khoản “{user?.username}”, rồi đăng nhập lại. Khi đó việc được giao sẽ hiện ở đây.
            </Text>
          </Card>
        ) : (
          <>
            <StatRow>
              <Stat label="Việc hôm nay" value={num(tasks.length)} sub={`${tasks.filter((t) => t.when === 'overdue').length} trễ hạn`} tone="blue" />
              <Stat label="Sản lượng" value={num(mine?.actual_qty ?? mine?.output ?? 0, 1)} sub="hoàn thành hôm nay" tone="green" />
              <Stat label="Phế" value={num(mine?.scrap_qty ?? mine?.scrap ?? 0, 1)} sub="hôm nay" tone="amber" />
            </StatRow>

            <StateView loading={loading} error={error} onRetry={() => load()} empty={!loading && !error && !tasks.length ? 'Hôm nay bạn chưa có việc nào được giao.' : null} />

            {!loading && !error && active && (
              <>
                <SectionTitle icon={<ClipboardList size={18} color={C.blue} />} title="Việc đang làm" />
                <Card variant="elevated">
                  <View style={styles.taskHead}>
                    <Text style={styles.code}>{active.order_code} · {active.step_name}</Text>
                    <Badge {...WHEN_BADGE[active.when || 'today']} />
                  </View>
                  <Text style={styles.product}>{active.product_name}</Text>
                  <Text style={styles.meta}>Máy: {active.machine_name || '—'} · Ca: {active.shift || '—'} · KH: {shortDate(active.planned_date)}</Text>
                  <Text style={styles.progress}>Đã làm {num(active.actual_qty, 2)} / {num(active.quantity, 2)} {active.unit}</Text>
                  <View style={styles.qtyRow}>
                    <TextInput style={styles.qtyInput} value={addQty} onChangeText={setAddQty} placeholder={`+ Số lượng (${active.unit || 'kg'})`} keyboardType="decimal-pad" />
                    <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.6 }]} onPress={saveQty} disabled={saving}>
                      {saving ? <ActivityIndicator color="#fff" size="small" /> : <Save color="#fff" size={16} />}
                      <Text style={styles.saveText}>Ghi nhận</Text>
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity onPress={() => navigation.navigate('WorkOrder', { screen: 'WorkOrderDetail', params: { task: active } })}>
                    <Text style={styles.link}>Chi tiết / Hoàn thành →</Text>
                  </TouchableOpacity>
                </Card>
              </>
            )}

            {!loading && !error && tasks.length > 1 && (
              <>
                <SectionTitle title={`Các việc khác (${tasks.length - 1})`} />
                {tasks.slice(1).map((t) => (
                  <TouchableOpacity key={t.task_id} onPress={() => navigation.navigate('WorkOrder', { screen: 'WorkOrderDetail', params: { task: t } })}>
                    <Card variant="outlined" style={styles.item}>
                      <View style={{ flex: 1 }}>
                        <View style={styles.taskHead}>
                          <Text style={styles.code}>{t.order_code} · {t.step_name}</Text>
                          <Badge {...WHEN_BADGE[t.when || 'today']} />
                        </View>
                        <Text style={styles.product} numberOfLines={1}>{t.product_name}</Text>
                        <Text style={styles.meta}>{num(t.actual_qty, 2)} / {num(t.quantity, 2)} {t.unit} · KH {shortDate(t.planned_date)}</Text>
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
  shiftRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  shiftText: { color: C.sub, fontSize: 13 },
  linked: { color: C.sub, fontSize: 12, marginTop: 4 },
  warnCard: { alignItems: 'center', gap: 8, borderColor: C.amber, backgroundColor: C.amberBg },
  warnTitle: { fontSize: 15, fontWeight: '700', color: C.text, textAlign: 'center' },
  warnText: { fontSize: 13, color: '#78350f', textAlign: 'center', lineHeight: 19 },
  taskHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  code: { fontSize: 15, fontWeight: '800', color: C.blue, flexShrink: 1 },
  product: { fontSize: 14, color: C.text, marginTop: 4 },
  meta: { fontSize: 12, color: C.sub, marginTop: 4 },
  progress: { fontSize: 14, fontWeight: '700', color: C.text, marginTop: 10 },
  qtyRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  qtyInput: { flex: 1, borderWidth: 1, borderColor: C.line, borderRadius: 10, paddingHorizontal: 12, height: 44, fontSize: 15, backgroundColor: '#fff' },
  saveBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.blue, borderRadius: 10, paddingHorizontal: 14, height: 44 },
  saveText: { color: '#fff', fontWeight: '700' },
  link: { color: C.blue, fontWeight: '700', marginTop: 12 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: 4 },
});
