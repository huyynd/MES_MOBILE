import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { ArrowLeft, Save, PackageCheck, Scale, Package } from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { recyclingApi } from '@/api/recycling';
import { inventoryApi } from '@/api/inventory';
import { Card } from '@/components/Card';

export function RecyclingDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [ticket, setTicket] = useState<any>(null);
  const [warehouses, setWarehouses] = useState<any[]>([]);

  // State cho bước Cân (weigh)
  const [weighForm, setWeighForm] = useState({
    internal_scrap_qty: '',
    mixed_scrap_qty: '',
    weighing_person: ''
  });

  // State cho bước Hoàn thành (complete)
  const [importWarehouseId, setImportWarehouseId] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      if (route.params?.id) {
        const t = await recyclingApi.get(route.params.id);
        setTicket(t);
      }
      const data = await inventoryApi.getLookups();
      if (data && data.warehouses) setWarehouses(data.warehouses);
    } catch (error) {
      console.error(error);
      Alert.alert('Lỗi', 'Không thể tải chi tiết phiếu');
    } finally {
      setLoading(false);
    }
  };

  const handleWeigh = async () => {
    if (!weighForm.internal_scrap_qty && !weighForm.mixed_scrap_qty) {
      return Alert.alert('Lỗi', 'Vui lòng nhập khối lượng cân');
    }
    setProcessing(true);
    try {
      await recyclingApi.weigh(ticket.id, {
        internal_scrap_qty: Number(weighForm.internal_scrap_qty || 0),
        mixed_scrap_qty: Number(weighForm.mixed_scrap_qty || 0),
        weighing_person: weighForm.weighing_person || 'Quản lý'
      });
      Alert.alert('Thành công', 'Đã ghi nhận cân');
      loadData();
    } catch (error: any) {
      Alert.alert('Lỗi', error?.message || 'Không thể ghi nhận cân');
    } finally {
      setProcessing(false);
    }
  };

  const handleComplete = async () => {
    if (!importWarehouseId) {
      return Alert.alert('Lỗi', 'Vui lòng chọn kho nhập thành phẩm (PE)');
    }
    setProcessing(true);
    try {
      await recyclingApi.complete(ticket.id, {
        import_warehouse_id: importWarehouseId
      });
      Alert.alert('Thành công', 'Đã hoàn thành phiếu tái chế');
      loadData();
    } catch (error: any) {
      Alert.alert('Lỗi', error?.message || 'Không thể hoàn thành phiếu');
    } finally {
      setProcessing(false);
    }
  };

  if (loading || !ticket) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1d4ed8" />
        <Text style={styles.loadingText}>Đang tải chi tiết phiếu...</Text>
      </View>
    );
  }

  const renderWeighForm = () => {
    if (ticket.status !== 'Chờ cân') return null;
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Scale size={20} color="#ea580c" />
          <Text style={styles.sectionTitle}>Cập nhật khối lượng thực tế (Cân)</Text>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Phế nội bộ (kg)</Text>
          <TextInput
            style={styles.input}
            value={weighForm.internal_scrap_qty}
            onChangeText={(t) => setWeighForm({ ...weighForm, internal_scrap_qty: t })}
            placeholder="0"
            keyboardType="numeric"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Phế trộn (kg)</Text>
          <TextInput
            style={styles.input}
            value={weighForm.mixed_scrap_qty}
            onChangeText={(t) => setWeighForm({ ...weighForm, mixed_scrap_qty: t })}
            placeholder="0"
            keyboardType="numeric"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Người cân</Text>
          <TextInput
            style={styles.input}
            value={weighForm.weighing_person}
            onChangeText={(t) => setWeighForm({ ...weighForm, weighing_person: t })}
            placeholder="Nhập tên người cân..."
          />
        </View>

        <TouchableOpacity 
          style={[styles.primaryBtn, processing && styles.btnDisabled]} 
          onPress={handleWeigh}
          disabled={processing}
        >
          {processing ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.btnText}>Ghi nhận Cân</Text>}
        </TouchableOpacity>
      </View>
    );
  };

  const renderCompleteForm = () => {
    if (ticket.status !== 'Đang tái chế') return null;
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <PackageCheck size={20} color="#16a34a" />
          <Text style={styles.sectionTitle}>Hoàn thành Tái chế</Text>
        </View>

        <Text style={styles.helperText}>Bạn cần chọn kho để nhập cuộn PE tái chế vào.</Text>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Kho nhập (Cuộn PE)</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipContainer}>
            {warehouses.map((w) => (
              <TouchableOpacity
                key={w.id}
                style={[styles.chip, importWarehouseId === w.id && styles.chipActive]}
                onPress={() => setImportWarehouseId(w.id)}
              >
                <Text style={[styles.chipText, importWarehouseId === w.id && styles.chipTextActive]}>
                  {w.name || w.warehouse_name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <TouchableOpacity 
          style={[styles.primaryBtn, { backgroundColor: '#16a34a' }, processing && styles.btnDisabled]} 
          onPress={handleComplete}
          disabled={processing}
        >
          {processing ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.btnText}>Hoàn thành phiếu</Text>}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Phiếu {ticket.ticket_code}</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 100 }}>
        
        {/* Info Card */}
        <View style={{ padding: 16 }}>
          <Card variant="elevated" style={styles.infoCard}>
            <View style={styles.row}>
              <Text style={styles.label}>Trạng thái:</Text>
              <Text style={[styles.value, { color: '#1d4ed8', fontWeight: 'bold' }]}>{ticket.status}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Bên thứ 3:</Text>
              <Text style={styles.value}>{ticket.third_party_name || '—'}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Tổng dự kiến:</Text>
              <Text style={styles.value}>{ticket.expected_qty} kg</Text>
            </View>
            {ticket.status !== 'Chờ cân' && (
              <>
                <View style={styles.row}>
                  <Text style={styles.label}>Phế nội bộ / trộn:</Text>
                  <Text style={styles.value}>{ticket.internal_scrap_qty || 0} / {ticket.mixed_scrap_qty || 0} kg</Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.label}>Tổng PE nhận:</Text>
                  <Text style={styles.value}>{ticket.total_received_qty || 0} kg</Text>
                </View>
              </>
            )}
          </Card>
        </View>

        {renderWeighForm()}
        {renderCompleteForm()}

      </ScrollView>
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
  infoCard: {
    padding: 16,
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  section: {
    backgroundColor: '#ffffff',
    padding: 16,
    marginBottom: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e2e8f0',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
  },
  helperText: {
    fontSize: 13,
    color: '#64748b',
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
  value: {
    fontSize: 14,
    color: '#1e293b',
    fontWeight: '500',
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
    backgroundColor: '#f0fdf4',
    borderColor: '#22c55e',
  },
  chipText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  chipTextActive: {
    color: '#16a34a',
    fontWeight: '600',
  },
  primaryBtn: {
    backgroundColor: '#ea580c',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  btnDisabled: {
    opacity: 0.7,
  },
  btnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  }
});
