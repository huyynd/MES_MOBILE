import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Repeat, Save, CheckCircle2, Flag } from 'lucide-react-native';
import { productionApi } from '@/api/production';
import { ProductionTask } from '@/types/production';
import { num } from '@/utils/format';
import { errMsg } from '@/utils/errors';

/* GHI CUỘN NHANH (chốt 2026-11-23) — công nhân có thể ghi 20–30 cuộn liên tục:
   - Ô số kg luôn sẵn sàng: gõ số → Enter / "Lưu cuộn" → ghi xong ô tự xóa, giữ bàn phím cho cuộn tiếp theo.
   - "Lặp lại" = ghi ngay 1 cuộn bằng đúng số kg cuộn trước (1 chạm).
   - Ghi nhiều cuộn 1 lần: gõ "25.4 24.8 26" (cách nhau dấu cách / dấu chấm phẩy / dấu +).
     Dấu phẩy là dấu thập phân kiểu Việt ("25,4" = 25.4).
   Mỗi số kg = 1 cuộn có mã riêng, hoàn thành + nhập kho ngay (máy chủ xử lý). */

type Roll = { task_code: string; roll_code: string; qty: number; created_at?: string };

const parseWeights = (s: string): number[] | null => {
  const parts = s.trim().split(/[\s;+]+/).filter(Boolean);
  if (!parts.length) return null;
  const nums = parts.map((p) => Number(p.replace(',', '.')));
  return nums.every((n) => Number.isFinite(n) && n > 0) ? nums : null;
};
const hhmm = (iso?: string) => (iso ? new Date(iso).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false }) : '');

