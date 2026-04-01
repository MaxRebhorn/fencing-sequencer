import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ArrowLeft, Save, Trash2, FolderOpen } from 'lucide-react';
import { useMoveStore } from '../../store/moveStore';
import { Action, SequenceNode, ActiveTarget, ReactionType } from '../../types';
import { StartPositionsSelect } from '../molecules/StartPositionsSelect';
import { BlockingInfoAlert } from '../molecules/BlockingInfoAlert';
import { ActorSelector } from '../molecules/ActorSelector';
import { SequenceTree } from './SequenceTree';
import { MoveGrid } from './MoveGrid';
import { ActionButtons } from '../molecules/ActionButtons';
import { SimulationPlaceholder } from '../atoms/SimulationPlaceholder';
import { useTranslation } from 'react-i18next';
import * as Logic from '../../utils/sequenceLogic';
import { useSequenceStore, SavedSequence } from '../../store/sequenceStore';

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
    onBack: () => void;
}

export const SequenceBuilder: React.FC<Props> = ({ onBack }) => {
    const { actions } = useMoveStore();
    const { savedSequences, saveSequence, deleteSequence } = useSequenceStore();
    const { t } = useTranslation();

    // ── Persistent state ───────────────────────────────────────────────────────
    const [steps, setSteps] = useState<SequenceNode[]>([]);
    const [playerStart, setPlayerStart] = useState('tierce'); // Default to generic ID
    const [opponentStart, setOpponentStart] = useState('tierce');
    const [currentSequenceId, setCurrentSequenceId] = useState<string | null>(null);
    const [sequenceName, setSequenceName] = useState('');

    // ── UI state ───────────────────────────────────────────────────────────────
    const [selectedActor, setSelectedActor] = useState<'player' | 'opponent'>('player');
    const [autoSwitch, setAutoSwitch] = useState(true);
    const [activeTarget, setActiveTarget] = useState<ActiveTarget>({ type: 'main' });
    const [nextActorHint, setNextActorHint] = useState('');
    const [showSaveDialog, setShowSaveDialog] = useState(false);
    const [showLoadDialog, setShowLoadDialog] = useState(false);

    // ── Derived: position map (memoized) ───────────────────────────────────────
    const positionMap = useMemo(
        () => Logic.computePositions(steps, playerStart, opponentStart),
        [steps, playerStart, opponentStart]
    );

    // ── Compute suggestions (memoized) ─────────────────────────────────────────
    const suggestedActionIds = useMemo(() => {
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
            return Logic.suggestAttacksForAttackInTempo(activeTarget, steps, actions, positionMap, playerStart, opponentStart);
        } else {
            const ctx = Logic.resolveContextSteps(activeTarget, steps);
            // This now triggers whenever steps, playerStart, or opponentStart change
            return Logic.analyzeAndSuggestMoves(ctx, selectedActor, actions, positionMap, playerStart, opponentStart);
        }
    }, [activeTarget, steps, selectedActor, actions, positionMap, playerStart, opponentStart]);

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
        const blockingParries = actions.filter(
            (a) => a.type === 'parry' && a.blocks?.includes(attack.id)
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

    const getSuggestionRank = (actionId: string): number | null => {
        const idx = suggestedActionIds.indexOf(actionId);
        return idx !== -1 ? idx : null;
    };

    // ── Mutations ──────────────────────────────────────────────────────────────
    const addStep = (action: Action) => {
        const newNode: SequenceNode = {
            id: Date.now().toString(),
            move: action,
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

            const stayAction = actions.find(a => a.id === 'stay_action');

            const newBranch: any = {
                id: `${feintNodeId}-${reactionType}-${Date.now()}`,
                reactionType,
                label: labels[reactionType],
                steps:
                    reactionType === 'no-reaction' && stayAction
                        ? [{ id: `stay-${Date.now()}`, move: stayAction, actor: feintNode.actor === 'player' ? 'opponent' : 'player' }]
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
    }, [actions]);

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
        if (steps.length === 0) return;
        setShowSaveDialog(true);
    };

    const confirmSave = () => {
        if (!sequenceName.trim()) return;
        saveSequence({
            name: sequenceName,
            steps,
            playerStart,
            opponentStart
        }, currentSequenceId || undefined);
        setShowSaveDialog(false);
    };

    const loadSequence = (seq: SavedSequence) => {
        setSteps(seq.steps);
        setPlayerStart(seq.playerStart);
        setOpponentStart(seq.opponentStart);
        setCurrentSequenceId(seq.id);
        setSequenceName(seq.name);
        setShowLoadDialog(false);
    };

    const handleNewSequence = () => {
        setSteps([]);
        setCurrentSequenceId(null);
        setSequenceName('');
        setActiveTarget({ type: 'main' });
    };

    const handleSimulate = () => {
        console.log('Simulate sequence (tree):', steps);
    };

    const blockingInfo = getBlockingParriesInfo();

    // ── Available parry names for position picker ──────────────────────────────
    const parryNames = useMemo(() => {
        return actions
            ? actions.filter((a) => a.type === 'parry').map((a) => a.name)
            : [];
    }, [actions]);

    // ── Render ─────────────────────────────────────────────────────────────────
    return (
        <div className="max-w-6xl mx-auto p-6">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="text-gray-400 hover:text-neon-green transition">
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold neon-text leading-tight">{t('sequence.title')}</h1>
                        {sequenceName && <span className="text-[10px] text-neon-blue uppercase font-black tracking-widest italic">{sequenceName}</span>}
                    </div>
                </div>
                
                <div className="flex gap-2">
                    <button 
                        onClick={handleNewSequence}
                        className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-full text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-white hover:border-gray-500 transition"
                    >
                        New
                    </button>
                    <button 
                        onClick={() => setShowLoadDialog(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-800 border border-gray-700 rounded-full text-[10px] font-black uppercase tracking-widest text-gray-300 hover:border-neon-blue transition"
                    >
                        <FolderOpen size={14} className="text-neon-blue" />
                        Load
                    </button>
                </div>
            </div>

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
                    {suggestedActionIds.length > 0 && (
                        <span className="ml-auto text-green-400 text-xs">
                            ✨ {suggestedActionIds.length} Recommended
                        </span>
                    )}
                </h2>
                <MoveGrid
                    actions={actions}
                    suggestedActionIds={suggestedActionIds}
                    onActionClick={addStep}
                    getSuggestionRank={getSuggestionRank}
                />
            </div>

            <ActionButtons onSave={handleSave} onSimulate={handleSimulate} />

            {/* Modal: Save Sequence */}
            {showSaveDialog && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-950/90 backdrop-blur-md animate-in fade-in">
                    <div className="bg-gray-900 border border-gray-700 rounded-3xl p-8 max-w-md w-full shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-neon-green to-neon-blue" />
                        <h3 className="text-xl font-black uppercase italic tracking-tighter text-white mb-6">Save Tactical Sequence</h3>
                        
                        <div className="space-y-4 mb-8">
                            <div>
                                <label className="block text-[10px] uppercase font-black text-gray-500 mb-1 tracking-widest">Sequence Name</label>
                                <input 
                                    type="text" 
                                    value={sequenceName}
                                    onChange={(e) => setSequenceName(e.target.value)}
                                    placeholder="e.g. Radaelli's Basic Molinello Drill"
                                    className="w-full bg-gray-800 border border-gray-700 p-3 rounded-xl text-white focus:border-neon-green focus:outline-none font-bold"
                                    autoFocus
                                />
                            </div>
                            
                            {currentSequenceId && (
                                <p className="text-[10px] text-gray-500 italic">This will overwrite the existing version of this sequence.</p>
                            )}
                        </div>

                        <div className="flex gap-3">
                            <button 
                                onClick={() => setShowSaveDialog(false)}
                                className="flex-1 py-3 border border-gray-700 rounded-2xl text-xs font-black uppercase tracking-widest text-gray-500 hover:bg-gray-800 transition"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={confirmSave}
                                className="flex-1 py-3 bg-neon-green text-gray-900 font-black uppercase tracking-widest rounded-2xl shadow-neon transition hover:scale-[1.02]"
                            >
                                Save Entry
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal: Load Sequence */}
            {showLoadDialog && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-950/90 backdrop-blur-md animate-in fade-in">
                    <div className="bg-gray-900 border border-gray-700 rounded-3xl p-8 max-w-2xl w-full shadow-2xl relative overflow-hidden flex flex-col max-h-[80vh]">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-neon-blue to-neon-green" />
                        <div className="flex justify-between items-center mb-8 shrink-0">
                            <h3 className="text-xl font-black uppercase italic tracking-tighter text-white">Saved Tactical Sequences</h3>
                            <button onClick={() => setShowLoadDialog(false)} className="text-gray-500 hover:text-white"><ArrowLeft size={24} /></button>
                        </div>

                        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">
                            {savedSequences.length === 0 ? (
                                <div className="text-center py-12 text-gray-600 uppercase font-black tracking-widest text-xs">No sequences saved yet</div>
                            ) : (
                                savedSequences.map(seq => (
                                    <div key={seq.id} className="group flex items-center gap-3 p-4 rounded-2xl bg-gray-800/50 border border-gray-700 hover:border-neon-blue transition-all cursor-pointer" onClick={() => loadSequence(seq)}>
                                        <div className="flex-1">
                                            <h4 className="font-black text-gray-200 uppercase tracking-tight">{seq.name}</h4>
                                            <div className="flex items-center gap-3 mt-1">
                                                <span className="text-[10px] text-gray-500 font-bold uppercase">{seq.steps.length} Actions</span>
                                                <span className="text-[10px] text-gray-600">Created: {new Date(seq.createdAt).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                deleteSequence(seq.id);
                                            }}
                                            className="p-2 text-gray-600 hover:text-red-500 transition opacity-0 group-hover:opacity-100"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="mt-8 pt-6 border-t border-gray-800 shrink-0">
                            <button 
                                onClick={() => setShowLoadDialog(false)}
                                className="w-full py-4 border border-gray-700 text-gray-500 font-black uppercase tracking-widest rounded-2xl hover:bg-gray-800 transition"
                            >
                                Back to Editor
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};