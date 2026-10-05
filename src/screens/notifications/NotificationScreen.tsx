import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView, SafeAreaView, Platform, StatusBar } from 'react-native';
import { Bell, CheckCheck, MapPin, Wrench, FileText, Factory, ChevronDown, CalendarClock, ArrowLeft } from 'lucide-react-native';
import { useAuthStore } from '@/store/authStore';
import { useNavigation } from '@react-navigation/native';

// Mock Data
const SHARED_OLDER_NOTIFICATIONS = [
  {
    id: '2',
    category: 'KHO PHẾ LIỆU',
    categoryColor: '#dcfce3', // light green
    categoryTextColor: '#16a34a', // green
    time: '2 giờ trước',
    icon: Factory, // Home/Factory like icon
    iconColor: '#16a34a',
    title: 'Phiếu phế SCR-2026-00025',
    desc: 'Thủ kho đã xác nhận nhập 15 KG phế màng nhựa PE vào khu lưu trữ B-02.',
    subBox: {
      icon: FileText,
      text: 'Mã phiếu: SCR-00025',
      status: 'Đã cân kiểm định',
      statusIcon: CheckCheck,
      statusColor: 'transparent',
      statusTextColor: '#0f766e' // teal
    },
    tags: ['#KhoPhe', '#TaiChePE'],
    isRead: true
  },
  {
    id: '3',
    category: 'Bảo trì định kỳ',
    categoryColor: '#f1f5f9', // slate
    categoryTextColor: '#64748b', // slate
    time: 'Hôm qua 16:30',
    icon: Wrench,
    iconColor: '#64748b',
    title: 'Máy Thổi 2: Đã hoàn tất tra dầu',
    desc: 'Đội cơ điện đã nghiệm thu kiểm tra đầu đùn và trục xoay máy thổi 2. Trạng thái vận hành ổn định.',
    tags: ['#BaoTri', '#MayThoi2'],
    isRead: false
  }
];

const WORKER_NOTIFICATIONS = [
  {
    title: "MỚI NHẤT",
    date: "Vừa xong",
    data: [
      {
        id: '103',
        category: 'CA LÀM VIỆC',
        categoryColor: '#e0e7ff', // indigo
        categoryTextColor: '#4338ca',
        time: '1 phút trước',
        icon: CheckCheck,
        iconColor: '#4338ca',
        title: 'Ca làm việc đã được sửa & duyệt',
        desc: 'Đăng ký ca của bạn ngày 26/09/2026 đã được Tổ trưởng thay đổi từ Ca Sáng sang Ca Chiều (14:00 - 22:00) và phê duyệt.',
        subBox: {
          icon: CalendarClock,
          text: 'Vui lòng kiểm tra lại lịch làm việc',
          status: 'Đã duyệt (Có chỉnh sửa)',
          statusColor: '#dcfce3',
          statusTextColor: '#16a34a'
        },
        tags: ['#CaChieu', '#26Thang9'],
        isRead: false
      },
      {
        id: '102',
        category: 'CA LÀM VIỆC',
        categoryColor: '#dcfce3', // green
        categoryTextColor: '#16a34a',
        time: '10 phút trước',
        icon: CheckCheck,
        iconColor: '#16a34a',
        title: 'Đăng ký ca làm việc đã duyệt',
        desc: 'Đăng ký Ca Đêm ngày 25/09/2026 của bạn đã được Tổ trưởng Lê Hoàng Long phê duyệt.',
        tags: ['#CaDem', '#25Thang9'],
        isRead: true
      }
    ]
  },
  {
    title: "TRƯỚC ĐÓ",
    date: "Hôm qua",
    data: SHARED_OLDER_NOTIFICATIONS
  }
];

