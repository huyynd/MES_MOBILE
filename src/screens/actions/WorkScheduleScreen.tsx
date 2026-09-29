import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Image, Modal, Alert, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, Search, Calendar as CalendarIcon, Filter, Plus, Clock, ChevronLeft, ChevronRight, X } from 'lucide-react-native';
import { Button } from '@/components/Button';
import { useAuthStore } from '@/store/authStore';
import { scheduleApi } from '@/api/schedule';
import apiClient from '@/api/client';
import { reportsApi } from '@/api/reports';

export function WorkScheduleScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  
  // Real Account Role
  const { user } = useAuthStore();
  const isManager = user?.is_admin || user?.role_name?.toLowerCase().includes('quản lý') || user?.role_name?.toLowerCase().includes('manager');

  // Generate current week
  const [weekDays, setWeekDays] = useState<any[]>([]);
  const [weekRangeStr, setWeekRangeStr] = useState('');
  const [selectedDay, setSelectedDay] = useState('');
  
  // Data States
  const [loading, setLoading] = useState(true);
  const [employeesData, setEmployeesData] = useState<any[]>([]);
  const [shiftsData, setShiftsData] = useState<any[]>([]);
  const [schedulesData, setSchedulesData] = useState<any[]>([]);
  
  // Detail Modal State
  const [selectedEmpDetail, setSelectedEmpDetail] = useState<any>(null);

  useEffect(() => {
    initWeekAndFetch();
  }, []);

  const initWeekAndFetch = () => {
    const today = new Date();
    const currentDay = today.getDay();
    const distance = currentDay === 0 ? 6 : currentDay - 1;
    const monday = new Date(today);
    monday.setDate(today.getDate() - distance);

    const week = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const isoDate = `${yyyy}-${mm}-${dd}`;
      week.push({
        id: i + 1,
        day: i === 6 ? 'CN' : `T${i + 2}`,
        date: `${dd}/${mm}`,
        isoDate: isoDate,
        dayNum: dd,
      });
    }
    setWeekDays(week);
    
    const todayYYYY = today.getFullYear();
    const todayMM = String(today.getMonth() + 1).padStart(2, '0');
    const todayDD = String(today.getDate()).padStart(2, '0');
    setSelectedDay(`${todayYYYY}-${todayMM}-${todayDD}`);
    
    setWeekRangeStr(`Tuần ${week[0].date} - ${week[6].date}, ${monday.getFullYear()}`);
    
    fetchData(week[0].isoDate, week[6].isoDate);
  };

  const fetchData = async (from: string, to: string) => {
    try {
      setLoading(true);
      const res = await scheduleApi.getSchedules(from, to);
      setShiftsData(res.shifts);
      setSchedulesData(res.schedules);

      let emps: any[] = [];
      try {
        const empResponse = await apiClient.get('/employees');
        emps = empResponse.data?.data || empResponse.data || [];
      } catch (err) {
        console.log('Error fetching /employees:', err instanceof Error ? err.message : String(err));
      }

      // Fallback: If APIs fail, extract unique employees from schedules
      if (!emps || emps.length === 0) {
        const uniqueCodes = Array.from(new Set(res.schedules.map((s: any) => s.employee_code).filter(Boolean)));
        emps = uniqueCodes.map((code: any) => {
          const s = res.schedules.find((x: any) => x.employee_code === code);
          return { employee_code: code, name: s.employee_name || code };
        });
        
        // Also add those who only have name but no code
        const uniqueNames = Array.from(new Set(res.schedules.filter((s: any) => !s.employee_code).map((s: any) => s.employee_name).filter(Boolean)));
        uniqueNames.forEach((name: any) => {
          if (!emps.find(e => e.name === name)) {
            emps.push({ employee_code: name, name: name });
          }
        });
      }

      setEmployeesData(emps);
    } catch (e) {
      console.log('Error fetching schedules', e);
    } finally {
      setLoading(false);
    }
  };

  // Build mapped employees
  const mappedEmployees = employeesData.map((emp, index) => {
    const empName = emp.name || emp.full_name || 'Không tên';
    const empCode = emp.employee_code || emp.code;
    
    const empSchedules = schedulesData.filter(s => (s.employee_code && s.employee_code === empCode) || (s.employee_name && s.employee_name === empName));
    const scheduleObj: Record<string, any> = {};
    weekDays.forEach(day => {
        const sched = empSchedules.find(s => s.work_date && s.work_date.split('T')[0] === day.isoDate);
        if (sched) {
            const shift = shiftsData.find(sh => sh.id === sched.shift_id || sh.shift_code === sched.shift_id);
            if (shift) {
               let color = '#bfdbfe';
               let code = shift.name ? shift.name.charAt(0).toUpperCase() : 'S';
               if (shift.name?.toLowerCase().includes('chiều') || shift.name?.includes('Ca 2')) { color = '#fed7aa'; code = 'C2'; }
               if (shift.name?.toLowerCase().includes('đêm') || shift.name?.includes('Ca 3')) { color = '#bbf7d0'; code = 'C3'; }
               if (shift.name?.includes('Ca 1')) { code = 'C1'; }
               
               scheduleObj[day.isoDate] = { shift: shift.name, color, code, ...sched, shift_details: shift };
            } else {
               // Fallback if shift details not found in master data
               scheduleObj[day.isoDate] = { shift: sched.shift_code || 'Ca', color: '#e2e8f0', code: '?', ...sched };
            }
        } else {
            scheduleObj[day.isoDate] = null;
        }
    });
    return { 
      id: emp.id || empCode || `emp-${index}`, 
      name: empName, 
      role: emp.position || emp.role || 'Nhân viên', 
      avatar: emp.avatar || 'https://i.pravatar.cc/150?u=' + index, 
      schedule: scheduleObj 
    };
  });

  const [showRegisterModal, setShowRegisterModal] = useState(false);

  let filteredShifts: any[] = [];
  if (user && !isManager) {
    const myEmp = mappedEmployees.find(e => 
      (user.employee_code && e.id === user.employee_code) || 
      (user.linked_worker && e.name === user.linked_worker) ||
      ((user as any).name && e.name === (user as any).name)
    );
    
    if (myEmp && myEmp.schedule && myEmp.schedule[selectedDay]) {
      const s = myEmp.schedule[selectedDay];
      const shiftName = s.shift;
      const start = s.shift_details?.start_time?.slice(0, 5) || '';
      const end = s.shift_details?.end_time?.slice(0, 5) || '';
      const timeRange = (start && end) ? `${start} - ${end}` : '';
      
      filteredShifts.push({
        id: s.id || '1',
        date: s.work_date?.split('T')[0] || selectedDay,
        shift: `${shiftName}${timeRange ? ` (${timeRange})` : ''}`,
        role: myEmp.role,
        time: timeRange ? `8:00h` : '',
        color: s.color || '#f1f5f9'
      });
    }
  }

  const handleRegisterShift = () => {
    setShowRegisterModal(false);
    Alert.alert('Thành công', 'Đã lưu đăng ký ca làm việc');
  };

  const renderManagerView = () => (
    <>
      <View style={styles.toolbar}>
        <View style={styles.searchBox}>
          <Search size={18} color="#64748b" />
          <TextInput placeholder="Tìm kiếm nhân viên..." style={styles.searchInput} placeholderTextColor="#94a3b8" />
        </View>
        <TouchableOpacity style={styles.filterBtn}>
          <Filter size={18} color="#3b82f6" />
        </TouchableOpacity>
      </View>
      <View style={styles.dateSelector}>
        <CalendarIcon size={20} color="#3b82f6" />
        <Text style={styles.dateSelectorText}>{weekRangeStr}</Text>
      </View>
      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {mappedEmployees.map((emp) => (
            <View key={emp.id} style={styles.employeeCard}>
              <View style={styles.empHeader}>
                <Image source={{ uri: emp.avatar }} style={styles.avatar} />
                <View style={styles.empInfo}>
                  <Text style={styles.empName}>{emp.name}</Text>
                  <Text style={styles.empRole}>{emp.role}</Text>
                </View>
                <TouchableOpacity style={styles.detailBtn} onPress={() => setSelectedEmpDetail(emp)}>
                  <Text style={styles.detailBtnText}>Chi tiết</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.scheduleGrid}>
                {weekDays.map((day) => {
                  const shiftData = emp.schedule[day.isoDate];
                  return (
                    <View key={day.id} style={styles.dayCol}>
                      <Text style={styles.dayLabelGrid}>{day.day}</Text>
                      {shiftData ? (
                        <View style={[styles.shiftBadge, { backgroundColor: shiftData.color }]}>
                          <Text style={styles.shiftCode}>{shiftData.code}</Text>
                        </View>
                      ) : (
                        <View style={styles.emptyBadge}>
                          <Text style={styles.emptyCode}>-</Text>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      {/* Chi tiết ca làm Modal */}
      <Modal visible={!!selectedEmpDetail} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '80%' }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={styles.modalTitle}>Chi tiết ca làm</Text>
              <TouchableOpacity onPress={() => setSelectedEmpDetail(null)}>
                <X size={24} color="#64748b" />
              </TouchableOpacity>
            </View>
            
            {selectedEmpDetail && (
              <>
                <View style={styles.empHeader}>
                  <Image source={{ uri: selectedEmpDetail.avatar }} style={styles.avatar} />
                  <View style={styles.empInfo}>
                    <Text style={styles.empName}>{selectedEmpDetail.name}</Text>
                    <Text style={styles.empRole}>{selectedEmpDetail.role}</Text>
                  </View>
                </View>

                <ScrollView showsVerticalScrollIndicator={false}>
                  {weekDays.map((day) => {
                    const shiftData = selectedEmpDetail.schedule[day.isoDate];
                    if (!shiftData) return null;
                    return (
                      <View key={day.id} style={[styles.shiftCard, { backgroundColor: shiftData.color, marginBottom: 12 }]}>
                        <View style={styles.timeRow}>
                          <Clock size={14} color="#475569" />
                          <Text style={styles.timeText}>{shiftData.shift_details?.start_time} - {shiftData.shift_details?.end_time}</Text>
                        </View>
                        <Text style={styles.shiftTitle}>{shiftData.shift} ({day.date})</Text>
                        {shiftData.check_in_at && (
                          <Text style={styles.shiftDuration}>Check-in: {new Date(shiftData.check_in_at).toLocaleTimeString()}</Text>
                        )}
                        {shiftData.check_out_at && (
                          <Text style={styles.shiftDuration}>Check-out: {new Date(shiftData.check_out_at).toLocaleTimeString()}</Text>
                        )}
                      </View>
                    );
                  })}
                  {weekDays.every(day => !selectedEmpDetail.schedule[day.isoDate]) && (
                    <Text style={{ textAlign: 'center', color: '#64748b', marginTop: 20 }}>Không có ca làm việc nào trong tuần này.</Text>
                  )}
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>
    </>
  );

  const renderWorkerView = () => (
    <>
      <View style={styles.calendarContainer}>
        <Text style={styles.monthText}>Tháng 9, 2026</Text>
        <View style={styles.weekRow}>
          <TouchableOpacity style={styles.navBtn}>
            <ChevronLeft size={20} color="#94a3b8" />
          </TouchableOpacity>
          <View style={styles.daysContainer}>
            {weekDays.map((item) => {
              const isActive = selectedDay === item.isoDate;
              return (
                <TouchableOpacity 
                  key={item.id} 
                  style={styles.dayColWorker}
                  onPress={() => setSelectedDay(item.isoDate)}
                >
                  <Text style={[styles.dayLabel, isActive && styles.dayLabelActive]}>{item.day[0]}</Text>
                  <View style={[styles.dateCircle, isActive && styles.dateCircleActive]}>
                    <Text style={[styles.dateText, isActive && styles.dateTextActive]}>{item.dayNum}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
          <TouchableOpacity style={styles.navBtn}>
            <ChevronRight size={20} color="#94a3b8" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {filteredShifts.length > 0 ? (
          filteredShifts.map((item) => (
            <View key={item.id} style={[styles.shiftCard, { backgroundColor: item.color }]}>
              {item.color === '#fed7aa' || item.color === '#bbf7d0' ? (
                 <View style={styles.timeRow}>
                    <Clock size={14} color="#475569" />
                    <Text style={styles.timeText}>{item.shift.split('(')[1]?.replace(')', '') || item.shift}</Text>
                 </View>
              ) : null}
              <Text style={styles.shiftTitle}>{item.shift.split(' (')[0]}</Text>
              <Text style={styles.shiftRole}>{item.role}</Text>
              <Text style={styles.shiftDuration}>{item.time}</Text>
            </View>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTextWorker}>Không có ca làm việc nào trong ngày này</Text>
          </View>
        )}
      </ScrollView>

      <TouchableOpacity 
        style={[styles.fab, { bottom: Math.max(insets.bottom, 16) }]} 
        onPress={() => setShowRegisterModal(true)}
      >
        <Plus size={24} color="#ffffff" />
      </TouchableOpacity>

      {/* Modal đăng ký ca */}
      <Modal visible={showRegisterModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Đăng ký ca làm việc</Text>
            
            <Text style={styles.inputLabel}>Chọn ngày</Text>
            <View style={styles.fakeInput}>
              <Text style={styles.fakeInputText}>{selectedDay}/2026</Text>
            </View>
            
            <Text style={styles.inputLabel}>Chọn ca</Text>
            <View style={styles.fakeInput}>
              <Text style={styles.fakeInputText}>Ca Sáng (06:00 - 14:00)</Text>
            </View>

            <View style={styles.modalActions}>
              <Button title="Hủy" variant="outline" style={[styles.actionBtn, { marginRight: 8 }]} onPress={() => setShowRegisterModal(false)} />
              <Button title="Đăng ký" style={styles.actionBtn} onPress={handleRegisterShift} />
            </View>
          </View>
        </View>
      </Modal>
    </>
  );

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) }]}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color="#0f172a" />
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
           <Text style={styles.headerTitle}>Lịch làm việc</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {isManager ? renderManagerView() : renderWorkerView()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 12, backgroundColor: '#ffffff',
    borderBottomWidth: 1, borderBottomColor: '#f1f5f9'
  },
  iconBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
  headerCenter: { flex: 1, alignItems: 'center', paddingRight: 40 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
  
  // Manager Styles
  toolbar: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12, backgroundColor: '#ffffff' },
  searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9', borderRadius: 12, paddingHorizontal: 12, height: 44, gap: 8 },
  searchInput: { flex: 1, fontSize: 15, color: '#0f172a' },
  filterBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#eff6ff', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#bfdbfe' },
  dateSelector: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 12, backgroundColor: '#ffffff', gap: 8 },
  dateSelectorText: { fontSize: 15, fontWeight: '600', color: '#1e293b' },
  content: { padding: 16, paddingBottom: 100 },
  employeeCard: { backgroundColor: '#ffffff', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#64748b', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  empHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  avatar: { width: 44, height: 44, borderRadius: 22, marginRight: 12, backgroundColor: '#e2e8f0' },
  empInfo: { flex: 1 },
  empName: { fontSize: 16, fontWeight: '700', color: '#0f172a', marginBottom: 4 },
  empRole: { fontSize: 13, color: '#64748b', fontWeight: '500' },
  detailBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: '#f1f5f9' },
  detailBtnText: { fontSize: 13, color: '#3b82f6', fontWeight: '600' },
  scheduleGrid: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#f8fafc', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#f1f5f9' },
  dayCol: { alignItems: 'center', gap: 8 },
  dayLabelGrid: { fontSize: 12, color: '#64748b', fontWeight: '600' },
  shiftBadge: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  shiftCode: { fontSize: 14, fontWeight: '700', color: '#1e293b' },
  emptyBadge: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#e2e8f0', borderStyle: 'dashed' },
  emptyCode: { fontSize: 14, fontWeight: '600', color: '#94a3b8' },

  // Worker Styles
  calendarContainer: { paddingHorizontal: 16, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', backgroundColor: '#ffffff' },
  monthText: { fontSize: 13, color: '#64748b', fontWeight: '500', marginBottom: 16 },
  weekRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  navBtn: { padding: 4 },
  daysContainer: { flexDirection: 'row', flex: 1, justifyContent: 'space-between', paddingHorizontal: 8 },
  dayColWorker: { alignItems: 'center', gap: 8 },
  dayLabel: { fontSize: 13, color: '#000000', fontWeight: '600' },
  dayLabelActive: { color: '#3b82f6' },
  dateCircle: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  dateCircleActive: { backgroundColor: '#3b82f6' },
  dateText: { fontSize: 15, color: '#64748b', fontWeight: '500' },
  dateTextActive: { color: '#ffffff', fontWeight: '600' },
  shiftCard: { borderRadius: 16, padding: 16, marginBottom: 12 },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  timeText: { fontSize: 13, color: '#475569', fontWeight: '500' },
  shiftTitle: { fontSize: 15, fontWeight: '600', color: '#1e293b', marginBottom: 6 },
  shiftRole: { fontSize: 13, color: '#475569', marginBottom: 12 },
  shiftDuration: { fontSize: 12, color: '#64748b', fontWeight: '500' },
  emptyContainer: { padding: 40, alignItems: 'center' },
  emptyTextWorker: { color: '#94a3b8', fontSize: 15 },
  fab: { position: 'absolute', right: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: '#3b82f6', justifyContent: 'center', alignItems: 'center', shadowColor: '#3b82f6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#ffffff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#0f172a', marginBottom: 20 },
  inputLabel: { fontSize: 14, fontWeight: '600', color: '#475569', marginBottom: 8 },
  fakeInput: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 16, marginBottom: 16 },
  fakeInputText: { fontSize: 16, color: '#0f172a' },
  modalActions: { flexDirection: 'row', marginTop: 8 },
  actionBtn: { flex: 1 }
});
