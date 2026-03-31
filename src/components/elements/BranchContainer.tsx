import React from 'react';
import { SequenceNode, FeintBranch, ReactionType, ActiveTarget, Action } from '../../types';
import { BranchRow } from './BranchRow';

interface Props {
    steps: SequenceNode[];
    activeTarget: ActiveTarget;
    availablePositions: string[];
    onRemoveStepFromBranch: (feintNodeId: string, branchId: string, nodeId: string) => void;
    onSelectTarget: (target: ActiveTarget) => void;
    onAddBranch: (feintNodeId: string, reactionType: ReactionType) => void;
    isBlock: (prevAction: Action, currentAction: Action) => boolean;
}

export const BranchContainer: React.FC<Props> = ({
                                                     steps,
                                                     activeTarget,
                                                     availablePositions,
                                                     onRemoveStepFromBranch,
                                                     onSelectTarget,
                                                     onAddBranch,
                                                     isBlock,
                                                 }) => {
    // Group branches by their parent node to allow vertical stacking per node
    const groupedBranches = steps.reduce((acc, step, index) => {
        const hasBranches = (step.isFeint || ((step.move as any).tempoOpening ?? 0) > 0) && step.branches && step.branches.length > 0;
        if (hasBranches) {
            acc.push({
                feintNodeId: step.id,
                branches: step.branches!,
                stepIndex: index
            });
        }
        return acc;
    }, [] as { feintNodeId: string, branches: FeintBranch[], stepIndex: number }[]);

    if (groupedBranches.length === 0) return null;

    // Approximate width of a card (w-44 = 176px) plus gap (gap-4 = 16px)
    const STEP_WIDTH = 192; 

    return (
        <div
            data-testid="branches-vertical-stack"
            className="flex flex-col gap-16 mt-12 mb-24"
        >
            {groupedBranches.map((group) => (
                <div 
                    key={group.feintNodeId} 
                    className="flex flex-col gap-6"
                    style={{ marginLeft: `${group.stepIndex * STEP_WIDTH + 20}px` }}
                >
                    {group.branches.map((branch, bIdx) => (
                        <div 
                            key={branch.id} 
                            className="relative"
                            style={{ marginLeft: `${bIdx * 40}px` }} // Incremental offset for multiple branches
                        >
                            <BranchRow
                                feintNodeId={group.feintNodeId}
                                branch={branch}
                                isActiveBranch={
                                    activeTarget.type === 'branch' &&
                                    (activeTarget as any).feintNodeId === group.feintNodeId &&
                                    (activeTarget as any).branchId === branch.id
                                }
                                availablePositions={availablePositions}
                                onSelectBranch={() =>
                                    onSelectTarget({
                                        type: 'branch',
                                        feintNodeId: group.feintNodeId,
                                        branchId: branch.id,
                                    })
                                }
                                onRemoveStep={(nodeId) =>
                                    onRemoveStepFromBranch(group.feintNodeId, branch.id, nodeId)
                                }
                                isBlock={isBlock}
                            />
                            
                            {/* Visual Indicator: Diversion Point */}
                            <div className="absolute -top-3 -left-4 w-2 h-2 rounded-full bg-cyan-500/40 shadow-[0_0_8px_rgba(6,182,212,0.4)]" />
                        </div>
                    ))}
                </div>
            ))}
        </div>
    );
};
