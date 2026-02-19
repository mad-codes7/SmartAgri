/**
 * SmartAgri AI - i18n Module
 */
import en from './en';
import hi from './hi';
import mr from './mr';

export const LANGUAGES = {
    en: { name: 'English', nativeName: 'English', flag: '🇬🇧' },
    hi: { name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
    mr: { name: 'Marathi', nativeName: 'मराठी', flag: '🏳️' },
};

const translations = { en, hi, mr };

export function getTranslations(lang) {
    return translations[lang] || translations.en;
}

export default translations;
