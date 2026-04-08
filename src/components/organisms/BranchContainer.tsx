import React from 'react';
import { SequenceNode, FeintBranch, ReactionType, ActiveTarget, Action } from '../../types';
import { BranchRow } from '../molecules/BranchRow';

interface Props {
    steps: SequenceNode[];
    activeTarget: ActiveTarget;
    availablePositions: string[];
    onRemoveStepFromBranch: (feintNodeId: string, branchId: string, nodeId: string) => void;
    onSelectTarget: (target: ActiveTarget) => void;
    onAddBranch: (feintNodeId: string, reactionType: ReactionType) => void;
    isBlock: (prevAction: Action, currentAction: Action) => boolean;
    collapsedNodes: string[];
}

export const BranchContainer: React.FC<Props> = ({
                                                     steps,
                                                     activeTarget,
                                                     availablePositions,
                                                     onRemoveStepFromBranch,
                                                     onSelectTarget,
                                                     onAddBranch,
                                                     isBlock,
                                                     collapsedNodes = [],
                                                 }) => {
    // Group branches by their parent node
    const groupedBranches = steps.reduce((acc, step, index) => {
        const hasBranches = step.isFeint && step.branches && step.branches.length > 0;
        // Only include branches if the parent feint node is not collapsed
        if (hasBranches && !collapsedNodes.includes(step.id)) {
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
    const CARD_WIDTH = 192; 

    return (
        <div
            data-testid="branches-vertical-stack"
            className="flex flex-col gap-4 mt-6 mb-24"
        >
            {groupedBranches.map((group) => {
                return (
                    <div 
                        key={group.feintNodeId} 
                        className="flex flex-col gap-2"
                        style={{ marginLeft: `${(group.stepIndex + 1) * CARD_WIDTH}px` }}
                    >
                        {group.branches.map((branch, bIdx) => (
                            <div 
                                key={branch.id} 
                                className="relative"
                                data-branch-container-id={branch.id}
                                style={{ marginLeft: `${bIdx * 20}px` }}
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
