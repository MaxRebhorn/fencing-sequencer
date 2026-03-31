import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useMoveStore } from '../store/moveStore';
import { Move } from '../types';
import { StartPositionsSelect } from './elements/StartPositionsSelect';
import { BlockingInfoAlert } from './elements/BlockingInfoAlert';
import { ActorSelector } from './elements/ActorSelector';
import { SequenceTree } from './elements/Sequencetree';
import { MoveGrid } from './elements/MoveGrid';
import { ActionButtons } from './elements/ActionButtons';
import { SimulationPlaceholder } from './elements/SimulationPlaceholder';
import { useTranslation } from 'react-i18next';

// ─── Types ─────────────────────────────────────────────────────────────────────

export type ReactionType = 'no-reaction' | 'attackInTempo';

export interface SequenceNode {
    id: string;
    move: Move;
    actor: 'player' | 'opponent';
    isFeint?: boolean;
    positionOverride?: string;
    branches?: FeintBranch[];
}

export interface FeintBranch {
    id: string;
    reactionType: ReactionType;
    label: string;
    steps: SequenceNode[];
}

export type ActiveTarget =
    | { type: 'main' }
    | { type: 'branch'; feintNodeId: string; branchId: string };

// ─── Helpers ──────────────────────────────────────────────────────────────────

function cloneNodes(nodes: SequenceNode[]): SequenceNode[] {
    return JSON.parse(JSON.stringify(nodes));
}

export function inferPosition(
    move: Move,
    startPosition: string,
    wasParried: boolean
): string {
    if (move.type === 'parry') return move.name;
    if (move.type === 'attack') {
        if (wasParried) {
            return startPosition;
        }
        const fastest = (move as any).fastestParries?.[0];
        if (fastest) return fastest;
    }
    return startPosition;
}

export function computePositions(
    steps: SequenceNode[],
    playerStart: string,
    opponentStart: string
): Map<string, { player: string; opponent: string }> {
    const map = new Map<string, { player: string; opponent: string }>();
    let playerPos = playerStart;
    let opponentPos = opponentStart;

    for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        const nextStep = steps[i + 1];
        const wasParried =
            !!nextStep &&
            nextStep.actor !== step.actor &&
            nextStep.move.type === 'parry' &&
            Array.isArray((nextStep.move as any).blocks) &&
            (nextStep.move as any).blocks.includes(step.move.id);

        if (step.actor === 'player') {
            const derived = inferPosition(step.move, playerPos, wasParried);
            playerPos = step.positionOverride ?? derived;
        } else {
            const derived = inferPosition(step.move, opponentPos, wasParried);
            opponentPos = step.positionOverride ?? derived;
        }

        map.set(step.id, { player: playerPos, opponent: opponentPos });
    }

    return map;
}

export function inferNextActor(
    contextSteps: SequenceNode[],
    currentActor: 'player' | 'opponent'
): { actor: 'player' | 'opponent'; hint: string } {
    if (contextSteps.length === 0) return { actor: currentActor, hint: '' };

    const last = contextSteps[contextSteps.length - 1];

    if (last.move.type === 'attack' && !last.isFeint) {
        return {
            actor: last.actor === 'player' ? 'opponent' : 'player',
            hint: 'Parade oder Angriff ins Tempo',
        };
    }

    if (last.isFeint || last.move.type === 'feint') {
        return { actor: last.actor, hint: 'Echter Angriff' };
    }

    if (last.move.type === 'parry') {
        return { actor: last.actor, hint: 'Riposte (Angriff)' };
    }

    return { actor: currentActor, hint: '' };
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
    onBack: () => void;
}

