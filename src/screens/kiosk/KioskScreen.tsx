import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';
import { CheckCircle2, XCircle, Camera, LogIn, ShieldCheck, Clock } from 'lucide-react-native';
import { BrandLogo } from '@/components/BrandLogo';
import { kioskApi, kioskStorage, KioskError, IdentifyResult } from '@/api/kiosk';

// Nội dung thông báo theo NĐ 13/2023 — giống kiosk web (src/modules/hr/kiosk/KioskApp.jsx); chủ dự án / pháp chế rà câu chữ.
const CONSENT_TEXT = [
  'Để chống chấm công hộ, mỗi lần chấm công máy sẽ chụp 1 ảnh khuôn mặt của bạn.',
  'Ảnh chỉ dùng để đối chiếu chấm công, chỉ trưởng tổ và phòng nhân sự được xem, mỗi lần xem đều được ghi lại.',
  'Ảnh được lưu tối đa 6 tháng rồi tự động xóa.',
  'Bạn có thể không đồng ý — vẫn chấm công được, nhưng mỗi lần chấm sẽ cần trưởng tổ xác nhận.',
];
const STEP_TIMEOUT_MS = 60000;   // đứng yên ở bước đồng ý / chụp quá 60s → về màn chờ (phiên máy chủ hết hạn sau 90s)
const RESULT_SHOW_MS = 5000;     // màn kết quả tự đóng
const CLAIM_POLL_MS = 5000;      // chờ quản lý duyệt máy
const TIME_SYNC_MS = 10 * 60000;

type Step =
  | { name: 'loading' }
  | { name: 'setup' }
  | { name: 'pending'; code: string }
  | { name: 'idle' }
  | { name: 'consent'; id: IdentifyResult }
  | { name: 'camera'; id: IdentifyResult; photoRequired: boolean }
  | { name: 'sending'; who: string }
  | { name: 'result'; ok: boolean; title: string; detail?: string };

const dirLabel = (d: 'IN' | 'OUT') => (d === 'IN' ? 'VÀO' : 'RA');
const fmtClock = (ms: number) => new Date(ms).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
const fmtDay = (ms: number) => new Date(ms).toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });

