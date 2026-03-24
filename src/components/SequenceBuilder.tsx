import React, { useState, useEffect } from 'react';
import { ArrowLeft, Play, Save, Sword, Shield, Trash2, User, Bot } from 'lucide-react';
import { useMoveStore } from '../store/moveStore';
import { Move } from '../types';

interface SequenceStep {
    id: string;
    move: Move;
    actor: 'player' | 'opponent';
}

interface Props {
    onBack: () => void;
}

export const SequenceBuilder: React.FC<Props> = ({ onBack }) => {
    const { moves } = useMoveStore();

    const [steps, setSteps] = useState<SequenceStep[]>(() => {
        const saved = localStorage.getItem('sequence');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (parsed.steps) return parsed.steps;
            } catch (e) {}
        }
        return [];
    });
    const [playerStart, setPlayerStart] = useState('3-Parade');
    const [opponentStart, setOpponentStart] = useState('3-Parade');
    const [selectedActor, setSelectedActor] = useState<'player' | 'opponent'>('player');
    const [suggestedMoveIds, setSuggestedMoveIds] = useState<string[]>([]);

    // Enhanced suggestion algorithm: considers both the last opposite move and the current actor's last move
    const analyzeAndSuggestMoves = (): string[] => {
        if (steps.length === 0) return [];

        // Find last opposite step
        const lastOppositeStep = [...steps].reverse().find(s => s.actor !== selectedActor);
        if (!lastOppositeStep) return [];

        // Find last self step
        const lastSelfStep = [...steps].reverse().find(s => s.actor === selectedActor);

        // Check riposte condition: last self step is a parry that blocks the previous step (which must be an attack)
        let isRiposteSituation = false;
        if (lastSelfStep && lastSelfStep.move.type === 'parry') {
            const selfIndex = steps.findIndex(s => s.id === lastSelfStep.id);
            if (selfIndex > 0) {
                const prevStep = steps[selfIndex - 1];
                if (prevStep.move.type === 'attack' && isBlock(prevStep.move, lastSelfStep.move)) {
                    isRiposteSituation = true;
                }
            }
        }

        // ===== RIPOSTE SITUATION =====
        if (isRiposteSituation && selectedActor === lastSelfStep?.actor) {
            const ourParry = lastSelfStep.move;
            const easiestAttacks = ourParry.easiestAttacks || [];

            // Score each attack
            const allAttacks = moves.filter(m => m.type === 'attack');
            const scored = allAttacks.map(attack => {
                // Count how many of the opponent's slowest parries block this attack
                const slowestCount = (attack.slowestParries || []).filter(pId => {
                    const parry = moves.find(m => m.id === pId);
                    return parry && parry.blocks && parry.blocks.includes(attack.id);
                }).length;

                // Count how many of the opponent's fastest parries block this attack
                const fastestCount = (attack.fastestParries || []).filter(pId => {
                    const parry = moves.find(m => m.id === pId);
                    return parry && parry.blocks && parry.blocks.includes(attack.id);
                }).length;

                // Hardness score: more slowest is good, more fastest is bad
                const hardnessScore = slowestCount - fastestCount;

                // Speed bonus: position in our parry's easiestAttacks (0 = highest bonus)
                const speedIndex = easiestAttacks.indexOf(attack.id);
                const speedBonus = speedIndex !== -1 ? (10 - speedIndex) : 1; // First gets +10, second +9, ... else +1

                // Total score (weights can be adjusted)
                const totalScore = hardnessScore * 3 + speedBonus;

                return { attack, score: totalScore };
            });

            // Sort descending by score
            scored.sort((a, b) => b.score - a.score);
            return scored.map(s => s.attack.id);
        }

        // ===== OTHER CASES (unchanged) =====
        const lastOppositeMove = lastOppositeStep.move;

        if (lastOppositeMove.type === 'attack') {
            const blockingParries = moves.filter(
                (m) => m.type === 'parry' && m.blocks && m.blocks.includes(lastOppositeMove.id)
            );
            const easiestIds = lastOppositeMove.fastestParries || [];
            const hardestIds = lastOppositeMove.slowestParries || [];
            const easiest = blockingParries.filter(p => easiestIds.includes(p.id));
            const hardest = blockingParries.filter(p => hardestIds.includes(p.id));
            const others = blockingParries.filter(p => !easiestIds.includes(p.id) && !hardestIds.includes(p.id));
            easiest.sort((a, b) => easiestIds.indexOf(a.id) - easiestIds.indexOf(b.id));
            hardest.sort((a, b) => hardestIds.indexOf(a.id) - hardestIds.indexOf(b.id));
            return [...easiest, ...others, ...hardest].map(p => p.id);
        }

        if (lastOppositeMove.type === 'parry') {
            const unblockedAttacks = moves.filter(
                (m) => m.type === 'attack' &&
                    (!lastOppositeMove.blocks || !lastOppositeMove.blocks.includes(m.id))
            );
            let sortedAttacks = [...unblockedAttacks];
            if (lastSelfStep && lastSelfStep.move.type === 'parry') {
                const ourLastParry = lastSelfStep.move;
                const ourEasiestAttacks = ourLastParry.easiestAttacks || [];
                const bestFromOurParry = unblockedAttacks.filter(a => ourEasiestAttacks.includes(a.id));
                const rest = unblockedAttacks.filter(a => !ourEasiestAttacks.includes(a.id));
                bestFromOurParry.sort((a, b) => ourEasiestAttacks.indexOf(a.id) - ourEasiestAttacks.indexOf(b.id));
                sortedAttacks = [...bestFromOurParry, ...rest];
            }
            const parryEasiestIds = lastOppositeMove.easiestAttacks || [];
            const easiestFromParry = sortedAttacks.filter(a => parryEasiestIds.includes(a.id));
            const otherFromParry = sortedAttacks.filter(a => !parryEasiestIds.includes(a.id));
            easiestFromParry.sort((a, b) => parryEasiestIds.indexOf(a.id) - parryEasiestIds.indexOf(b.id));
            return [...easiestFromParry, ...otherFromParry].map(a => a.id);
        }

        return [];
    };

    // Re-run suggestions whenever steps or selectedActor change
    useEffect(() => {
        setSuggestedMoveIds(analyzeAndSuggestMoves());
    }, [steps, selectedActor]);

    const addStep = (move: Move) => {
        setSteps([
            ...steps,
            {
                id: Date.now().toString(),
                move,
                actor: selectedActor,
            },
        ]);
    };

    const removeStep = (id: string) => {
        setSteps(steps.filter((s) => s.id !== id));
    };

    const isBlock = (prev: Move, current: Move) => {
        return current.type === 'parry' && current.blocks && current.blocks.includes(prev.id);
    };

    const handleSave = () => {
        localStorage.setItem(
            'sequence',
            JSON.stringify({ steps, playerStart, opponentStart })
        );
    };

    const handleSimulate = () => {
        console.log('Simulate sequence:', steps);
        // TODO: implement animation
    };

    // Get info for the strategy hint
    const getLastActionInfo = () => {
        if (steps.length === 0) return null;
        const lastStep = steps[steps.length - 1];
        return {
            actor: lastStep.actor,
            move: lastStep.move,
            isOpposite: lastStep.actor !== selectedActor
        };
    };

    const lastActionInfo = getLastActionInfo();

    const getBlockingParriesInfo = () => {
        if (!lastActionInfo || !lastActionInfo.isOpposite) return null;
        if (lastActionInfo.move.type !== 'attack') return null;

        const attack = lastActionInfo.move;
        const blockingParries = moves.filter(
            (m) => m.type === 'parry' && m.blocks && m.blocks.includes(attack.id)
        );
        const easiestIds = attack.easiestParries || [];
        const hardestIds = attack.hardestParries || [];
        const easiest = blockingParries.filter(p => easiestIds.includes(p.id));
        const hardest = blockingParries.filter(p => hardestIds.includes(p.id));
        const others = blockingParries.filter(p => !easiestIds.includes(p.id) && !hardestIds.includes(p.id));
        easiest.sort((a, b) => easiestIds.indexOf(a.id) - easiestIds.indexOf(b.id));
        hardest.sort((a, b) => hardestIds.indexOf(a.id) - hardestIds.indexOf(b.id));
        const sorted = [...easiest, ...others, ...hardest];

        return {
            attack,
            parries: sorted,
            hasBlockingParries: sorted.length > 0
        };
    };

    const blockingInfo = getBlockingParriesInfo();

    const getSuggestionRank = (moveId: string): number | null => {
        const idx = suggestedMoveIds.indexOf(moveId);
        return idx !== -1 ? idx : null;
    };

    return (
        <div className="max-w-6xl mx-auto p-6">
            <button onClick={onBack} className="mb-4 text-gray-400 hover:text-neon-green transition">
                <ArrowLeft size={24} />
            </button>

            <h1 className="text-2xl font-bold mb-6 neon-text">Sequenz bauen</h1>

            <div className="h-40 mb-8 bg-gray-900/30 rounded-lg flex items-center justify-center text-gray-500">
                (Simulation kommt hier rein)
            </div>

            <div className="flex gap-4 mb-6">
                <select
                    value={playerStart}
                    onChange={(e) => setPlayerStart(e.target.value)}
                    className="bg-gray-800 px-3 py-2 rounded border border-gray-700 focus:border-neon-green"
                >
                    <option>3-Parade</option>
                    <option>4-Parade</option>
                </select>

                <select
                    value={opponentStart}
                    onChange={(e) => setOpponentStart(e.target.value)}
                    className="bg-gray-800 px-3 py-2 rounded border border-gray-700 focus:border-neon-green"
                >
                    <option>3-Parade</option>
                    <option>4-Parade</option>
                </select>
            </div>

            {blockingInfo && (
                <div className={`mb-4 p-3 rounded-lg text-center ${blockingInfo.hasBlockingParries ? 'bg-green-900/20 border border-green-500/30' : 'bg-yellow-900/20 border border-yellow-500/30'}`}>
                    <p className="text-sm">
                        {blockingInfo.hasBlockingParries ? (
                            <span className="text-green-400">
                                🛡️ <strong>{blockingInfo.attack.name}</strong> kann mit folgenden Paraden geblockt werden
                                (nach Geschwindigkeit sortiert):
                                <span className="font-bold ml-1">
                                    {blockingInfo.parries.map(p => p.name).join(', ')}
                                </span>
                            </span>
                        ) : (
                            <span className="text-yellow-400">
                                ⚠️ <strong>{blockingInfo.attack.name}</strong> kann von keiner Parade geblockt werden!
                            </span>
                        )}
                    </p>
                </div>
            )}

            <div className="flex justify-center my-6">
                <div className="bg-gray-800 rounded-full p-1 flex items-center shadow-lg">
                    <button
                        onClick={() => setSelectedActor('player')}
                        className={`px-6 py-2 rounded-full transition-all flex items-center space-x-2 ${
                            selectedActor === 'player'
                                ? 'bg-blue-600 text-white shadow-md'
                                : 'text-gray-400 hover:text-white'
                        }`}
                    >
                        <User size={18} />
                        <span>Spieler-Aktion</span>
                    </button>
                    <button
                        onClick={() => setSelectedActor('opponent')}
                        className={`px-6 py-2 rounded-full transition-all flex items-center space-x-2 ${
                            selectedActor === 'opponent'
                                ? 'bg-red-600 text-white shadow-md'
                                : 'text-gray-400 hover:text-white'
                        }`}
                    >
                        <Bot size={18} />
                        <span>Gegner-Aktion</span>
                    </button>
                </div>
            </div>

            <div className="mb-8 overflow-visible">
                <div className="flex gap-4 items-center min-h-[140px] overflow-visible">
                    {steps.map((step, i) => {
                        const prev = steps[i - 1];
                        const block = prev && isBlock(prev.move, step.move);

                        return (
                            <div key={step.id} className="flex items-center gap-2">
                                <div
                                    className={`w-44 p-3 rounded-lg relative border ${
                                        step.actor === 'player'
                                            ? 'bg-blue-900/30 border-blue-500'
                                            : 'bg-red-900/30 border-red-500'
                                    }`}
                                >
                                    <button
                                        onClick={() => removeStep(step.id)}
                                        className="absolute top-1 right-1 text-gray-400 hover:text-red-500"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                    <div
                                        className="w-10 h-10 mx-auto mb-2"
                                        dangerouslySetInnerHTML={{ __html: step.move.svgContent }}
                                    />
                                    <div className="flex justify-center mb-1">
                                        {step.move.type === 'attack' && <Sword size={14} className="text-pink-400" />}
                                        {step.move.type === 'parry' && (
                                            <Shield size={14} className={block ? 'text-green-400' : 'text-gray-400'} />
                                        )}
                                        {step.move.type === 'feint' && <div className="w-3 h-3 rounded-full bg-cyan-400" />}
                                    </div>
                                    <div className="text-xs text-center font-medium">{step.move.name}</div>
                                    <div className="text-[10px] text-center text-gray-400">
                                        {step.actor === 'player' ? 'Du' : 'Gegner'}
                                    </div>
                                    {step.move.type === 'parry' && prev && prev.move.type === 'attack' && block && (
                                        <div className="absolute -top-2 -left-2 bg-green-500 text-white text-[10px] px-1 rounded-full">
                                            ✓ Blockt!
                                        </div>
                                    )}
                                </div>
                                {i < steps.length - 1 && <div className="text-gray-500 text-sm">→</div>}
                            </div>
                        );
                    })}
                    {steps.length === 0 && (
                        <div className="text-gray-500 w-full text-center py-8">
                            Keine Schritte – wähle unten eine Aktion aus.
                        </div>
                    )}
                </div>
            </div>

            <div className="mb-8">
                <h2 className="text-sm text-gray-400 mb-2">
                    {selectedActor === 'player' ? 'Spieler-Aktion' : 'Gegner-Aktion'}
                    {suggestedMoveIds.length > 0 && (
                        <span className="ml-2 text-green-400 text-xs">
                            (✨ {suggestedMoveIds.length} empfohlene Aktionen)
                        </span>
                    )}
                </h2>
                <div className="flex flex-wrap gap-3">
                    {moves.map((move) => {
                        const rank = getSuggestionRank(move.id);
                        const isSuggested = rank !== null;
                        let borderClass = 'border-gray-700';
                        let bgClass = 'bg-gray-800';
                        let shadowClass = '';
                        let badge = null;

                        if (isSuggested) {
                            if (rank === 0) {
                                borderClass = 'border-yellow-400';
                                bgClass = 'bg-yellow-900/50';
                                shadowClass = 'shadow-yellow-500/50';
                                badge = <div className="text-[10px] text-center text-yellow-300 mt-1">⭐ Beste Wahl</div>;
                            } else if (rank === 1) {
                                borderClass = 'border-green-500';
                                bgClass = 'bg-green-900/30';
                                shadowClass = 'shadow-green-500/30';
                                badge = <div className="text-[10px] text-center text-green-400 mt-1">✓ Empfohlen</div>;
                            } else {
                                borderClass = 'border-green-500/50';
                                bgClass = 'bg-green-900/20';
                                badge = <div className="text-[10px] text-center text-green-400/70 mt-1">Möglichkeit</div>;
                            }
                        }

                        return (
                            <button
                                key={move.id}
                                onClick={() => addStep(move)}
                                className={`w-28 p-2 rounded-lg border transition-all hover:scale-105 ${borderClass} ${bgClass} ${shadowClass} hover:shadow-lg relative group`}
                            >
                                <div
                                    className="w-8 h-8 mx-auto mb-1"
                                    dangerouslySetInnerHTML={{ __html: move.svgContent }}
                                />
                                <div className="text-xs text-center">{move.name}</div>
                                {badge}
                                {isSuggested && (
                                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                                        {rank === 0 ? 'Schnellste / einfachste Aktion' :
                                            rank === 1 ? 'Gute Alternative' :
                                                'Möglich, aber nicht optimal'}
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="flex gap-4">
                <button
                    onClick={handleSave}
                    className="flex-1 bg-gray-700 py-2 rounded flex justify-center items-center gap-2 hover:bg-gray-600 transition"
                >
                    <Save size={16} /> Speichern
                </button>
                <button
                    onClick={handleSimulate}
                    className="flex-1 bg-neon-green text-gray-900 py-2 rounded flex justify-center items-center gap-2 shadow-neon hover:bg-neon-green/80 transition"
                >
                    <Play size={16} /> Simulieren
                </button>
            </div>
        </div>
    );
};