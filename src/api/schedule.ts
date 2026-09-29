import apiClient from './client';

export const scheduleApi = {
  getTodayShiftForEmployee: async (employeeCode: string, date: string) => {
    let schedules = [];
    try {
      const wsResponse = await apiClient.get('/work-schedules?from=' + date + '&to=' + date);
      schedules = wsResponse.data?.data || [];
    } catch (e) {
      console.log('Error fetching /work-schedules', e);
    }

    // Lấy danh sách ca chi tiết (kèm giờ bắt đầu, giờ kết thúc)
    let shifts = [];
    try {
      const shiftResponse = await apiClient.get('/shifts');
      shifts = shiftResponse.data?.data || shiftResponse.data || [];
    } catch (e) {
      console.log('Error fetching /shifts', e instanceof Error ? e.message : String(e));
    }

    // Tìm lịch hôm nay của nhân viên hiện tại
    const mySchedule = schedules.find((s: any) => s.employee_code === employeeCode || s.employee_name === employeeCode);
    if (!mySchedule || !mySchedule.shift_id) return null;

    // Tìm thông tin chi tiết của ca đó
    const myShift = shifts.find((s: any) => s.id === mySchedule.shift_id);
    if (!myShift) return null;

    return {
      shift_id: myShift.id,
      shift_code: myShift.shift_code,
      name: myShift.name,
      start_time: myShift.start_time, // "06:00:00"
      end_time: myShift.end_time,     // "14:00:00"
      check_in_at: mySchedule.check_in_at,
      check_out_at: mySchedule.check_out_at
    };
  },

  getSchedules: async (fromDate: string, toDate: string) => {
    let schedules = [];
    try {
      const wsResponse = await apiClient.get(`/work-schedules?from=${fromDate}&to=${toDate}`);
      schedules = wsResponse.data?.data || wsResponse.data || [];
    } catch (e) {
      console.log('Error fetching /work-schedules in getSchedules:', e instanceof Error ? e.message : String(e));
    }
    
    let shifts = [];
    try {
      const shiftResponse = await apiClient.get('/shifts');
      shifts = shiftResponse.data?.data || shiftResponse.data || [];
    } catch (e) {
      console.log('Error fetching /shifts in getSchedules:', e instanceof Error ? e.message : String(e));
    }
    
    return { schedules, shifts };
  },

  getShifts: async () => {
    try {
      const shiftResponse = await apiClient.get('/shifts');
      return shiftResponse.data?.data || shiftResponse.data || [];
    } catch (e) {
      console.log('Error fetching /shifts:', e instanceof Error ? e.message : String(e));
      return [];
    }
  }
};
