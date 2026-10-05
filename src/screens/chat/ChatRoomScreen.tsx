import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, SafeAreaView } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { ArrowLeft, Send, Image as ImageIcon, File, Phone, Video, Info } from 'lucide-react-native';
import { useAuthStore } from '@/store/authStore';
import io from 'socket.io-client';

// Socket instance
let socket: any = null;

const MOCK_MESSAGES = [
  { id: '1', text: 'Chào mọi người, ca 1 bắt đầu làm việc nhé.', sender: 'LHL', isMe: false, time: '06:00' },
  { id: '2', text: 'Đã rõ thưa anh.', sender: 'ME', isMe: true, time: '06:05' },
  { id: '3', text: 'Nhớ kiểm tra máy ép cẩn thận, hôm qua có sự cố.', sender: 'LHL', isMe: false, time: '06:10' },
];

export function ChatRoomScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { user } = useAuthStore();
  const { id, name, type } = route.params || { id: 'general', name: 'Nhóm Tổng Công Ty', type: 'GENERAL' };

  const [messages, setMessages] = useState(MOCK_MESSAGES);
  const [inputText, setInputText] = useState('');
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    // Khởi tạo socket
    // socket = io('http://localhost:4000'); // Thay bằng URL thật
    // socket.emit('join_rooms', [id]);
    
    // socket.on('new_message', (msg: any) => {
    //   setMessages(prev => [...prev, {
    //     id: msg.id,
    //     text: msg.content,
    //     sender: msg.sender_code,
    //     isMe: msg.sender_code === user?.employee_code,
    //     time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    //   }]);
    // });

    return () => {
      if (socket) socket.disconnect();
    };
  }, [id, user]);

  const handleSend = () => {
    if (!inputText.trim()) return;
    
    const newMsg = {
      id: Date.now().toString(),
      text: inputText.trim(),
      sender: 'ME',
      isMe: true,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    setMessages(prev => [...prev, newMsg]);
    // socket.emit('send_message', { conversation_id: id, content: inputText.trim() });
    
    setInputText('');
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const renderMessage = ({ item, index }: { item: typeof MOCK_MESSAGES[0], index: number }) => {
    const isConsecutive = index > 0 && messages[index - 1].sender === item.sender;
    
    return (
      <View style={[styles.messageWrapper, item.isMe ? styles.messageWrapperRight : styles.messageWrapperLeft, isConsecutive && styles.messageConsecutive]}>
        {!item.isMe && !isConsecutive && (
          <View style={styles.senderAvatar}>
            <Text style={styles.senderAvatarText}>{item.sender.substring(0, 2)}</Text>
          </View>
        )}
        {(!item.isMe && isConsecutive) && <View style={{ width: 28, marginRight: 8 }} />}

        <View style={[styles.messageBubble, item.isMe ? styles.messageBubbleMe : styles.messageBubbleOther]}>
          <Text style={[styles.messageText, item.isMe ? styles.messageTextMe : styles.messageTextOther]}>
            {item.text}
          </Text>
          <Text style={[styles.messageTime, item.isMe ? styles.messageTimeMe : styles.messageTimeOther]}>
            {item.time}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ArrowLeft color="#1e293b" size={24} />
          </TouchableOpacity>
          <View style={styles.headerTitleGroup}>
            <Text style={styles.headerTitle} numberOfLines={1}>{name}</Text>
            <Text style={styles.headerSubtitle}>{type === 'PRIVATE' ? 'Đang hoạt động' : '32 thành viên'}</Text>
          </View>
        </View>
        
        {/* Nút gọi bị ẩn đi theo yêu cầu "Chỉ có chức năng nhắn, không có chức năng gọi" */}
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerIcon}>
            <Info color="#1d4ed8" size={24} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Messages */}
      <KeyboardAvoidingView 
        style={styles.keyboardView} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={item => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.messageList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
        />

        {/* Input */}
        <View style={styles.inputContainer}>
          <TouchableOpacity style={styles.attachBtn}>
            <ImageIcon color="#1d4ed8" size={24} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.attachBtn}>
            <File color="#1d4ed8" size={24} />
          </TouchableOpacity>
          
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="Nhắn tin..."
              placeholderTextColor="#94a3b8"
              value={inputText}
              onChangeText={setInputText}
              multiline
            />
          </View>
          
          <TouchableOpacity 
            style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]} 
            onPress={handleSend}
            disabled={!inputText.trim()}
          >
            <Send color={inputText.trim() ? "#1d4ed8" : "#94a3b8"} size={24} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backBtn: {
    marginRight: 12,
  },
  headerTitleGroup: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
  },
  headerIcon: {
    marginLeft: 16,
  },
  keyboardView: {
    flex: 1,
  },
  messageList: {
    padding: 16,
    paddingBottom: 24,
  },
  messageWrapper: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-end',
  },
  messageWrapperLeft: {
    justifyContent: 'flex-start',
  },
  messageWrapperRight: {
    justifyContent: 'flex-end',
  },
  messageConsecutive: {
    marginTop: -10,
  },
  senderAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  senderAvatarText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  messageBubbleOther: {
    backgroundColor: '#ffffff',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  messageBubbleMe: {
    backgroundColor: '#1d4ed8',
    borderBottomRightRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  messageTextOther: {
    color: '#0f172a',
  },
  messageTextMe: {
    color: '#ffffff',
  },
  messageTime: {
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  messageTimeOther: {
    color: '#94a3b8',
  },
  messageTimeMe: {
    color: '#bfdbfe',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  attachBtn: {
    padding: 8,
    marginRight: 4,
  },
  inputWrapper: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 100,
    marginHorizontal: 8,
  },
  input: {
    fontSize: 16,
    color: '#0f172a',
    maxHeight: 80,
  },
  sendBtn: {
    padding: 8,
  },
  sendBtnDisabled: {
    opacity: 0.5,
  },
});
