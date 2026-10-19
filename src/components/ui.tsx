import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { AlertTriangle, Inbox } from 'lucide-react-native';

export const C = {
  bg: '#f8fafc', card: '#ffffff', text: '#0f172a', sub: '#64748b', muted: '#94a3b8', line: '#e2e8f0',
  blue: '#1d4ed8', blueBg: '#dbeafe', green: '#16a34a', greenBg: '#dcfce7', amber: '#d97706', amberBg: '#fef3c7',
  red: '#dc2626', redBg: '#fee2e2',
};

export function SectionTitle({ icon, title, right }: { icon?: React.ReactNode; title: string; right?: React.ReactNode }) {
  return (
    <View style={s.section}>
      {icon}
      <Text style={s.sectionTitle}>{title}</Text>
      <View style={{ flex: 1 }} />
      {right}
    </View>
  );
}

type Tone = 'blue' | 'green' | 'amber' | 'red' | 'gray';
const toneColor: Record<Tone, string> = { blue: C.blue, green: C.green, amber: C.amber, red: C.red, gray: C.text };

export function Stat({ label, value, sub, tone = 'gray' }: { label: string; value: string; sub?: string; tone?: Tone }) {
  return (
    <View style={s.stat}>
      <Text style={s.statLabel} numberOfLines={1}>{label}</Text>
      <Text style={[s.statValue, { color: toneColor[tone] }]} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
      {sub ? <Text style={s.statSub} numberOfLines={2}>{sub}</Text> : null}
    </View>
  );
}

export function StatRow({ children }: { children: React.ReactNode }) {
  return <View style={s.statRow}>{children}</View>;
}

export function Row({ label, value, tone }: { label: string; value: string; tone?: Tone }) {
  return (
    <View style={s.row}>
      <Text style={s.rowLabel} numberOfLines={2}>{label}</Text>
      <Text style={[s.rowValue, tone ? { color: toneColor[tone] } : null]}>{value}</Text>
    </View>
  );
}

export function Segmented<T extends string>({ options, value, onChange }: { options: { key: T; label: string }[]; value: T; onChange: (k: T) => void }) {
  return (
    <View style={s.seg}>
      {options.map((o) => (
        <TouchableOpacity key={o.key} style={[s.segItem, value === o.key && s.segActive]} onPress={() => onChange(o.key)} activeOpacity={0.8}>
          <Text style={[s.segText, value === o.key && s.segTextActive]} numberOfLines={1}>{o.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

export function StateView({ loading, error, empty, onRetry }: { loading?: boolean; error?: string | null; empty?: string | null; onRetry?: () => void }) {
  if (loading) return <View style={s.state}><ActivityIndicator color={C.blue} /><Text style={s.stateText}>Đang tải…</Text></View>;
  if (error) return (
    <View style={s.state}>
      <AlertTriangle color={C.red} size={28} />
      <Text style={[s.stateText, { color: C.red }]}>{error}</Text>
      {onRetry ? <TouchableOpacity onPress={onRetry}><Text style={s.retry}>Thử lại</Text></TouchableOpacity> : null}
    </View>
  );
  if (empty) return <View style={s.state}><Inbox color={C.muted} size={28} /><Text style={s.stateText}>{empty}</Text></View>;
  return null;
}

export function Badge({ text, tone = 'gray' }: { text: string; tone?: Tone }) {
  const bg = { blue: C.blueBg, green: C.greenBg, amber: C.amberBg, red: C.redBg, gray: '#f1f5f9' }[tone];
  return <View style={[s.badge, { backgroundColor: bg }]}><Text style={[s.badgeText, { color: toneColor[tone] }]}>{text}</Text></View>;
}

const s = StyleSheet.create({
  section: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 18, marginBottom: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: C.text },
  statRow: { flexDirection: 'row', gap: 8, marginVertical: 4 },
  stat: { flex: 1, backgroundColor: C.card, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: C.line },
  statLabel: { fontSize: 11, fontWeight: '700', color: C.sub, textTransform: 'uppercase' },
  statValue: { fontSize: 20, fontWeight: '800', marginTop: 4 },
  statSub: { fontSize: 11, color: C.muted, marginTop: 2 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', gap: 12 },
  rowLabel: { flex: 1, fontSize: 14, color: '#334155' },
  rowValue: { fontSize: 14, fontWeight: '700', color: C.text },
  seg: { flexDirection: 'row', backgroundColor: '#e2e8f0', borderRadius: 10, padding: 3, marginVertical: 8 },
  segItem: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  segActive: { backgroundColor: C.card, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  segText: { fontSize: 13, color: C.sub, fontWeight: '600' },
  segTextActive: { color: C.blue },
  state: { alignItems: 'center', justifyContent: 'center', paddingVertical: 32, gap: 8 },
  stateText: { color: C.sub, fontSize: 14, textAlign: 'center', paddingHorizontal: 16 },
  retry: { color: C.blue, fontWeight: '700', marginTop: 4 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, alignSelf: 'flex-start' },
  badgeText: { fontSize: 11, fontWeight: '700' },
});
