import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, TextInput } from 'react-native';
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

  const load = useCallback(async (isRefresh = false) => {
    if (!director && !workerName) { setLoading(false); return; }
    isRefresh ? setRefreshing(true) : setLoading(true);
    setError(null);
    try {
      const today = todayLocal();
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

  const keyword = q.trim().toLowerCase();
  const shown = tasks
    .filter((t) => (filter === 'all' ? true : t.when !== 'future'))
    .filter((t) => !keyword || [t.order_code, t.product_name, t.step_name, t.assigned_worker, t.machine_name]
      .some((v) => String(v || '').toLowerCase().includes(keyword)));

  const renderItem = ({ item }: { item: ProductionTask }) => (
    <TouchableOpacity onPress={() => navigation.navigate('WorkOrderDetail', { task: item })} activeOpacity={0.8}>
      <Card variant="outlined" style={styles.card}>
        <View style={{ flex: 1 }}>
          <View style={styles.head}>
            <Text style={styles.code}>{item.order_code} · {item.step_name}</Text>
            <Badge {...WHEN_BADGE[item.when || 'today']} />
          </View>
          <Text style={styles.product} numberOfLines={1}>{item.product_name}</Text>
          <Text style={styles.meta}>
            {num(item.actual_qty, 2)} / {num(item.quantity, 2)} {item.unit} · KH {shortDate(item.planned_date)}
            {director ? ` · ${item.assigned_worker || 'chưa giao'}` : ''}{item.machine_name ? ` · ${item.machine_name}` : ''}
          </Text>
        </View>
        <ChevronRight color={C.muted} size={18} />
      </Card>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.headerTitle}>{director ? 'CÔNG VIỆC TOÀN XƯỞNG' : 'CÔNG VIỆC CỦA TÔI'}</Text>
      </View>
      <View style={styles.tools}>
        <Segmented<Filter> options={[{ key: 'today', label: 'Hôm nay' }, { key: 'all', label: 'Tất cả đang mở' }]} value={filter} onChange={setFilter} />
        {director && (
          <View style={styles.search}>
            <Search size={16} color={C.muted} />
            <TextInput style={styles.searchInput} value={q} onChangeText={setQ} placeholder="Tìm lệnh, sản phẩm, công nhân, máy…" />
          </View>
        )}
      </View>
      {!director && !workerName ? (
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
  list: { padding: 16, paddingTop: 8 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: 4 },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  code: { fontSize: 15, fontWeight: '800', color: C.blue, flexShrink: 1 },
  product: { fontSize: 14, color: C.text, marginTop: 4 },
  meta: { fontSize: 12, color: C.sub, marginTop: 4 },
});
