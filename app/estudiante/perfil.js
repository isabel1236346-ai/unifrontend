import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  ActivityIndicator, StatusBar, Platform, Alert
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';

const COLORS = {
  primary: '#E95A0C', primaryLight: '#FFEDD5', textPrimary: '#1F2937',
  textSecondary: '#6B7280', border: '#E5E7EB', surface: '#FFFFFF',
  background: '#F9FAFB', white: '#FFFFFF', accent: '#EF4444', success: '#10B981'
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

const InfoRow = ({ icon, label, value }) => (
  <View style={styles.infoRow}>
    <View style={styles.infoIconWrap}>
      <Ionicons name={icon} size={18} color={COLORS.primary} />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value || 'No especificado'}</Text>
    </View>
  </View>
);

const PerfilEstudianteScreen = () => {
  const router = useRouter();
  const [perfil, setPerfil] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

      setPerfil(res.data);
    } catch (err) {
      console.error('Error al cargar perfil:', err);
      setError('No se pudo cargar tu perfil. Verifica tu conexión.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPerfil(); }, []);

  const nombreCompleto = `${perfil?.nombre || ''} ${perfil?.apellidopat || ''} ${perfil?.apellidomat || ''}`.trim();
  const facultadNombre = perfil?.facultad_nombre || perfil?.facultad?.nombre || perfil?.academico?.facultad || 'Sin facultad';
  
  // ✅ Campos críticos que antes pedía el modal (para verificar que se guardaron)
  const codigoEstudiante = perfil?.codigoestudiante || perfil?.codigo_estudiante || 'No registrado';
  const semestre = perfil?.semestre || 'No registrado';
  const telefono = perfil?.telefono || 'No registrado';

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
              <Text style={styles.correo}>{perfil?.email || perfil?.correo || 'Sin correo'}</Text>
              
              {/* Badge de Facultad */}
              <View style={styles.facultadBadge}>
                <Ionicons name="school" size={14} color={COLORS.primary} />
                <Text style={styles.facultadBadgeText}>{facultadNombre}</Text>
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Información Académica</Text>
              <InfoRow icon="barcode-outline" label="Código de Estudiante" value={codigoEstudiante} />
              <InfoRow icon="book-outline" label="Semestre" value={semestre} />
              
              <View style={styles.divider} />
              
              <Text style={styles.cardTitle}>Información Personal</Text>
              <InfoRow icon="id-card-outline" label="Carnet / CI" value={perfil?.ci || perfil?.carnet} />
              <InfoRow icon="call-outline" label="Teléfono" value={telefono} />
              <InfoRow icon="mail-outline" label="Correo Electrónico" value={perfil?.email || perfil?.correo} />
            </View>

            <TouchableOpacity 
              style={styles.editBtn}
              onPress={() => Alert.alert('Próximamente', 'La edición de perfil estará disponible pronto.')}
            >
              <Ionicons name="create-outline" size={18} color={COLORS.white} />
              <Text style={styles.editBtnText}>Editar Perfil</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
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
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  nombre: { fontSize: 22, fontWeight: '700', color: COLORS.textPrimary, textAlign: 'center' },
  correo: { fontSize: 14, color: COLORS.textSecondary, marginTop: 4, textAlign: 'center' },
  
  facultadBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: COLORS.primaryLight, paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 20, marginTop: 12,
  },
  facultadBadgeText: { fontSize: 13, color: COLORS.primary, fontWeight: '600' },

  card: {
    backgroundColor: COLORS.surface, borderRadius: 16, padding: 20,
    borderWidth: 1, borderColor: COLORS.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  cardTitle: {
    fontSize: 16, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 12, marginTop: 4
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16 },
  infoIconWrap: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.primaryLight,
    justifyContent: 'center', alignItems: 'center',
  },
  infoLabel: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '500' },
  infoValue: { fontSize: 15, color: COLORS.textPrimary, fontWeight: '600', marginTop: 2 },
  
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 16 },

  editBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: COLORS.primary, paddingVertical: 14, borderRadius: 12, marginTop: 24,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 4,
  },
  editBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
});

export default PerfilEstudianteScreen;