export const SequenceBuilder: React.FC<Props> = ({ onBack }) => {
    const { moves } = useMoveStore();
    const { t } = useTranslation();

    // ── Persistent state ───────────────────────────────────────────────────────
    const [steps, setSteps] = useState<SequenceNode[]>(() => {
        try {
            const saved = localStorage.getItem('sequence');
            if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed.steps) return parsed.steps;
            }
        } catch (_) {}
        return [];
    });

    const [playerStart, setPlayerStart] = useState('3-Parade');
    const [opponentStart, setOpponentStart] = useState('3-Parade');

    // ── UI state ───────────────────────────────────────────────────────────────
    const [selectedActor, setSelectedActor] = useState<'player' | 'opponent'>('player');
    const [autoSwitch, setAutoSwitch] = useState(true);
    const [activeTarget, setActiveTarget] = useState<ActiveTarget>({ type: 'main' });
    const [nextActorHint, setNextActorHint] = useState('');

    // ── Derived: position map (memoized) ───────────────────────────────────────
    const positionMap = useMemo(
        () => computePositions(steps, playerStart, opponentStart),
        [steps, playerStart, opponentStart]
    );

    // ── Helpers ────────────────────────────────────────────────────────────────
    const isBlock = useCallback(
        (prev: Move, current: Move) =>
            current.type === 'parry' &&
            Array.isArray((current as any).blocks) &&
            (current as any).blocks.includes(prev.id),
        []
    );

    const resolveContextSteps = useCallback(
        (target: ActiveTarget, allSteps: SequenceNode[]): SequenceNode[] => {
            if (target.type === 'main') return allSteps;
            const feintNode = allSteps.find((s) => s.id === target.feintNodeId);
            if (!feintNode?.branches) return allSteps;
            const branch = feintNode.branches.find((b) => b.id === target.branchId);
            if (!branch) return allSteps;
            const mainUpToFeint = allSteps.slice(
                0,
                allSteps.findIndex((s) => s.id === target.feintNodeId) + 1
            );
            return [...mainUpToFeint, ...branch.steps];
        },
        []
    );

    // ── Suggestion algorithm ───────────────────────────────────────────────────
    const analyzeAndSuggestMoves = useCallback(
        (ctx: SequenceNode[], actor: 'player' | 'opponent'): string[] => {
            if (ctx.length === 0) return [];

            const lastOppositeStep = [...ctx].reverse().find((s) => s.actor !== actor);
            if (!lastOppositeStep) return [];
            const lastSelfStep = [...ctx].reverse().find((s) => s.actor === actor);

            let isRiposteSituation = false;
            if (lastSelfStep?.move.type === 'parry') {
                const selfIndex = ctx.findIndex((s) => s.id === lastSelfStep.id);
                if (selfIndex > 0) {
                    const prevStep = ctx[selfIndex - 1];
                    if (prevStep.move.type === 'attack' && isBlock(prevStep.move, lastSelfStep.move)) {
                        isRiposteSituation = true;
                    }
                }
            }

            if (isRiposteSituation && actor === lastSelfStep?.actor) {
                const ourParry = lastSelfStep.move;
                const easiestAttacks = (ourParry as any).easiestAttacks || [];
                const allAttacks = moves.filter((m) => m.type === 'attack');
                const scored = allAttacks.map((attack) => {
                    const slowestCount = ((attack as any).slowestParries || []).filter((pId: string) => {
                        const parry = moves.find((m) => m.id === pId);
                        return parry && (parry as any).blocks?.includes(attack.id);
                    }).length;
                    const fastestCount = ((attack as any).fastestParries || []).filter((pId: string) => {
                        const parry = moves.find((m) => m.id === pId);
                        return parry && (parry as any).blocks?.includes(attack.id);
                    }).length;
                    const hardnessScore = slowestCount - fastestCount;
                    const speedIndex = easiestAttacks.indexOf(attack.id);
                    const speedBonus = speedIndex !== -1 ? 10 - speedIndex : 1;
                    return { attack, score: hardnessScore * 3 + speedBonus };
                });
                scored.sort((a, b) => b.score - a.score);
                return scored.map((s) => s.attack.id);
            }

            const lastOppositeMove = lastOppositeStep.move;

            if (lastOppositeMove.type === 'attack') {
                const blockingParries = moves.filter(
                    (m) => m.type === 'parry' && (m as any).blocks?.includes(lastOppositeMove.id)
                );
                const currentPos = lastSelfStep
                    ? positionMap.get(lastSelfStep.id)?.[actor] ?? (actor === 'player' ? playerStart : opponentStart)
                    : (actor === 'player' ? playerStart : opponentStart);

                const easiestIds: string[] = (lastOppositeMove as any).fastestParries || [];
                const hardestIds: string[] = (lastOppositeMove as any).slowestParries || [];

                const scored = blockingParries.map((p) => {
                    let score = 0;
                    if (easiestIds.includes(p.id)) score += 10 - easiestIds.indexOf(p.id);
                    if (hardestIds.includes(p.id)) score -= 5;
                    if (p.name === currentPos || p.id === currentPos) score += 8;
                    return { p, score };
                });
                scored.sort((a, b) => b.score - a.score);
                return scored.map((s) => s.p.id);
            }

            if (lastOppositeMove.type === 'parry') {
                const unblockedAttacks = moves.filter(
                    (m) =>
                        m.type === 'attack' &&
                        (!(lastOppositeMove as any).blocks || !(lastOppositeMove as any).blocks.includes(m.id))
                );
                let sortedAttacks = [...unblockedAttacks];
                if (lastSelfStep?.move.type === 'parry') {
                    const ourEasiestAttacks = (lastSelfStep.move as any).easiestAttacks || [];
                    const best = unblockedAttacks.filter((a) => ourEasiestAttacks.includes(a.id));
                    const rest = unblockedAttacks.filter((a) => !ourEasiestAttacks.includes(a.id));
                    best.sort((a, b) => ourEasiestAttacks.indexOf(a.id) - ourEasiestAttacks.indexOf(b.id));
                    sortedAttacks = [...best, ...rest];
                }
                const parryEasiestIds = (lastOppositeMove as any).easiestAttacks || [];
                const easiest = sortedAttacks.filter((a) => parryEasiestIds.includes(a.id));
                const others = sortedAttacks.filter((a) => !parryEasiestIds.includes(a.id));
                easiest.sort((a, b) => parryEasiestIds.indexOf(a.id) - parryEasiestIds.indexOf(b.id));
                return [...easiest, ...others].map((a) => a.id);
            }

            return [];
        },
        [moves, isBlock, positionMap, playerStart, opponentStart]
    );

    const suggestAttacksForAttackInTempo = useCallback((): string[] => {
        if (activeTarget.type !== 'branch') return [];
        const feintNode = steps.find(s => s.id === activeTarget.feintNodeId);
        const branch = feintNode?.branches?.find(b => b.id === activeTarget.branchId);
        if (!branch || branch.reactionType !== 'attackInTempo') return [];

        const finteActor = feintNode.actor;
        const attacker = finteActor === 'player' ? 'opponent' : 'player';

        const attackerPos = positionMap.get(feintNode.id)?.[attacker] ??
            (attacker === 'player' ? playerStart : opponentStart);
        const opponentPos = positionMap.get(feintNode.id)?.[finteActor] ??
            (finteActor === 'player' ? playerStart : opponentStart);

        const attacks = moves.filter(m => m.type === 'attack');
        const scored = attacks.map(attack => {
            const slowestCount = ((attack as any).slowestParries || []).filter((pId: string) => {
                const parry = moves.find(m => m.id === pId);
                return parry && (parry as any).blocks?.includes(attack.id);
            }).length;
            const fastestCount = ((attack as any).fastestParries || []).filter((pId: string) => {
                const parry = moves.find(m => m.id === pId);
                return parry && (parry as any).blocks?.includes(attack.id);
            }).length;
            const hardnessScore = slowestCount - fastestCount;
            const speedBonus = 10 - ((attack as any).fastestParries?.length ?? 0);
            const score = hardnessScore * 3 + speedBonus;
            return { attack, score };
        });
        scored.sort((a, b) => b.score - a.score);
        return scored.map(s => s.attack.id);
    }, [activeTarget, steps, positionMap, moves, playerStart, opponentStart]);

    // ── Compute suggestions (memoized) ─────────────────────────────────────────
    const suggestedMoveIds = useMemo(() => {
        const isAttackInTempoEmpty =
            activeTarget.type === 'branch' &&
            steps.some(s =>
                s.id === activeTarget.feintNodeId &&
                s.branches?.some(b =>
                    b.id === activeTarget.branchId &&
                    b.reactionType === 'attackInTempo' &&
                    b.steps.length === 0
                )
            );

        if (isAttackInTempoEmpty) {
            return suggestAttacksForAttackInTempo();
        } else {
            const ctx = resolveContextSteps(activeTarget, steps);
            return analyzeAndSuggestMoves(ctx, selectedActor);
        }
    }, [activeTarget, steps, selectedActor, suggestAttacksForAttackInTempo, resolveContextSteps, analyzeAndSuggestMoves]);

    // ── Auto‑switch effect ────────────────────────────────────────────────────
    useEffect(() => {
        if (!autoSwitch) return;
        const ctx = resolveContextSteps(activeTarget, steps);
        const { actor, hint } = inferNextActor(ctx, selectedActor);
        if (actor !== selectedActor) {
            setSelectedActor(actor);
        }
        setNextActorHint(hint);
    }, [steps, activeTarget, autoSwitch, selectedActor, resolveContextSteps]);

    // ── Blocking info ──────────────────────────────────────────────────────────
    const getBlockingParriesInfo = () => {
        const ctx = resolveContextSteps(activeTarget, steps);
        if (ctx.length === 0) return null;
        const lastStep = ctx[ctx.length - 1];
        if (lastStep.actor === selectedActor || lastStep.move.type !== 'attack') return null;
        const attack = lastStep.move;
        const blockingParries = moves.filter(
            (m) => m.type === 'parry' && (m as any).blocks?.includes(attack.id)
        );
        const easiestIds: string[] = (attack as any).easiestParries || [];
        const hardestIds: string[] = (attack as any).hardestParries || [];
        const easiest = blockingParries.filter((p) => easiestIds.includes(p.id));
        const hardest = blockingParries.filter((p) => hardestIds.includes(p.id));
        const others = blockingParries.filter((p) => !easiestIds.includes(p.id) && !hardestIds.includes(p.id));
        easiest.sort((a, b) => easiestIds.indexOf(a.id) - easiestIds.indexOf(b.id));
        hardest.sort((a, b) => hardestIds.indexOf(a.id) - hardestIds.indexOf(b.id));
        const sorted = [...easiest, ...others, ...hardest];
        return { attack, parries: sorted, hasBlockingParries: sorted.length > 0 };
    };

    const getSuggestionRank = (moveId: string): number | null => {
        const idx = suggestedMoveIds.indexOf(moveId);
        return idx !== -1 ? idx : null;
    };

    // ── Mutations ──────────────────────────────────────────────────────────────
    const addStep = (move: Move) => {
        const newNode: SequenceNode = {
            id: Date.now().toString(),
            move,
            actor: selectedActor,
        };

        if (activeTarget.type === 'main') {
            setSteps((prev) => [...prev, newNode]);
        } else {
            setSteps((prev) => {
                const cloned = cloneNodes(prev);
                const feintNode = cloned.find((s) => s.id === (activeTarget as any).feintNodeId);
                const branch = feintNode?.branches?.find((b) => b.id === (activeTarget as any).branchId);
                if (branch) branch.steps.push(newNode);
                return cloned;
            });
        }
    };

    const removeStep = (id: string) => {
        setSteps((prev) => prev.filter((s) => s.id !== id));
        if (activeTarget.type === 'branch' && (activeTarget as any).feintNodeId === id) {
            setActiveTarget({ type: 'main' });
        }
    };

    const removeStepFromBranch = (feintNodeId: string, branchId: string, nodeId: string) => {
        setSteps((prev) => {
            const cloned = cloneNodes(prev);
            const branch = cloned
                .find((s) => s.id === feintNodeId)
                ?.branches?.find((b) => b.id === branchId);
            if (branch) branch.steps = branch.steps.filter((s) => s.id !== nodeId);
            return cloned;
        });
    };

    const toggleFeint = (nodeId: string) => {
        setSteps((prev) => {
            const cloned = cloneNodes(prev);
            const node = cloned.find((s) => s.id === nodeId);
            if (!node) return prev;
            if (node.isFeint) {
                node.isFeint = false;
                delete node.branches;
            } else {
                node.isFeint = true;
                node.branches = node.branches ?? [];
            }
            return cloned;
        });
    };

    const addBranch = useCallback((feintNodeId: string, reactionType: ReactionType) => {
        let newBranchId = '';

        setSteps((prev) => {
            const cloned = cloneNodes(prev);
            const feintNode = cloned.find((s) => s.id === feintNodeId);
            if (!feintNode) return prev;
            if (!feintNode.branches) feintNode.branches = [];

            const existing = feintNode.branches.find((b) => b.reactionType === reactionType);
            if (existing) {
                newBranchId = existing.id;
                return prev;
            }

            const labels: Record<ReactionType, string> = {
                'no-reaction': 'Bleiben',
                'attackInTempo': 'Angriff ins Tempo',
            };

            const stayMove: Move = {
                id: 'bleiben',
                name: 'Bleiben',
                type: 'stay' as any,
                svgContent:
                    '<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="2"><circle cx="20" cy="20" r="14"/><line x1="20" y1="12" x2="20" y2="28"/><line x1="12" y1="20" x2="28" y2="20"/></svg>',
            };

            const newBranch: FeintBranch = {
                id: `${feintNodeId}-${reactionType}-${Date.now()}`,
                reactionType,
                label: labels[reactionType],
                steps:
                    reactionType === 'no-reaction'
                        ? [{ id: `stay-${Date.now()}`, move: stayMove, actor: feintNode.actor === 'player' ? 'opponent' : 'player' }]
                        : [],
            };

            newBranchId = newBranch.id;
            feintNode.branches.push(newBranch);
            return cloned;
        });

        setTimeout(() => {
            if (newBranchId) {
                setActiveTarget({ type: 'branch', feintNodeId, branchId: newBranchId });
            }
        }, 0);
    }, []);

    const setPositionOverride = (nodeId: string, position: string | undefined) => {
        setSteps((prev) => {
            const cloned = cloneNodes(prev);
            const node = cloned.find((s) => s.id === nodeId);
            if (node) node.positionOverride = position;
            return cloned;
        });
    };

    // ── Persistence ────────────────────────────────────────────────────────────
    const handleSave = () => {
        localStorage.setItem('sequence', JSON.stringify({ steps, playerStart, opponentStart }));
    };

    const handleSimulate = () => {
        console.log('Simulate sequence (tree):', steps);
    };

    const blockingInfo = getBlockingParriesInfo();

    // ── Available parry names for position picker ──────────────────────────────
    const parryNames = moves
        .filter((m) => m.type === 'parry')
        .map((m) => m.name);

    // ── Render ─────────────────────────────────────────────────────────────────
    return (
        <div className="max-w-6xl mx-auto p-6">
            <button onClick={onBack} className="mb-4 text-gray-400 hover:text-neon-green transition">
                <ArrowLeft size={24} />
            </button>

            <h1 className="text-2xl font-bold mb-6 neon-text">{t('sequence.title')}</h1>

            <SimulationPlaceholder />

            <StartPositionsSelect
                playerStart={playerStart}
                opponentStart={opponentStart}
                onPlayerStartChange={setPlayerStart}
                onOpponentStartChange={setOpponentStart}
            />

            <BlockingInfoAlert blockingInfo={blockingInfo} />

            <div className="flex items-center gap-4 mb-4">
                <ActorSelector selectedActor={selectedActor} onSelectActor={(a) => { setSelectedActor(a); setAutoSwitch(false); }} />
                <label className="flex items-center gap-1.5 text-xs text-gray-400 cursor-pointer select-none ml-auto">
                    <input
                        type="checkbox"
                        checked={autoSwitch}
                        onChange={(e) => setAutoSwitch(e.target.checked)}
                        className="accent-cyan-500"
                    />
                    Auto-Wechsel
                </label>
            </div>

            {activeTarget.type === 'branch' && (
                <div className="mb-3 flex items-center gap-2 text-xs text-cyan-400 bg-cyan-900/20 border border-cyan-700/40 rounded px-3 py-2">
                    <span>✏️ Aktiver Zweig:</span>
                    {(() => {
                        const fn = steps.find((s) => s.id === (activeTarget as any).feintNodeId);
                        const br = fn?.branches?.find((b) => b.id === (activeTarget as any).branchId);
                        return <strong>{br?.label ?? '?'}</strong>;
                    })()}
                    <button className="ml-auto text-gray-400 hover:text-white" onClick={() => setActiveTarget({ type: 'main' })}>
                        ✕ Hauptsequenz
                    </button>
                </div>
            )}

            <SequenceTree
                steps={steps}
                activeTarget={activeTarget}
                positionMap={positionMap}
                availablePositions={parryNames}
                onRemoveStep={removeStep}
                onRemoveStepFromBranch={removeStepFromBranch}
                onToggleFeint={toggleFeint}
                onAddBranch={addBranch}
                onSelectTarget={setActiveTarget}
                onSetPositionOverride={setPositionOverride}
                isBlock={isBlock}
            />

            <div className="mb-8">
                <h2 className="text-sm text-gray-400 mb-2 flex items-center gap-2">
                    <span>{selectedActor === 'player' ? 'Spieler-Aktion' : 'Gegner-Aktion'}</span>
                    {nextActorHint && autoSwitch && (
                        <span className="text-cyan-600 text-xs">({nextActorHint})</span>
                    )}
                    {suggestedMoveIds.length > 0 && (
                        <span className="ml-auto text-green-400 text-xs">
                            ✨ {suggestedMoveIds.length} empfohlen
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