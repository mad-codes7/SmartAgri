/**
 * SmartAgri AI Mobile - Language Context
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getTranslations, LANGUAGES } from '../i18n';

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
    const [lang, setLang] = useState('en');

    useEffect(() => {
        (async () => {
            const saved = await AsyncStorage.getItem('smartagri_lang');
            if (saved && LANGUAGES[saved]) setLang(saved);
        })();
    }, []);

    const t = getTranslations(lang);

    const changeLang = useCallback(async (newLang) => {
        if (LANGUAGES[newLang]) {
            setLang(newLang);
            await AsyncStorage.setItem('smartagri_lang', newLang);
        }
    }, []);

    return (
        <LanguageContext.Provider value={{ lang, t, changeLang, LANGUAGES }}>
            {children}
        </LanguageContext.Provider>
    );
}

export const useLang = () => useContext(LanguageContext);