export function KioskScreen({ onExit }: { onExit: () => void }) {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<Step>({ name: 'loading' });
  const [deviceName, setDeviceName] = useState('');
  const [newName, setNewName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [skew, setSkew] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const [perm, requestPerm] = useCameraPermissions();
  const cam = useRef<CameraView>(null);
  const [camReady, setCamReady] = useState(false);

  const toIdle = useCallback(() => { setUsername(''); setPassword(''); setErr(null); setCamReady(false); setStep({ name: 'idle' }); }, []);

  // Lỗi 401 từ requireKiosk = máy chưa duyệt / đã bị thu hồi → xóa mã máy, quay lại đăng ký
  const handleDeviceError = useCallback(async (e: any) => {
    if (e instanceof KioskError && e.status === 401 && /Tablet/.test(e.message)) {
      await kioskStorage.clearToken();
      setErr(e.message); setStep({ name: 'setup' });
      return true;
    }
    return false;
  }, []);

  // ── Khởi động: có mã máy → màn chờ; đang chờ duyệt → màn mã; chưa có → đăng ký ──
  useEffect(() => {
    (async () => {
      const token = await kioskStorage.getToken();
      setDeviceName((await kioskStorage.getName()) || '');
      if (token) { toIdle(); return; }
      const p = await kioskStorage.getPending();
      setStep(p ? { name: 'pending', code: p.code } : { name: 'setup' });
    })();
  }, [toIdle]);

  // Đồng hồ (theo giờ máy chủ) + đồng bộ giờ định kỳ
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  useEffect(() => {
    if (step.name !== 'idle') return;
    let alive = true;
    const sync = () => kioskApi.time().then((r) => { if (alive) setSkew(new Date(r.now).getTime() - Date.now()); })
      .catch((e) => handleDeviceError(e));
    sync(); const t = setInterval(sync, TIME_SYNC_MS);
    return () => { alive = false; clearInterval(t); };
  }, [step.name, handleDeviceError]);

  // Chờ quản lý duyệt máy (poll claim)
  useEffect(() => {
    if (step.name !== 'pending') return;
    let stop = false; let timer: any;
    const poll = async () => {
      const p = await kioskStorage.getPending();
      if (!p) { setStep({ name: 'setup' }); return; }
      try {
        const r = await kioskApi.claim(p);
        if (r.status === 200 && r.body?.token) {
          await kioskStorage.setToken(r.body.token);
          await kioskStorage.setPending(null);
          setDeviceName(r.body.name || '');
          await kioskStorage.setName(r.body.name || '');
          if (!stop) toIdle();
          return;
        }
      } catch (e: any) {
        if (e instanceof KioskError && (e.status === 410 || e.status === 404)) {
          await kioskStorage.setPending(null);
          if (!stop) { setErr(e.message); setStep({ name: 'setup' }); }
          return;
        }
      }
      if (!stop) timer = setTimeout(poll, CLAIM_POLL_MS);
    };
    poll();
    return () => { stop = true; clearTimeout(timer); };
  }, [step.name, toIdle]);

  // Đứng yên quá lâu ở bước đồng ý / chụp → về màn chờ; kết quả tự đóng
  useEffect(() => {
    if (step.name === 'consent' || step.name === 'camera') {
      const t = setTimeout(toIdle, STEP_TIMEOUT_MS); return () => clearTimeout(t);
    }
    if (step.name === 'result') { const t = setTimeout(toIdle, RESULT_SHOW_MS); return () => clearTimeout(t); }
  }, [step, toIdle]);

  // ── Hành động ──
  const register = async () => {
    const name = newName.trim();
    if (!name) { setErr('Nhập tên máy, ví dụ "Tablet Tổ Cắt 1"'); return; }
    setBusy(true); setErr(null);
    try {
      const r = await kioskApi.register(name);
      await kioskStorage.setPending({ device_id: r.device_id, claim_secret: r.claim_secret, code: r.code });
      setStep({ name: 'pending', code: r.code });
    } catch (e: any) { setErr(e.message); } finally { setBusy(false); }
  };

  const identify = async () => {
    if (!username.trim() || !password) { setErr('Nhập tài khoản và mật khẩu'); return; }
    setBusy(true); setErr(null);
    try {
      const id = await kioskApi.identifyAccount(username.trim(), password);
      setPassword('');
      if (id.needs_consent) setStep({ name: 'consent', id });
      else goCamera(id, id.photo_required);
    } catch (e: any) {
      setPassword('');
      if (!(await handleDeviceError(e))) setErr(e.message);
    } finally { setBusy(false); }
  };

  const goCamera = async (id: IdentifyResult, photoRequired: boolean) => {
    if (!photoRequired) { await sendPunch(id, null); return; }
    if (!perm?.granted) {
      const r = await requestPerm();
      if (!r.granted) { setStep({ name: 'result', ok: false, title: 'Chưa cho phép dùng camera', detail: 'Vào Cài đặt của máy → Ứng dụng → cho phép Camera, rồi chấm lại.' }); return; }
    }
    setCamReady(false);
    setStep({ name: 'camera', id, photoRequired });
  };

  const answerConsent = async (id: IdentifyResult, accept: boolean) => {
    setBusy(true);
    try {
      const r = await kioskApi.consent(id.session, accept);
      await goCamera(id, r.photo_required);
    } catch (e: any) {
      setStep({ name: 'result', ok: false, title: 'Không lưu được lựa chọn', detail: e.message });
    } finally { setBusy(false); }
  };

  const capture = async (id: IdentifyResult) => {
    if (!cam.current || !camReady) return;
    setBusy(true);
    try {
      const shot = await cam.current.takePictureAsync({ quality: 0.7, shutterSound: false });
      // Máy chủ nhận tối đa 300 KB, JPEG/WebP → thu về rộng 640px, nén 0.6 (~40–80 KB)
      const ctx = ImageManipulator.ImageManipulator.manipulate(shot.uri);
      ctx.resize({ width: 640, height: null });
      const ref = await ctx.renderAsync();
      const img = await ref.saveAsync({ compress: 0.6, format: ImageManipulator.SaveFormat.JPEG });
      await sendPunch(id, { uri: img.uri, width: img.width, height: img.height });
    } catch (e: any) {
      setStep({ name: 'result', ok: false, title: 'Không chụp được ảnh', detail: e?.message });
    } finally { setBusy(false); }
  };

  const sendPunch = async (id: IdentifyResult, photo: { uri: string; width: number; height: number } | null) => {
    setStep({ name: 'sending', who: id.employee.name });
    try {
      const r = await kioskApi.punch(id.session, photo);
      setStep({
        name: 'result', ok: true,
        title: r.duplicate ? `${id.employee.name} — bạn vừa chấm rồi` : `${id.employee.name} — đã chấm ${dirLabel(r.direction)}`,
        detail: r.message,
      });
    } catch (e: any) {
      if (await handleDeviceError(e)) return;
      setStep({ name: 'result', ok: false, title: 'Chấm công KHÔNG thành công', detail: e.message });
    }
  };

  const serverNow = now + skew;

  // ── Giao diện ──
  return (
    <KeyboardAvoidingView style={[s.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={s.header}>
        <BrandLogo variant="mark" size={40} />
        <View style={{ flex: 1 }}>
          <Text style={s.hTitle}>MÁY CHẤM CÔNG</Text>
          <Text style={s.hSub}>{deviceName || 'Ngọc An Thư MES'}</Text>
        </View>
        {(step.name === 'idle' || step.name === 'setup' || step.name === 'pending') && (
          <TouchableOpacity onPress={onExit}><Text style={s.exit}>Thoát chế độ máy chấm công</Text></TouchableOpacity>
        )}
      </View>

      <ScrollView contentContainerStyle={s.body} keyboardShouldPersistTaps="handled">
        {step.name === 'loading' && <ActivityIndicator size="large" color="#1d4ed8" />}

        {step.name === 'setup' && (
          <View style={s.card}>
            <Text style={s.title}>Đăng ký máy này làm máy chấm công của tổ</Text>
            <Text style={s.text}>Đặt tên để quản lý nhận ra máy, ví dụ “Tablet Tổ Cắt 1”. Sau khi bấm, máy sẽ hiện một mã — quản lý vào web MES → Chấm công → Thiết bị, nhập mã đó và chọn tổ để duyệt.</Text>
            <TextInput style={s.input} value={newName} onChangeText={setNewName} placeholder="Tên máy" maxLength={100} />
            {err && <Text style={s.err}>{err}</Text>}
            <TouchableOpacity style={[s.btn, busy && s.dim]} onPress={register} disabled={busy}>
              {busy ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Đăng ký máy này</Text>}
            </TouchableOpacity>
          </View>
        )}

        {step.name === 'pending' && (
          <View style={s.card}>
            <Text style={s.title}>Mã đăng ký máy</Text>
            <Text style={s.code}>{step.code}</Text>
            <Text style={s.text}>Đưa mã này cho quản lý duyệt trên web MES (Chấm công → Thiết bị). Mã có hiệu lực 15 phút. Máy sẽ tự chuyển sang màn chấm công khi được duyệt.</Text>
            <View style={s.row}><ActivityIndicator color="#1d4ed8" /><Text style={s.textMuted}>Đang chờ duyệt…</Text></View>
            <TouchableOpacity style={s.btnGhost} onPress={async () => { await kioskStorage.setPending(null); setErr(null); setStep({ name: 'setup' }); }}>
              <Text style={s.btnGhostText}>Lấy mã mới</Text>
            </TouchableOpacity>
          </View>
        )}

        {step.name === 'idle' && (
          <View style={s.card}>
            <View style={s.clockBox}>
              <Clock color="#1d4ed8" size={22} />
              <Text style={s.clock}>{fmtClock(serverNow)}</Text>
            </View>
            <Text style={s.day}>{fmtDay(serverNow)}</Text>
            <Text style={s.label}>TÀI KHOẢN</Text>
            <TextInput style={s.input} value={username} onChangeText={setUsername} placeholder="Tên đăng nhập" autoCapitalize="none" autoCorrect={false} />
            <Text style={s.label}>MẬT KHẨU</Text>
            <TextInput style={s.input} value={password} onChangeText={setPassword} placeholder="Mật khẩu" secureTextEntry onSubmitEditing={identify} />
            {err && <Text style={s.err}>{err}</Text>}
            <TouchableOpacity style={[s.btn, busy && s.dim]} onPress={identify} disabled={busy}>
              {busy ? <ActivityIndicator color="#fff" /> : <><LogIn color="#fff" size={20} /><Text style={s.btnText}>Chấm công</Text></>}
            </TouchableOpacity>
            <Text style={s.hint}>Mỗi người tự đăng nhập bằng tài khoản của mình. Chấm xong máy tự đăng xuất.</Text>
          </View>
        )}

        {step.name === 'consent' && (
          <View style={s.card}>
            <ShieldCheck color="#1d4ed8" size={32} />
            <Text style={s.title}>{step.id.employee.name} — đồng ý chụp ảnh khi chấm công</Text>
            {CONSENT_TEXT.map((t, i) => <Text key={i} style={s.bullet}>• {t}</Text>)}
            <Text style={s.textMuted}>Theo Nghị định 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân{step.id.consent_version ? ` · phiên bản ${step.id.consent_version}` : ''}</Text>
            <View style={s.row}>
              <TouchableOpacity style={[s.btnGhost, { flex: 1 }]} onPress={() => answerConsent(step.id, false)} disabled={busy}>
                <Text style={s.btnGhostText}>Không đồng ý</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.btn, { flex: 1 }, busy && s.dim]} onPress={() => answerConsent(step.id, true)} disabled={busy}>
                <Text style={s.btnText}>Đồng ý</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {step.name === 'camera' && (
          <View style={s.card}>
            <Text style={s.title}>{step.id.employee.name} — chấm {dirLabel(step.id.expected_direction)}</Text>
            <Text style={s.textMuted}>Nhìn thẳng vào camera rồi bấm chụp</Text>
            <View style={s.camBox}>
              <CameraView ref={cam} style={StyleSheet.absoluteFill} facing="front" mirror onCameraReady={() => setCamReady(true)} />
            </View>
            <TouchableOpacity style={[s.btn, (!camReady || busy) && s.dim]} onPress={() => capture(step.id)} disabled={!camReady || busy}>
              {busy ? <ActivityIndicator color="#fff" /> : <><Camera color="#fff" size={20} /><Text style={s.btnText}>Chụp & chấm công</Text></>}
            </TouchableOpacity>
            <TouchableOpacity style={s.btnGhost} onPress={toIdle}><Text style={s.btnGhostText}>Hủy</Text></TouchableOpacity>
          </View>
        )}

        {step.name === 'sending' && (
          <View style={s.card}><ActivityIndicator size="large" color="#1d4ed8" /><Text style={s.title}>Đang ghi nhận cho {step.who}…</Text></View>
        )}

        {step.name === 'result' && (
          <TouchableOpacity activeOpacity={0.9} onPress={toIdle} style={[s.card, { borderColor: step.ok ? '#16a34a' : '#dc2626', borderWidth: 2 }]}>
            {step.ok ? <CheckCircle2 color="#16a34a" size={56} /> : <XCircle color="#dc2626" size={56} />}
            <Text style={[s.title, { color: step.ok ? '#15803d' : '#b91c1c', textAlign: 'center' }]}>{step.title}</Text>
            {step.detail ? <Text style={[s.text, { textAlign: 'center' }]}>{step.detail}</Text> : null}
            <Text style={s.textMuted}>Chạm để tiếp tục</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f1f5f9' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  hTitle: { fontSize: 18, fontWeight: '800', color: '#0f172a' },
  hSub: { fontSize: 13, color: '#64748b' },
  exit: { color: '#64748b', fontSize: 13, textDecorationLine: 'underline' },
  body: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  card: { width: '100%', maxWidth: 560, backgroundColor: '#fff', borderRadius: 20, padding: 24, gap: 12, alignItems: 'stretch',
    shadowColor: '#0f172a', shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 3 },
  title: { fontSize: 22, fontWeight: '800', color: '#0f172a' },
  text: { fontSize: 16, color: '#334155', lineHeight: 23 },
  textMuted: { fontSize: 13, color: '#64748b' },
  bullet: { fontSize: 16, color: '#334155', lineHeight: 23 },
  label: { fontSize: 12, fontWeight: '700', color: '#64748b', marginTop: 4 },
  input: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 12, paddingHorizontal: 16, height: 56, fontSize: 20, backgroundColor: '#fff' },
  btn: { flexDirection: 'row', gap: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1d4ed8', borderRadius: 14, height: 60 },
  btnText: { color: '#fff', fontSize: 20, fontWeight: '800' },
  btnGhost: { alignItems: 'center', justifyContent: 'center', borderRadius: 14, height: 52, backgroundColor: '#f1f5f9' },
  btnGhostText: { color: '#334155', fontSize: 17, fontWeight: '700' },
  dim: { opacity: 0.5 },
  err: { color: '#dc2626', fontSize: 15, fontWeight: '600' },
  hint: { fontSize: 13, color: '#64748b', textAlign: 'center' },
  code: { fontSize: 56, fontWeight: '900', letterSpacing: 8, color: '#1d4ed8', textAlign: 'center', fontVariant: ['tabular-nums'] },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  clockBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  clock: { fontSize: 52, fontWeight: '800', color: '#0f172a', fontVariant: ['tabular-nums'] },
  day: { fontSize: 16, color: '#64748b', textAlign: 'center', textTransform: 'capitalize', marginBottom: 8 },
  camBox: { width: '100%', aspectRatio: 3 / 4, maxHeight: 520, borderRadius: 16, overflow: 'hidden', backgroundColor: '#0f172a' },
});
