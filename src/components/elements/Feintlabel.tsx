import React from 'react';
import { useTranslation } from 'react-i18next';

export const FeintLabel: React.FC = () => {
    const { t } = useTranslation();

    return (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-cyan-500 to-cyan-400 text-gray-900 text-[9px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap shadow-lg">
            {t('sequence.feint')}
        </div>
    );
};