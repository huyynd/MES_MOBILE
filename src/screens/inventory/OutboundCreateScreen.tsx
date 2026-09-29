import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { inventoryApi } from '@/api/inventory';

export function OutboundCreateScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lookups, setLookups] = useState<any>({ products: [], locations: [] });

  const [header, setHeader] = useState({
    location_id: '',
    purpose: 'Giao cho khách hàng',
    note: ''
  });

  const [lines, setLines] = useState([
    { _k: Math.random().toString(), product_id: '', quantity: '', unit: '', note: '' }
  ]);

  useEffect(() => {
    loadLookups();
  }, []);

  const loadLookups = async () => {
    const data = await inventoryApi.getLookups();
    setLookups(data);
    setLoading(false);
  };

  const addLine = () => {
    setLines([...lines, { _k: Math.random().toString(), product_id: '', quantity: '', unit: '', note: '' }]);
  };

  const removeLine = (key: string) => {
    setLines(lines.filter(l => l._k !== key));
  };

  const updateLine = (key: string, field: string, value: string) => {
    setLines(lines.map(l => {
      if (l._k === key) {
        if (field === 'product_id') {
          const prod = (lookups.products || []).find((p: any) => p.id === value);
          return { ...l, [field]: value, unit: prod?.unit || '' };
        }
        return { ...l, [field]: value };
      }
      return l;
    }));
  };

  const handleSave = async () => {
    if (!header.location_id) {
      return Alert.alert('Lỗi', 'Vui lòng chọn Kho / Vị trí xuất hàng');
    }
    const validLines = lines.filter(l => l.product_id && Number(l.quantity) > 0);
    if (validLines.length === 0) {
      return Alert.alert('Lỗi', 'Vui lòng nhập ít nhất 1 sản phẩm với số lượng > 0');
    }

    setSaving(true);
    try {
      await inventoryApi.createOutboundSlip({
        purpose: header.purpose,
        location_id: header.location_id,
        note: header.note,
        lines: validLines.map(l => ({
          product_id: l.product_id,
          quantity: Number(l.quantity),
          unit: l.unit,
          note: l.note
        }))
      });
      Alert.alert('Thành công', 'Đã tạo Phiếu chờ xuất kho cho khách hàng!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (e: any) {
      Alert.alert('Lỗi', e.message || 'Không thể tạo phiếu xuất kho');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0ea5e9" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.headerBar, { height: 60 + insets.top, paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tạo phiếu xuất kho</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ padding: 16 }}>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Thông tin chung</Text>
          
          <Text style={styles.label}>Mục đích xuất <Text style={styles.req}>*</Text></Text>
          <View style={styles.readOnlyInput}>
            <Text style={styles.readOnlyText}>{header.purpose}</Text>
          </View>

          <Text style={styles.label}>Kho / Vị trí xuất <Text style={styles.req}>*</Text></Text>
          <View style={styles.pickerContainer}>
            {/* Giả lập select bằng cách click hiện list, ở đây dùng đơn giản nhất là render picker hoặc navigate to selection screen, tạm dùng nút đơn giản */}
            {(lookups.locations || []).length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row' }}>
                {(lookups.locations || []).map((loc: any) => (
                  <TouchableOpacity
                    key={loc.id}
                    style={[styles.chip, header.location_id === loc.id && styles.chipActive]}
                    onPress={() => setHeader({ ...header, location_id: loc.id })}
                  >
                    <Text style={[styles.chipText, header.location_id === loc.id && styles.chipTextActive]}>
                      {loc.name || loc.warehouse_name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : (
              <Text style={{ color: '#94a3b8' }}>Chưa có dữ liệu kho</Text>
            )}
          </View>

          <Text style={styles.label}>Ghi chú</Text>
          <TextInput 
            style={styles.input}
            placeholder="Ghi chú phiếu xuất..."
            value={header.note}
            onChangeText={t => setHeader({ ...header, note: t })}
          />
        </View>

        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <Text style={styles.sectionTitle}>Danh sách vật tư</Text>
            <TouchableOpacity onPress={addLine} style={styles.addBtn}>
              <Plus size={16} color="#0ea5e9" />
              <Text style={styles.addBtnText}>Thêm dòng</Text>
            </TouchableOpacity>
          </View>

          {lines.map((line, index) => (
            <View key={line._k} style={styles.lineItem}>
              <View style={styles.rowBetween}>
                <Text style={styles.lineTitle}>Sản phẩm {index + 1}</Text>
                {lines.length > 1 && (
                  <TouchableOpacity onPress={() => removeLine(line._k)}>
                    <Trash2 size={18} color="#ef4444" />
                  </TouchableOpacity>
                )}
              </View>

              <Text style={styles.label}>Chọn sản phẩm <Text style={styles.req}>*</Text></Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row', marginBottom: 12 }}>
                {(lookups.products || []).map((p: any) => (
                  <TouchableOpacity
                    key={p.id}
                    style={[styles.chip, line.product_id === p.id && styles.chipActive]}
                    onPress={() => updateLine(line._k, 'product_id', p.id)}
                  >
                    <Text style={[styles.chipText, line.product_id === p.id && styles.chipTextActive]}>
                      {p.product_code}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <View style={styles.row}>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={styles.label}>Số lượng <Text style={styles.req}>*</Text></Text>
                  <TextInput 
                    style={styles.input}
                    placeholder="0"
                    keyboardType="numeric"
                    value={line.quantity}
                    onChangeText={t => updateLine(line._k, 'quantity', t)}
                  />
                </View>
                <View style={{ flex: 1, paddingLeft: 8 }}>
                  <Text style={styles.label}>Đơn vị</Text>
                  <TextInput 
                    style={styles.input}
                    placeholder="ĐVT"
                    value={line.unit}
                    onChangeText={t => updateLine(line._k, 'unit', t)}
                  />
                </View>
              </View>

              <Text style={styles.label}>Ghi chú dòng</Text>
              <TextInput 
                style={styles.input}
                placeholder="Ghi chú..."
                value={line.note}
                onChangeText={t => updateLine(line._k, 'note', t)}
              />
            </View>
          ))}
        </View>

      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator color="#fff" /> : <Save size={20} color="#fff" />}
          <Text style={styles.saveBtnText}>{saving ? 'Đang lưu...' : 'Xác nhận xuất kho'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  headerBar: {
    height: 60, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0'
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
  content: { flex: 1 },
  card: {
    backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 16,
    shadowColor: '#64748b', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1e293b', marginBottom: 16 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  row: { flexDirection: 'row' },
  label: { fontSize: 13, fontWeight: '600', color: '#64748b', marginBottom: 6 },
  req: { color: '#ef4444' },
  input: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#1e293b', marginBottom: 12 },
  readOnlyInput: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 12 },
  readOnlyText: { fontSize: 14, color: '#475569', fontWeight: '500' },
  pickerContainer: { marginBottom: 12, minHeight: 40 },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f1f5f9', marginRight: 8, borderWidth: 1, borderColor: '#e2e8f0' },
  chipActive: { backgroundColor: '#e0f2fe', borderColor: '#7dd3fc' },
  chipText: { fontSize: 13, color: '#64748b', fontWeight: '500' },
  chipTextActive: { color: '#0369a1', fontWeight: '600' },
  addBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, backgroundColor: '#f0f9ff', borderRadius: 8 },
  addBtnText: { color: '#0ea5e9', fontWeight: '600', fontSize: 13, marginLeft: 4 },
  lineItem: { borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 16, marginTop: 4 },
  lineTitle: { fontSize: 14, fontWeight: '600', color: '#334155' },
  footer: { backgroundColor: '#fff', padding: 16, borderTopWidth: 1, borderTopColor: '#e2e8f0' },
  saveBtn: { backgroundColor: '#0ea5e9', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 14, borderRadius: 12 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700', marginLeft: 8 }
});
