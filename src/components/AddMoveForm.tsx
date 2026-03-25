import React, { useState, useEffect } from 'react';
import { useMoveStore } from '../store/moveStore';
import { Move } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { SimpleSVGEditor } from './elements/SimpleSvgEditor';

interface Props {
    onBack: () => void;
    move?: Move;
}

interface RankedSelection {
    id: string;
    rank: number;
}

export const AddMoveForm: React.FC<Props> = ({ onBack, move }) => {
    const { moves, addMove, updateMove } = useMoveStore();

    const [type, setType] = useState<'attack' | 'parry'>(move?.type || 'parry');
    const [name, setName] = useState(move?.name || '');
    const [description, setDescription] = useState(move?.description || '');
    const [selectedSVG, setSelectedSVG] = useState<string | null>(move?.svgContent || null);

    const [defendedAttacks, setDefendedAttacks] = useState<RankedSelection[]>([]);
    const [fastestAttacks, setFastestAttacks] = useState<RankedSelection[]>([]);
    const [parriesBlocking, setParriesBlocking] = useState<RankedSelection[]>([]);
    const [parriesFastest, setParriesFastest] = useState<RankedSelection[]>([]);
    const [parriesHardest, setParriesHardest] = useState<RankedSelection[]>([]);

    const attackMoves = moves.filter((m) => m.type === 'attack');
    const parryMoves = moves.filter((m) => m.type === 'parry');

    const toRanked = (ids: string[]): RankedSelection[] =>
        ids.map((id, idx) => ({ id, rank: idx + 1 }));

    useEffect(() => {
        if (move) {
            if (move.type === 'parry') {
                setDefendedAttacks(toRanked(move.blocks || []));
                setFastestAttacks(toRanked(move.easiestAttacks || []));
            } else if (move.type === 'attack') {
                setParriesBlocking(toRanked(move.blocks || []));
                setParriesFastest(toRanked(move.fastestParries || []));
                setParriesHardest(toRanked(move.slowestParries || []));
            }
        }
    }, [move]);

    const handleSelectRanked = (
        currentList: RankedSelection[],
        setList: React.Dispatch<React.SetStateAction<RankedSelection[]>>,
        id: string
    ) => {
        const index = currentList.findIndex((s) => s.id === id);
        if (index >= 0) {
            setList(currentList.filter((s) => s.id !== id));
        } else {
            setList([...currentList, { id, rank: currentList.length + 1 }]);
        }
    };

    const getRank = (list: RankedSelection[], id: string) => {
        const sel = list.find((s) => s.id === id);
        return sel ? sel.rank : null;
    };

    const handleSubmit = () => {
        if (!name.trim()) return;

        const newId = move?.id || uuidv4();

        const moveData: Move = {
            id: newId,
            name,
            type,
            description,
            svgContent: selectedSVG || '<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" stroke="#ff4bd0" fill="none"/></svg>',
            blocks: type === 'parry'
                ? defendedAttacks.map(s => s.id)
                : parriesBlocking.map(s => s.id),
            easiestAttacks: type === 'parry'
                ? fastestAttacks.map(s => s.id)
                : undefined,
            fastestParries: type === 'attack'
                ? parriesFastest.map(s => s.id)
                : undefined,
            slowestParries: type === 'attack'
                ? parriesHardest.map(s => s.id)
                : undefined,
        };

        // Save/update the move first
        if (move) {
            updateMove(move.id, moveData);
        } else {
            addMove(moveData);
        }

        // CRITICAL: If this is an attack, sync the relationship to parries
        if (type === 'attack') {
            // Get all parries from the store
            const allParries = useMoveStore.getState().moves.filter(m => m.type === 'parry');
            const selectedParryIds = parriesBlocking.map(s => s.id);

            // Update each parry's blocks array
            allParries.forEach(parry => {
                const shouldBlock = selectedParryIds.includes(parry.id);
                const currentlyBlocks = parry.blocks?.includes(newId) || false;

                if (shouldBlock && !currentlyBlocks) {
                    // Add this attack to the parry's blocks
                    const newBlocks = [...(parry.blocks || []), newId];
                    updateMove(parry.id, { blocks: newBlocks });
                } else if (!shouldBlock && currentlyBlocks) {
                    // Remove this attack from the parry's blocks
                    const newBlocks = (parry.blocks || []).filter(id => id !== newId);
                    updateMove(parry.id, { blocks: newBlocks });
                }
            });
        }

        onBack();
    };

    const borderStyle = {
        borderColor: type === 'attack' ? '#ff4bd0' : '#00ff9d',
        boxShadow: type === 'attack' ? '0 0 0 1px #ff4bd0' : '0 0 0 1px #00ff9d',
    };

    const cardClass =
        'relative border rounded p-1 cursor-pointer hover:shadow-lg transition w-16 h-16 flex items-center justify-center';

    const renderCard = (
        svg: string,
        rank: number | null,
        onClick: () => void,
        key: string
    ) => (
        <div
            key={key}
            onClick={onClick}
            className={`${cardClass} ${
                rank ? 'border-neon-green bg-gray-800' : 'border-gray-400 bg-gray-900'
            }`}
        >
            <div
                className="w-full h-full flex items-center justify-center"
                dangerouslySetInnerHTML={{ __html: svg }}
            />
            {rank && (
                <span className="absolute top-1 left-1 text-yellow-400 font-bold text-xs bg-black/50 rounded-full w-4 h-4 flex items-center justify-center">
                    {rank}
                </span>
            )}
        </div>
    );

    return (
        <div className="max-w-3xl mx-auto p-6 space-y-6">
            <button
                onClick={onBack}
                className="text-gray-400 hover:text-neon-green transition"
            >
                ← Back
            </button>

            <h1 className="text-2xl font-bold neon-text">
                {move ? 'Edit Move' : 'Add New Move'}
            </h1>

            <div className="flex justify-center space-x-4 mb-4">
                <button
                    onClick={() => setType('attack')}
                    className={`px-4 py-1 rounded-full transition font-semibold ${
                        type === 'attack'
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'bg-gray-700 text-gray-400 hover:text-white'
                    }`}
                >
                    Attack
                </button>
                <button
                    onClick={() => setType('parry')}
                    className={`px-4 py-1 rounded-full transition font-semibold ${
                        type === 'parry'
                            ? 'bg-red-600 text-white shadow-md'
                            : 'bg-gray-700 text-gray-400 hover:text-white'
                    }`}
                >
                    Parry
                </button>
            </div>

            <SimpleSVGEditor
                key={move?.id || 'new'}
                mode={type}
                label={name || (type === 'attack' ? 'A' : 'P')}
                onChange={(svg) => setSelectedSVG(svg)}
                initialSVG={selectedSVG || undefined}
            />

            <input
                type="text"
                placeholder="Move Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`w-full p-2 mb-4 rounded bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2`}
                style={borderStyle}
            />

            <textarea
                placeholder="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={`w-full p-2 mb-4 rounded bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2`}
                style={borderStyle}
            />

            {type === 'parry' && (
                <>
                    <details className="border border-gray-600 rounded mb-4">
                        <summary className="p-2 cursor-pointer font-semibold bg-gray-800 hover:bg-gray-700">
                            Attacks blocked by this parry
                        </summary>
                        <div className="grid grid-cols-4 gap-2 p-2">
                            {attackMoves.map((m) =>
                                renderCard(
                                    m.svgContent,
                                    getRank(defendedAttacks, m.id),
                                    () => handleSelectRanked(defendedAttacks, setDefendedAttacks, m.id),
                                    m.id
                                )
                            )}
                        </div>
                    </details>

                    <details className="border border-gray-600 rounded mb-4">
                        <summary className="p-2 cursor-pointer font-semibold bg-gray-800 hover:bg-gray-700">
                            Easiest attacks from this parry
                        </summary>
                        <div className="grid grid-cols-4 gap-2 p-2">
                            {attackMoves.map((m) =>
                                renderCard(
                                    m.svgContent,
                                    getRank(fastestAttacks, m.id),
                                    () => handleSelectRanked(fastestAttacks, setFastestAttacks, m.id),
                                    m.id
                                )
                            )}
                        </div>
                    </details>
                </>
            )}

            {type === 'attack' && (
                <>
                    <details className="border border-gray-600 rounded mb-4">
                        <summary className="p-2 cursor-pointer font-semibold bg-gray-800 hover:bg-gray-700">
                            Parries that block this attack
                        </summary>
                        <div className="grid grid-cols-4 gap-2 p-2">
                            {parryMoves.map((p) =>
                                renderCard(
                                    p.svgContent,
                                    getRank(parriesBlocking, p.id),
                                    () => handleSelectRanked(parriesBlocking, setParriesBlocking, p.id),
                                    p.id
                                )
                            )}
                        </div>
                    </details>

                    <details className="border border-gray-600 rounded mb-4">
                        <summary className="p-2 cursor-pointer font-semibold bg-gray-800 hover:bg-gray-700">
                            Parries easiest to switch into from this attack
                        </summary>
                        <div className="grid grid-cols-4 gap-2 p-2">
                            {parryMoves.map((p) =>
                                renderCard(
                                    p.svgContent,
                                    getRank(parriesFastest, p.id),
                                    () => handleSelectRanked(parriesFastest, setParriesFastest, p.id),
                                    p.id
                                )
                            )}
                        </div>
                    </details>

                    <details className="border border-gray-600 rounded mb-4">
                        <summary className="p-2 cursor-pointer font-semibold bg-gray-800 hover:bg-gray-700">
                            Parries hardest to switch into from this attack
                        </summary>
                        <div className="grid grid-cols-4 gap-2 p-2">
                            {parryMoves.map((p) =>
                                renderCard(
                                    p.svgContent,
                                    getRank(parriesHardest, p.id),
                                    () => handleSelectRanked(parriesHardest, setParriesHardest, p.id),
                                    p.id
                                )
                            )}
                        </div>
                    </details>
                </>
            )}

            <div className="flex justify-end space-x-4">
                <button
                    onClick={onBack}
                    className="px-2 py-1 text-sm border rounded hover:bg-gray-700 transition"
                >
                    Cancel
                </button>
                <button
                    onClick={handleSubmit}
                    className="px-2 py-1 text-sm bg-neon-green text-black font-semibold rounded hover:bg-green-500 transition"
                >
                    {move ? 'Update Move' : 'Add Move'}
                </button>
            </div>
        </div>
    );
};