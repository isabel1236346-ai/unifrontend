// context/ThemeContext.js
import React, { createContext, useState, useEffect, useContext } from 'react';
import { useColorScheme as useSystemColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ThemeContext = createContext();

export const AppThemeProvider = ({ children }) => {
  const systemColorScheme = useSystemColorScheme();
  // 'light', 'dark', o 'system'
  const [theme, setThemeState] = useState('system'); 
  const [isLoading, setIsLoading] = useState(true);

  // 1. Cargar preferencia guardada al iniciar la app
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('appTheme');
        if (savedTheme) {
          setThemeState(savedTheme);
        }
      } catch (e) {
        console.error("Error al cargar el tema:", e);
      } finally {
        setIsLoading(false);
      }
    };
    loadTheme();
  }, []);

  // 2. Función para cambiar y guardar el tema
  const setTheme = async (newTheme) => {
    setThemeState(newTheme);
    try {
      await AsyncStorage.setItem('appTheme', newTheme);
    } catch (e) {
      console.error("Error al guardar el tema:", e);
    }
  };

  // 3. Determinar el esquema de color real (light o dark)
  const colorScheme = theme === 'system' ? (systemColorScheme || 'light') : theme;

  return (
    <ThemeContext.Provider value={{ theme, colorScheme, setTheme, isLoading }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Hook personalizado para usar el tema fácilmente en cualquier pantalla
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme debe usarse dentro de un AppThemeProvider');
  }
  return context;
};