import React from 'react';
import { useTranslation } from 'react-i18next';
import { useMoveStore } from '../../store/moveStore';
import { useSourceStore } from '../../store/sourceStore';

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
    const { actions } = useMoveStore();
    const { activeSourceId } = useSourceStore();

    // Get all parries from the system to use as starting guards
    const parries = actions.filter(a => a.type === 'parry');

    return (
        <div className="flex gap-4 mb-6">
            <div className="flex-1">
                <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1 ml-1">Fencer Starting Guard</label>
                <select
                    value={playerStart}
                    onChange={(e) => onPlayerStartChange(e.target.value)}
                    className="w-full bg-gray-800 px-3 py-2 rounded border border-gray-700 focus:border-neon-green text-sm"
                >
                    {parries.map(p => (
                        <option key={`p-${p.id}`} value={p.id}>
                            {p.sourceNames[activeSourceId] || p.name}
                        </option>
                    ))}
                </select>
            </div>

            <div className="flex-1">
                <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1 ml-1">Adversary Starting Guard</label>
                <select
                    value={opponentStart}
                    onChange={(e) => onOpponentStartChange(e.target.value)}
                    className="w-full bg-gray-800 px-3 py-2 rounded border border-gray-700 focus:border-neon-green text-sm"
                >
                    {parries.map(p => (
                        <option key={`o-${p.id}`} value={p.id}>
                            {p.sourceNames[activeSourceId] || p.name}
                        </option>
                    ))}
                </select>
            </div>
        </div>
    );
};
