import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Alert, ActivityIndicator } from 'react-native';
import { Package } from 'lucide-react-native';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { productionApi } from '@/api/production';

export function MaterialUsageScreen({ route, navigation }: any) {
  const orderId = route.params?.orderId as string | undefined;
  const [lines, setLines] = useState<any[]>([]);
  const [loading, setLoading] = useState(Boolean(orderId));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!orderId) return;
    productionApi.getMaterials(orderId)
      .then((data) => setLines((data.lines || []).map((line: any) => ({ ...line, used_qty: String(line.used_qty ?? line.suggested_qty ?? 0) }))))
      .catch((error) => Alert.alert('Lỗi', error.response?.data?.message || 'Không thể tải định mức nguyên vật liệu.'))
      .finally(() => setLoading(false));
  }, [orderId]);

  const save = async () => {
    if (!orderId) return;
    setSaving(true);
    try {
      await productionApi.saveMaterials(orderId, lines.map((line) => ({ material_id: line.material_id, qty: Number(line.used_qty) || 0, unit: line.unit })));
      Alert.alert('Thành công', 'Đã ghi nhận nguyên vật liệu thực tế.', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (error: any) {
      Alert.alert('Lỗi', error.response?.data?.message || error.message || 'Không thể lưu nguyên vật liệu.');
    } finally {
      setSaving(false);
    }
  };

  if (!orderId) return <View style={styles.center}><Package size={48} color="#94a3b8" /><Text style={styles.text}>Chọn một công đoạn để ghi nhận nguyên vật liệu.</Text></View>;
  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#1d4ed8" /></View>;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {!lines.length ? <View style={styles.center}><Package size={48} color="#94a3b8" /><Text style={styles.text}>Lệnh này chưa có định mức nguyên vật liệu.</Text></View> : lines.map((line) => (
        <Card key={line.material_id} style={styles.card}>
          <Text style={styles.name}>{line.material_name}</Text>
          <Text style={styles.code}>{line.material_code}</Text>
          <Text style={styles.meta}>Gợi ý: {line.suggested_qty} {line.unit} · Tồn: {line.on_hand} {line.unit}</Text>
          <Text style={styles.label}>Sử dụng thực tế ({line.unit})</Text>
          <TextInput style={styles.input} value={line.used_qty} keyboardType="decimal-pad" onChangeText={(used_qty) => setLines((current) => current.map((item) => item.material_id === line.material_id ? { ...item, used_qty } : item))} />
        </Card>
      ))}
      {lines.length > 0 && <Button title="LƯU GHI NHẬN" onPress={save} loading={saving} />}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' }, content: { padding: 16, gap: 12 }, center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }, text: { marginTop: 16, fontSize: 16, color: '#64748b', textAlign: 'center', fontWeight: '500' },
  card: { padding: 16 }, name: { fontSize: 16, fontWeight: '700', color: '#0f172a' }, code: { marginTop: 2, fontSize: 13, color: '#64748b' }, meta: { marginTop: 10, fontSize: 13, color: '#475569' }, label: { marginTop: 14, marginBottom: 6, fontSize: 13, color: '#475569', fontWeight: '600' }, input: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 10, fontSize: 16, color: '#0f172a' },
});
