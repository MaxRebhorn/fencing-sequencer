import React, { useState } from 'react';

interface Props {
    nodeId: string;
    actor: 'player' | 'opponent';
    position: string;
    override?: string;
    availablePositions: string[];
    onSetOverride: (pos: string | undefined) => void;
}

export const PositionBadge: React.FC<Props> = ({
                                                   actor,
                                                   position,
                                                   override,
                                                   availablePositions,
                                                   onSetOverride,
                                               }) => {
    const [open, setOpen] = useState(false);
    const isOverridden = !!override;
    const display = override ?? position;

    return (
        <div className="relative">
            <button
                title={`Position ${actor === 'player' ? 'Spieler' : 'Gegner'} – klicken zum Überschreiben`}
                onClick={() => setOpen((v) => !v)}
                className={`
                    text-[9px] px-1.5 py-0.5 rounded border flex items-center gap-1 leading-none transition
                    ${actor === 'player'
                    ? isOverridden
                        ? 'border-blue-400 bg-blue-900/60 text-blue-200'
                        : 'border-blue-700/50 bg-blue-900/20 text-blue-400/70'
                    : isOverridden
                        ? 'border-red-400 bg-red-900/60 text-red-200'
                        : 'border-red-700/50 bg-red-900/20 text-red-400/70'
                }
                    hover:opacity-100 opacity-80
                `}
            >
                <span className="opacity-60">{actor === 'player' ? 'S' : 'G'}:</span>
                <span className="font-medium">{display || '—'}</span>
                {isOverridden && <span className="opacity-50 text-[8px]">*</span>}
            </button>

            {open && (
                <div
                    className="absolute top-full left-0 mt-1 z-30 bg-gray-900 border border-gray-600 rounded shadow-lg min-w-[130px]">
                    <div className="text-[9px] text-gray-500 px-2 pt-1.5 pb-1 border-b border-gray-700">
                        Position wählen
                    </div>
                    {isOverridden && (
                        <button
                            onClick={() => {
                                onSetOverride(undefined);
                                setOpen(false);
                            }}
                            className="w-full text-left text-[10px] px-2 py-1 text-gray-400 hover:bg-gray-800 italic"
                        >
                            ↩ Berechnet ({position})
                        </button>
                    )}
                    {availablePositions.map((pos) => (
                        <button
                            key={pos}
                            onClick={() => {
                                onSetOverride(pos);
                                setOpen(false);
                            }}
                            className={`
                                w-full text-left text-[10px] px-2 py-1 hover:bg-gray-700 transition
                                ${pos === display ? 'text-white font-semibold' : 'text-gray-300'}
                            `}
                        >
                            {pos}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};