const MANAGER_NOTIFICATIONS = [
  {
    title: "MỚI NHẤT",
    date: "Hôm nay",
    data: [
      {
        id: '101',
        category: 'DUYỆT CA',
        categoryColor: '#fef3c7',
        categoryTextColor: '#d97706',
        time: '5 phút trước',
        icon: CalendarClock,
        iconColor: '#d97706',
        title: 'Đăng ký ca làm việc mới',
        desc: 'Nhân viên Nguyễn Văn A đã đăng ký Ca Sáng (06:00 - 14:00) ngày 26/09/2026.',
        subBox: {
          avatarText: 'NVA',
          text: 'Vui lòng kiểm tra và phê duyệt',
          status: 'Chờ duyệt',
          statusColor: '#fef9c3',
          statusTextColor: '#ca8a04'
        },
        tags: ['#DangKyCa', '#CaSang'],
        isRead: false,
        action: 'ShiftApproval'
      },
      {
        id: '104',
        category: 'DUYỆT NGHỈ PHÉP',
        categoryColor: '#fce7f3', // pink-100
        categoryTextColor: '#be185d', // pink-700
        time: '15 phút trước',
        icon: FileText,
        iconColor: '#be185d',
        title: 'Đơn xin nghỉ phép mới',
        desc: 'Nhân viên Trần Thị B đã gửi đơn xin nghỉ phép vào ngày 27/09/2026. Lý do: Nghỉ ốm.',
        subBox: {
          avatarText: 'TTB',
          text: 'Vui lòng kiểm tra và phê duyệt',
          status: 'Chờ duyệt',
          statusColor: '#fdf2f8',
          statusTextColor: '#db2777'
        },
        tags: ['#NghiPhep', '#ChoDuyet'],
        isRead: false,
        action: 'LeaveRequest'
      },
      {
        id: '105',
        category: 'GIẢI TRÌNH CÔNG',
        categoryColor: '#ffedd5', // orange-100
        categoryTextColor: '#c2410c', // orange-700
        time: '30 phút trước',
        icon: FileText,
        iconColor: '#c2410c',
        title: 'Phiếu giải trình công mới',
        desc: 'Nhân viên Nguyễn Văn A gửi giải trình cho ca Sáng ngày 26/09/2026. Lý do: Quên chấm công lúc về.',
        subBox: {
          avatarText: 'NVA',
          text: 'Vui lòng kiểm tra và phê duyệt',
          status: 'Chờ duyệt',
          statusColor: '#fff7ed',
          statusTextColor: '#ea580c'
        },
        tags: ['#GiaiTrinh', '#ChoDuyet'],
        isRead: false,
        action: 'AttendanceAppeal'
      },
      {
        id: '1',
        category: 'NHÂN SỰ',
        categoryColor: '#e0e7ff', // light indigo
        categoryTextColor: '#4338ca', // indigo
        time: '1 giờ trước',
        icon: FileText,
        iconColor: '#4338ca',
        title: 'Đơn xin nghỉ phép đã được duyệt',
        desc: 'Đơn nghỉ phép ngày 22/09/2026 của nhân viên Nguyễn Văn Hùng đã được Tổ trưởng duyệt. Số phép năm còn lại: 11 ngày.',
        subBox: {
          avatarText: 'NVH',
          text: 'Phê duyệt bởi: Lê Hoàng Long (Tổ trưởng)',
          status: 'Đã duyệt',
          statusColor: '#86efac', // light green
          statusTextColor: '#166534' // dark green
        },
        tags: ['#NghiPhep', '#Ca1'],
        isRead: true
      }
    ]
  },
  {
    title: "TRƯỚC ĐÓ",
    date: "Hôm qua",
    data: SHARED_OLDER_NOTIFICATIONS
  }
];

