import React from 'react';

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
    return (
        <div className="flex gap-4 mb-6">
            <select
                value={playerStart}
                onChange={(e) => onPlayerStartChange(e.target.value)}
                className="bg-gray-800 px-3 py-2 rounded border border-gray-700 focus:border-neon-green"
            >
                <option>3-Parade</option>
                <option>4-Parade</option>
            </select>

            <select
                value={opponentStart}
                onChange={(e) => onOpponentStartChange(e.target.value)}
                className="bg-gray-800 px-3 py-2 rounded border border-gray-700 focus:border-neon-green"
            >
                <option>3-Parade</option>
                <option>4-Parade</option>
            </select>
        </div>
    );
};