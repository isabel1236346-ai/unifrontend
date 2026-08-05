import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  Platform,
  Switch
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'https://unibackend-production.up.railway.app';
const TOKEN_KEY = 'adminAuthToken'; 

const COLORS = {
  primary: '#E95A0C',
  primaryLight: '#FFEDD5',
  secondary: '#4B5563',
  accent: '#EF4444',
  success: '#10B981',
  warning: '#F59E0B',
  info: '#3B82F6',
  background: '#F9FAFB',
  surface: '#FFFFFF',
  textPrimary: '#1F2937',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  border: '#E5E7EB',
  divider: '#D1D5DB',
  shadow: 'rgba(0, 0, 0, 0.05)',
  white: '#FFFFFF',
  black: '#000000',
  error: '#DC2626',
};

const getTokenAsync = async () => {
  if (Platform.OS === 'web') {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch (e) {
      console.error("Error al acceder a localStorage en web:", e);
      return null;
    }
  } else {
    try {
      return await SecureStore.getItemAsync(TOKEN_KEY);
    } catch (e) {
      console.error("Error al obtener token de SecureStore en nativo:", e);
      return null;
    }
  }
};

const deleteTokenAsync = async () => {
  if (Platform.OS === 'web') {
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem('usuario');
    } catch (e) { console.error("Error en web:", e); }
  } else {
    try {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      await AsyncStorage.removeItem('usuario');
    } catch (e) { console.error("Error en nativo:", e); }
  }
};

