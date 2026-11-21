import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, TextInput, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronRight, Search } from 'lucide-react-native';
import { productionApi } from '@/api/production';
import { ProductionTask } from '@/types/production';
import { useAuthStore } from '@/store/authStore';
import { Card } from '@/components/Card';
import { C, StateView, Badge, Segmented } from '@/components/ui';
import { WHEN_BADGE } from '@/screens/home/WorkerHome';
import { isDirector, workerNameOf } from '@/utils/roles';
import { todayLocal, shortDate } from '@/utils/date';
import { num } from '@/utils/format';
import { errMsg } from '@/utils/errors';
import { teamApi, TeamRoster } from '@/api/team';

type Filter = 'today' | 'all';

export function WorkOrderListScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const director = isDirector(user);
  const workerName = workerNameOf(user);

  const [tasks, setTasks] = useState<ProductionTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('today');
  const [q, setQ] = useState('');
  // Tablet tổ trưởng (chốt 2026-11-21): xem việc của CẢ TỔ hoặc TỪNG THÀNH VIÊN; công nhân bấm tên mình → chọn việc → điền kết quả.
  const [team, setTeam] = useState<TeamRoster | null>(null);
  const [member, setMember] = useState<string>('all'); // 'all' = cả tổ, còn lại = employees.id

  const load = useCallback(async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    setError(null);
    try {
      const today = todayLocal();
      // Tổ trưởng: lấy việc đang mở của mọi thành viên trong tổ
      const roster = await teamApi.roster().catch(() => null);
      setTeam(roster);
      if (roster) {
        const ids = new Set(roster.employees.map((e) => e.id));
        const names = new Set(roster.employees.map((e) => e.name.trim().toLowerCase()));
        const open = await productionApi.getOpenTasks(today);
        setTasks(open.filter((t) => (t.assigned_worker_id && ids.has(t.assigned_worker_id))
          || (!t.assigned_worker_id && names.has(String(t.assigned_worker || '').trim().toLowerCase()))));
        return;
      }
      if (!director && !workerName) { setTasks([]); return; }
      // Công nhân: chỉ việc của mình. Giám đốc: mọi việc đang mở trong nhà máy.
      const open = await productionApi.getOpenTasks(today, director ? undefined : workerName);
      setTasks(open);
    } catch (e) {
      setError(errMsg(e, 'Không tải được danh sách công việc.'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [director, workerName]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const memberOf = (t: ProductionTask) => team?.employees.find((e) => e.id === t.assigned_worker_id
    || (!t.assigned_worker_id && e.name.trim().toLowerCase() === String(t.assigned_worker || '').trim().toLowerCase()));
  const picked = team?.employees.find((e) => e.id === member);
  const keyword = q.trim().toLowerCase();
  const shown = tasks
    .filter((t) => (filter === 'all' ? true : t.when !== 'future'))
    .filter((t) => !team || member === 'all' || memberOf(t)?.id === member)
    .filter((t) => !keyword || [t.order_code, t.product_name, t.step_name, t.assigned_worker, t.machine_name]
      .some((v) => String(v || '').toLowerCase().includes(keyword)));

  const renderItem = ({ item }: { item: ProductionTask }) => (
    <TouchableOpacity onPress={() => navigation.navigate('WorkOrderDetail', { task: item, actor: team ? memberOf(item)?.name : undefined })} activeOpacity={0.8}>
      <Card variant="outlined" style={styles.card}>
        <View style={{ flex: 1 }}>
          <View style={styles.head}>
            <Text style={styles.code}>{item.order_code} · {item.step_name}</Text>
            <Badge {...WHEN_BADGE[item.when || 'today']} />
          </View>
          <Text style={styles.product} numberOfLines={1}>{item.product_name}</Text>
          <Text style={styles.meta}>
            {num(item.actual_qty, 2)} / {num(item.quantity, 2)} {item.unit} · KH {shortDate(item.planned_date)}
            {director || team ? ` · ${item.assigned_worker || 'chưa giao'}` : ''}{item.machine_name ? ` · ${item.machine_name}` : ''}
          </Text>
        </View>
        <ChevronRight color={C.muted} size={18} />
      </Card>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.headerTitle}>{team ? `CÔNG VIỆC ${team.unit_name.toUpperCase()}` : director ? 'CÔNG VIỆC TOÀN XƯỞNG' : 'CÔNG VIỆC CỦA TÔI'}</Text>
      </View>
      <View style={styles.tools}>
        <Segmented<Filter> options={[{ key: 'today', label: 'Hôm nay' }, { key: 'all', label: 'Tất cả đang mở' }]} value={filter} onChange={setFilter} />
        {team && (
          <>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
              {[{ id: 'all', name: 'Cả tổ' }, ...team.employees].map((e) => {
                const n = tasks.filter((t) => (filter === 'all' || t.when !== 'future') && (e.id === 'all' || memberOf(t)?.id === e.id)).length;
                const on = member === e.id;
                return (
                  <TouchableOpacity key={e.id} onPress={() => setMember(e.id)} style={[styles.chip, on && styles.chipOn]}>
                    <Text style={[styles.chipText, on && styles.chipTextOn]}>{e.name} ({n})</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <Text style={styles.teamHint}>{picked ? `Việc của ${picked.name} — bấm vào việc để điền kết quả sản xuất` : 'Công nhân: bấm TÊN của bạn để xem việc của mình'}</Text>
          </>
        )}
        {director && !team && (
          <View style={styles.search}>
            <Search size={16} color={C.muted} />
            <TextInput style={styles.searchInput} value={q} onChangeText={setQ} placeholder="Tìm lệnh, sản phẩm, công nhân, máy…" />
          </View>
        )}
      </View>
      {!team && !director && !workerName && !loading ? (
        <StateView empty={'Tài khoản chưa được gắn công nhân.\nNhờ quản lý vào web → Tài khoản → chọn "Công nhân liên kết".'} />
      ) : (loading || error) ? (
        <StateView loading={loading} error={error} onRetry={() => load()} />
      ) : (
        <FlatList
          data={shown}
          keyExtractor={(item, index) => String(item.task_id || index)}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<StateView empty={filter === 'today' ? 'Hôm nay chưa có việc nào.' : 'Không có việc nào đang mở.'} />}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} colors={[C.blue]} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: { paddingHorizontal: 16, paddingBottom: 14, backgroundColor: C.blue },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#fff' },
  tools: { paddingHorizontal: 16 },
  search: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: C.line, paddingHorizontal: 10, height: 40 },
  searchInput: { flex: 1, fontSize: 14 },
  chips: { gap: 8, paddingVertical: 8 },
  chip: { paddingHorizontal: 14, height: 40, borderRadius: 20, borderWidth: 1, borderColor: C.line, backgroundColor: '#fff', justifyContent: 'center' },
  chipOn: { backgroundColor: C.blue, borderColor: C.blue },
  chipText: { fontSize: 14, fontWeight: '600', color: C.text },
  chipTextOn: { color: '#fff' },
  teamHint: { fontSize: 13, color: C.sub, marginBottom: 4 },
  list: { padding: 16, paddingTop: 8 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: 4 },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  code: { fontSize: 15, fontWeight: '800', color: C.blue, flexShrink: 1 },
  product: { fontSize: 14, color: C.text, marginTop: 4 },
  meta: { fontSize: 12, color: C.sub, marginTop: 4 },
});
