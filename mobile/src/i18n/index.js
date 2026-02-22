/**
 * SmartAgri AI Mobile - i18n Module
 * Supports 7 Indian languages + English
 */
import en from './en';
import hi from './hi';
import mr from './mr';
import te from './te';
import ta from './ta';
import kn from './kn';
import gu from './gu';
import pa from './pa';

export const LANGUAGES = {
    en: { name: 'English', nativeName: 'English', flag: '🇬🇧' },
    hi: { name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
    mr: { name: 'Marathi', nativeName: 'मराठी', flag: '🇮🇳' },
    te: { name: 'Telugu', nativeName: 'తెలుగు', flag: '🇮🇳' },
    ta: { name: 'Tamil', nativeName: 'தமிழ்', flag: '🇮🇳' },
    kn: { name: 'Kannada', nativeName: 'ಕನ್ನಡ', flag: '🇮🇳' },
    gu: { name: 'Gujarati', nativeName: 'ગુજરાતી', flag: '🇮🇳' },
    pa: { name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', flag: '🇮🇳' },
};

const translations = { en, hi, mr, te, ta, kn, gu, pa };

export function getTranslations(lang) {
    return translations[lang] || translations.en;
}

export default translations;
