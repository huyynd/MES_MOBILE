import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { ArrowLeft, Save } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { inventoryApi } from '@/api/inventory';
import { recyclingApi } from '@/api/recycling';

export function RecyclingCreateScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [warehouses, setWarehouses] = useState<any[]>([]);

  const [form, setForm] = useState({
    export_date: new Date().toISOString().slice(0, 10),
    scrap_warehouse_id: '',
    expected_qty: '',
    third_party_name: '',
    note: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // getLookups returns { warehouses: [...] }
      const data = await inventoryApi.getLookups();
      if (data && data.warehouses) {
        setWarehouses(data.warehouses);
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Lỗi', 'Không thể tải danh sách kho');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!form.scrap_warehouse_id) {
      return Alert.alert('Lỗi', 'Vui lòng chọn kho xuất');
    }
    if (!form.expected_qty || isNaN(Number(form.expected_qty))) {
      return Alert.alert('Lỗi', 'Vui lòng nhập khối lượng dự kiến hợp lệ');
    }

    setSaving(true);
    try {
      await recyclingApi.create({
        export_date: form.export_date,
        scrap_warehouse_id: form.scrap_warehouse_id,
        expected_qty: Number(form.expected_qty),
        third_party_name: form.third_party_name,
        note: form.note
      });
      Alert.alert('Thành công', 'Đã tạo phiếu tái chế', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error: any) {
      console.error(error);
      Alert.alert('Lỗi', error?.message || 'Không thể tạo phiếu tái chế');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1d4ed8" />
        <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tạo Phiếu Tái Chế</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin chung</Text>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Ngày xuất</Text>
            <TextInput
              style={styles.input}
              value={form.export_date}
              onChangeText={(t) => setForm({ ...form, export_date: t })}
              placeholder="YYYY-MM-DD"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Bên thứ 3 (Gia công)</Text>
            <TextInput
              style={styles.input}
              value={form.third_party_name}
              onChangeText={(t) => setForm({ ...form, third_party_name: t })}
              placeholder="Nhập tên bên thứ 3..."
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Tổng khối lượng dự kiến (kg)</Text>
            <TextInput
              style={styles.input}
              value={form.expected_qty}
              onChangeText={(t) => setForm({ ...form, expected_qty: t })}
              placeholder="0"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Ghi chú</Text>
            <TextInput
              style={[styles.input, { minHeight: 80 }]}
              value={form.note}
              onChangeText={(t) => setForm({ ...form, note: t })}
              placeholder="Nhập ghi chú..."
              multiline
              textAlignVertical="top"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Kho xuất (Phế phẩm)</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipContainer}>
            {warehouses.map((w) => (
              <TouchableOpacity
                key={w.id}
                style={[styles.chip, form.scrap_warehouse_id === w.id && styles.chipActive]}
                onPress={() => setForm({ ...form, scrap_warehouse_id: w.id })}
              >
                <Text style={[styles.chipText, form.scrap_warehouse_id === w.id && styles.chipTextActive]}>
                  {w.name || w.warehouse_name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <TouchableOpacity 
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]} 
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Save color="#fff" size={20} style={{ marginRight: 8 }} />
              <Text style={styles.saveBtnText}>Tạo phiếu</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#64748b',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: '#ffffff',
    padding: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#475569',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: '#1e293b',
    backgroundColor: '#f8fafc',
  },
  chipContainer: {
    paddingRight: 16,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#f1f5f9',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  chipActive: {
    backgroundColor: '#eff6ff',
    borderColor: '#3b82f6',
  },
  chipText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  chipTextActive: {
    color: '#2563eb',
    fontWeight: '600',
  },
  footer: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  saveBtn: {
    backgroundColor: '#1d4ed8',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
  },
  saveBtnDisabled: {
    backgroundColor: '#94a3b8',
  },
  saveBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  }
});
