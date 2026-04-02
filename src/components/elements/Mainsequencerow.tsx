import React from 'react';
import { SequenceNode, ActiveTarget, Action, ReactionType } from '../../types';
import { ActionCard } from '../molecules/ActionCard';
import { AddBranchButton } from '../atoms/AddBranchButton';

interface Props {
    steps: SequenceNode[];
    positionMap: Map<string, { player: string; opponent: string }>;
    availablePositions: string[];
    activeTarget: ActiveTarget;
    onRemoveStep: (id: string) => void;
    onToggleFeint: (nodeId: string) => void;
    onSelectTarget: (target: ActiveTarget) => void;
    onSetPositionOverride: (nodeId: string, position: string | undefined) => void;
    onAddBranch: (feintNodeId: string, reactionType: ReactionType) => void;
    isBlock: (prevAction: Action, currentAction: Action) => boolean;
}

export const MainSequenceRow: React.FC<Props> = ({
                                                     steps,
                                                     positionMap,
                                                     availablePositions,
                                                     activeTarget,
                                                     onRemoveStep,
                                                     onToggleFeint,
                                                     onSelectTarget,
                                                     onSetPositionOverride,
                                                     onAddBranch,
                                                     isBlock,
                                                 }) => {
    return (
        <div data-testid="main-sequence" className="flex flex-nowrap gap-4 items-start pb-10">
            {steps.map((step, i) => {
                const prev = steps[i - 1];
                const positions = positionMap.get(step.id);
                const isActiveTarget = activeTarget.type === 'main';
                const existingBranchTypes = (step.branches || []).map(b => b.reactionType);

                return (
                    <div
                        key={step.id}
                        data-testid={`main-step-column-${step.id}`}
                        className="flex flex-col items-center shrink-0"
                    >
                        <ActionCard
                            step={step}
                            prevStep={prev}
                            fencerPosition={positions?.player}
                            adversaryPosition={positions?.opponent}
                            availablePositions={availablePositions}
                            showFeintButton={true}
                            isActive={isActiveTarget}
                            onRemove={() => onRemoveStep(step.id)}
                            onToggleFeint={() => onToggleFeint(step.id)}
                            onSetPositionOverride={(pos) => onSetPositionOverride(step.id, pos)}
                            isBlock={isBlock}
                            onClick={() => onSelectTarget({ type: 'main' })}
                        />

                        {/* Only show branch buttons if this step is a feint */}
                        {step.isFeint && (
                            <AddBranchButton
                                existingTypes={existingBranchTypes}
                                onAdd={(type) => onAddBranch(step.id, type)}
                            />
                        )}

                        <div className="mt-2 text-[9px] uppercase tracking-widest text-slate-600 font-bold">
                            Phase {i + 1}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};