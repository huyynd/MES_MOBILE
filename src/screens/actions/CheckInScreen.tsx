import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ScrollView, Text, TouchableOpacity, Image, Alert, ActivityIndicator } from 'react-native';
import { useAuthStore } from '@/store/authStore';
import { useNavigation } from '@react-navigation/native';
import {
  ArrowLeft, Clock, Calendar, MapPin,
  CheckCircle2, Map, History, ChevronRight,
  FileText, Activity, PlayCircle, WifiOff, RefreshCw
} from 'lucide-react-native';
import { Card } from '@/components/Card';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { scheduleApi } from '@/api/schedule';

// ─── CẤU HÌNH VỊ TRÍ NHÀ MÁY ────────────────────────────────────────────────
// Thay tọa độ này bằng vị trí GPS thật của nhà máy
const FACTORY_LOCATION = {
  latitude: 21.050012,
  longitude: 105.799348,
  radius: 5,          // Bán kính cho phép chấm công (mét)
  name: 'Xưởng Cắt Bao Bì Số 2',
};
// ─────────────────────────────────────────────────────────────────────────────

/** Tính khoảng cách (mét) giữa 2 tọa độ GPS theo công thức Haversine */
function haversineDistance(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R = 6371000; // Bán kính Trái Đất (mét)
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

type GpsStatus = 'idle' | 'loading' | 'valid' | 'too_far' | 'denied' | 'error';
type AttendanceState = 'not_checked_in' | 'checked_in' | 'checked_out';

// Ca làm việc: 07:30 - 16:30 (8 tiếng), tối thiểu làm 4 tiếng
const MIN_WORK_HOURS = 4; // Số giờ tối thiểu trước khi được phép chấm ra

export function CheckInScreen() {
  const { user } = useAuthStore();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [currentTime, setCurrentTime] = useState(new Date());

  // Dynamic shift data
  const [shiftData, setShiftData] = useState<any>(null);
  const [loadingShift, setLoadingShift] = useState(true);

  // Trạng thái chấm công: chưa vào / đã vào / đã ra
  const [attendanceState, setAttendanceState] = useState<AttendanceState>('not_checked_in');
  const [checkInTime, setCheckInTime] = useState<Date | null>(null);
  const [checkOutTime, setCheckOutTime] = useState<Date | null>(null);

  // GPS state
  const [gpsStatus, setGpsStatus] = useState<GpsStatus>('idle');
  const [userCoords, setUserCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [distanceM, setDistanceM] = useState<number | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const locationSub = useRef<Location.LocationSubscription | null>(null);

  // Parse shift times
  const shiftStartHour = shiftData ? parseInt(shiftData.start_time.split(':')[0]) : 7;
  const shiftStartMin = shiftData ? parseInt(shiftData.start_time.split(':')[1]) : 30;
  const shiftEndHour = shiftData ? parseInt(shiftData.end_time.split(':')[0]) : 16;
  const shiftEndMin = shiftData ? parseInt(shiftData.end_time.split(':')[1]) : 30;
  const shiftName = shiftData ? shiftData.name : 'Chưa xếp ca';

  useEffect(() => {
    const fetchShift = async () => {
      setLoadingShift(true);
      try {
        const dateStr = new Date().toISOString().split('T')[0];
        const ec = user?.employee_code || user?.linked_worker || '';
        const data = await scheduleApi.getTodayShiftForEmployee(ec, dateStr);
        setShiftData(data);
      } catch (e) {
        console.warn('Lỗi tải ca:', e);
      } finally {
        setLoadingShift(false);
      }
    };
    if (user) fetchShift();
  }, [user]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    startGPS();
    return () => { locationSub.current?.remove(); };
  }, []);

  const startGPS = async () => {
    setGpsStatus('loading');
    setUserCoords(null);
    setDistanceM(null);
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') { setGpsStatus('denied'); return; }
    try {
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      updatePosition(pos);
      locationSub.current = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, distanceInterval: 1 },
        updatePosition
      );
    } catch (e) { setGpsStatus('error'); }
  };

  const updatePosition = (pos: Location.LocationObject) => {
    const { latitude, longitude, accuracy: acc } = pos.coords;
    const dist = haversineDistance(latitude, longitude, FACTORY_LOCATION.latitude, FACTORY_LOCATION.longitude);
    setUserCoords({ lat: latitude, lon: longitude });
    setDistanceM(Math.round(dist));
    setAccuracy(acc ? Math.round(acc) : null);
    setGpsStatus(dist <= FACTORY_LOCATION.radius ? 'valid' : 'too_far');
  };

  const formatTime = (date: Date) =>
    `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`;

  const formatHM = (date: Date) =>
    `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;

  /** Tính số phút đã làm kể từ checkInTime đến now */
  const workedMinutes = (): number => {
    if (!checkInTime) return 0;
    return Math.floor((currentTime.getTime() - checkInTime.getTime()) / 60000);
  };

  /** Kiểm tra có đủ giờ tối thiểu chưa */
  const hasMinHours = (): boolean => workedMinutes() >= MIN_WORK_HOURS * 60;

  /** Hiển thị thời gian đã làm */
  const workedLabel = (): string => {
    const mins = workedMinutes();
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h ${String(m).padStart(2, '0')}p`;
  };

  /** Kiểm tra GPS trước khi thực hiện bất kỳ thao tác nào */
  const checkGPSBeforeAction = (): boolean => {
    if (gpsStatus !== 'valid') {
      Alert.alert(
        'Không thể chấm công',
        gpsStatus === 'loading' ? 'Đang lấy vị trí GPS, vui lòng chờ...'
          : gpsStatus === 'denied' ? 'Ứng dụng chưa được cấp quyền truy cập vị trí.'
            : gpsStatus === 'too_far' ? `Bạn đang cách nhà máy ${distanceM}m. Cần trong vòng ${FACTORY_LOCATION.radius}m.`
              : 'Không lấy được vị trí GPS. Vui lòng thử lại.',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  };
  /** Chấm VÀO CA */
  const handleCheckIn = () => {
    if (!checkGPSBeforeAction()) return;
    const now = new Date();
    const shiftStartMs = new Date(now.getFullYear(), now.getMonth(), now.getDate(), shiftStartHour, shiftStartMin).getTime();
    const lateMinutes = Math.max(0, Math.floor((now.getTime() - shiftStartMs) / 60000));
    const lateNote = lateMinutes > 0 ? `\n\n⚠️ Muộn ${lateMinutes} phút so với giờ vào ca (${String(shiftStartHour).padStart(2, '0')}:${String(shiftStartMin).padStart(2, '0')}).` : '';
    Alert.alert(
      'Xác nhận vào ca',
      `Xác nhận CHẤM VÀO CA lúc ${formatHM(now)}?${lateNote}`,
      [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Vào ca', onPress: () => { setCheckInTime(new Date()); setAttendanceState('checked_in'); } },
      ]
    );
  };

  /** Chấm RA CA */
  const handleCheckOut = () => {
    if (!checkGPSBeforeAction()) return;
    const now = new Date();
    const mins = workedMinutes();
    const h = Math.floor(mins / 60);
    const m = mins % 60;

    if (!hasMinHours()) {
      // Chưa đủ giờ — cảnh báo bắt buộc xác nhận
      const remaining = MIN_WORK_HOURS * 60 - mins;
      const rh = Math.floor(remaining / 60);
      const rm = remaining % 60;
      Alert.alert(
        '⚠️ Chưa đủ giờ làm',
        `Bạn mới làm được ${h}h ${String(m).padStart(2, '0')}p, chưa đủ ${MIN_WORK_HOURS}h tối thiểu.\n\nCòn thiếu: ${rh > 0 ? rh + 'h ' : ''}${rm}p nữa.\n\nBạn có chắc muốn chấm ra sớm? Cần giải trình lý do.`,
        [
          { text: 'Ở lại làm', style: 'cancel' },
          { text: 'Xác nhận ra sớm', style: 'destructive', onPress: () => { setCheckOutTime(new Date()); setAttendanceState('checked_out'); } },
        ]
      );
    } else {
      // Đủ giờ — xác nhận bình thường
      const shiftEndMs = new Date(now.getFullYear(), now.getMonth(), now.getDate(), shiftEndHour, shiftEndMin).getTime();
      const earlyMinutes = Math.max(0, Math.floor((shiftEndMs - now.getTime()) / 60000));
      const earlyNote = earlyMinutes > 0 ? `\n\n📌 Ra trước giờ kết ca ${earlyMinutes} phút.` : '';
      Alert.alert(
        'Xác nhận ra ca',
        `Xác nhận CHẤM RA CA lúc ${formatHM(now)}?\nĐã làm: ${h}h ${String(m).padStart(2, '0')}p.${earlyNote}`,
        [
          { text: 'Hủy', style: 'cancel' },
          { text: 'Ra ca', onPress: () => { setCheckOutTime(new Date()); setAttendanceState('checked_out'); } },
        ]
      );
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { height: 60 + insets.top, paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chấm công</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Profile Card */}
        <Card variant="elevated" style={styles.card}>
          <View style={styles.profileHeader}>
            <View style={styles.profileInfo}>
              <Image
                source={{ uri: 'https://ui-avatars.com/api/?name=NV&background=0D8ABC&color=fff' }}
                style={styles.avatar}
              />
              <View>
                <View style={styles.nameRow}>
                  <Text style={styles.name}>{user?.full_name || 'Thọ'}</Text>
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{user?.employee_code || user?.linked_worker || 'Chưa liên kết NV'}</Text>
                  </View>
                </View>
                <Text style={styles.roleText}>Công nhân cắt</Text>
              </View>
            </View>
            <View style={styles.statusBadge}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>Đang sx</Text>
            </View>
          </View>

          <View style={styles.timeInfoRow}>
            <View style={styles.timeInfoItem}>
              <Clock size={16} color="#1d4ed8" />
              <Text style={styles.timeInfoText}>
                {loadingShift ? 'Đang tải ca...' : `${shiftName}: ${String(shiftStartHour).padStart(2, '0')}:${String(shiftStartMin).padStart(2, '0')} - ${String(shiftEndHour).padStart(2, '0')}:${String(shiftEndMin).padStart(2, '0')}`}
              </Text>
            </View>
            <View style={styles.timeInfoItem}>
              <Calendar size={16} color="#64748b" />
              <Text style={styles.timeInfoTextSmall}>Thứ Hai, 18/09/2026</Text>
            </View>
          </View>
        </Card>

        {/* Live Clock Card */}
        <Card variant="elevated" style={styles.clockCard}>
          <Text style={styles.clockLabel}>THỜI GIAN THỰC</Text>
          <Text style={styles.liveClock}>{formatTime(currentTime)}</Text>

          {/* Bộ đếm giờ làm */}
          <View style={styles.progressCircle}>
            <View style={[
              styles.circleOuter,
              { borderColor: attendanceState === 'checked_in' ? '#1d4ed8' : attendanceState === 'checked_out' ? '#16a34a' : '#e2e8f0' }
            ]}>
              <View style={styles.circleInner}>
                <Text style={styles.circleLabel}>
                  {attendanceState === 'not_checked_in' ? 'Chưa vào ca'
                    : attendanceState === 'checked_in' ? 'Đang làm'
                      : 'Đã kết ca'}
                </Text>
                <Text style={[
                  styles.circleValue,
                  { color: attendanceState === 'checked_in' ? '#1d4ed8' : attendanceState === 'checked_out' ? '#16a34a' : '#94a3b8' }
                ]}>
                  {attendanceState !== 'not_checked_in' ? workedLabel() : '--:--'}
                </Text>
                <Text style={[
                  styles.circleTarget,
                  { color: hasMinHours() ? '#16a34a' : '#f59e0b' }
                ]}>
                  {attendanceState === 'not_checked_in' ? `Ca: ${String(shiftStartHour).padStart(2, '0')}:${String(shiftStartMin).padStart(2, '0')} - ${String(shiftEndHour).padStart(2, '0')}:${String(shiftEndMin).padStart(2, '0')}`
                    : hasMinHours() ? `✓ Đủ ${MIN_WORK_HOURS}h tối thiểu`
                      : `Min: ${MIN_WORK_HOURS}h`}
                </Text>
              </View>
            </View>
          </View>

          {/* Trạng thái vào/ra ca */}
          <View style={styles.checkinStatusBox}>
            {/* Hàng VÀO CA */}
            <View style={styles.checkinStatusHeader}>
              <View style={styles.checkinStatusLeft}>
                <View style={[
                  styles.statusIconDot,
                  { backgroundColor: attendanceState !== 'not_checked_in' ? '#16a34a' : '#e2e8f0' }
                ]}>
                  <CheckCircle2 size={12} color={attendanceState !== 'not_checked_in' ? '#fff' : '#94a3b8'} />
                </View>
                <Text style={styles.checkinStatusTitle}>Vào ca</Text>
              </View>
              {checkInTime ? (
                <View style={styles.checkinTimeBadge}>
                  <CheckCircle2 size={12} color="#15803d" />
                  <Text style={styles.checkinTimeText}>{formatHM(checkInTime)}</Text>
                </View>
              ) : (
                <Text style={styles.checkinTimePending}>Chưa chấm</Text>
              )}
            </View>

            {/* Đường nối */}
            <View style={styles.statusConnector} />

            {/* Hàng RA CA */}
            <View style={styles.checkinStatusHeader}>
              <View style={styles.checkinStatusLeft}>
                <View style={[
                  styles.statusIconDot,
                  { backgroundColor: attendanceState === 'checked_out' ? '#1d4ed8' : '#e2e8f0' }
                ]}>
                  <Clock size={12} color={attendanceState === 'checked_out' ? '#fff' : '#94a3b8'} />
                </View>
                <Text style={styles.checkinStatusTitle}>Ra ca</Text>
              </View>
              {checkOutTime ? (
                <View style={[styles.checkinTimeBadge, { backgroundColor: '#dbeafe' }]}>
                  <CheckCircle2 size={12} color="#1d4ed8" />
                  <Text style={[styles.checkinTimeText, { color: '#1d4ed8' }]}>{formatHM(checkOutTime)}</Text>
                </View>
              ) : (
                <Text style={styles.checkinTimePending}>Chưa chấm</Text>
              )}
            </View>

            {attendanceState === 'checked_in' && (
              <View style={styles.locationRow}>
                <MapPin size={14} color="#1d4ed8" />
                <Text style={styles.locationText}>{FACTORY_LOCATION.name}</Text>
              </View>
            )}
          </View>
        </Card>

        {/* GPS Vị trí thật */}
        <Card variant="elevated" style={styles.mapCard}>
          <View style={styles.mapHeader}>
            <View style={styles.mapHeaderLeft}>
              <View style={[
                styles.mapIconBox,
                { backgroundColor: gpsStatus === 'valid' ? '#16a34a' : gpsStatus === 'too_far' ? '#ef4444' : '#64748b' }
              ]}>
                <MapPin size={18} color="#ffffff" />
              </View>
              <View>
                <Text style={styles.mapTitle}>Vị trí của bạn</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  {gpsStatus === 'loading' ? (
                    <ActivityIndicator size={10} color="#64748b" style={{ marginRight: 4 }} />
                  ) : (
                    <View style={[
                      styles.pingDot,
                      { backgroundColor: gpsStatus === 'valid' ? '#16a34a' : gpsStatus === 'too_far' ? '#ef4444' : '#94a3b8' }
                    ]} />
                  )}
                  <Text style={[
                    styles.mapSubtitle,
                    { color: gpsStatus === 'valid' ? '#16a34a' : gpsStatus === 'too_far' ? '#ef4444' : '#64748b' }
                  ]}>
                    {gpsStatus === 'loading' && 'Đang lấy vị trí GPS...'}
                    {gpsStatus === 'valid' && 'Trong vùng chấm công hợp lệ ✓'}
                    {gpsStatus === 'too_far' && `Ngoài vùng cho phép (${distanceM}m)`}
                    {gpsStatus === 'denied' && 'Chưa cấp quyền vị trí'}
                    {gpsStatus === 'error' && 'Lỗi GPS'}
                    {gpsStatus === 'idle' && 'Chưa xác định'}
                  </Text>
                </View>
              </View>
            </View>
            <TouchableOpacity style={styles.refreshBtn} onPress={startGPS}>
              <RefreshCw size={14} color="#1d4ed8" />
              <Text style={styles.refreshText}>Làm mới</Text>
            </TouchableOpacity>
          </View>

          {/* GPS Info Box */}
          <View style={[
            styles.gpsInfoBox,
            { borderColor: gpsStatus === 'valid' ? '#bbf7d0' : gpsStatus === 'too_far' ? '#fecaca' : '#e2e8f0' }
          ]}>
            {gpsStatus === 'loading' ? (
              <View style={styles.gpsLoadingRow}>
                <ActivityIndicator size="small" color="#1d4ed8" />
                <Text style={styles.gpsLoadingText}>Đang định vị GPS...</Text>
              </View>
            ) : gpsStatus === 'denied' ? (
              <View style={styles.gpsDeniedRow}>
                <WifiOff size={20} color="#ef4444" />
                <Text style={styles.gpsDeniedText}>Vui lòng cấp quyền vị trí trong Cài đặt</Text>
              </View>
            ) : userCoords ? (
              <View>
                <View style={styles.gpsCoordRow}>
                  <Text style={styles.gpsCoordLabel}>Tọa độ của bạn:</Text>
                  <Text style={styles.gpsCoordValue}>
                    {userCoords.lat.toFixed(5)}° N, {userCoords.lon.toFixed(5)}° E
                  </Text>
                </View>
                <View style={styles.gpsCoordRow}>
                  <Text style={styles.gpsCoordLabel}>Độ chính xác GPS:</Text>
                  <Text style={styles.gpsCoordValue}>±{accuracy ?? '?'}m</Text>
                </View>
                <View style={[styles.gpsDistanceRow, {
                  backgroundColor: gpsStatus === 'valid' ? '#dcfce7' : '#fee2e2'
                }]}>
                  <Text style={[styles.gpsDistanceMain, {
                    color: gpsStatus === 'valid' ? '#15803d' : '#dc2626'
                  }]}>
                    {distanceM}m
                  </Text>
                  <Text style={[styles.gpsDistanceSub, {
                    color: gpsStatus === 'valid' ? '#16a34a' : '#ef4444'
                  }]}>
                    {gpsStatus === 'valid'
                      ? `✓ Trong vùng cho phép (≤${FACTORY_LOCATION.radius}m)`
                      : `✗ Cần tiến vào trong vòng ${FACTORY_LOCATION.radius}m`}
                  </Text>
                </View>
              </View>
            ) : (
              <View style={styles.gpsDeniedRow}>
                <Activity size={20} color="#64748b" />
                <Text style={styles.gpsDeniedText}>Chưa xác định vị trí</Text>
              </View>
            )}
          </View>

          <View style={styles.mapFooter}>
            <View style={styles.mapFooterItem}>
              <Text style={styles.mapFooterLabel}>Khoảng cách nhà máy:</Text>
              <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                <Text style={[styles.mapFooterValue, {
                  color: gpsStatus === 'valid' ? '#16a34a' : gpsStatus === 'too_far' ? '#ef4444' : '#64748b'
                }]}>
                  {distanceM !== null ? `${distanceM}m` : '--'}
                </Text>
                <Text style={styles.mapFooterSub}> / Cho phép {FACTORY_LOCATION.radius}m</Text>
              </View>
            </View>
            <View style={styles.mapFooterItem}>
              <Text style={styles.mapFooterLabel}>Phương thức xác thực:</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                <MapPin size={14} color="#1d4ed8" />
                <Text style={styles.mapFooterMethod}>GPS Geofence</Text>
              </View>
            </View>
          </View>
        </Card>

        {/* Nút chấm công — thay đổi theo trạng thái */}
        {attendanceState === 'not_checked_in' && (
          <TouchableOpacity
            style={[
              styles.actionBtn,
              styles.actionBtnCheckIn,
              gpsStatus !== 'valid' && styles.actionBtnDisabled,
            ]}
            onPress={handleCheckIn}
          >
            {gpsStatus === 'loading' ? (
              <ActivityIndicator size={24} color="#ffffff" />
            ) : (
              <PlayCircle size={24} color="#ffffff" />
            )}
            <Text style={styles.actionBtnText}>
              {gpsStatus === 'loading' ? 'Đang định vị...'
                : gpsStatus === 'valid' ? '▶ CHẤM VÀO CA'
                  : gpsStatus === 'too_far' ? `Quá xa nhà máy (${distanceM}m)`
                    : 'Chưa xác định vị trí'}
            </Text>
          </TouchableOpacity>
        )}

        {attendanceState === 'checked_in' && (
          <TouchableOpacity
            style={[
              styles.actionBtn,
              styles.actionBtnCheckOut,
              gpsStatus !== 'valid' && styles.actionBtnDisabled,
            ]}
            onPress={handleCheckOut}
          >
            {gpsStatus === 'loading' ? (
              <ActivityIndicator size={24} color="#ffffff" />
            ) : (
              <CheckCircle2 size={24} color="#ffffff" />
            )}
            <Text style={styles.actionBtnText}>
              {gpsStatus === 'loading' ? 'Đang định vị...'
                : gpsStatus === 'valid'
                  ? (hasMinHours() ? '■ CHẤM RA CA' : `■ RA SỚM (còn ${MIN_WORK_HOURS}h - ${Math.floor(workedMinutes() / 60)}h${workedMinutes() % 60}p)`)
                  : gpsStatus === 'too_far' ? `Quá xa nhà máy (${distanceM}m)`
                    : 'Chưa xác định vị trí'}
            </Text>
          </TouchableOpacity>
        )}

        {attendanceState === 'checked_out' && (
          <View style={[styles.actionBtn, styles.actionBtnDone, { opacity: 1 }]}>
            <CheckCircle2 size={24} color="#ffffff" />
            <Text style={styles.actionBtnText}>✓ ĐÃ GHI NHẬN RA CA</Text>
          </View>
        )}

        {/* Ghi chú GPS */}
        {attendanceState !== 'checked_out' && (
          <View style={styles.actionNoteRow}>
            <View style={[styles.pingDotSmall, {
              backgroundColor: gpsStatus === 'valid' ? '#16a34a' : '#94a3b8'
            }]} />
            <Text style={[styles.actionNoteText, {
              color: gpsStatus === 'valid' ? '#16a34a' : '#64748b'
            }]}>
              {gpsStatus === 'valid'
                ? `GPS xác thực: Trong vùng ${FACTORY_LOCATION.name}`
                : 'Cần đứng trong vòng 5m của nhà máy để chấm công'}
            </Text>
          </View>
        )}

        {/* Cảnh báo chưa đủ giờ khi đang trong ca */}
        {attendanceState === 'checked_in' && !hasMinHours() && (
          <View style={styles.earlyWarningBox}>
            <Clock size={14} color="#b45309" />
            <Text style={styles.earlyWarningText}>
              Chưa đủ {MIN_WORK_HOURS}h tối thiểu — Đã làm {workedLabel()}
            </Text>
          </View>
        )}

        {/* History Section */}
        <Card variant="elevated" style={styles.historyCard}>
          <View style={styles.historyHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <History size={18} color="#1d4ed8" />
              <Text style={styles.historyTitle}>Lịch sử tuần này</Text>
            </View>
            <Text style={styles.historyLink}>Chi tiết</Text>
          </View>

          <View style={styles.historyList}>
            <View style={styles.historyItem}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                  <Text style={styles.historyItemTitle}>Hôm nay (18/09)</Text>
                  <View style={styles.gpsTag}>
                    <Text style={styles.gpsTagText}>GPS Chuẩn (±3m)</Text>
                  </View>
                </View>
                <Text style={styles.historyItemSub}>Vào: 07:28 (Cổng Xưởng 2) — Ra: Đang làm</Text>
              </View>
              <View style={styles.statusBadgeBlue}>
                <Text style={styles.statusBadgeBlueText}>Đủ giờ</Text>
              </View>
            </View>

            <View style={styles.historyItemLow}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                  <Text style={styles.historyItemTitle}>Hôm qua (17/09)</Text>
                </View>
                <Text style={styles.historyItemSub}>Vào: 07:30 — Ra: 16:35 (08h05)</Text>
              </View>
              <View style={styles.statusBadgeGreen}>
                <Text style={styles.statusBadgeGreenText}>Đạt chuẩn</Text>
              </View>
            </View>

            <View style={styles.historyItemLow}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                  <Text style={styles.historyItemTitle}>Thứ Bảy (16/09)</Text>
                </View>
                <Text style={styles.historyItemSub}>Vào: 07:45 — Ra: 16:30 (07h45)</Text>
              </View>
              <View style={styles.statusBadgeRed}>
                <Text style={styles.statusBadgeRedText}>Muộn 15p</Text>
              </View>
            </View>
          </View>
        </Card>

        {/* Action Grid */}
        <View style={styles.actionGrid}>
          <TouchableOpacity style={styles.gridBtn} onPress={() => navigation.navigate('AttendanceAppeal' as never)}>
            <View style={[styles.gridIconBox, { backgroundColor: '#dbeafe' }]}>
              <FileText size={18} color="#1d4ed8" />
            </View>
            <Text style={styles.gridBtnTitle}>Giải trình công</Text>
            <Text style={styles.gridBtnSubBlue}>1 đơn duyệt</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.gridBtn} onPress={() => navigation.navigate('LeaveRequest' as never)}>
            <View style={[styles.gridIconBox, { backgroundColor: '#dcfce7' }]}>
              <Clock size={18} color="#16a34a" />
            </View>
            <Text style={styles.gridBtnTitle}>Nghỉ phép</Text>
            <Text style={styles.gridBtnSub}>Còn 12 ngày</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.gridBtn} onPress={() => navigation.navigate('WorkSchedule' as never)}>
            <View style={[styles.gridIconBox, { backgroundColor: '#e0e7ff' }]}>
              <Calendar size={18} color="#4f46e5" />
            </View>
            <Text style={styles.gridBtnTitle}>Lịch làm việc</Text>
            <Text style={styles.gridBtnSubIndigo}>Ca 1 suốt tuần</Text>
          </TouchableOpacity>
        </View>

        {/* Safety Policy */}
        <View style={styles.policyCard}>
          <View style={styles.policyIcon}>
            <CheckCircle2 size={20} color="#1d4ed8" />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.policyTitle}>Quy định chấm công an toàn</Text>
            <Text style={styles.policySub}>Nhớ thực hiện chấm công trước giờ vào ca</Text>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    flex: 1,
  },
  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  scrollContent: {
    padding: 16,
  },
  card: {
    padding: 16,
    marginBottom: 16,
    borderRadius: 16,
  },
  profileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginRight: 8,
  },
  badge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#475569',
  },
  roleText: {
    fontSize: 13,
    color: '#475569',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dbeafe',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#1d4ed8',
    marginRight: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#1d4ed8',
  },
  timeInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  timeInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeInfoText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0f172a',
    marginLeft: 6,
  },
  timeInfoTextSmall: {
    fontSize: 12,
    color: '#475569',
    marginLeft: 6,
  },
  clockCard: {
    padding: 16,
    marginBottom: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  clockLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748b',
    letterSpacing: 1,
    marginBottom: 4,
  },
  liveClock: {
    fontSize: 32,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -1,
  },
  progressCircle: {
    marginVertical: 20,
  },
  circleOuter: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 8,
    borderColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleInner: {
    alignItems: 'center',
  },
  circleLabel: {
    fontSize: 12,
    color: '#64748b',
  },
  circleValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0f172a',
    marginVertical: 4,
  },
  circleTarget: {
    fontSize: 12,
    fontWeight: '600',
    color: '#16a34a',
  },
  checkinStatusBox: {
    width: '100%',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
  },
  checkinStatusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  checkinStatusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkinStatusTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
    marginLeft: 8,
  },
  checkinTimeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  checkinTimeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#15803d',
    marginLeft: 4,
  },
  checkinTimePending: {
    fontSize: 11,
    fontWeight: '500',
    color: '#94a3b8',
    fontStyle: 'italic',
  },
  statusIconDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusConnector: {
    width: 2,
    height: 12,
    backgroundColor: '#e2e8f0',
    marginLeft: 10,
    marginBottom: 6,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 28,
  },
  locationText: {
    fontSize: 12,
    color: '#475569',
    marginLeft: 6,
  },
  mapCard: {
    padding: 16,
    marginBottom: 16,
    borderRadius: 16,
  },
  mapHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  mapHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mapIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#16a34a',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  mapTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  pingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#16a34a',
    marginRight: 4,
  },
  mapSubtitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#16a34a',
  },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
  },
  refreshText: {
    fontSize: 11,
    color: '#1d4ed8',
    marginLeft: 4,
  },
  mapVisualizer: {
    height: 140,
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    marginBottom: 12,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  factoryZone: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: '#1d4ed8',
    borderStyle: 'dashed',
    backgroundColor: 'rgba(29, 78, 216, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  factoryCenter: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  factoryLabel: {
    position: 'absolute',
    bottom: -20,
    fontSize: 10,
    fontWeight: '600',
    color: '#475569',
  },
  userPin: {
    position: 'absolute',
    top: 40,
    right: 40,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#16a34a',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
  userPinLabel: {
    position: 'absolute',
    top: 66,
    right: 16,
    backgroundColor: '#16a34a',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  userPinLabelText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#ffffff',
  },
  gpsBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 8,
  },
  gpsBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#475569',
    marginLeft: 4,
  },
  coordBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 8,
  },
  coordText: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: '#475569',
  },
  mapFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  mapFooterItem: {
    flex: 1,
    backgroundColor: '#f8fafc',
    padding: 8,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  mapFooterLabel: {
    fontSize: 10,
    color: '#64748b',
  },
  mapFooterValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#16a34a',
  },
  mapFooterSub: {
    fontSize: 10,
    color: '#64748b',
  },
  mapFooterMethod: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1d4ed8',
    marginLeft: 4,
  },
  // GPS Info Box styles
  gpsInfoBox: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    backgroundColor: '#f8fafc',
  },
  gpsLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  gpsLoadingText: {
    fontSize: 13,
    color: '#64748b',
    marginLeft: 10,
  },
  gpsDeniedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  gpsDeniedText: {
    fontSize: 13,
    color: '#64748b',
    marginLeft: 8,
  },
  gpsCoordRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  gpsCoordLabel: {
    fontSize: 11,
    color: '#64748b',
  },
  gpsCoordValue: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0f172a',
    fontFamily: 'monospace',
  },
  gpsDistanceRow: {
    marginTop: 8,
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
  },
  gpsDistanceMain: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -1,
  },
  gpsDistanceSub: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  actionBtn: {
    height: 56,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 8,
    backgroundColor: '#64748b',
    shadowColor: '#64748b',
  },
  actionBtnCheckIn: {
    backgroundColor: '#1d4ed8',
    shadowColor: '#1d4ed8',
  },
  actionBtnCheckOut: {
    backgroundColor: '#ef4444',
    shadowColor: '#ef4444',
  },
  actionBtnDone: {
    backgroundColor: '#16a34a',
    shadowColor: '#16a34a',
  },
  actionBtnDisabled: {
    backgroundColor: '#94a3b8',
    shadowColor: '#94a3b8',
  },
  actionBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
    marginLeft: 8,
  },
  actionNoteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  pingDotSmall: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#16a34a',
    marginRight: 6,
  },
  actionNoteText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#16a34a',
  },
  earlyWarningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#fbbf24',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 16,
    gap: 8,
  },
  earlyWarningText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#b45309',
    flex: 1,
    marginLeft: 6,
  },
  historyCard: {
    padding: 16,
    marginBottom: 16,
    borderRadius: 16,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  historyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    marginLeft: 8,
  },
  historyLink: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1d4ed8',
  },
  historyList: {
    gap: 8,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    padding: 12,
    borderRadius: 8,
  },
  historyItemLow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 8,
  },
  historyItemTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0f172a',
    marginRight: 8,
  },
  gpsTag: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  gpsTagText: {
    fontSize: 9,
    color: '#15803d',
    fontWeight: '600',
  },
  historyItemSub: {
    fontSize: 11,
    color: '#475569',
  },
  statusBadgeBlue: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeBlueText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#1d4ed8',
  },
  statusBadgeGreen: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeGreenText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#15803d',
  },
  statusBadgeRed: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeRedText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#b91c1c',
  },
  actionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  gridBtn: {
    flex: 1,
    backgroundColor: '#ffffff',
    marginHorizontal: 4,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  gridIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  gridBtnTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: 2,
  },
  gridBtnSubBlue: {
    fontSize: 10,
    color: '#1d4ed8',
    fontWeight: '500',
  },
  gridBtnSub: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '500',
  },
  gridBtnSubIndigo: {
    fontSize: 10,
    color: '#4f46e5',
    fontWeight: '500',
  },
  policyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  policyIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  policyTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 2,
  },
  policySub: {
    fontSize: 12,
    color: '#475569',
  }
});
