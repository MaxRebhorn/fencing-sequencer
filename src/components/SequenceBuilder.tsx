import React, { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useMoveStore } from '../store/moveStore';
import { Move } from '../types';
import { StartPositionsSelect } from './elements/StartPositionsSelect';
import { BlockingInfoAlert } from './elements/BlockingInfoAlert';
import { ActorSelector } from './elements/ActorSelector';
import { SequenceStepsList } from './elements/SequenceStepsList';
import { MoveGrid } from './elements/MoveGrid';
import { ActionButtons } from './elements/ActionButtons';
import { SimulationPlaceholder } from './elements/SimulationPlaceholder';

// This type should ideally be exported from a shared types file.
// For now, we define it here and will use it in the steps state.
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

    // Helper functions (unchanged)
    const isBlock = (prev: Move, current: Move) => {
        return current.type === 'parry' && current.blocks && current.blocks.includes(prev.id);
    };

    const getLastActionInfo = () => {
        if (steps.length === 0) return null;
        const lastStep = steps[steps.length - 1];
        return {
            actor: lastStep.actor,
            move: lastStep.move,
            isOpposite: lastStep.actor !== selectedActor,
        };
    };

    const getBlockingParriesInfo = () => {
        const lastActionInfo = getLastActionInfo();
        if (!lastActionInfo || !lastActionInfo.isOpposite) return null;
        if (lastActionInfo.move.type !== 'attack') return null;

        const attack = lastActionInfo.move;
        const blockingParries = moves.filter(
            (m) => m.type === 'parry' && m.blocks && m.blocks.includes(attack.id)
        );
        const easiestIds = attack.easiestParries || [];
        const hardestIds = attack.hardestParries || [];
        const easiest = blockingParries.filter((p) => easiestIds.includes(p.id));
        const hardest = blockingParries.filter((p) => hardestIds.includes(p.id));
        const others = blockingParries.filter(
            (p) => !easiestIds.includes(p.id) && !hardestIds.includes(p.id)
        );
        easiest.sort((a, b) => easiestIds.indexOf(a.id) - easiestIds.indexOf(b.id));
        hardest.sort((a, b) => hardestIds.indexOf(a.id) - hardestIds.indexOf(b.id));
        const sorted = [...easiest, ...others, ...hardest];

        return {
            attack,
            parries: sorted,
            hasBlockingParries: sorted.length > 0,
        };
    };

    const getSuggestionRank = (moveId: string): number | null => {
        const idx = suggestedMoveIds.indexOf(moveId);
        return idx !== -1 ? idx : null;
    };

    // Suggestion algorithm (unchanged)
    const analyzeAndSuggestMoves = (): string[] => {
        if (steps.length === 0) return [];

        const lastOppositeStep = [...steps].reverse().find((s) => s.actor !== selectedActor);
        if (!lastOppositeStep) return [];

        const lastSelfStep = [...steps].reverse().find((s) => s.actor === selectedActor);

        let isRiposteSituation = false;
        if (lastSelfStep && lastSelfStep.move.type === 'parry') {
            const selfIndex = steps.findIndex((s) => s.id === lastSelfStep.id);
            if (selfIndex > 0) {
                const prevStep = steps[selfIndex - 1];
                if (prevStep.move.type === 'attack' && isBlock(prevStep.move, lastSelfStep.move)) {
                    isRiposteSituation = true;
                }
            }
        }

        // Riposte situation
        if (isRiposteSituation && selectedActor === lastSelfStep?.actor) {
            const ourParry = lastSelfStep.move;
            const easiestAttacks = ourParry.easiestAttacks || [];

            const allAttacks = moves.filter((m) => m.type === 'attack');
            const scored = allAttacks.map((attack) => {
                const slowestCount = (attack.slowestParries || []).filter((pId) => {
                    const parry = moves.find((m) => m.id === pId);
                    return parry && parry.blocks && parry.blocks.includes(attack.id);
                }).length;

                const fastestCount = (attack.fastestParries || []).filter((pId) => {
                    const parry = moves.find((m) => m.id === pId);
                    return parry && parry.blocks && parry.blocks.includes(attack.id);
                }).length;

                const hardnessScore = slowestCount - fastestCount;
                const speedIndex = easiestAttacks.indexOf(attack.id);
                const speedBonus = speedIndex !== -1 ? 10 - speedIndex : 1;
                const totalScore = hardnessScore * 3 + speedBonus;

                return { attack, score: totalScore };
            });

            scored.sort((a, b) => b.score - a.score);
            return scored.map((s) => s.attack.id);
        }

        // Other cases
        const lastOppositeMove = lastOppositeStep.move;

        if (lastOppositeMove.type === 'attack') {
            const blockingParries = moves.filter(
                (m) => m.type === 'parry' && m.blocks && m.blocks.includes(lastOppositeMove.id)
            );
            const easiestIds = lastOppositeMove.fastestParries || [];
            const hardestIds = lastOppositeMove.slowestParries || [];
            const easiest = blockingParries.filter((p) => easiestIds.includes(p.id));
            const hardest = blockingParries.filter((p) => hardestIds.includes(p.id));
            const others = blockingParries.filter(
                (p) => !easiestIds.includes(p.id) && !hardestIds.includes(p.id)
            );
            easiest.sort((a, b) => easiestIds.indexOf(a.id) - easiestIds.indexOf(b.id));
            hardest.sort((a, b) => hardestIds.indexOf(a.id) - hardestIds.indexOf(b.id));
            return [...easiest, ...others, ...hardest].map((p) => p.id);
        }

        if (lastOppositeMove.type === 'parry') {
            const unblockedAttacks = moves.filter(
                (m) =>
                    m.type === 'attack' &&
                    (!lastOppositeMove.blocks || !lastOppositeMove.blocks.includes(m.id))
            );
            let sortedAttacks = [...unblockedAttacks];
            if (lastSelfStep && lastSelfStep.move.type === 'parry') {
                const ourLastParry = lastSelfStep.move;
                const ourEasiestAttacks = ourLastParry.easiestAttacks || [];
                const bestFromOurParry = unblockedAttacks.filter((a) =>
                    ourEasiestAttacks.includes(a.id)
                );
                const rest = unblockedAttacks.filter((a) => !ourEasiestAttacks.includes(a.id));
                bestFromOurParry.sort(
                    (a, b) => ourEasiestAttacks.indexOf(a.id) - ourEasiestAttacks.indexOf(b.id)
                );
                sortedAttacks = [...bestFromOurParry, ...rest];
            }
            const parryEasiestIds = lastOppositeMove.easiestAttacks || [];
            const easiestFromParry = sortedAttacks.filter((a) => parryEasiestIds.includes(a.id));
            const otherFromParry = sortedAttacks.filter((a) => !parryEasiestIds.includes(a.id));
            easiestFromParry.sort(
                (a, b) => parryEasiestIds.indexOf(a.id) - parryEasiestIds.indexOf(b.id)
            );
            return [...easiestFromParry, ...otherFromParry].map((a) => a.id);
        }

        return [];
    };

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

    const handleSave = () => {
        localStorage.setItem('sequence', JSON.stringify({ steps, playerStart, opponentStart }));
    };

    const handleSimulate = () => {
        console.log('Simulate sequence:', steps);
        // TODO: implement animation
    };

    const blockingInfo = getBlockingParriesInfo();

    return (
        <div className="max-w-6xl mx-auto p-6">
            <button
                onClick={onBack}
                className="mb-4 text-gray-400 hover:text-neon-green transition"
            >
                <ArrowLeft size={24} />
            </button>

            <h1 className="text-2xl font-bold mb-6 neon-text">Sequenz bauen</h1>

            <SimulationPlaceholder />

            <StartPositionsSelect
                playerStart={playerStart}
                opponentStart={opponentStart}
                onPlayerStartChange={setPlayerStart}
                onOpponentStartChange={setOpponentStart}
            />

            <BlockingInfoAlert blockingInfo={blockingInfo} />

            <ActorSelector selectedActor={selectedActor} onSelectActor={setSelectedActor} />

            <SequenceStepsList steps={steps} onRemoveStep={removeStep} isBlock={isBlock} />

            <div className="mb-8">
                <h2 className="text-sm text-gray-400 mb-2">
                    {selectedActor === 'player' ? 'Spieler-Aktion' : 'Gegner-Aktion'}
                    {suggestedMoveIds.length > 0 && (
                        <span className="ml-2 text-green-400 text-xs">
              (✨ {suggestedMoveIds.length} empfohlene Aktionen)
            </span>
                    )}
                </h2>
                <MoveGrid
                    moves={moves}
                    suggestedMoveIds={suggestedMoveIds}
                    onMoveClick={addStep}
                    getSuggestionRank={getSuggestionRank}
                />
            </div>

            <ActionButtons onSave={handleSave} onSimulate={handleSimulate} />
        </div>
    );
};