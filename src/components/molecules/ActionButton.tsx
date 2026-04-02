import React from 'react';
import { Action } from '../../types';
import { useTranslation } from 'react-i18next';
import { ActionIcon } from '../atoms/ActionIcon';
import { useSourceStore } from '../../store/sourceStore';

interface Props {
    action: Action;
    suggestionRank: number | null;
    onClick: (action: Action) => void;
    compact?: boolean;
}

export const ActionButton: React.FC<Props> = ({ action, suggestionRank, onClick, compact = false }) => {
    const { t } = useTranslation();
    const { activeSourceId } = useSourceStore();
    const isSuggested = suggestionRank !== null;

    let borderClass = 'border-gray-700';
    let bgClass = 'bg-gray-800';
    let shadowClass = '';
    let badge = null;
    let tooltipText = '';

    if (isSuggested && !compact) {
        if (suggestionRank === 0) {
            borderClass = 'border-yellow-400';
            bgClass = 'bg-yellow-900/50';
            shadowClass = 'shadow-yellow-500/50';
            badge = <div className="text-[10px] text-center text-yellow-300 mt-1">{t('move.bestChoice')}</div>;
            tooltipText = t('move.tooltipBest');
        } else if (suggestionRank === 1) {
            borderClass = 'border-green-500';
            bgClass = 'bg-green-900/30';
            shadowClass = 'shadow-green-500/30';
            badge = <div className="text-[10px] text-center text-green-400 mt-1">{t('move.recommended')}</div>;
            tooltipText = t('move.tooltipRecommended');
        } else {
            borderClass = 'border-green-500/50';
            bgClass = 'bg-green-900/20';
            badge = <div className="text-[10px] text-center text-green-400/70 mt-1">{t('move.possibility')}</div>;
            tooltipText = t('move.tooltipPossible');
        }
    }

    // Use source-specific name for display, with optional chaining for sourceNames
    const displayName = action.sourceNames?.[activeSourceId] || action.sourceNames?.['System'] || action.id;

    return (
        <button
            onClick={() => onClick(action)}
            className={`${compact ? 'w-20 p-1' : 'w-28 p-2'} rounded-lg border transition-all hover:scale-105 ${borderClass} ${bgClass} ${shadowClass} hover:shadow-lg relative group`}
        >
            <ActionIcon svgContent={action.svgContent} className={compact ? 'w-6 h-6' : 'w-8 h-8'} />
            <div className={`${compact ? 'text-[10px]' : 'text-xs'} text-center truncate font-bold text-gray-200`}>{displayName}</div>
            {badge}
            {isSuggested && !compact && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                    {tooltipText}
                </div>
            )}
        </button>
    );
};
