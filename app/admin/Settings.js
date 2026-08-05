import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
  Switch,
  ActivityIndicator,
  Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'https://unibackend-production.up.railway.app';
const TOKEN_KEY = 'adminAuthToken'; // Cambia a 'academicoAuthToken' si usas una clave diferente

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
};

const getTokenAsync = async () => {
  if (Platform.OS === 'web') {
    try { return localStorage.getItem(TOKEN_KEY); } catch (e) { return null; }
  } else {
    try { return await SecureStore.getItemAsync(TOKEN_KEY); } catch (e) { return null; }
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
  const [user, setUser] = useState({ nombre: '', email: '', role: '' });
  
  // Preferencias locales
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [isTelegramLinked, setIsTelegramLinked] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const token = await getTokenAsync();
      if (!token) {
        router.replace('/');
        return;
      }

      const response = await axios.get(`${API_BASE_URL}/profile`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      setUser({
        nombre: `${response.data.nombre || ''} ${response.data.apellidopat || ''}`.trim() || 'Usuario',
        email: response.data.email || 'sin-email@ejemplo.com',
        role: response.data.role || 'academico',
      });

      const chatId = response.data.telegram_chat_id;
      const hasTelegram = chatId !== null && chatId !== undefined && chatId !== '' && chatId !== 'null';
      setIsTelegramLinked(hasTelegram);

    } catch (error) {
      console.error('Error al cargar perfil en settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    const performLogout = async () => {
      try {
        await deleteTokenAsync();
        router.replace('/');
      } catch (error) {
        console.error('Error al cerrar sesión:', error);
        router.replace('/');
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
      isTelegramLinked 
        ? 'Tu cuenta ya está vinculada a Telegram. Puedes gestionarla o desvincularla desde el icono de Telegram en la cabecera del Panel Principal.' 
        : 'Para vincular Telegram, ve al Panel Principal y toca el icono de avión de papel en la cabecera.',
      [{ text: 'Entendido', style: 'default' }]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Cargando configuración...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.surface} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ajustes</Text>
        <View style={{ width: 40 }} /> {/* Espaciador para centrar el título */}
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        
        {/* Sección: Cuenta */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cuenta</Text>
          <View style={styles.card}>
            <TouchableOpacity style={styles.settingItem} onPress={() => router.push('/admin/Perfil')} activeOpacity={0.7}>
              <View style={[styles.iconBox, { backgroundColor: COLORS.primaryLight }]}>
                <Ionicons name="person-outline" size={22} color={COLORS.primary} />
              </View>
              <View style={styles.itemContent}>
                <Text style={styles.itemTitle}>Perfil de Usuario</Text>
                <Text style={styles.itemSubtitle}>{user.nombre}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={COLORS.textTertiary} />
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.settingItem} onPress={() => router.push('/admin/CambiarPassword')} activeOpacity={0.7}>
              <View style={[styles.iconBox, { backgroundColor: COLORS.warning + '20' }]}>
                <Ionicons name="lock-closed-outline" size={22} color={COLORS.warning} />
              </View>
              <View style={styles.itemContent}>
                <Text style={styles.itemTitle}>Cambiar Contraseña</Text>
                <Text style={styles.itemSubtitle}>Actualiza tu contraseña de acceso</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={COLORS.textTertiary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Sección: Preferencias */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferencias</Text>
          <View style={styles.card}>
            <View style={styles.settingItem}>
              <View style={[styles.iconBox, { backgroundColor: COLORS.info + '20' }]}>
                <Ionicons name="notifications-outline" size={22} color={COLORS.info} />
              </View>
              <View style={styles.itemContent}>
                <Text style={styles.itemTitle}>Notificaciones</Text>
                <Text style={styles.itemSubtitle}>Recibir alertas de eventos y comité</Text>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: COLORS.border, true: COLORS.primaryLight }}
                thumbColor={notificationsEnabled ? COLORS.primary : COLORS.textTertiary}
              />
            </View>
          </View>
        </View>

        {/* Sección: Integraciones */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Integraciones</Text>
          <View style={styles.card}>
            <TouchableOpacity style={styles.settingItem} onPress={handleTelegramPress} activeOpacity={0.7}>
              <View style={[styles.iconBox, { backgroundColor: '#E3F2FD' }]}>
                <Ionicons name="send" size={22} color="#0088cc" />
              </View>
              <View style={styles.itemContent}>
                <Text style={styles.itemTitle}>Telegram</Text>
                <Text style={styles.itemSubtitle}>
                  {isTelegramLinked ? 'Vinculado correctamente ✓' : 'No vinculado'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={COLORS.textTertiary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Sección: Soporte */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Soporte</Text>
          <View style={styles.card}>
            <TouchableOpacity style={styles.settingItem} onPress={() => Alert.alert('Soporte', 'Para ayuda, contacta a: sistemas@cidtec-uc.com')} activeOpacity={0.7}>
              <View style={[styles.iconBox, { backgroundColor: COLORS.success + '20' }]}>
                <Ionicons name="help-circle-outline" size={22} color={COLORS.success} />
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
                <Ionicons name="information-circle-outline" size={22} color={COLORS.secondary} />
              </View>
              <View style={styles.itemContent}>
                <Text style={styles.itemTitle}>Acerca de</Text>
                <Text style={styles.itemSubtitle}>Versión 1.2.0</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={COLORS.textTertiary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Sección: Cierre de Sesión */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.8}>
            <Ionicons name="log-out-outline" size={22} color={COLORS.white} />
            <Text style={styles.logoutText}>Cerrar Sesión</Text>
          </TouchableOpacity>
          <Text style={styles.versionText}>Desarrollado por CIDTEC-UC</Text>
        </View>

      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 16,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: 8,
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  itemSubtitle: {
    fontSize: 13,
    color: COLORS.textTertiary,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginLeft: 68, // Alineado visualmente con el texto (40 icono + 12 margin + 16 padding)
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.accent,
    paddingVertical: 16,
    borderRadius: 16,
    marginTop: 8,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  logoutText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  versionText: {
    textAlign: 'center',
    fontSize: 12,
    color: COLORS.textTertiary,
    marginTop: 16,
  },
});

export default SettingsScreen;