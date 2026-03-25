import React from 'react';
import { useTranslation } from 'react-i18next';

export const SimulationPlaceholder: React.FC = () => {
    const { t } = useTranslation();
    return (
        <div className="h-40 mb-8 bg-gray-900/30 rounded-lg flex items-center justify-center text-gray-500">
            {t('simulation.placeholder')}
        </div>
    );
};