import React from 'react';
import { SequenceNode, FeintBranch, ReactionType, ActiveTarget } from '../SequenceBuilder';
import { Move } from '../../types';
import { BranchRow } from './BranchRow';
import { AddBranchButton } from './Addbranchbutton';

interface Props {
    steps: SequenceNode[];
    activeTarget: ActiveTarget;
    availablePositions: string[];
    onRemoveStepFromBranch: (feintNodeId: string, branchId: string, nodeId: string) => void;
    onSelectTarget: (target: ActiveTarget) => void;
    onAddBranch: (feintNodeId: string, reactionType: ReactionType) => void;
    isBlock: (prevMove: Move, currentMove: Move) => boolean;
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
    // Flatten all branches from all feint steps into a single list.
    // Each item contains the branch and the feintNodeId it belongs to.
    const flattenedBranches = steps.flatMap((step) =>
        (step.isFeint || ((step.move as any).tempoOpening ?? 0) > 0) && step.branches
            ? step.branches.map((branch) => ({ branch, feintNodeId: step.id }))
            : []
    );

    return (
        <div
            data-testid="branches-horizontal"
            className="flex flex-nowrap gap-2 mt-6 overflow-x-auto pb-2"
        >
            {flattenedBranches.map(({ branch, feintNodeId }) => (
                <BranchRow
                    key={branch.id}
                    feintNodeId={feintNodeId}
                    branch={branch}
                    isActiveBranch={
                        activeTarget.type === 'branch' &&
                        (activeTarget as any).feintNodeId === feintNodeId &&
                        (activeTarget as any).branchId === branch.id
                    }
                    availablePositions={availablePositions}
                    onSelectBranch={() =>
                        onSelectTarget({
                            type: 'branch',
                            feintNodeId: feintNodeId,
                            branchId: branch.id,
                        })
                    }
                    onRemoveStep={(nodeId) =>
                        onRemoveStepFromBranch(feintNodeId, branch.id, nodeId)
                    }
                    isBlock={isBlock}
                />
            ))}

            {/* Optionally, an “Add branch” button at the end.
                You may want to show it only if there is at least one feint step. */}
            {steps.some(step => step.isFeint || ((step.move as any).tempoOpening ?? 0) > 0) && (
                // But which feint step should the new branch be added to?
                // This depends on your UX. For simplicity, add to the last feint step.
                <AddBranchButton
                    node={steps.filter(step => step.isFeint || ((step.move as any).tempoOpening ?? 0) > 0).slice(-1)[0]}
                    existingTypes={[]}
                    onAdd={(type) => {
                        const lastFeint = steps.findLast(step => step.isFeint || ((step.move as any).tempoOpening ?? 0) > 0);
                        if (lastFeint) onAddBranch(lastFeint.id, type);
                    }}
                />
            )}
        </div>
    );
};