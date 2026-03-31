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
    collapsedNodes: string[]; // Added to track folding
}

export const BranchContainer: React.FC<Props> = ({
                                                     steps,
                                                     activeTarget,
                                                     availablePositions,
                                                     onRemoveStepFromBranch,
                                                     onSelectTarget,
                                                     onAddBranch,
                                                     isBlock,
                                                     collapsedNodes
                                                 }) => {
    // Group branches by their parent node
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
            className="flex flex-col gap-4 mt-6 mb-24" // Decreased gap from 16 to 4
        >
            {groupedBranches.map((group) => {
                const isCollapsed = collapsedNodes.includes(group.feintNodeId);
                if (isCollapsed) return null; // Hide the entire stack if parent is folded

                return (
                    <div 
                        key={group.feintNodeId} 
                        className="flex flex-col gap-2" // Bare minimum gap between branches in a group
                        style={{ marginLeft: `${(group.stepIndex + 1) * STEP_WIDTH}px` }} // Starts 1 card distance to the right
                    >
                        {group.branches.map((branch, bIdx) => (
                            <div 
                                key={branch.id} 
                                className="relative"
                                style={{ marginLeft: `${bIdx * 20}px` }} // Subtle incremental offset
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
                            </div>
                        ))}
                    </div>
                );
            })}
        </div>
    );
};