export function RollRecorder({ task, onFinished, onTotal }: { task: ProductionTask; onFinished: () => void; onTotal?: (kg: number) => void }) {
  const [rolls, setRolls] = useState<Roll[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState<{ ok: boolean; text: string } | null>(null);
  const ref = useRef<TextInput>(null);
  const unit = task.unit || 'kg';

  useEffect(() => {
    let ok = true;
    productionApi.listRolls(task.order_id, task.task_code!)
      .then((r) => { if (ok) setRolls(r); })
      .catch(() => { /* danh sách chỉ để xem — lỗi không chặn ghi */ })
      .finally(() => { if (ok) setLoading(false); });
    return () => { ok = false; };
  }, [task.order_id, task.task_code]);

  const last = rolls[0]?.qty;
  const total = rolls.reduce((s, r) => s + r.qty, 0);
  useEffect(() => { onTotal?.(total); }, [total, onTotal]); // báo tổng kg cuộn lên màn chi tiết (Đã sản xuất / Còn lại)

  const save = async (weights: number[]) => {
    if (busy) return;
    setBusy(true); setFlash(null);
    try {
      const r = await productionApi.recordRolls(task.order_id, task.task_code!, weights);
      setInput('');
      const now = new Date().toISOString();
      setRolls((prev) => [...r.rolls.map((x) => ({ ...x, created_at: now })).reverse(), ...prev]);
      setFlash({ ok: true, text: r.rolls.length === 1
        ? `Đã ghi cuộn ${r.rolls[0].roll_code} · ${num(r.rolls[0].qty, 2)} ${unit}`
        : `Đã ghi ${r.rolls.length} cuộn · ${num(weights.reduce((a, b) => a + b, 0), 2)} ${unit}` });
    } catch (e) {
      setFlash({ ok: false, text: errMsg(e, 'Không ghi được cuộn — thử lại') });
    } finally {
      setBusy(false);
      setTimeout(() => ref.current?.focus(), 50); // giữ bàn phím cho cuộn tiếp theo
    }
  };

  const submit = () => {
    const w = parseWeights(input);
    if (!w) { setFlash({ ok: false, text: 'Nhập số kg lớn hơn 0 (nhiều cuộn: cách nhau dấu cách)' }); return; }
    save(w);
  };

  const finish = () => {
    Alert.alert('Kết thúc việc', `Đã ghi ${rolls.length} cuộn · ${num(total, 2)} ${unit}. Kết thúc việc này? (việc sẽ rời khỏi danh sách)`, [
      { text: 'Chưa', style: 'cancel' },
      { text: 'Kết thúc', onPress: async () => {
        setBusy(true);
        try { await productionApi.recordRolls(task.order_id, task.task_code!, [], true); onFinished(); }
        catch (e) { Alert.alert('Lỗi', errMsg(e, 'Không kết thúc được việc')); }
        finally { setBusy(false); }
      } },
    ]);
  };

  const preview = parseWeights(input);
  return (
    <View style={s.wrap}>
      <Text style={s.title}>GHI CUỘN — {task.step_name}</Text>
      <View style={s.row}>
        <TextInput ref={ref} style={s.input} value={input} onChangeText={setInput} autoFocus
          placeholder={`Số ${unit} của cuộn`} keyboardType="decimal-pad" returnKeyType="done"
          onSubmitEditing={submit} blurOnSubmit={false} editable={!busy} />
        <TouchableOpacity style={[s.saveBtn, (busy || !input.trim()) && s.dim]} onPress={submit} disabled={busy || !input.trim()}>
          {busy ? <ActivityIndicator color="#fff" /> : <><Save color="#fff" size={22} /><Text style={s.saveText}>{preview && preview.length > 1 ? `Lưu ${preview.length} cuộn` : 'Lưu cuộn'}</Text></>}
        </TouchableOpacity>
      </View>
      <Text style={s.hint}>Nhiều cuộn 1 lần: gõ cách nhau dấu cách, vd “25,4 24,8 26”.</Text>

      {last ? (
        <TouchableOpacity style={[s.repeat, busy && s.dim]} onPress={() => save([last])} disabled={busy}>
          <Repeat color="#1d4ed8" size={20} />
          <Text style={s.repeatText}>Lặp lại cuộn trước: + {num(last, 2)} {unit}</Text>
        </TouchableOpacity>
      ) : null}

      {flash && <Text style={[s.flash, flash.ok ? s.flashOk : s.flashErr]}>{flash.ok ? '✓ ' : '✗ '}{flash.text}</Text>}

      <View style={s.sumRow}>
        <Text style={s.sum}>Đã ghi: <Text style={s.sumStrong}>{rolls.length} cuộn</Text> · <Text style={s.sumStrong}>{num(total, 2)} {unit}</Text></Text>
        {loading && <ActivityIndicator size="small" color="#64748b" />}
      </View>
      {rolls.slice(0, 50).map((r, i) => (
        <View key={r.task_code} style={[s.rollRow, i === 0 && s.rollNew]}>
          <CheckCircle2 color="#16a34a" size={16} />
          <Text style={s.rollCode}>{r.roll_code}</Text>
          <Text style={s.rollQty}>{num(r.qty, 2)} {unit}</Text>
          <Text style={s.rollTime}>{hhmm(r.created_at)}</Text>
        </View>
      ))}
      {rolls.length > 50 && <Text style={s.hint}>… và {rolls.length - 50} cuộn cũ hơn</Text>}

      <TouchableOpacity style={[s.finish, busy && s.dim]} onPress={finish} disabled={busy}>
        <Flag color="#475569" size={18} />
        <Text style={s.finishText}>Kết thúc việc này</Text>
      </TouchableOpacity>
      <Text style={s.hint}>Ghi nhầm cuộn: báo quản lý “Hủy hoàn thành” cuộn đó trên web.</Text>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { backgroundColor: '#fff', borderRadius: 16, padding: 16, gap: 10, borderWidth: 1, borderColor: '#e2e8f0' },
  title: { fontSize: 13, fontWeight: '800', color: '#64748b', letterSpacing: 0.5 },
  row: { flexDirection: 'row', gap: 10 },
  input: { flex: 1, height: 64, borderWidth: 2, borderColor: '#1d4ed8', borderRadius: 14, paddingHorizontal: 16, fontSize: 28, fontWeight: '700', backgroundColor: '#f8fafc' },
  saveBtn: { minWidth: 140, height: 64, borderRadius: 14, backgroundColor: '#16a34a', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 14 },
  saveText: { color: '#fff', fontSize: 18, fontWeight: '800' },
  dim: { opacity: 0.5 },
  hint: { fontSize: 12, color: '#94a3b8' },
  repeat: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 52, borderRadius: 12, borderWidth: 2, borderColor: '#bfdbfe', backgroundColor: '#eff6ff' },
  repeatText: { fontSize: 17, fontWeight: '800', color: '#1d4ed8' },
  flash: { fontSize: 15, fontWeight: '700', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10 },
  flashOk: { color: '#15803d', backgroundColor: '#dcfce7' },
  flashErr: { color: '#b91c1c', backgroundColor: '#fee2e2' },
  sumRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  sum: { fontSize: 14, color: '#334155' },
  sumStrong: { fontWeight: '800', color: '#0f172a' },
  rollRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8, paddingHorizontal: 10, borderRadius: 10, backgroundColor: '#f8fafc' },
  rollNew: { backgroundColor: '#f0fdf4' },
  rollCode: { flex: 1, fontSize: 14, fontWeight: '700', color: '#0f172a', fontVariant: ['tabular-nums'] },
  rollQty: { fontSize: 15, fontWeight: '800', color: '#15803d', fontVariant: ['tabular-nums'] },
  rollTime: { fontSize: 12, color: '#94a3b8', width: 42, textAlign: 'right' },
  finish: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 46, borderRadius: 12, backgroundColor: '#f1f5f9', marginTop: 6 },
  finishText: { fontSize: 15, fontWeight: '700', color: '#475569' },
});
