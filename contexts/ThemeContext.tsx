import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { darkColors, lightColors } from '../constants/colors';

type Theme = 'dark' | 'light';

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => Promise<void>;
}

const STORAGE_KEY = 'app_theme';

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'dark',
  setTheme: async () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Default 'dark' — preserves current look for existing users on first launch.
  const [theme, setThemeState] = useState<Theme>('dark');

  useEffect(() => {
    async function loadTheme() {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored === 'dark' || stored === 'light') {
          setThemeState(stored);
        }
        // If nothing stored, stay at default 'dark'.
      } catch {
        // AsyncStorage unavailable — stay at default 'dark'.
      }
    }
    loadTheme();
  }, []);

  async function setTheme(next: Theme) {
    setThemeState(next);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, next);
    } catch {}
  }

  // theme is in the value object so consumers re-render when it changes.
  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

// Returns the active color set. Swap `import { Colors } from '../constants/colors'`
// for `const colors = useColors()` to make a screen react to theme changes.
export function useColors() {
  const { theme } = useTheme();
  return theme === 'dark' ? darkColors : lightColors;
}
