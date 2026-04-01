import React, { useState, useEffect, useMemo } from 'react';
import { useMoveStore } from '../store/moveStore';
import { useSourceStore } from '../store/sourceStore';
import { Action } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { SimpleSVGEditor } from './elements/SimpleSvgEditor';

interface Props {
    onBack: () => void;
    move?: Action;
}

interface RankedSelection {
    id: string;
    rank: number;
}

export const AddMoveForm: React.FC<Props> = ({ onBack, move }) => {
    const { actions, addAction, updateAction } = useMoveStore();
    const { activeSourceId } = useSourceStore();

    const [type, setType] = useState<'attack' | 'parry'>(move?.type || 'parry');
    const [name, setName] = useState(move?.name || '');
    const [description, setDescription] = useState(move?.description || '');
    const [selectedSVG, setSelectedSVG] = useState<string | null>(move?.svgContent || null);

    const [defendedAttacks, setDefendedAttacks] = useState<RankedSelection[]>([]);
    const [fastestAttacks, setFastestAttacks] = useState<RankedSelection[]>([]);
    const [parriesBlocking, setParriesBlocking] = useState<RankedSelection[]>([]);
    const [parriesFastest, setParriesFastest] = useState<RankedSelection[]>([]);
    const [parriesHardest, setParriesHardest] = useState<RankedSelection[]>([]);

    // Get source-mapped display names for all actions
    const attackActionsMapped = useMemo(() => {
        return actions
            .filter((a) => a.type === 'attack')
            .map(a => ({
                ...a,
                displayName: a.sourceNames[activeSourceId] || a.name
            }));
    }, [actions, activeSourceId]);

    const parryActionsMapped = useMemo(() => {
        return actions
            .filter((a) => a.type === 'parry')
            .map(a => ({
                ...a,
                displayName: a.sourceNames[activeSourceId] || a.name
            }));
    }, [actions, activeSourceId]);

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

        const actionData: Action = {
            id: newId,
            sourceId: move?.sourceId || 'Custom',
            sourceNames: move?.sourceNames || { [activeSourceId]: name, 'Custom': name },
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

        if (move) {
            updateAction(move.id, actionData);
        } else {
            addAction(actionData);
        }

        if (type === 'attack') {
            const allParries = useMoveStore.getState().actions.filter(a => a.type === 'parry');
            const selectedParryIds = parriesBlocking.map(s => s.id);

            allParries.forEach(parry => {
                const shouldBlock = selectedParryIds.includes(parry.id);
                const currentlyBlocks = parry.blocks?.includes(newId) || false;

                if (shouldBlock && !currentlyBlocks) {
                    const newBlocks = [...(parry.blocks || []), newId];
                    updateAction(parry.id, { blocks: newBlocks });
                } else if (!shouldBlock && currentlyBlocks) {
                    const newBlocks = (parry.blocks || []).filter(id => id !== newId);
                    updateAction(parry.id, { blocks: newBlocks });
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
        displayName: string,
        rank: number | null,
        onClick: () => void,
        key: string
    ) => (
        <div
            key={key}
            onClick={onClick}
            title={displayName}
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
            <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-[6px] text-white truncate px-0.5 text-center font-bold">
                {displayName}
            </div>
        </div>
    );

    return (
        <div className="max-w-2xl mx-auto p-6 space-y-6 bg-gray-900 rounded-xl border border-gray-800 shadow-2xl overflow-y-auto max-h-[90vh]">
            <button
                onClick={onBack}
                className="text-gray-400 hover:text-neon-green transition flex items-center gap-2"
            >
                ← Back
            </button>

            <h1 className="text-2xl font-bold neon-text uppercase tracking-widest text-center">
                {move ? 'Edit Action' : 'Add New Action'}
            </h1>

            <div className="flex justify-center space-x-4 mb-4">
                <button
                    onClick={() => setType('attack')}
                    className={`px-6 py-2 rounded-full transition font-black uppercase tracking-tighter ${
                        type === 'attack'
                            ? 'bg-neon-pink text-white shadow-[0_0_15px_rgba(255,75,208,0.5)]'
                            : 'bg-gray-800 text-gray-500 hover:text-gray-300'
                    }`}
                >
                    Attack
                </button>
                <button
                    onClick={() => setType('parry')}
                    className={`px-6 py-2 rounded-full transition font-black uppercase tracking-tighter ${
                        type === 'parry'
                            ? 'bg-neon-green text-gray-900 shadow-neon'
                            : 'bg-gray-800 text-gray-500 hover:text-gray-300'
                    }`}
                >
                    Parry
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                    <SimpleSVGEditor
                        key={move?.id || 'new'}
                        mode={type}
                        label={name || (type === 'attack' ? 'A' : 'P')}
                        onChange={(svg) => setSelectedSVG(svg)}
                        initialSVG={selectedSVG || undefined}
                    />
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-[10px] uppercase font-black text-gray-500 mb-1 tracking-widest">Action Name</label>
                        <input
                            type="text"
                            placeholder="Primary Name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className={`w-full p-2 rounded bg-gray-800 text-white placeholder-gray-600 focus:outline-none focus:ring-1 border border-gray-700`}
                            style={borderStyle}
                        />
                    </div>
                    
                    <div className="bg-gray-800/50 p-3 rounded border border-gray-700">
                        <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest leading-tight">Historical Context</p>
                        <p className="text-[10px] text-gray-400 mt-1 italic">
                            Currently showing names for: <span className="text-neon-blue font-bold uppercase">{activeSourceId}</span>
                        </p>
                        <p className="text-[10px] text-gray-500 mt-2">Mappings and source assignments are managed on the Sources page.</p>
                    </div>
                </div>
            </div>

            <textarea
                placeholder="Technical Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={`w-full p-3 rounded bg-gray-800 text-white placeholder-gray-600 focus:outline-none border border-gray-700 h-24`}
            />

            {type === 'parry' && (
                <div className="space-y-4">
                    <details className="border border-gray-700 rounded-lg overflow-hidden group" open>
                        <summary className="p-3 cursor-pointer font-bold bg-gray-800 hover:bg-gray-700 flex justify-between items-center text-xs uppercase tracking-widest text-gray-300">
                            <span>Blocked Attacks</span>
                            <span className="text-neon-green px-2 py-0.5 rounded-full bg-neon-green/10 text-[10px]">{defendedAttacks.length} selected</span>
                        </summary>
                        <div className="grid grid-cols-4 sm:grid-cols-6 gap-3 p-4 bg-gray-900/50">
                            {attackActionsMapped.map((a) =>
                                renderCard(
                                    a.svgContent,
                                    a.displayName,
                                    getRank(defendedAttacks, a.id),
                                    () => handleSelectRanked(defendedAttacks, setDefendedAttacks, a.id),
                                    a.id
                                )
                            )}
                        </div>
                    </details>

                    <details className="border border-gray-700 rounded-lg overflow-hidden group">
                        <summary className="p-3 cursor-pointer font-bold bg-gray-800 hover:bg-gray-700 flex justify-between items-center text-xs uppercase tracking-widest text-gray-300">
                            <span>Easiest Ripostes (Next Actions)</span>
                            <span className="text-neon-blue px-2 py-0.5 rounded-full bg-neon-blue/10 text-[10px]">{fastestAttacks.length} ranked</span>
                        </summary>
                        <div className="grid grid-cols-4 sm:grid-cols-6 gap-3 p-4 bg-gray-900/50">
                            {attackActionsMapped.map((a) =>
                                renderCard(
                                    a.svgContent,
                                    a.displayName,
                                    getRank(fastestAttacks, a.id),
                                    () => handleSelectRanked(fastestAttacks, setFastestAttacks, a.id),
                                    a.id
                                )
                            )}
                        </div>
                    </details>
                </div>
            )}

            {type === 'attack' && (
                <div className="space-y-4">
                    <details className="border border-gray-700 rounded-lg overflow-hidden group" open>
                        <summary className="p-3 cursor-pointer font-bold bg-gray-800 hover:bg-gray-700 flex justify-between items-center text-xs uppercase tracking-widest text-gray-300">
                            <span>Blocked By These Parries</span>
                        </summary>
                        <div className="grid grid-cols-4 sm:grid-cols-6 gap-3 p-4 bg-gray-900/50">
                            {parryActionsMapped.map((p) =>
                                renderCard(
                                    p.svgContent,
                                    p.displayName,
                                    getRank(parriesBlocking, p.id),
                                    () => handleSelectRanked(parriesBlocking, setParriesBlocking, p.id),
                                    p.id
                                )
                            )}
                        </div>
                    </details>

                    <details className="border border-gray-700 rounded-lg overflow-hidden group">
                        <summary className="p-3 cursor-pointer font-bold bg-gray-800 hover:bg-gray-700 flex justify-between items-center text-xs uppercase tracking-widest text-gray-300">
                            <span>Easiest Defensive Transitions</span>
                        </summary>
                        <div className="grid grid-cols-4 sm:grid-cols-6 gap-3 p-4 bg-gray-900/50">
                            {parryActionsMapped.map((p) =>
                                renderCard(
                                    p.svgContent,
                                    p.displayName,
                                    getRank(parriesFastest, p.id),
                                    () => handleSelectRanked(parriesFastest, setParriesFastest, p.id),
                                    p.id
                                )
                            )}
                        </div>
                    </details>

                    <details className="border border-gray-700 rounded-lg overflow-hidden group">
                        <summary className="p-3 cursor-pointer font-bold bg-gray-800 hover:bg-gray-700 flex justify-between items-center text-xs uppercase tracking-widest text-gray-300">
                            <span>Hardest Defensive Transitions</span>
                        </summary>
                        <div className="grid grid-cols-4 sm:grid-cols-6 gap-3 p-4 bg-gray-900/50">
                            {parryActionsMapped.map((p) =>
                                renderCard(
                                    p.svgContent,
                                    p.displayName,
                                    getRank(parriesHardest, p.id),
                                    () => handleSelectRanked(parriesHardest, setParriesHardest, p.id),
                                    p.id
                                )
                            )}
                        </div>
                    </details>
                </div>
            )}

            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-800">
                <button
                    onClick={onBack}
                    className="px-6 py-2 text-xs font-bold uppercase tracking-widest border border-gray-700 rounded-full hover:bg-gray-800 transition text-gray-400"
                >
                    Cancel
                </button>
                <button
                    onClick={handleSubmit}
                    className="px-8 py-2 text-xs bg-neon-green text-gray-900 font-black uppercase tracking-widest rounded-full hover:bg-green-500 transition shadow-neon"
                >
                    {move ? 'Update Action' : 'Save Action'}
                </button>
            </div>
        </div>
    );
};
