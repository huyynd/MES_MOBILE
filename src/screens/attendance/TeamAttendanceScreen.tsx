import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { shrinkPunchPhoto } from '@/utils/punchPhoto';
import * as Location from 'expo-location';
import { CheckCircle2, XCircle, Camera, ShieldCheck, Delete, MapPin, Lock } from 'lucide-react-native';
import { teamApi, TeamIdentify, TeamMember, TeamRoster, Gps } from '@/api/team';

/* Tab "Chấm công" trên tablet của tổ (tổ trưởng đăng nhập) — chủ dự án chốt 2026-11-21:
   công nhân chọn TÊN mình → nhập PIN 6 số → (lần đầu) đồng ý chụp ảnh → chụp → máy ghi giờ máy chủ + vị trí GPS.
   Chỉ chấm cho HÔM NAY (giờ máy chủ, không chấm bù ngày khác). Máy tự biết lượt VÀO hay RA. */

const CONSENT_TEXT = [
  'Để chống chấm công hộ, mỗi lần chấm công máy sẽ chụp 1 ảnh khuôn mặt của bạn.',
  'Ảnh chỉ dùng để đối chiếu chấm công, chỉ trưởng tổ và phòng nhân sự được xem, mỗi lần xem đều được ghi lại.',
  'Ảnh được lưu tối đa 6 tháng rồi tự động xóa.',
  'Bạn có thể không đồng ý — vẫn chấm công được, nhưng mỗi lần chấm sẽ cần trưởng tổ xác nhận.',
];
const PIN_LEN = 6;
const STEP_TIMEOUT_MS = 60000; // đứng yên ở bước PIN / đồng ý / chụp quá 60s → về danh sách (phiên máy chủ hết hạn sau 90s)
const RESULT_SHOW_MS = 4000;

type Step =
  | { name: 'list' }
  | { name: 'pin'; m: TeamMember }
  | { name: 'consent'; id: TeamIdentify }
  | { name: 'camera'; id: TeamIdentify }
  | { name: 'sending'; who: string }
  | { name: 'result'; ok: boolean; title: string; detail?: string };

const dirLabel = (d: 'IN' | 'OUT') => (d === 'IN' ? 'VÀO' : 'RA');
const hhmm = (iso: string) => new Date(iso).toLocaleTimeString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit', hour12: false });
const today = () => new Date().toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });

/** Lấy vị trí GPS, tối đa 8 giây; không được thì trả null (máy chủ vẫn nhận, đánh dấu cần xác nhận). */
async function getGps(): Promise<Gps> {
  try {
    const perm = await Location.requestForegroundPermissionsAsync();
    if (perm.status !== 'granted') return null;
    const pos = await Promise.race([
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High }),
      new Promise<null>((r) => setTimeout(() => r(null), 8000)),
    ]);
    if (!pos) return null;
    return { lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy ?? null };
  } catch { return null; }
}

