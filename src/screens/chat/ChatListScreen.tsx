import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, TextInput } from 'react-native';
import { Search, Edit, Users, ChevronLeft, ArrowLeft, MoreVertical } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '@/store/authStore';

// Dữ liệu mẫu (Tạm thời)
const MOCK_CONVERSATIONS = [
  {
    id: 'general',
    type: 'GENERAL',
    name: 'Nhóm Tổng Công Ty',
    lastMessage: 'Quản lý: Mọi người nhớ chấm công đầy đủ nhé.',
    lastMessageTime: '10:30',
    unreadCount: 0,
    avatarText: 'ALL',
    avatarColor: '#1d4ed8'
  },
  {
    id: 'group1',
    type: 'GROUP',
    name: 'Tổ Lắp Ráp 1',
    lastMessage: 'A Hùng: Đã nhận đủ vật tư ca sáng.',
    lastMessageTime: '08:15',
    unreadCount: 2,
    avatarText: 'TL1',
    avatarColor: '#16a34a'
  },
  {
    id: 'private1',
    type: 'PRIVATE',
    name: 'Lê Hoàng Long',
    lastMessage: 'Đơn nghỉ phép của em duyệt chưa anh?',
    lastMessageTime: 'Hôm qua',
    unreadCount: 0,
    avatarText: 'LHL',
    avatarColor: '#f59e0b'
  }
];

export function ChatListScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuthStore();
  const [conversations, setConversations] = useState(MOCK_CONVERSATIONS);
  const [search, setSearch] = useState('');

  const renderItem = ({ item }: { item: typeof MOCK_CONVERSATIONS[0] }) => {
    return (
      <TouchableOpacity 
        style={styles.chatItem}
        activeOpacity={0.7}
        onPress={() => navigation.navigate('ChatRoom', { id: item.id, name: item.name, type: item.type })}
      >
        <View style={[styles.avatar, { backgroundColor: item.avatarColor }]}>
          {item.type === 'GENERAL' || item.type === 'GROUP' ? (
            <Users color="#fff" size={20} />
          ) : (
            <Text style={styles.avatarText}>{item.avatarText}</Text>
          )}
        </View>

        <View style={styles.chatInfo}>
          <View style={styles.chatHeaderRow}>
            <Text style={styles.chatName} numberOfLines={1}>{item.name}</Text>
            <Text style={[styles.chatTime, item.unreadCount > 0 && styles.chatTimeUnread]}>
              {item.lastMessageTime}
            </Text>
          </View>
          <View style={styles.chatMessageRow}>
            <Text style={[styles.chatLastMessage, item.unreadCount > 0 && styles.chatLastMessageUnread]} numberOfLines={1}>
              {item.lastMessage}
            </Text>
            {item.unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadBadgeText}>{item.unreadCount}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ArrowLeft color="#0f172a" size={24} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Đoạn chat</Text>
        </View>
        <TouchableOpacity style={styles.iconBtn}>
          <Edit color="#0f172a" size={22} />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Search color="#64748b" size={20} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm..."
            placeholderTextColor="#94a3b8"
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      {/* List */}
      <FlatList
        data={conversations}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0f172a',
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#0f172a',
  },
  listContent: {
    paddingBottom: 20,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  chatInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  chatHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  chatName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    flex: 1,
    marginRight: 8,
  },
  chatTime: {
    fontSize: 12,
    color: '#64748b',
  },
  chatTimeUnread: {
    color: '#0f172a',
    fontWeight: '600',
  },
  chatMessageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chatLastMessage: {
    fontSize: 14,
    color: '#64748b',
    flex: 1,
    marginRight: 16,
  },
  chatLastMessageUnread: {
    color: '#0f172a',
    fontWeight: '600',
  },
  unreadBadge: {
    backgroundColor: '#1d4ed8',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
});
