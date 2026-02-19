/**
 * SmartAgri AI - Language Context
 */
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getTranslations, LANGUAGES } from '../i18n';

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
    const [lang, setLang] = useState(() => {
        return localStorage.getItem('smartagri_lang') || 'en';
    });

    const t = getTranslations(lang);

    const changeLang = useCallback((newLang) => {
        if (LANGUAGES[newLang]) {
            setLang(newLang);
            localStorage.setItem('smartagri_lang', newLang);
        }
    }, []);

    return (
        <LanguageContext.Provider value={{ lang, t, changeLang, LANGUAGES }}>
            {children}
        </LanguageContext.Provider>
    );
}

export const useLang = () => useContext(LanguageContext);