export function TeamAttendanceScreen() {
  const insets = useSafeAreaInsets();
  const [roster, setRoster] = useState<TeamRoster | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [step, setStep] = useState<Step>({ name: 'list' });
  const [pin, setPin] = useState('');
  const [pinErr, setPinErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [perm, requestPerm] = useCameraPermissions();
  const cam = useRef<CameraView>(null);
  const [camReady, setCamReady] = useState(false);
  const gpsRef = useRef<Promise<Gps> | null>(null);

  const load = useCallback(async () => {
    try { setErr(null); setRoster(await teamApi.roster()); }
    catch (e: any) { setErr(e.message); }
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const toList = useCallback(() => { setPin(''); setPinErr(null); setCamReady(false); setStep({ name: 'list' }); load(); }, [load, setCamReady]);

  useEffect(() => {
    if (step.name === 'pin' || step.name === 'consent' || step.name === 'camera') {
      const t = setTimeout(toList, STEP_TIMEOUT_MS); return () => clearTimeout(t);
    }
    if (step.name === 'result') { const t = setTimeout(toList, RESULT_SHOW_MS); return () => clearTimeout(t); }
  }, [step, toList]);

  const pick = (m: TeamMember) => {
    setPin(''); setPinErr(null);
    gpsRef.current = getGps(); // lấy vị trí song song trong lúc nhập PIN
    setStep({ name: 'pin', m });
  };

  const submitPin = async (m: TeamMember, value: string) => {
    setBusy(true); setPinErr(null);
    try {
      const id = await teamApi.identify(m.id, value);
      setPin('');
      if (id.needs_consent) setStep({ name: 'consent', id });
      else await goCamera(id, id.photo_required);
    } catch (e: any) {
      setPin('');
      setPinErr(e.message);
    } finally { setBusy(false); }
  };

  const press = (k: string) => {
    if (step.name !== 'pin' || busy) return;
    if (k === 'del') { setPin((p) => p.slice(0, -1)); return; }
    const next = (pin + k).slice(0, PIN_LEN);
    setPin(next);
    if (next.length === PIN_LEN) submitPin(step.m, next);
  };

  const goCamera = async (id: TeamIdentify, photoRequired: boolean) => {
    if (!photoRequired) { await sendPunch(id, null); return; }
    if (!perm?.granted) {
      const r = await requestPerm();
      if (!r.granted) { setStep({ name: 'result', ok: false, title: 'Chưa cho phép dùng camera', detail: 'Vào Cài đặt của máy → Ứng dụng → cho phép Camera, rồi chấm lại.' }); return; }
    }
    setCamReady(false);
    setStep({ name: 'camera', id });
  };

  const answerConsent = async (id: TeamIdentify, accept: boolean) => {
    setBusy(true);
    try { const r = await teamApi.consent(id.session, accept); await goCamera(id, r.photo_required); }
    catch (e: any) { setStep({ name: 'result', ok: false, title: 'Không lưu được lựa chọn', detail: e.message }); }
    finally { setBusy(false); }
  };

  const capture = async (id: TeamIdentify) => {
    if (!cam.current || !camReady) return;
    setBusy(true);
    try {
      const shot = await cam.current.takePictureAsync({ quality: 0.6, shutterSound: false });
      await sendPunch(id, await shrinkPunchPhoto(shot)); // thu nhỏ đúng tỉ lệ (web: gửi luôn)
    } catch (e: any) {
      setStep({ name: 'result', ok: false, title: 'Không chụp được ảnh', detail: e?.message });
    } finally { setBusy(false); }
  };

  const sendPunch = async (id: TeamIdentify, photo: { uri: string; width: number; height: number } | null) => {
    setStep({ name: 'sending', who: id.employee.name });
    const gps = (await gpsRef.current?.catch(() => null)) ?? null;
    try {
      const r = await teamApi.punch(id.session, photo, gps);
      setStep({
        name: 'result', ok: true,
        title: r.duplicate ? `${id.employee.name} — bạn vừa chấm rồi` : `${id.employee.name} — đã chấm ${dirLabel(r.direction)}`,
        detail: [r.message, gps ? null : 'Không lấy được vị trí GPS — lần chấm này cần tổ trưởng xác nhận.'].filter(Boolean).join('\n'),
      });
    } catch (e: any) {
      setStep({ name: 'result', ok: false, title: 'Chấm công KHÔNG thành công', detail: e.message });
    }
  };

  // ── Giao diện ──
  const header = (
    <View style={s.header}>
      <Text style={s.hTitle}>Chấm công</Text>
      <Text style={s.hSub}>{roster?.unit_name ? `${roster.unit_name} · ` : ''}{today()}</Text>
    </View>
  );

  if (step.name === 'list') {
    return (
      <View style={[s.root, { paddingTop: insets.top }]}>
        {header}
        <ScrollView contentContainerStyle={s.body}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} />}>
          {err ? (
            <View style={s.card}><Text style={s.err}>{err}</Text>
              <TouchableOpacity style={s.btnGhost} onPress={load}><Text style={s.btnGhostText}>Thử lại</Text></TouchableOpacity></View>
          ) : !roster ? <ActivityIndicator size="large" color="#1d4ed8" /> : roster.employees.length === 0 ? (
            <View style={s.card}><Text style={s.text}>Tổ chưa có công nhân. Admin vào web MES → Chấm công → Đơn vị sản xuất để thêm công nhân vào tổ.</Text></View>
          ) : (
            <>
              <Text style={s.hint}>Bấm vào TÊN của bạn để chấm công vào / ra hôm nay</Text>
              <View style={s.grid}>
                {roster.employees.map((m) => {
                  const last = m.today[m.today.length - 1];
                  const inAt = m.today.find((p) => p.direction === 'IN');
                  const outAt = [...m.today].reverse().find((p) => p.direction === 'OUT');
                  const working = last?.direction === 'IN';
                  const done = last?.direction === 'OUT'; // mỗi ngày 1 lần VÀO + 1 lần RA (chốt 2026-11-23)
                  const disabled = !m.has_pin || m.pin_locked || done;
                  return (
                    <TouchableOpacity key={m.id} disabled={disabled} onPress={() => pick(m)}
                      style={[s.tile, working && s.tileIn, !working && outAt && s.tileOut, disabled && s.dim]}>
                      <Text style={s.tileName} numberOfLines={2}>{m.name}</Text>
                      <Text style={s.tileCode}>{m.employee_code}</Text>
                      <Text style={[s.tileState, working ? { color: '#15803d' } : outAt ? { color: '#1d4ed8' } : null]}>
                        {!m.has_pin ? 'Chưa có PIN — báo admin' : m.pin_locked ? 'PIN đang bị khóa'
                          : working ? `Đang làm · vào ${hhmm(inAt!.at)}` : done ? `Đã chấm đủ hôm nay · ra ${hhmm(outAt!.at)}` : 'Chưa chấm'}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          )}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      {header}
      <ScrollView contentContainerStyle={[s.body, { alignItems: 'center' }]} keyboardShouldPersistTaps="handled">
        {step.name === 'pin' && (
          <View style={s.card}>
            <Text style={s.title}>{step.m.name}</Text>
            <Text style={s.textMuted}>Nhập mã PIN 6 số của bạn</Text>
            <View style={s.dots}>
              {Array.from({ length: PIN_LEN }).map((_, i) => <View key={i} style={[s.dot, i < pin.length && s.dotOn]} />)}
            </View>
            {pinErr && <Text style={[s.err, { textAlign: 'center' }]}>{pinErr}</Text>}
            {busy ? <ActivityIndicator size="large" color="#1d4ed8" style={{ marginVertical: 24 }} /> : (
              <View style={s.pad}>
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'].map((k, i) => (
                  k === '' ? <View key={i} style={s.key} /> : (
                    <TouchableOpacity key={i} style={s.key} onPress={() => press(k)} accessibilityLabel={k === 'del' ? 'Xóa' : k}>
                      {k === 'del' ? <Delete color="#334155" size={26} /> : <Text style={s.keyText}>{k}</Text>}
                    </TouchableOpacity>
                  )))}
              </View>
            )}
            <TouchableOpacity style={s.btnGhost} onPress={toList}><Text style={s.btnGhostText}>Không phải tôi — quay lại</Text></TouchableOpacity>
          </View>
        )}

        {step.name === 'consent' && (
          <View style={s.card}>
            <ShieldCheck color="#1d4ed8" size={32} />
            <Text style={s.title}>{step.id.employee.name} — đồng ý chụp ảnh khi chấm công</Text>
            {CONSENT_TEXT.map((t, i) => <Text key={i} style={s.text}>• {t}</Text>)}
            <Text style={s.textMuted}>Theo Nghị định 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân{step.id.consent_version ? ` · phiên bản ${step.id.consent_version}` : ''}</Text>
            <View style={s.row}>
              <TouchableOpacity style={[s.btnGhost, { flex: 1 }]} onPress={() => answerConsent(step.id, false)} disabled={busy}><Text style={s.btnGhostText}>Không đồng ý</Text></TouchableOpacity>
              <TouchableOpacity style={[s.btn, { flex: 1 }, busy && s.dim]} onPress={() => answerConsent(step.id, true)} disabled={busy}><Text style={s.btnText}>Đồng ý</Text></TouchableOpacity>
            </View>
          </View>
        )}

        {step.name === 'camera' && (
          <View style={s.card}>
            <Text style={s.title}>{step.id.employee.name} — chấm {dirLabel(step.id.expected_direction)}</Text>
            <View style={s.row}><MapPin color="#64748b" size={14} /><Text style={s.textMuted}>Nhìn thẳng vào camera rồi bấm chụp · máy ghi giờ và vị trí</Text></View>
            <View style={s.camBox}>
              <CameraView ref={cam} style={StyleSheet.absoluteFill} facing="front" mirror onCameraReady={() => setCamReady(true)} />
            </View>
            <TouchableOpacity style={[s.btn, (!camReady || busy) && s.dim]} onPress={() => capture(step.id)} disabled={!camReady || busy}>
              {busy ? <ActivityIndicator color="#fff" /> : <><Camera color="#fff" size={20} /><Text style={s.btnText}>Chụp & chấm công</Text></>}
            </TouchableOpacity>
            <TouchableOpacity style={s.btnGhost} onPress={toList}><Text style={s.btnGhostText}>Hủy</Text></TouchableOpacity>
          </View>
        )}

        {step.name === 'sending' && (
          <View style={s.card}><ActivityIndicator size="large" color="#1d4ed8" /><Text style={s.title}>Đang ghi nhận cho {step.who}…</Text></View>
        )}

        {step.name === 'result' && (
          <TouchableOpacity activeOpacity={0.9} onPress={toList} style={[s.card, { alignItems: 'center', borderColor: step.ok ? '#16a34a' : '#dc2626', borderWidth: 2 }]}>
            {step.ok ? <CheckCircle2 color="#16a34a" size={56} /> : <XCircle color="#dc2626" size={56} />}
            <Text style={[s.title, { color: step.ok ? '#15803d' : '#b91c1c', textAlign: 'center' }]}>{step.title}</Text>
            {step.detail ? <Text style={[s.text, { textAlign: 'center' }]}>{step.detail}</Text> : null}
            <Text style={s.textMuted}>Chạm để tiếp tục</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
      {step.name !== 'result' && step.name !== 'sending' && (
        <View style={s.footer}><Lock color="#94a3b8" size={12} /><Text style={s.footerText}>Chỉ chấm được cho hôm nay · giờ theo máy chủ</Text></View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f1f5f9' },
  header: { paddingHorizontal: 20, paddingVertical: 14, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  hTitle: { fontSize: 20, fontWeight: '800', color: '#0f172a' },
  hSub: { fontSize: 13, color: '#64748b', marginTop: 2, textTransform: 'capitalize' },
  body: { padding: 16, gap: 12, flexGrow: 1 },
  hint: { fontSize: 14, color: '#475569', textAlign: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center' },
  tile: { width: 170, minHeight: 110, backgroundColor: '#fff', borderRadius: 16, padding: 14, gap: 4, borderWidth: 2, borderColor: '#e2e8f0' },
  tileIn: { borderColor: '#86efac', backgroundColor: '#f0fdf4' },
  tileOut: { borderColor: '#bfdbfe', backgroundColor: '#eff6ff' },
  tileName: { fontSize: 17, fontWeight: '800', color: '#0f172a' },
  tileCode: { fontSize: 12, color: '#64748b' },
  tileState: { fontSize: 13, fontWeight: '600', color: '#64748b', marginTop: 'auto' },
  card: { width: '100%', maxWidth: 520, backgroundColor: '#fff', borderRadius: 20, padding: 22, gap: 12,
    shadowColor: '#0f172a', shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 3 },
  title: { fontSize: 22, fontWeight: '800', color: '#0f172a' },
  text: { fontSize: 16, color: '#334155', lineHeight: 23 },
  textMuted: { fontSize: 13, color: '#64748b' },
  err: { color: '#dc2626', fontSize: 15, fontWeight: '600' },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 14, marginVertical: 8 },
  dot: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: '#94a3b8' },
  dotOn: { backgroundColor: '#1d4ed8', borderColor: '#1d4ed8' },
  pad: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12, marginVertical: 4 },
  key: { width: '28%', height: 64, borderRadius: 14, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },
  keyText: { fontSize: 28, fontWeight: '700', color: '#0f172a' },
  btn: { flexDirection: 'row', gap: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1d4ed8', borderRadius: 14, height: 58 },
  btnText: { color: '#fff', fontSize: 19, fontWeight: '800' },
  btnGhost: { alignItems: 'center', justifyContent: 'center', borderRadius: 14, height: 50, backgroundColor: '#f1f5f9' },
  btnGhostText: { color: '#334155', fontSize: 16, fontWeight: '700' },
  dim: { opacity: 0.5 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  camBox: { width: '100%', aspectRatio: 3 / 4, maxHeight: 480, borderRadius: 16, overflow: 'hidden', backgroundColor: '#0f172a' },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8 },
  footerText: { fontSize: 12, color: '#94a3b8' },
});
