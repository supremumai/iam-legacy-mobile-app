import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import i18n from '../i18n';

type Locale = 'en' | 'es';

interface LanguageContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => Promise<void>;
  t: (key: string, params?: object) => string;
}

const STORAGE_KEY = 'app_language';

const LanguageContext = createContext<LanguageContextValue>({
  locale: 'en',
  setLocale: async () => {},
  t: (key) => key,
});

function detectDeviceLocale(): Locale {
  try {
    const languageCode = Localization.getLocales()[0]?.languageCode ?? 'en';
    return languageCode === 'es' ? 'es' : 'en';
  } catch {
    return 'en';
  }
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');

  // Sync the i18n singleton to current React state at render time — BEFORE t() can be called
  // by any child. This is the source of truth; setLocale also sets it early as belt-and-suspenders.
  i18n.locale = locale;

  useEffect(() => {
    async function loadLocale() {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored === 'en' || stored === 'es') {
          setLocaleState(stored);
        } else {
          const detected = detectDeviceLocale();
          setLocaleState(detected);
          try {
            await AsyncStorage.setItem(STORAGE_KEY, detected);
          } catch {}
        }
      } catch {
        const detected = detectDeviceLocale();
        setLocaleState(detected);
      }
    }
    loadLocale();
  }, []);

  async function setLocale(next: Locale) {
    i18n.locale = next;
    setLocaleState(next);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, next);
    } catch {}
  }

  // Recreated on every render — when locale state changes, this re-render means
  // i18n.locale is already updated (line above), so i18n.t() returns the new strings.
  function t(key: string, params?: object): string {
    return i18n.t(key, params);
  }

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
