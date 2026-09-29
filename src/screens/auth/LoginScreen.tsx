import React, { useState } from 'react';
import { StyleSheet, Text, View, KeyboardAvoidingView, Platform, ScrollView, Alert, TouchableOpacity, ImageBackground } from 'react-native';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { authApi } from '@/api/auth';
import { useAuthStore } from '@/store/authStore';
import { User, Lock, Eye, EyeOff, LogIn, CheckSquare, Square, Mail, ArrowLeft } from 'lucide-react-native';

export function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [employeeName, setEmployeeName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  
  const login = useAuthStore(state => state.login);

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('Lỗi', 'Vui lòng nhập tài khoản và mật khẩu');
      return;
    }

    setIsLoading(true);
    try {
      const response = await authApi.login(username, password);
      await login(response.token, response.user);
    } catch (error: any) {
      const message = error.response?.data?.message || 'Không thể kết nối đến máy chủ';
      Alert.alert('Đăng nhập thất bại', message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    if (!username || !employeeName) {
      Alert.alert('Lỗi', 'Vui lòng nhập tên nhân viên và tài khoản');
      return;
    }
    Alert.alert(
      'Thành công', 
      'Yêu cầu cấp lại mật khẩu cho admin, admin thực hiện cập nhật mật khẩu trong quản lý người dùng trên web',
      [{ text: 'Đóng', onPress: () => setIsForgotPassword(false) }]
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ImageBackground 
        source={{ uri: 'https://img.freepik.com/free-vector/smart-factory-concept-illustration_114360-3944.jpg?w=1000' }} 
        style={styles.background}
        imageStyle={{ opacity: 0.3 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          
          <View style={styles.headerContainer}>
            <Text style={styles.systemTitle}>Hệ thống MES</Text>
            <Text style={styles.systemSubtitle}>Bao Bì Ngọc An Thư • Điều hành sản xuất</Text>
          </View>

          <View style={styles.formCard}>
            {!isForgotPassword ? (
              <>
                <Input
                  label="TÀI KHOẢN"
                  placeholder="admin"
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  leftIcon={<User size={20} color="#94a3b8" />}
                />
                
                <View style={styles.spacer} />

                <Input
                  label="MẬT KHẨU"
                  placeholder="••••••••"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  leftIcon={<Lock size={20} color="#94a3b8" />}
                  rightIcon={showPassword ? <EyeOff size={20} color="#94a3b8" /> : <Eye size={20} color="#94a3b8" />}
                  onRightIconPress={() => setShowPassword(!showPassword)}
                />

                <View style={styles.optionsRow}>
                  <TouchableOpacity 
                    style={styles.checkboxContainer} 
                    onPress={() => setRememberMe(!rememberMe)}
                    activeOpacity={0.7}
                  >
                    {rememberMe ? (
                      <CheckSquare size={20} color="#1d4ed8" />
                    ) : (
                      <Square size={20} color="#94a3b8" />
                    )}
                    <Text style={styles.rememberText}>Ghi nhớ đăng nhập</Text>
                  </TouchableOpacity>

                  <TouchableOpacity activeOpacity={0.7} onPress={() => setIsForgotPassword(true)}>
                    <Text style={styles.forgotText}>Quên mật khẩu?</Text>
                  </TouchableOpacity>
                </View>

                <Button
                  title="ĐĂNG NHẬP"
                  onPress={handleLogin}
                  loading={isLoading}
                  icon={<LogIn size={20} color="#ffffff" />}
                  style={styles.loginBtn}
                />
              </>
            ) : (
              <>
                <View style={styles.forgotHeader}>
                  <TouchableOpacity onPress={() => setIsForgotPassword(false)} style={styles.backBtn}>
                    <ArrowLeft size={24} color="#1d4ed8" />
                  </TouchableOpacity>
                  <Text style={styles.forgotTitle}>Quên mật khẩu</Text>
                  <View style={{ width: 24 }} />
                </View>

                <Input
                  label="TÊN NHÂN VIÊN"
                  placeholder="Nguyễn Văn A"
                  value={employeeName}
                  onChangeText={setEmployeeName}
                  leftIcon={<User size={20} color="#94a3b8" />}
                />

                <View style={styles.spacer} />

                <Input
                  label="TÀI KHOẢN"
                  placeholder="admin"
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  leftIcon={<User size={20} color="#94a3b8" />}
                />
                
                <View style={styles.spacer} />
                <View style={styles.spacer} />

                <Button
                  title="GỬI YÊU CẦU"
                  onPress={handleForgotPassword}
                  icon={<Mail size={20} color="#ffffff" />}
                  style={styles.loginBtn}
                />
              </>
            )}
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Mobile MES v3.4.2 • Bản quyền Bao Bì Ngọc An Thư</Text>
          </View>

        </ScrollView>
      </ImageBackground>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 20,
  },
  systemTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 8,
  },
  systemSubtitle: {
    fontSize: 14,
    color: '#475569',
    fontWeight: '500',
  },
  formCard: {
    backgroundColor: '#ffffff',
    padding: 24,
    borderRadius: 24,
    shadowColor: '#1d4ed8',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 8,
  },
  spacer: {
    height: 8,
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rememberText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#475569',
    fontWeight: '500',
  },
  forgotText: {
    fontSize: 14,
    color: '#1d4ed8',
    fontWeight: '600',
  },
  loginBtn: {
    height: 56,
    borderRadius: 16,
  },
  forgotHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  backBtn: {
    padding: 4,
  },
  forgotTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  footer: {
    marginTop: 'auto',
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 10,
  },
  footerText: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '500',
  }
});