const SettingsScreen = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState({ id: null, nombre: '', email: '', role: '' });
  
  const [notificacionesActivas, setNotificacionesActivas] = useState(true);
  const [modoOscuro, setModoOscuro] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const token = await getTokenAsync();
      console.log("⚙️ Settings: Token obtenido:", token ? `${token.substring(0, 20)}...` : 'NULL');

      if (!token) {
        Alert.alert(
          'Autenticación Requerida',
          'No se encontró el token. Por favor, inicia sesión de nuevo.',
          [{ text: 'OK', onPress: () => router.replace('/LoginAdmin') }]
        );
        return;
      }

      console.log("⚙️ Settings: Solicitando perfil a la API...");
      const response = await axios.get(`${API_BASE_URL}/profile`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      console.log("✅ Settings: Datos del perfil recibidos:", response.data);
      const userData = response.data;

      // ✅ Manejo flexible de nombres de campos (igual que en UsuarioA)
      setUser({
        id: userData.idusuario || userData.id || null,
        nombre: `${userData.nombre || userData.username || ''} ${userData.apellidopat || ''}`.trim() || 'Usuario',
        email: userData.email || 'sin-email@ejemplo.com',
        role: userData.role || 'admin',
      });
    } catch (error) {
      console.error("❌ Settings: Error al cargar perfil:", error);
      if (error.response) {
        console.error("❌ Settings: Status:", error.response.status);
        console.error("❌ Settings: Data:", error.response.data);
        
        if (error.response.status === 401) {
          Alert.alert(
            'Sesión Expirada',
            'Tu sesión ha expirado. Por favor inicia sesión nuevamente.',
            [{ text: 'OK', onPress: () => router.replace('/LoginAdmin') }]
          );
          return;
        }
      } else if (error.request) {
        console.error("❌ Settings: No hubo respuesta del servidor:", error.request);
      }
      
      Alert.alert('Error', 'No se pudo cargar la información del perfil. Revisa la consola para más detalles.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    const performLogout = async () => {
      try {
        await deleteTokenAsync();
        router.replace('/LoginAdmin'); 
      } catch (error) {
        console.error('Error al cerrar sesión:', error);
        router.replace('/LoginAdmin');
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm('¿Está seguro que desea cerrar la sesión actual?')) {
        await performLogout();
      }
    } else {
      Alert.alert(
        'Confirmar Cierre de Sesión',
        '¿Está seguro que desea cerrar la sesión actual?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Cerrar Sesión', style: 'destructive', onPress: performLogout },
        ]
      );
    }
  };

  const handleTelegramPress = () => {
    Alert.alert(
      'Integración con Telegram',
      'Para vincular o gestionar tu cuenta de Telegram, ve al Panel Principal y toca el icono de avión de papel en la cabecera.',
      [{ text: 'Entendido', style: 'default' }]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Cargando configuración...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Ajustes',
          headerStyle: { backgroundColor: COLORS.primary },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: 'bold' },
          headerLeft: () => (
            <TouchableOpacity 
              onPress={() => router.back()} 
              style={{ marginLeft: 15, padding: 5 }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.formContainer}>
          
          {/* Sección: Mi Cuenta */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Mi Cuenta</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nombre de Usuario</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="person-outline" size={20} color={COLORS.textSecondary} />
                <Text style={styles.inputText}>{user.nombre}</Text>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Correo Electrónico</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="mail-outline" size={20} color={COLORS.textSecondary} />
                <Text style={styles.inputText}>{user.email}</Text>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Rol Actual</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="shield-checkmark-outline" size={20} color={COLORS.success} />
                <Text style={[styles.inputText, { color: COLORS.success, fontWeight: '600' }]}>
                  {user.role.toUpperCase()}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={() => {
                if (!user.id) {
                  Alert.alert('Error', 'No se pudo identificar tu ID de usuario.');
                  return;
                }
                console.log('Navegando a editar perfil con ID:', user.id);
                router.push(`/admin/editUser/${user.id}`);
              }}
              style={styles.editProfileButton}
              activeOpacity={0.7}
            >
              <Ionicons name="pencil-outline" size={20} color={COLORS.white} />
              <Text style={styles.editProfileButtonText}>Editar mi Perfil</Text>
            </TouchableOpacity>
          </View>

          {/* Sección: Preferencias */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Preferencias</Text>

            <View style={styles.switchRow}>
              <View style={styles.switchLabel}>
                <Text style={styles.label}>Notificaciones</Text>
                <Text style={styles.hintText}>Recibir alertas de eventos y comité</Text>
              </View>
              <Switch
                value={notificacionesActivas}
                onValueChange={setNotificacionesActivas}
                trackColor={{ false: COLORS.border, true: COLORS.primaryLight }}
                thumbColor={notificacionesActivas ? COLORS.primary : COLORS.textTertiary}
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.switchRow}>
              <View style={styles.switchLabel}>
                <Text style={styles.label}>Modo Oscuro</Text>
                <Text style={styles.hintText}>Cambiar la apariencia de la aplicación</Text>
              </View>
              <Switch
                value={modoOscuro}
                onValueChange={setModoOscuro}
                trackColor={{ false: COLORS.border, true: COLORS.primaryLight }}
                thumbColor={modoOscuro ? COLORS.primary : COLORS.textTertiary}
              />
            </View>
          </View>

          {/* Sección: Integraciones */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Integraciones</Text>

            <TouchableOpacity style={styles.settingItem} onPress={handleTelegramPress} activeOpacity={0.7}>
              <View style={[styles.iconBox, { backgroundColor: '#E3F2FD' }]}>
                <Ionicons name="send" size={20} color="#0088cc" />
              </View>
              <View style={styles.itemContent}>
                <Text style={styles.itemTitle}>Telegram</Text>
                <Text style={styles.itemSubtitle}>Gestionar notificaciones por Telegram</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={COLORS.textTertiary} />
            </TouchableOpacity>
          </View>

          {/* Sección: Soporte y Acerca de */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Soporte</Text>

            <TouchableOpacity style={styles.settingItem} onPress={() => Alert.alert('Soporte', 'Para ayuda, contacta a: sistemas@cidtec-uc.com')} activeOpacity={0.7}>
              <View style={[styles.iconBox, { backgroundColor: COLORS.success + '20' }]}>
                <Ionicons name="help-circle-outline" size={20} color={COLORS.success} />
              </View>
              <View style={styles.itemContent}>
                <Text style={styles.itemTitle}>Centro de Ayuda</Text>
                <Text style={styles.itemSubtitle}>Preguntas frecuentes y contacto</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={COLORS.textTertiary} />
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.settingItem} onPress={() => Alert.alert('Acerca de', 'Sistema de Gestión de Eventos Universitarios\nVersión 1.2.0')} activeOpacity={0.7}>
              <View style={[styles.iconBox, { backgroundColor: COLORS.secondary + '20' }]}>
                <Ionicons name="information-circle-outline" size={20} color={COLORS.secondary} />
              </View>
              <View style={styles.itemContent}>
                <Text style={styles.itemTitle}>Acerca de</Text>
                <Text style={styles.itemSubtitle}>Versión 1.2.0</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={COLORS.textTertiary} />
            </TouchableOpacity>
          </View>

          {/* Botón de Cierre de Sesión */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleLogout}
              activeOpacity={0.8}
            >
              <Ionicons name="log-out-outline" size={20} color={COLORS.white} />
              <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
            </TouchableOpacity>
          </View>
          
          <Text style={styles.versionText}>Desarrollado por CIDTEC-UC</Text>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollView: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, fontSize: 16, color: COLORS.textSecondary },
  formContainer: { padding: 20, paddingBottom: 40 },
  section: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primaryLight,
  },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 8 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 15,
    height: 50,
  },
  inputText: { flex: 1, fontSize: 16, color: COLORS.textPrimary, marginLeft: 10 },
  hintText: { fontSize: 12, color: COLORS.textTertiary, marginTop: 2 },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  switchLabel: { flex: 1 },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 15 },
  settingItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  iconBox: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  itemContent: { flex: 1 },
  itemTitle: { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 2 },
  itemSubtitle: { fontSize: 12, color: COLORS.textTertiary },
  actions: { marginTop: 10 },
  editProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingVertical: 12,
    marginTop: 10,
    gap: 8,
  },
  editProfileButtonText: { fontSize: 15, fontWeight: '600', color: COLORS.white },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.accent,
    borderRadius: 10,
    paddingVertical: 15,
    gap: 8,
  },
  logoutButtonText: { fontSize: 16, fontWeight: '600', color: COLORS.white },
  versionText: { textAlign: 'center', fontSize: 12, color: COLORS.textTertiary, marginTop: 20 },
});

export default SettingsScreen;