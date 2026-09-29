import { Clock, Package, AlertTriangle, Activity, CheckCircle2, Minus, Plus, Save, FileText, PlayCircle, RefreshCw, ChevronRight, BarChart2, PieChart as PieChartIcon } from 'lucide-react-native';
import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Text, TouchableOpacity, Image, Alert, Modal, TextInput, ActivityIndicator, RefreshControl, Dimensions } from 'react-native';
import { useAuthStore } from '@/store/authStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card } from '@/components/Card';
import { useNavigation } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import { productionApi } from '@/api/production';
import { ProductionTask } from '@/types/production';
import { AppHeader } from '@/components/AppHeader';
import { reportsApi } from '@/api/reports';
import { scheduleApi } from '@/api/schedule';
import { LineChart, PieChart, BarChart } from 'react-native-chart-kit';

const screenWidth = Dimensions.get('window').width;

export function HomeDashboard() {
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const navigation = useNavigation<any>();

  // --- State dữ liệu thật ---
  const [tasks, setTasks] = useState<ProductionTask[]>([]);
  const [activeTask, setActiveTask] = useState<ProductionTask | null>(null);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // --- State ca làm việc ---
  const [currentShift, setCurrentShift] = useState<any>(null);
  const [mySchedule, setMySchedule] = useState<any>(null);

  // --- State cập nhật nhanh sản lượng ---
  const [quickInput, setQuickInput] = useState('0.0');
  const [saving, setSaving] = useState(false);

  // --- State cho Popup NVL ---
  const [showMaterialPopup, setShowMaterialPopup] = useState(false);
  const [materialQty, setMaterialQty] = useState('');

  const isManager = user?.is_admin || (user?.role_name && !user?.role_name.toLowerCase().includes('công nhân'));

  const fetchTasks = useCallback(async (isRefresh = false) => {
    if (!user) return;
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const workerName = user.linked_worker || user.full_name || user.username;
      const today = new Date().toISOString().split('T')[0];
      
      // Fetch shift data
      try {
        const shifts = await scheduleApi.getShifts();
        const now = new Date();
        const currentTimeStr = now.toLocaleTimeString('en-US', { hour12: false });
        
        let active = shifts.find((s: any) => {
          if (!s.start_time || !s.end_time) return false;
          if (s.start_time <= s.end_time) {
            return currentTimeStr >= s.start_time && currentTimeStr <= s.end_time;
          } else {
            return currentTimeStr >= s.start_time || currentTimeStr <= s.end_time;
          }
        });
        
        setCurrentShift(active || shifts[0] || null);

        if (!isManager) {
           const workerCode = user.employee_code || user.linked_worker || user.username;
           if (workerCode) {
             const schedule = await scheduleApi.getTodayShiftForEmployee(workerCode, today);
             setMySchedule(schedule);
             if (schedule) {
               setCurrentShift({
                 name: schedule.name,
                 start_time: schedule.start_time,
                 end_time: schedule.end_time
               });
             }
           }
        }
      } catch(e) {
        console.warn('Failed to fetch shifts', e);
      }

      if (isManager) {
        try {
          const dashData = await reportsApi.getDashboard();
          setDashboardData(dashData);
        } catch (e) {
          console.warn('Dashboard API error:', e);
        }
      }

      const data = await productionApi.getDailyTasks(workerName, today);
      const list: ProductionTask[] = Array.isArray(data) ? data : [];
      setTasks(list);
      // Lấy lệnh đang thực hiện (actual_qty > 0) hoặc lệnh đầu tiên
      const inProgress = list.find(t => (t.actual_qty || 0) > 0) || list[0] || null;
      setActiveTask(inProgress);
      if (inProgress) {
        setQuickInput('0.0');
      }
    } catch (e) {
      console.warn('HomeDashboard fetchTasks error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      fetchTasks();
    }, [fetchTasks])
  );

  const adjustQuickInput = (amount: number) => {
    const current = parseFloat(quickInput) || 0;
    setQuickInput(Math.max(0, current + amount).toFixed(1));
  };

  const handleQuickSave = async () => {
    if (!activeTask) return Alert.alert('Lỗi', 'Chưa có lệnh sản xuất nào được chọn.');
    const addQty = parseFloat(quickInput);
    if (addQty <= 0) return Alert.alert('Lỗi', 'Vui lòng nhập số lượng lớn hơn 0.');
    setSaving(true);
    try {
      const newQty = (activeTask.actual_qty || 0) + addQty;
      await productionApi.updateTaskProgress(activeTask.task_id, {
        actual_qty: newQty,
        status: 'Đang thực hiện',
      });
      Alert.alert('Thành công', `Đã ghi nhận thêm ${quickInput} ${activeTask.unit || 'KG'}!`);
      setQuickInput('0.0');
      fetchTasks(); // Refresh dữ liệu
    } catch (e: any) {
      Alert.alert('Lỗi', e?.response?.data?.message || 'Không thể ghi nhận sản lượng.');
    } finally {
      setSaving(false);
    }
  };

  const shiftName = currentShift ? currentShift.name : 'Ca chưa xác định';
  const shiftTime = currentShift && currentShift.start_time && currentShift.end_time 
      ? `(${currentShift.start_time.slice(0,5)} - ${currentShift.end_time.slice(0,5)})`
      : '';

  const workerTotalOutput = tasks.reduce((sum, t) => sum + (Number(t.actual_qty) || 0), 0);
  const workerTotalScrap = tasks.reduce((sum, t) => sum + (Number(t.product_scrap_qty) || 0), 0);
  
  const workerTotalPlan = tasks.reduce((sum, t: any) => sum + (Number(t.total_qty || t.target_qty || t.planned_qty) || 0), 0);
  let workerPerformanceStr = '0%';
  let workerPerformanceStatus = 'Chưa có tiến độ';
  
  if (workerTotalPlan > 0) {
    const perf = (workerTotalOutput / workerTotalPlan) * 100;
    workerPerformanceStr = perf.toFixed(1) + '%';
    workerPerformanceStatus = perf >= 100 ? 'Vượt chỉ tiêu' : (perf >= 80 ? 'Đạt tiến độ' : 'Chậm tiến độ');
  } else if (workerTotalOutput > 0) {
    workerPerformanceStr = '100%';
    workerPerformanceStatus = 'Hoàn thành (Không KH)';
  }

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 0) }]}>
      <AppHeader />
      <ScrollView contentContainerStyle={styles.scrollContent} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchTasks(true)} />}>
      
      {/* Header Info - Compact Profile */}
      <View style={styles.headerCard}>
        <View style={styles.profileRow}>
          <Image 
            source={{ uri: 'https://ui-avatars.com/api/?name=NV&background=0D8ABC&color=fff' }} 
            style={styles.avatar}
          />
          <View style={styles.profileInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.employeeName}>{user?.full_name || 'Thọ'}</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{user?.employee_code || user?.linked_worker || 'Chưa liên kết NV'}</Text>
              </View>
            </View>
            <View style={styles.statusRow}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>Đang làm việc</Text>
              <Text style={styles.shiftText}> • {shiftName} {shiftTime}</Text>
            </View>
          </View>
        </View>
        {!isManager && (
          <View style={styles.checkinInfoBox}>
            <View style={styles.checkinLeft}>
              <Clock size={16} color="#64748b" />
              <View style={{ marginLeft: 8 }}>
                {mySchedule && mySchedule.check_in_at ? (
                  <Text style={styles.checkinText}>Vào ca: {new Date(mySchedule.check_in_at).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })} <Text style={styles.onTimeText}>Đã check-in</Text></Text>
                ) : (
                  <Text style={styles.checkinText}>Vào ca: Chưa check-in</Text>
                )}
                <Text style={styles.checkinSubtext}>Tích lũy thực tế: <Text style={styles.boldText}>0h 0m</Text></Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('CheckIn')}>
              <Text style={styles.linkText}>Chi tiết công {'>'}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Thống kê - 3 cột */}
      {isManager ? (
        <View style={styles.statsRow}>
          <Card variant="elevated" style={styles.statCard}>
            <View style={styles.statHeader}>
              <Package size={14} color="#1d4ed8" />
              <Text style={styles.statLabel}>TỔNG LỆNH</Text>
            </View>
            <Text style={styles.statValueBlue}>{dashboardData?.kpi?.open_orders || 0}</Text>
            <Text style={styles.statSubtext}>Chờ/Đang chạy</Text>
          </Card>
          
          <Card variant="elevated" style={styles.statCard}>
            <View style={styles.statHeader}>
              <Activity size={14} color="#22c55e" />
              <Text style={styles.statLabel}>ĐANG CHẠY</Text>
            </View>
            <Text style={styles.statValueGreen}>{dashboardData?.kpi?.po_active || 0}</Text>
            <Text style={styles.statSubtextGreen}>Lệnh SX</Text>
          </Card>

          <Card variant="elevated" style={styles.statCard}>
            <View style={styles.statHeader}>
              <AlertTriangle size={14} color="#eab308" />
              <Text style={styles.statLabel}>MÁY ACTIVE</Text>
            </View>
            <Text style={styles.statValueYellow}>{dashboardData?.machines?.filter((m:any)=>m.current_task)?.length || 0}</Text>
            <Text style={styles.statSubtext}>Đang hoạt động</Text>
          </Card>
        </View>
      ) : (
        <View style={styles.statsRow}>
          <Card variant="elevated" style={styles.statCard}>
            <View style={styles.statHeader}>
              <Package size={14} color="#1d4ed8" />
              <Text style={styles.statLabel}>SẢN LƯỢNG</Text>
            </View>
            <Text style={styles.statValueBlue}>{workerTotalOutput.toLocaleString()}</Text>
            <Text style={styles.statSubtext}>KG đóng gói</Text>
          </Card>
          
          <Card variant="elevated" style={styles.statCard}>
            <View style={styles.statHeader}>
              <AlertTriangle size={14} color="#eab308" />
              <Text style={styles.statLabel}>PHẾ PHÁT SINH</Text>
            </View>
            <Text style={styles.statValueYellow}>{workerTotalScrap.toLocaleString()}</Text>
            <Text style={styles.statSubtext}>KG định mức 1.5%</Text>
          </Card>

          <Card variant="elevated" style={styles.statCard}>
            <View style={styles.statHeader}>
              <Activity size={14} color="#22c55e" />
              <Text style={styles.statLabel}>HIỆU SUẤT</Text>
            </View>
            <Text style={styles.statValueGreen}>{workerPerformanceStr}</Text>
            <Text style={styles.statSubtextGreen}>{workerPerformanceStatus}</Text>
          </Card>
        </View>
      )}

      {/* Nội dung thay đổi theo Role */}
      {isManager ? (
        <View style={{ marginTop: 12 }}>
          {/* Thao tác nhanh cho Quản lý */}
          <View style={styles.sectionHeader}>
            <Activity size={20} color="#1d4ed8" />
            <Text style={styles.sectionTitle}>Thao tác nhanh</Text>
          </View>
          
          <View style={styles.quickActionGrid}>
            <TouchableOpacity style={styles.quickActionItem} onPress={() => navigation.navigate('ShiftApproval')}>
              <View>
                <View style={[styles.quickActionIcon, { backgroundColor: '#e0e7ff' }]}><Clock size={24} color="#4f46e5" /></View>
              </View>
              <Text style={styles.quickActionText}>Duyệt ca</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.quickActionItem} onPress={() => navigation.navigate('LeaveRequest')}>
              <View>
                <View style={[styles.quickActionIcon, { backgroundColor: '#ffedd5' }]}><Clock size={24} color="#ea580c" /></View>
              </View>
              <Text style={styles.quickActionText}>Nghỉ phép</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.quickActionItem} onPress={() => navigation.navigate('AttendanceAppeal')}>
              <View>
                <View style={[styles.quickActionIcon, { backgroundColor: '#f3e8ff' }]}><AlertTriangle size={24} color="#9333ea" /></View>
              </View>
              <Text style={styles.quickActionText}>Giải trình</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.quickActionItem}>
              <View>
                <View style={[styles.quickActionIcon, { backgroundColor: '#fee2e2' }]}><Package size={24} color="#ef4444" /></View>
                <View style={styles.quickActionBadge}><Text style={styles.quickActionBadgeText}>3</Text></View>
              </View>
              <Text style={styles.quickActionText}>Xuất kho</Text>
            </TouchableOpacity>
          </View>

          {/* Charts Section */}
          <View style={styles.sectionHeader}>
            <BarChart2 size={20} color="#1d4ed8" />
            <Text style={styles.sectionTitle}>Hệ thống Báo cáo</Text>
          </View>
          
          <Card variant="elevated" style={styles.chartCard}>
            <Text style={styles.chartTitle}>A. Kế hoạch vs Thực tế (7 ngày)</Text>
            <LineChart
              data={{
                labels: ["19/09", "20/09", "21/09", "22/09", "23/09", "24/09", "25/09"],
                datasets: [
                  {
                    data: [110, 10, 0, 0, 220, 80, 20],
                    color: (opacity = 1) => `rgba(29, 78, 216, ${opacity})`, // Thực tế - Xanh
                    strokeWidth: 2
                  },
                  {
                    data: [110, 10, 0, 0, 160, 220, 25],
                    color: (opacity = 1) => `rgba(245, 158, 11, ${opacity})`, // Kế hoạch - Cam
                    strokeWidth: 2
                  }
                ],
                legend: ["Thực tế", "Kế hoạch"]
              }}
              width={screenWidth - 48}
              height={220}
              chartConfig={{
                backgroundColor: '#ffffff',
                backgroundGradientFrom: '#ffffff',
                backgroundGradientTo: '#ffffff',
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(200, 200, 200, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(100, 116, 139, ${opacity})`,
                propsForDots: { r: "4", strokeWidth: "2", stroke: "#fff" }
              }}
              bezier
              style={{ marginVertical: 8, borderRadius: 8 }}
            />
          </Card>

          <Card variant="elevated" style={styles.chartCard}>
            <Text style={styles.chartTitle}>B. Trạng thái Lệnh Sản xuất</Text>
            {dashboardData ? (
              <PieChart
                data={[
                  { name: "Mới", population: dashboardData.status_breakdown?.find((s:any)=>s.status==='Mới')?.n || 0, color: "#94a3b8", legendFontColor: "#475569", legendFontSize: 12 },
                  { name: "Đang SX", population: dashboardData.status_breakdown?.find((s:any)=>s.status==='Đang sản xuất')?.n || 0, color: "#1d4ed8", legendFontColor: "#475569", legendFontSize: 12 },
                  { name: "Hoàn thành", population: dashboardData.status_breakdown?.find((s:any)=>s.status==='Hoàn thành')?.n || 0, color: "#22c55e", legendFontColor: "#475569", legendFontSize: 12 },
                ]}
              width={screenWidth - 48}
              height={200}
              chartConfig={{
                color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`
              }}
              accessor={"population"}
              backgroundColor={"transparent"}
              paddingLeft={"15"}
              absolute
              />
            ) : <ActivityIndicator size="small" color="#1d4ed8" style={{ padding: 20 }} />}
          </Card>

          <View style={styles.sectionHeader}>
            <Activity size={20} color="#1d4ed8" />
            <Text style={styles.sectionTitle}>Quản lý & Điều hành</Text>
          </View>
          
          <TouchableOpacity style={styles.managerCard} onPress={() => navigation.navigate('WorkOrder', { screen: 'WorkOrderList' })}>
            <View style={[styles.managerCardIcon, { backgroundColor: '#dbeafe' }]}><Package size={24} color="#1d4ed8" /></View>
            <View style={styles.managerCardContent}>
              <Text style={styles.managerCardTitle}>Lệnh sản xuất tổng</Text>
              <Text style={styles.managerCardSub}>{dashboardData?.kpi?.po_active || 0} lệnh đang chạy, {dashboardData?.kpi?.po_done || 0} lệnh hoàn thành</Text>
            </View>
            <ChevronRight size={20} color="#94a3b8" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.managerCard} onPress={() => navigation.navigate('ProductionPlan')}>
            <View style={[styles.managerCardIcon, { backgroundColor: '#fef3c7' }]}><FileText size={24} color="#d97706" /></View>
            <View style={styles.managerCardContent}>
              <Text style={styles.managerCardTitle}>Kế hoạch sản xuất</Text>
              <Text style={styles.managerCardSub}>Xem kế hoạch và tiến độ tuần này</Text>
            </View>
            <ChevronRight size={20} color="#94a3b8" />
          </TouchableOpacity>

        </View>
      ) : (
        <View>
          {/* Card Lệnh sản xuất hiện tại (Dành cho Công nhân) */}
          {loading ? (
            <View style={[styles.workOrderCard, { justifyContent: 'center', alignItems: 'center', paddingVertical: 32 }]}>
              <ActivityIndicator size="large" color="#1d4ed8" />
              <Text style={{ marginTop: 12, color: '#64748b', fontSize: 14 }}>Đang tải lệnh sản xuất...</Text>
            </View>
          ) : activeTask ? (
        <Card variant="elevated" style={styles.workOrderCard}>
          <View style={styles.woHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={styles.woIconMarker} />
              <View>
                <Text style={styles.woLabel}>LỆNH SẢN XUẤT</Text>
                <Text style={styles.woCode}>{activeTask.order_code}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => fetchTasks(true)} style={{ padding: 4 }}>
              <RefreshCw size={16} color="#64748b" />
            </TouchableOpacity>
          </View>

          <View style={styles.woDetailsRow}>
            <View style={styles.woDetailColLeft}>
              <View style={styles.woDetailItem}>
                <Text style={styles.woDetailLabelBlue}>{activeTask.product_code}</Text>
                <Text style={styles.woDetailTitle}>{activeTask.product_name}</Text>
              </View>
            </View>
            <View style={styles.woDetailColRight}>
              <View style={styles.woDetailItem}>
                <Text style={styles.woDetailLabel}>Công đoạn</Text>
                <Text style={styles.woDetailValue}>{activeTask.step_name || '—'}</Text>
              </View>
            </View>
          </View>

          {/* Progress bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Sản lượng thực tế</Text>
              <Text style={styles.progressValue}>
                <Text style={styles.progressValueBig}>{activeTask.actual_qty || 0}</Text>
                {' '}{activeTask.unit || 'KG'}
              </Text>
            </View>
            <View style={styles.progressFooter}>
              {(activeTask.product_scrap_qty || 0) > 0 && (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <AlertTriangle size={14} color="#ef4444" />
                  <Text style={styles.progressFooterTextRed}>Phế: {activeTask.product_scrap_qty} {activeTask.unit || 'KG'}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Quick input form */}
          <View style={styles.quickInputContainer}>
            <View>
              <Text style={styles.quickInputLabel}>Cập nhật nhanh sản lượng</Text>
              <Text style={styles.quickInputValue}>+ {quickInput} {activeTask.unit || 'KG'}</Text>
            </View>
            <View style={styles.quickInputControls}>
              <TouchableOpacity style={styles.adjustBtn} onPress={() => adjustQuickInput(-1)}>
                <Minus size={20} color="#475569" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.adjustBtn} onPress={() => adjustQuickInput(1)}>
                <Plus size={20} color="#475569" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitBtn, saving && { opacity: 0.6 }]}
                onPress={handleQuickSave}
                disabled={saving}
              >
                {saving
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <Save size={16} color="#ffffff" style={{ marginRight: 4 }} />
                }
                <Text style={styles.submitBtnText}>{saving ? 'Đang lưu...' : 'Ghi nhận'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Nút xem chi tiết */}
          <TouchableOpacity
            style={styles.viewDetailBtn}
            onPress={() => navigation.navigate('WorkOrder', { screen: 'WorkOrderDetail', params: { task: activeTask } })}
          >
            <Text style={styles.viewDetailText}>Xem chi tiết lệnh →</Text>
          </TouchableOpacity>
        </Card>
      ) : (
        <Card variant="elevated" style={[styles.workOrderCard, { alignItems: 'center', paddingVertical: 32 }]}>
          <CheckCircle2 size={40} color="#94a3b8" />
          <Text style={{ marginTop: 12, color: '#64748b', fontSize: 15, fontWeight: '600' }}>Không có lệnh sản xuất hôm nay</Text>
          <Text style={{ color: '#94a3b8', fontSize: 13, marginTop: 4 }}>Bạn chưa được phân công công việc nào.</Text>
        </Card>
      )}

      {/* Thao tác phân xưởng */}
      <View style={styles.sectionHeader}>
        <Package size={20} color="#1d4ed8" />
        <Text style={styles.sectionTitle}>Thao tác phân xưởng</Text>
      </View>
      
      <TouchableOpacity 
        style={styles.primaryActionBtn}
        onPress={() => navigation.navigate('WorkOrder', { screen: 'WorkOrderList' })}
      >
        <Plus size={20} color="#ffffff" />
        <Text style={styles.primaryActionText}>Ghi nhận sản lượng hoàn thành</Text>
      </TouchableOpacity>

      <View style={styles.actionGridRow}>
        <TouchableOpacity 
          style={styles.secondaryActionBtnYellow}
          onPress={() => navigation.navigate('ScrapReport')}
        >
          <AlertTriangle size={18} color="#b45309" />
          <Text style={styles.secondaryActionTextYellow}>Ghi nhận phế</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.outlineActionBtn, { marginHorizontal: 0, marginLeft: 6 }]}
          onPress={() => setShowMaterialPopup(true)}
        >
          <Activity size={18} color="#1d4ed8" />
          <Text style={styles.outlineActionText}>NVL thực tế</Text>
        </TouchableOpacity>
      </View>

      {/* Danh sách lệnh còn lại trong ngày */}
      <View style={styles.sectionHeaderLine}>
        <FileText size={18} color="#475569" />
        <Text style={styles.sectionTitleSmall}>Các lệnh trong ngày</Text>
        <TouchableOpacity
          style={styles.viewAllBtn}
          onPress={() => navigation.navigate('WorkOrder', { screen: 'WorkOrderList' })}
        >
          <Text style={styles.viewAllText}>Xem tất cả ({tasks.length})</Text>
        </TouchableOpacity>
      </View>

      {tasks.filter(t => t.task_id !== activeTask?.task_id).slice(0, 3).map(task => (
        <TouchableOpacity
          key={task.task_id}
          onPress={() => navigation.navigate('WorkOrder', { screen: 'WorkOrderDetail', params: { task } })}
        >
          <Card variant="outlined" style={styles.nextWoCard}>
            <View style={styles.nextWoIcon}>
              <Package size={24} color="#64748b" />
            </View>
            <View style={styles.nextWoContent}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={styles.nextWoCode}>{task.order_code}</Text>
                <View style={styles.waitingBadge}>
                  <Text style={styles.waitingBadgeText}>{(task.actual_qty || 0) > 0 ? 'Đang thực hiện' : 'Chờ thực hiện'}</Text>
                </View>
              </View>
              <Text style={styles.nextWoTitle}>{task.product_name}</Text>
              <Text style={styles.nextWoSpec}>Công đoạn: {task.step_name || '—'} • Đã làm: {task.actual_qty || 0} {task.unit}</Text>
            </View>
            <View style={styles.nextWoArrow}>
              <PlayCircle size={20} color="#64748b" />
            </View>
          </Card>
        </TouchableOpacity>
      ))}

          {tasks.length === 0 && !loading && (
            <Card variant="outlined" style={[styles.nextWoCard, { justifyContent: 'center' }]}>
              <Text style={{ color: '#94a3b8', fontSize: 14, textAlign: 'center', flex: 1 }}>Không có lệnh nào khác trong ngày.</Text>
            </Card>
          )}
        </View>
      )}
      
      <View style={{ height: 40 }} />

      {/* Popup Nhập NVL thực tế */}
      <Modal visible={showMaterialPopup} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Ghi nhận NVL tiêu hao</Text>
            <Text style={styles.modalSubtitle}>Lệnh SX: {activeTask?.order_code || '—'}</Text>
            
            <View style={styles.modalInputGroup}>
              <Text style={styles.modalLabel}>Hạt Nhựa Trắng (KG)</Text>
              <TextInput 
                style={styles.modalInput}
                keyboardType="numeric"
                placeholder="Nhập số lượng thực tế..."
                value={materialQty}
                onChangeText={setMaterialQty}
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalBtnCancel} onPress={() => setShowMaterialPopup(false)}>
                <Text style={styles.modalBtnCancelText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalBtnSubmit} onPress={() => {
                Alert.alert('Thành công', `Đã ghi nhận ${materialQty} KG nguyên vật liệu.`);
                setShowMaterialPopup(false);
                setMaterialQty('');
              }}>
                <Text style={styles.modalBtnSubmitText}>Xác nhận</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    padding: 12,
  },
  headerCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  profileInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  employeeName: {
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
    fontSize: 11,
    color: '#475569',
    fontWeight: '600',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22c55e',
    marginRight: 6,
  },
  statusText: {
    fontSize: 13,
    color: '#16a34a',
    fontWeight: '500',
  },
  shiftText: {
    fontSize: 13,
    color: '#64748b',
  },
  checkinInfoBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  checkinLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkinText: {
    fontSize: 12,
    color: '#334155',
  },
  onTimeText: {
    color: '#16a34a',
    fontWeight: '600',
    backgroundColor: '#dcfce7',
    paddingHorizontal: 4,
    borderRadius: 4,
  },
  checkinSubtext: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  boldText: {
    fontWeight: '700',
    color: '#0f172a',
  },
  linkText: {
    fontSize: 12,
    color: '#1d4ed8',
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    marginHorizontal: 4,
    padding: 10,
    borderRadius: 12,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '700',
    marginLeft: 4,
  },
  statValueBlue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1d4ed8',
  },
  statValueYellow: {
    fontSize: 18,
    fontWeight: '800',
    color: '#d97706',
  },
  statValueGreen: {
    fontSize: 18,
    fontWeight: '800',
    color: '#16a34a',
  },
  statSubtext: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  statSubtextGreen: {
    fontSize: 11,
    color: '#16a34a',
    marginTop: 2,
  },
  workOrderCard: {
    padding: 16,
    marginBottom: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  woHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  woIconMarker: {
    width: 4,
    height: 24,
    backgroundColor: '#1d4ed8',
    borderRadius: 2,
    marginRight: 8,
  },
  woLabel: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  woCode: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  woStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  woStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#d97706',
    marginRight: 4,
  },
  woStatusText: {
    fontSize: 11,
    color: '#b45309',
    fontWeight: '600',
  },
  woDetailsRow: {
    flexDirection: 'row',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  woDetailColLeft: {
    flex: 1,
    paddingRight: 8,
  },
  woDetailColRight: {
    flex: 1,
    paddingLeft: 8,
  },
  woDetailItem: {
    marginBottom: 10,
  },
  woDetailLabelBlue: {
    fontSize: 12,
    color: '#1d4ed8',
    fontWeight: '600',
  },
  woDetailTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  woDetailLabel: {
    fontSize: 11,
    color: '#64748b',
    marginBottom: 2,
  },
  woDetailValue: {
    fontSize: 13,
    color: '#1e293b',
    fontWeight: '600',
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '500',
  },
  progressValue: {
    fontSize: 12,
    color: '#64748b',
  },
  progressValueBig: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1d4ed8',
  },
  progressPercent: {
    color: '#1d4ed8',
    fontWeight: '700',
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#e2e8f0',
    borderRadius: 4,
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#1d4ed8',
    borderRadius: 4,
  },
  progressFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressFooterText: {
    fontSize: 11,
    color: '#16a34a',
    marginLeft: 4,
  },
  progressFooterTextRed: {
    fontSize: 11,
    color: '#ef4444',
    marginLeft: 4,
  },
  quickInputContainer: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quickInputLabel: {
    fontSize: 11,
    color: '#64748b',
  },
  quickInputValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 2,
  },
  quickInputControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  adjustBtn: {
    width: 32,
    height: 32,
    backgroundColor: '#e2e8f0',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  submitBtn: {
    flexDirection: 'row',
    backgroundColor: '#1d4ed8',
    paddingHorizontal: 12,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    marginLeft: 8,
  },
  primaryActionBtn: {
    flexDirection: 'row',
    backgroundColor: '#1d4ed8',
    padding: 14,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryActionText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 8,
  },
  actionGridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  secondaryActionBtnYellow: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#fef3c7',
    padding: 14,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  secondaryActionTextYellow: {
    color: '#b45309',
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 8,
  },
  secondaryActionBtnRed: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#fee2e2',
    padding: 14,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
  },
  secondaryActionTextRed: {
    color: '#b91c1c',
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 8,
  },
  outlineActionBtn: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 14,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 6,
  },
  outlineActionText: {
    color: '#1d4ed8',
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 8,
  },
  sectionHeaderLine: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 12,
  },
  sectionTitleSmall: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1e293b',
    marginLeft: 8,
    flex: 1,
  },
  viewAllBtn: {
    padding: 4,
  },
  viewAllText: {
    fontSize: 12,
    color: '#1d4ed8',
    fontWeight: '600',
  },
  nextWoIcon: {
    width: 40,
    height: 40,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  nextWoContent: {
    flex: 1,
  },
  nextWoCode: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
    marginRight: 8,
  },
  waitingBadge: {
    backgroundColor: '#e2e8f0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  waitingBadgeText: {
    fontSize: 10,
    color: '#475569',
    fontWeight: '600',
  },
  nextWoTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1e293b',
    marginTop: 4,
  },
  nextWoSpec: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  nextWoArrow: {
    padding: 8,
  },
  nextWoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    marginBottom: 8,
  },
  viewDetailBtn: {
    marginTop: 12,
    paddingVertical: 8,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  viewDetailText: {
    fontSize: 13,
    color: '#1d4ed8',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 20,
  },
  modalInputGroup: {
    marginBottom: 24,
  },
  modalLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#0f172a',
    backgroundColor: '#f8fafc',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modalBtnCancel: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginRight: 12,
  },
  modalBtnCancelText: {
    color: '#64748b',
    fontWeight: '600',
    fontSize: 14,
  },
  modalBtnSubmit: {
    backgroundColor: '#1d4ed8',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  modalBtnSubmitText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
  managerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  managerCardIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  managerCardContent: {
    flex: 1,
  },
  managerCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
  },
  managerCardSub: {
    fontSize: 12,
    color: '#64748b',
  },
  badgeRed: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeRedText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  chartCard: {
    padding: 16,
    marginBottom: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    alignItems: 'center',
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  quickActionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  quickActionItem: {
    alignItems: 'center',
    flex: 1,
  },
  quickActionIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 12,
    color: '#334155',
    fontWeight: '600',
    textAlign: 'center',
  },
  quickActionBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#ef4444',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  quickActionBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
  }
});
