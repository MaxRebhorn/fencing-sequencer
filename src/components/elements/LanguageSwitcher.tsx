import React from 'react';
import { useTranslation } from 'react-i18next';

export const LanguageSwitcher: React.FC = () => {
    const { i18n } = useTranslation();

    const toggleLanguage = () => {
        const newLang = i18n.language === 'en' ? 'de' : 'en';
        i18n.changeLanguage(newLang);
    };

    return (
        <button
            onClick={toggleLanguage}
            className="px-3 py-1 rounded bg-gray-700 hover:bg-gray-600 transition text-sm"
        >
            {i18n.language === 'en' ? '🇩🇪 Deutsch' : '🇬🇧 English'}
        </button>
    );
};