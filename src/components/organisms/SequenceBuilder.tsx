import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useMoveStore } from '../../store/moveStore';
import { Move, SequenceNode, FeintBranch, ActiveTarget, ReactionType } from '../../types';
import { StartPositionsSelect } from '../molecules/StartPositionsSelect';
import { BlockingInfoAlert } from '../molecules/BlockingInfoAlert';
import { ActorSelector } from '../molecules/ActorSelector';
import { SequenceTree } from './SequenceTree';
import { MoveGrid } from './MoveGrid';
import { ActionButtons } from '../molecules/ActionButtons';
import { SimulationPlaceholder } from '../atoms/SimulationPlaceholder';
import { useTranslation } from 'react-i18next';
import * as Logic from '../../utils/sequenceLogic';

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
        () => Logic.computePositions(steps, playerStart, opponentStart),
        [steps, playerStart, opponentStart]
    );

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
            return Logic.suggestAttacksForAttackInTempo(activeTarget, steps, moves, positionMap, playerStart, opponentStart);
        } else {
            const ctx = Logic.resolveContextSteps(activeTarget, steps);
            return Logic.analyzeAndSuggestMoves(ctx, selectedActor, moves, positionMap, playerStart, opponentStart);
        }
    }, [activeTarget, steps, selectedActor, moves, positionMap, playerStart, opponentStart]);

    // ── Auto‑switch effect ────────────────────────────────────────────────────
    useEffect(() => {
        if (!autoSwitch) return;
        const ctx = Logic.resolveContextSteps(activeTarget, steps);
        const { actor, hint } = Logic.inferNextActor(ctx, selectedActor);
        if (actor !== selectedActor) {
            setSelectedActor(actor);
        }
        setNextActorHint(hint);
    }, [steps, activeTarget, autoSwitch, selectedActor]);

    // ── Blocking info ──────────────────────────────────────────────────────────
    const getBlockingParriesInfo = () => {
        const ctx = Logic.resolveContextSteps(activeTarget, steps);
        if (ctx.length === 0) return null;
        const lastStep = ctx[ctx.length - 1];
        if (lastStep.actor === selectedActor || lastStep.move.type !== 'attack') return null;
        const attack = lastStep.move;
        const blockingParries = moves.filter(
            (m) => m.type === 'parry' && m.blocks?.includes(attack.id)
        );
        const easiestIds: string[] = attack.easiestParries || [];
        const hardestIds: string[] = attack.hardestParries || [];
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
                const cloned = Logic.cloneNodes(prev);
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
            const cloned = Logic.cloneNodes(prev);
            const branch = cloned
                .find((s) => s.id === feintNodeId)
                ?.branches?.find((b) => b.id === branchId);
            if (branch) branch.steps = branch.steps.filter((s) => s.id !== nodeId);
            return cloned;
        });
    };

    const toggleFeint = (nodeId: string) => {
        setSteps((prev) => {
            const cloned = Logic.cloneNodes(prev);
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
            const cloned = Logic.cloneNodes(prev);
            const feintNode = cloned.find((s) => s.id === feintNodeId);
            if (!feintNode) return prev;
            if (!feintNode.branches) feintNode.branches = [];

            const existing = feintNode.branches.find((b) => b.reactionType === reactionType);
            if (existing) {
                newBranchId = existing.id;
                return prev;
            }

            const labels: Record<ReactionType, string> = {
                'no-reaction': 'Stay',
                'attackInTempo': 'Attack in Tempo',
            };

            const stayMove: Move = {
                id: 'bleiben',
                name: 'Stay',
                type: 'stay',
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
            const cloned = Logic.cloneNodes(prev);
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
                    Auto-Switch
                </label>
            </div>

            {activeTarget.type === 'branch' && (
                <div className="mb-3 flex items-center gap-2 text-xs text-cyan-400 bg-cyan-900/20 border border-cyan-700/40 rounded px-3 py-2">
                    <span>✏️ Active Branch:</span>
                    {(() => {
                        const fn = steps.find((s) => s.id === (activeTarget as any).feintNodeId);
                        const br = fn?.branches?.find((b) => b.id === (activeTarget as any).branchId);
                        return <strong>{br?.label ?? '?'}</strong>;
                    })()}
                    <button className="ml-auto text-gray-400 hover:text-white" onClick={() => setActiveTarget({ type: 'main' })}>
                        ✕ Main Sequence
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
                isBlock={Logic.isBlock}
            />

            <div className="mb-8">
                <h2 className="text-sm text-gray-400 mb-2 flex items-center gap-2">
                    <span>{selectedActor === 'player' ? 'Player Action' : 'Opponent Action'}</span>
                    {nextActorHint && autoSwitch && (
                        <span className="text-cyan-600 text-xs">({nextActorHint})</span>
                    )}
                    {suggestedMoveIds.length > 0 && (
                        <span className="ml-auto text-green-400 text-xs">
                            ✨ {suggestedMoveIds.length} Recommended
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
