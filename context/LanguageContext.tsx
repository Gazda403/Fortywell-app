import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LanguageCode, SUPPORTED_LANGUAGES, LanguageOption } from '../types/i18n';
import { translations } from '../lib/translations';

const STORAGE_KEY_LANGUAGE = '@fortywell_language';

interface LanguageContextType {
  language: LanguageCode;
  setLanguage: (code: LanguageCode) => Promise<void>;
  t: (keyPath: string, params?: Record<string, string | number>) => string;
  languageOptions: LanguageOption[];
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: async () => {},
  t: (key) => key,
  languageOptions: SUPPORTED_LANGUAGES,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<LanguageCode>('en');

  // Load initial language preference
  useEffect(() => {
    (async () => {
      try {
        let storedLang: string | null = null;
        storedLang = await AsyncStorage.getItem(STORAGE_KEY_LANGUAGE);
        if (!storedLang && typeof window !== 'undefined' && window.localStorage) {
          storedLang = window.localStorage.getItem(STORAGE_KEY_LANGUAGE);
        }

        if (storedLang && ['en', 'es', 'de', 'fr', 'it', 'hr'].includes(storedLang)) {
          setLanguageState(storedLang as LanguageCode);
        }
      } catch (_) {}
    })();
  }, []);

  const setLanguage = useCallback(async (code: LanguageCode) => {
    setLanguageState(code);
    try {
      await AsyncStorage.setItem(STORAGE_KEY_LANGUAGE, code);
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(STORAGE_KEY_LANGUAGE, code);
      }
    } catch (_) {}
  }, []);

  // Translation lookup helper with parameter substitution
  const t = useCallback(
    (keyPath: string, params?: Record<string, string | number>): string => {
      const keys = keyPath.split('.');
      let currentObj: any = translations[language] || translations['en'];

      for (const key of keys) {
        if (currentObj && typeof currentObj === 'object' && key in currentObj) {
          currentObj = currentObj[key];
        } else {
          // Fallback to English if missing in target locale
          let fallbackObj: any = translations['en'];
          for (const fk of keys) {
            if (fallbackObj && typeof fallbackObj === 'object' && fk in fallbackObj) {
              fallbackObj = fallbackObj[fk];
            } else {
              return keyPath;
            }
          }
          currentObj = fallbackObj;
          break;
        }
      }

      if (typeof currentObj !== 'string') {
        return keyPath;
      }

      let result = currentObj;
      if (params) {
        Object.entries(params).forEach(([pKey, pVal]) => {
          result = result.replace(new RegExp(`{{\\s*${pKey}\\s*}}`, 'g'), String(pVal));
        });
      }

      return result;
    },
    [language]
  );

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
        languageOptions: SUPPORTED_LANGUAGES,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
