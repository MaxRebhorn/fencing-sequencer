import React from 'react';
import { useTranslation } from 'react-i18next';

interface Props {
    playerStart: string;
    opponentStart: string;
    onPlayerStartChange: (value: string) => void;
    onOpponentStartChange: (value: string) => void;
}

export const StartPositionsSelect: React.FC<Props> = ({
                                                          playerStart,
                                                          opponentStart,
                                                          onPlayerStartChange,
                                                          onOpponentStartChange,
                                                      }) => {
    const { t } = useTranslation();

    return (
        <div className="flex gap-4 mb-6">
            <select
                value={playerStart}
                onChange={(e) => onPlayerStartChange(e.target.value)}
                className="bg-gray-800 px-3 py-2 rounded border border-gray-700 focus:border-neon-green"
            >
                <option value="3-Parade">{t('sequence.startPositions.parry3')}</option>
                <option value="4-Parade">{t('sequence.startPositions.parry4')}</option>
            </select>

            <select
                value={opponentStart}
                onChange={(e) => onOpponentStartChange(e.target.value)}
                className="bg-gray-800 px-3 py-2 rounded border border-gray-700 focus:border-neon-green"
            >
                <option value="3-Parade">{t('sequence.startPositions.parry3')}</option>
                <option value="4-Parade">{t('sequence.startPositions.parry4')}</option>
            </select>
        </div>
    );
};