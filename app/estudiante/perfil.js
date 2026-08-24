import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  ActivityIndicator, StatusBar, Platform, Alert, Modal,
  TextInput, KeyboardAvoidingView, TouchableWithoutFeedback
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';

const COLORS = {
  primary: '#E95A0C', primaryLight: '#FFEDD5', textPrimary: '#1F2937',
  textSecondary: '#6B7280', border: '#E5E7EB', surface: '#FFFFFF',
  background: '#F9FAFB', white: '#FFFFFF', accent: '#EF4444', success: '#10B981',
  telegramBlue: '#0088cc', telegramLight: '#E3F2FD', danger: '#FEE2E2', dangerText: '#DC2626'
};

const API_BASE_URL = 'https://unibackend-production.up.railway.app';
const TOKEN_KEY = 'studentAuthToken';

const getToken = async () => {
  try {
    return Platform.OS === 'web'
      ? localStorage.getItem(TOKEN_KEY)
      : await SecureStore.getItemAsync(TOKEN_KEY);
  } catch { return null; }
};

const InfoRow = ({ icon, label, value, editable = false, onEdit }) => (
  <View style={styles.infoRow}>
    <View style={styles.infoIconWrap}>
      <Ionicons name={icon} size={18} color={COLORS.primary} />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={styles.infoLabel}>{label}</Text>
      <View style={styles.infoValueContainer}>
        <Text style={styles.infoValue}>{value || 'No especificado'}</Text>
        {editable && onEdit && (
          <TouchableOpacity onPress={onEdit} style={styles.editIcon}>
            <Ionicons name="create-outline" size={16} color={COLORS.primary} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  </View>
);

// Componente para la sección de Telegram
const TelegramSection = ({ telegramData, onUnlink, loading }) => {
  if (!telegramData?.vinculado) return null;

  return (
    <View style={styles.telegramCard}>
      {/* Header */}
      <View style={styles.telegramHeader}>
        <View style={styles.telegramLogoContainer}>
          <View style={styles.telegramLogo}>
            <Ionicons name="send" size={28} color={COLORS.white} />
          </View>
        </View>
        <View style={styles.telegramTitleContainer}>
          <Text style={styles.telegramTitle}>Telegram Vinculado</Text>
          <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
        </View>
        <TouchableOpacity style={styles.closeButton} onPress={() => {}} disabled>
          <Ionicons name="close" size={20} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Status */}
      <View style={styles.telegramStatus}>
        <View style={styles.checkCircle}>
          <Ionicons name="checkmark" size={32} color={COLORS.white} />
        </View>
        <Text style={styles.telegramStatusText}>Tu cuenta está vinculada con Telegram</Text>
        <Text style={styles.telegramUsername}>{telegramData.username || '@usuario'}</Text>
      </View>

      {/* Notifications */}
      <View style={styles.notificationsSection}>
        <Text style={styles.notificationsTitle}>Recibirás notificaciones de:</Text>
        
        <View style={styles.notificationItem}>
          <View style={styles.notificationCheck}>
            <Ionicons name="checkmark" size={14} color={COLORS.white} />
          </View>
          <Text style={styles.notificationText}>Confirmación de inscripciones a eventos</Text>
        </View>

        <View style={styles.notificationItem}>
          <View style={styles.notificationCheck}>
            <Ionicons name="checkmark" size={14} color={COLORS.white} />
          </View>
          <Text style={styles.notificationText}>Recordatorios de eventos próximos</Text>
        </View>

        <View style={styles.notificationItem}>
          <View style={styles.notificationCheck}>
            <Ionicons name="checkmark" size={14} color={COLORS.white} />
          </View>
          <Text style={styles.notificationText}>Actualizaciones importantes</Text>
        </View>
      </View>

      {/* Unlink Button */}
      <TouchableOpacity 
        style={[styles.unlinkButton, loading && styles.unlinkButtonDisabled]} 
        onPress={onUnlink}
        disabled={loading}
      >
        <Ionicons name="unlink" size={18} color={COLORS.dangerText} />
        <Text style={styles.unlinkButtonText}>
          {loading ? 'Procesando...' : 'Desvincular Telegram'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const PerfilEstudianteScreen = () => {
  const router = useRouter();
  const [perfil, setPerfil] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [telegramUnlinking, setTelegramUnlinking] = useState(false);
  
  const [formData, setFormData] = useState({
    codigoestudiante: '',
    semestre: '',
    telefono: '',
    ci: ''
  });

  const fetchPerfil = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token) { router.replace('/login'); return; }

      const res = await axios.get(`${API_BASE_URL}/profile`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 8000,
      });

      console.log(' Perfil completo recibido:', res.data);
      setPerfil(res.data);
    } catch (err) {
      console.error('Error al cargar perfil:', err);
      setError('No se pudo cargar tu perfil. Verifica tu conexión.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPerfil(); }, []);

  const handleUnlinkTelegram = async () => {
    Alert.alert(
      'Desvincular Telegram',
      '¿Estás seguro de que deseas desvincular tu cuenta de Telegram? Dejarás de recibir notificaciones.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Desvincular',
          style: 'destructive',
          onPress: async () => {
            setTelegramUnlinking(true);
            try {
              const token = await getToken();
              await axios.post(
                `${API_BASE_URL}/telegram/desvincular`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
              );
              
              Alert.alert('✅ Éxito', 'Telegram desvinculado correctamente');
              fetchPerfil(); // Recargar perfil
            } catch (err) {
              console.error('Error al desvincular Telegram:', err);
              Alert.alert('Error', 'No se pudo desvincular Telegram. Inténtalo de nuevo.');
            } finally {
              setTelegramUnlinking(false);
            }
          }
        }
      ]
    );
  };

  const handleEditPress = () => {
    setFormData({
      codigoestudiante: perfil?.codigoestudiante || '',
      semestre: perfil?.semestre || '',
      telefono: perfil?.telefono || '',
      ci: perfil?.ci || perfil?.carnet || ''
    });
    setShowEditModal(true);
  };

  const handleSaveProfile = async () => {
    if (!formData.codigoestudiante || !formData.semestre) {
      Alert.alert('Campos requeridos', 'El código de estudiante y el semestre son obligatorios.');
      return;
    }

    setSaving(true);
    try {
      const token = await getToken();
      
      await axios.put(`${API_BASE_URL}/estudiantes/mis-datos-inscripcion`, {
        codigoestudiante: formData.codigoestudiante,
        semestre: formData.semestre,
        telefono: formData.telefono,
        ci: formData.ci
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      Alert.alert('✅ Éxito', 'Perfil actualizado correctamente');
      setShowEditModal(false);
      fetchPerfil();
      
    } catch (err) {
      console.error('Error al actualizar perfil:', err);
      Alert.alert('Error', err.response?.data?.message || 'No se pudo actualizar el perfil.');
    } finally {
      setSaving(false);
    }
  };

  const nombreCompleto = `${perfil?.nombre || ''} ${perfil?.apellidopat || ''} ${perfil?.apellidomat || ''}`.trim();
  const facultadNombre = perfil?.facultad || 'Sin facultad';
  
  const codigoEstudiante = perfil?.codigoestudiante || 'No registrado';
  const semestre = perfil?.semestre || 'No registrado';
  const telefono = perfil?.telefono || 'No registrado';
  const ci = perfil?.ci || perfil?.carnet || 'No especificado';

  // Datos de Telegram (ajusta según la estructura de tu backend)
  const telegramData = {
    vinculado: perfil?.telegramVinculado || false,
    username: perfil?.telegramUsername || null
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <Stack.Screen options={{ title: 'Mi Perfil', headerBackTitle: 'Volver' }} />

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
        {loading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Cargando tu perfil...</Text>
          </View>
        ) : error ? (
          <View style={styles.centerBox}>
            <Ionicons name="alert-circle-outline" size={48} color={COLORS.accent} />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={fetchPerfil}>
              <Text style={styles.retryBtnText}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.avatarWrap}>
              <View style={styles.avatar}>
                <Ionicons name="person" size={40} color={COLORS.white} />
              </View>
              <Text style={styles.nombre}>{nombreCompleto || 'Estudiante'}</Text>
              <Text style={styles.correo}>{perfil?.email || 'Sin correo'}</Text>
              
              <View style={styles.facultadBadge}>
                <Ionicons name="school" size={14} color={COLORS.primary} />
                <Text style={styles.facultadBadgeText}>{facultadNombre}</Text>
              </View>
            </View>

            {/* Sección de Telegram */}
            <TelegramSection 
              telegramData={telegramData}
              onUnlink={handleUnlinkTelegram}
              loading={telegramUnlinking}
            />

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Información Académica</Text>
              <InfoRow icon="barcode-outline" label="Código de Estudiante" value={codigoEstudiante} editable={true} onEdit={handleEditPress} />
              <InfoRow icon="book-outline" label="Semestre" value={semestre} editable={true} onEdit={handleEditPress} />
              
              <View style={styles.divider} />
              
              <Text style={styles.cardTitle}>Información Personal</Text>
              <InfoRow icon="call-outline" label="Teléfono" value={telefono} editable={true} onEdit={handleEditPress} />
              <InfoRow icon="mail-outline" label="Correo Electrónico" value={perfil?.email} />
            </View>

            <TouchableOpacity style={styles.editBtn} onPress={handleEditPress}>
              <Ionicons name="create-outline" size={18} color={COLORS.white} />
              <Text style={styles.editBtnText}>Editar Perfil</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      {/* Modal de Edición */}
      <Modal visible={showEditModal} animationType="slide" transparent={true} onRequestClose={() => setShowEditModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <TouchableWithoutFeedback onPress={() => !saving && setShowEditModal(false)}>
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback>
                <View style={styles.modalContent}>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Editar Perfil</Text>
                    <TouchableOpacity onPress={() => !saving && setShowEditModal(false)} disabled={saving}>
                      <Ionicons name="close" size={24} color={COLORS.textSecondary} />
                    </TouchableOpacity>
                  </View>

                  <ScrollView style={styles.modalBody}>
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Código de Estudiante *</Text>
                      <TextInput 
                        style={styles.input} 
                        value={formData.codigoestudiante} 
                        onChangeText={(text) => setFormData({...formData, codigoestudiante: text})} 
                        placeholder="Ej: 2023-1234" 
                        placeholderTextColor={COLORS.textSecondary} 
                        editable={!saving} 
                      />
                    </View>
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Semestre *</Text>
                      <TextInput 
                        style={styles.input} 
                        value={formData.semestre} 
                        onChangeText={(text) => setFormData({...formData, semestre: text})} 
                        placeholder="Ej: 5to semestre" 
                        placeholderTextColor={COLORS.textSecondary} 
                        editable={!saving} 
                      />
                    </View>
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Teléfono</Text>
                      <TextInput 
                        style={styles.input} 
                        value={formData.telefono} 
                        onChangeText={(text) => setFormData({...formData, telefono: text})} 
                        placeholder="Ej: 71234567" 
                        placeholderTextColor={COLORS.textSecondary} 
                        keyboardType="phone-pad" 
                        editable={!saving} 
                      />
                    </View>
                  </ScrollView>

                  <View style={styles.modalFooter}>
                    <TouchableOpacity 
                      style={[styles.cancelBtn, saving && styles.btnDisabled]} 
                      onPress={() => setShowEditModal(false)} 
                      disabled={saving}
                    >
                      <Text style={styles.cancelBtnText}>Cancelar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.saveBtn, saving && styles.btnDisabled]} 
                      onPress={handleSaveProfile} 
                      disabled={saving}
                    >
                      {saving ? (
                        <ActivityIndicator size="small" color={COLORS.white} />
                      ) : (
                        <>
                          <Ionicons name="save-outline" size={18} color={COLORS.white} />
                          <Text style={styles.saveBtnText}>Guardar</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  centerBox: { alignItems: 'center', paddingVertical: 60 },
  loadingText: { marginTop: 12, color: COLORS.textSecondary, fontSize: 14 },
  errorText: { marginTop: 12, color: COLORS.textSecondary, textAlign: 'center', fontSize: 14 },
  retryBtn: { marginTop: 16, backgroundColor: COLORS.accent, paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8 },
  retryBtnText: { color: COLORS.white, fontWeight: '600', fontSize: 14 },
  avatarWrap: { alignItems: 'center', marginBottom: 28 },
  avatar: { 
    width: 90, height: 90, borderRadius: 45, backgroundColor: COLORS.primary, 
    justifyContent: 'center', alignItems: 'center', marginBottom: 12, 
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 
  },
  nombre: { fontSize: 22, fontWeight: '700', color: COLORS.textPrimary, textAlign: 'center' },
  correo: { fontSize: 14, color: COLORS.textSecondary, marginTop: 4, textAlign: 'center' },
  facultadBadge: { 
    flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.primaryLight, 
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginTop: 12 
  },
  facultadBadgeText: { fontSize: 13, color: COLORS.primary, fontWeight: '600' },
  
  // Telegram Section Styles
  telegramCard: {
    backgroundColor: COLORS.telegramLight,
    borderRadius: 16,
    marginBottom: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#BBDEFB',
  },
  telegramHeader: {
    backgroundColor: COLORS.white,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  telegramLogoContainer: {
    marginRight: 12,
  },
  telegramLogo: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.telegramBlue,
    justifyContent: 'center',
    alignItems: 'center',
  },
  telegramTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  telegramTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  closeButton: {
    padding: 4,
  },
  telegramStatus: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: COLORS.white,
  },
  checkCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.success,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  telegramStatusText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 4,
  },
  telegramUsername: {
    fontSize: 15,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  notificationsSection: {
    backgroundColor: COLORS.white,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  notificationsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  notificationCheck: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.success,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  unlinkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.danger,
    paddingVertical: 14,
    margin: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  unlinkButtonDisabled: {
    opacity: 0.6,
  },
  unlinkButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.dangerText,
  },
  
  // Resto de estilos
  card: { 
    backgroundColor: COLORS.surface, borderRadius: 16, padding: 20, 
    borderWidth: 1, borderColor: COLORS.border, 
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 12, marginTop: 4 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16 },
  infoIconWrap: { 
    width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.primaryLight, 
    justifyContent: 'center', alignItems: 'center' 
  },
  infoLabel: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '500' },
  infoValueContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flex: 1 },
  infoValue: { fontSize: 15, color: COLORS.textPrimary, fontWeight: '600', marginTop: 2, flex: 1 },
  editIcon: { padding: 4 },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 16 },
  editBtn: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, 
    backgroundColor: COLORS.primary, paddingVertical: 14, borderRadius: 12, marginTop: 24, 
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.3, shadowRadius: 6, elevation: 4 
  },
  editBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: COLORS.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  modalTitle: { fontSize: 20, fontWeight: '700', color: COLORS.textPrimary },
  modalBody: { padding: 20 },
  inputGroup: { marginBottom: 20 },
  inputLabel: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 8 },
  input: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, padding: 14, fontSize: 15, color: COLORS.textPrimary, backgroundColor: COLORS.background },
  modalFooter: { flexDirection: 'row', gap: 12, padding: 20, borderTopWidth: 1, borderTopColor: COLORS.border },
  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  cancelBtnText: { fontSize: 15, fontWeight: '600', color: COLORS.textSecondary },
  saveBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  saveBtnText: { fontSize: 15, fontWeight: '700', color: COLORS.white },
  btnDisabled: { opacity: 0.5 },
});

export default PerfilEstudianteScreen;