export function NotificationScreen() {
  const { user } = useAuthStore();
  const navigation = useNavigation<any>();
  const [activeRoleTab, setActiveRoleTab] = useState<'MANAGER' | 'WORKER'>('MANAGER');

  const isManager = user?.is_admin || (user?.role_name && !user?.role_name.toLowerCase().includes('công nhân'));
  const notifications = !isManager ? WORKER_NOTIFICATIONS : (activeRoleTab === 'MANAGER' ? MANAGER_NOTIFICATIONS : WORKER_NOTIFICATIONS);

  const CustomHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.headerTopRow}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 12, padding: 4 }}>
            <ArrowLeft color="#1e293b" size={24} />
          </TouchableOpacity>
          <View style={styles.logoGroup}>
            <View style={styles.logoIconContainer}>
              <Factory color="#ffffff" size={16} />
            </View>
            <View>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={styles.headerLogoText}>NGỌC AN THƯ MES</Text>
                <View style={styles.shiftBadge}>
                  <Text style={styles.shiftBadgeText}>Ca 1</Text>
                </View>
              </View>
              <Text style={styles.headerTitle}>Hộp Thư Thông Báo</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.headerRightIcons}>
          <TouchableOpacity style={styles.avatarIconBtn}>
            <Text style={styles.avatarIconText}>{user?.full_name?.charAt(0) || 'U'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const FilterPills = () => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterContent}>
      <TouchableOpacity style={[styles.filterPill, styles.filterPillActive]}>
        <Text style={[styles.filterText, styles.filterTextActive]}>Tất cả</Text>
        <View style={styles.filterCountBadgeActive}><Text style={styles.filterCountTextActive}>12</Text></View>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.filterPill}>
        <View style={[styles.dot, { backgroundColor: '#ef4444' }]} />
        <Text style={styles.filterText}>Cảnh báo máy & Sự cố</Text>
        <View style={styles.filterCountBadge}><Text style={styles.filterCountText}>3</Text></View>
      </TouchableOpacity>

      <TouchableOpacity style={styles.filterPill}>
        <View style={[styles.dot, { backgroundColor: '#3b82f6' }]} />
        <Text style={styles.filterText}>Lệnh sản xuất</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderNotificationCard = (item: any) => {
    const Icon = item.icon;
    return (
      <TouchableOpacity 
        style={styles.cardContainer}
        activeOpacity={0.7}
        onPress={() => item.action && navigation.navigate(item.action)}
      >
        {/* Card Header */}
        <View style={styles.cardHeader}>
          <View style={[styles.cardIconBox, { backgroundColor: item.categoryColor }]}>
            <Icon color={item.iconColor} size={20} />
          </View>
          <View style={styles.cardHeaderRight}>
            <View style={[styles.categoryTag, { backgroundColor: item.categoryColor }]}>
              <Text style={[styles.categoryText, { color: item.categoryTextColor }]}>{item.category.toUpperCase()}</Text>
            </View>
            <Text style={styles.timeText}>{item.time}</Text>
          </View>
          <View style={styles.checkIcon}>
            <CheckCheck color="#cbd5e1" size={18} />
          </View>
        </View>

        {/* Content */}
        <Text style={styles.cardTitle}>{item.title}</Text>
        <Text style={styles.cardDesc}>{item.desc}</Text>

        {/* Sub Box */}
        {item.subBox && (
          <View style={styles.subBox}>
            <View style={styles.subBoxLeft}>
              {item.subBox.avatarText && (
                <View style={styles.subAvatar}>
                  <Text style={styles.subAvatarText}>{item.subBox.avatarText}</Text>
                </View>
              )}
              {item.subBox.icon && (
                <item.subBox.icon color="#64748b" size={16} style={{ marginRight: 8 }} />
              )}
              <Text style={styles.subBoxText} numberOfLines={2}>{item.subBox.text}</Text>
            </View>
            
            <View style={[styles.subStatusBadge, { backgroundColor: item.subBox.statusColor }]}>
              {item.subBox.statusIcon && <item.subBox.statusIcon color={item.subBox.statusTextColor} size={14} style={{ marginRight: 4 }} />}
              <Text style={[styles.subStatusText, { color: item.subBox.statusTextColor }]}>{item.subBox.status}</Text>
            </View>
          </View>
        )}

        {/* Tags */}
        <View style={styles.tagRow}>
          {item.tags.map((tag: string, index: number) => (
            <View key={index} style={styles.hashTag}>
              <Text style={styles.hashTagText}>{tag}</Text>
            </View>
          ))}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <CustomHeader />
      
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        
        {/* Title & Actions */}
        <View style={styles.pageTitleRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={styles.pageTitle}>Hộp thư cảnh báo</Text>
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>4 chưa đọc</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.readAllBtn}>
            <CheckCheck color="#64748b" size={16} />
            <Text style={styles.readAllText}>Đọc tất cả</Text>
          </TouchableOpacity>
        </View>

        {isManager && (
          <View style={styles.roleTabsContainer}>
            <TouchableOpacity 
              style={[styles.roleTab, activeRoleTab === 'MANAGER' && styles.roleTabActive]}
              onPress={() => setActiveRoleTab('MANAGER')}
            >
              <Text style={[styles.roleTabText, activeRoleTab === 'MANAGER' && styles.roleTabTextActive]}>Quản lý / Duyệt</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.roleTab, activeRoleTab === 'WORKER' && styles.roleTabActive]}
              onPress={() => setActiveRoleTab('WORKER')}
            >
              <Text style={[styles.roleTabText, activeRoleTab === 'WORKER' && styles.roleTabTextActive]}>Cá nhân</Text>
            </TouchableOpacity>
          </View>
        )}

        <FilterPills />

        {/* Sections */}
        {notifications.map((section, sIndex) => (
          <View key={sIndex} style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{section.title} <Text style={{ color: '#1d4ed8' }}>•</Text></Text>
              <Text style={styles.sectionDate}>{section.date}</Text>
            </View>
            
            {section.data.map((item) => (
              <React.Fragment key={item.id}>
                {renderNotificationCard(item)}
              </React.Fragment>
            ))}
          </View>
        ))}
        
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  container: {
    flex: 1,
  },
  /* Header Styles */
  headerContainer: {
    backgroundColor: '#e0e7ff', // Very light blue gradient effect from mockup
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logoGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoIconContainer: {
    width: 36,
    height: 36,
    backgroundColor: '#1d4ed8',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  headerLogoText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1d4ed8',
    marginRight: 8,
  },
  shiftBadge: {
    backgroundColor: '#c7d2fe',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  shiftBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#4338ca',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1e293b',
    marginTop: 2,
  },
  headerRightIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bellIconBtn: {
    marginRight: 16,
    position: 'relative',
  },
  bellBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#ef4444',
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#e0e7ff',
  },
  bellBadgeText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#fff',
  },
  avatarIconBtn: {
    width: 32,
    height: 32,
    backgroundColor: '#1d4ed8',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarIconText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },

  /* Title & Actions */
  pageTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 20,
    marginBottom: 16,
  },
  pageTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    marginRight: 8,
  },
  unreadBadge: {
    backgroundColor: '#b91c1c', // dark red
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  unreadText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ffffff',
  },
  readAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e2e8f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  readAllText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    marginLeft: 4,
  },

  /* Role Tabs */
  roleTabsContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 4,
  },
  roleTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  roleTabActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  roleTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  roleTabTextActive: {
    color: '#1d4ed8',
  },

  /* Filter Pills */
  filterScroll: {
    marginBottom: 24,
  },
  filterContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  filterPillActive: {
    backgroundColor: '#1d4ed8',
    borderColor: '#1d4ed8',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  filterTextActive: {
    color: '#ffffff',
  },
  filterCountBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 6,
  },
  filterCountBadgeActive: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 6,
  },
  filterCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
  },
  filterCountTextActive: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ffffff',
  },

  /* Sections */
  sectionContainer: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1e293b',
  },
  sectionDate: {
    fontSize: 13,
    color: '#94a3b8',
    fontWeight: '500',
  },

  /* Notification Card */
  cardContainer: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f8fafc',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardHeaderRight: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 8,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '800',
  },
  timeText: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '500',
  },
  checkIcon: {
    padding: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 6,
    lineHeight: 22,
  },
  cardDesc: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
    marginBottom: 12,
  },

  /* Sub Box */
  subBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  subBoxLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 8,
  },
  subAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#c7d2fe',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  subAvatarText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#4338ca',
  },
  subBoxText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  subStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  subStatusText: {
    fontSize: 11,
    fontWeight: '700',
  },

  /* Hashtags */
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  hashTag: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  hashTagText: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  }
});
