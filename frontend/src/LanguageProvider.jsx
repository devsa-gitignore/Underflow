import React, { useEffect, useMemo, useState } from 'react';
import { LanguageContext } from './language-context';

const STORAGE_KEY = 'swasthya_language';

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    if (typeof window === 'undefined') return 'en';
    return localStorage.getItem(STORAGE_KEY) || 'en';
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, language);
    document.documentElement.lang = language === 'hi' ? 'hi' : 'en';
  }, [language]);

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      toggleLanguage: () => setLanguage((current) => (current === 'en' ? 'hi' : 'en')),
    }),
    [language]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}
