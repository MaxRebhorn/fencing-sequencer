import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { SequenceNode, ReactionType, ActiveTarget } from '../../types';
import { Action } from '../../types';
import { MainSequenceRow } from './Mainsequencerow';
import { BranchContainer } from './BranchContainer';
import { BranchArrows } from './Brancharrows';

interface Props {
    steps: SequenceNode[];
    activeTarget: ActiveTarget;
    positionMap: Map<string, { player: string; opponent: string }>;
    availablePositions: string[];
    onRemoveStep: (id: string) => void;
    onRemoveStepFromBranch: (feintNodeId: string, branchId: string, nodeId: string) => void;
    onToggleFeint: (nodeId: string) => void;
    onAddBranch: (feintNodeId: string, reactionType: ReactionType) => void;
    onSelectTarget: (target: ActiveTarget) => void;
    onSetPositionOverride: (nodeId: string, position: string | undefined) => void;
    isBlock: (prevAction: Action, currentAction: Action) => boolean;
}

export const SequenceTree: React.FC<Props> = ({
                                                  steps,
                                                  activeTarget,
                                                  positionMap,
                                                  availablePositions,
                                                  onRemoveStep,
                                                  onRemoveStepFromBranch,
                                                  onToggleFeint,
                                                  onAddBranch,
                                                  onSelectTarget,
                                                  onSetPositionOverride,
                                                  isBlock,
                                              }) => {
    const { t } = useTranslation();
    const containerRef = useRef<HTMLDivElement>(null);
    const [arrowPaths, setArrowPaths] = useState<Array<{
        path: string;
        color: string;
        dashed: boolean;
        id: string;
    }>>([]);

    const updateArrows = useCallback(() => {
        if (!containerRef.current) return;

        const newPaths: Array<{ path: string; color: string; dashed: boolean; id: string }> = [];

        steps.forEach((step) => {
            if (!step.isFeint || !step.branches) return;

            const mainRowEl = containerRef.current?.querySelector(
                `[data-testid="main-step-column-${step.id}"]`
            ) as HTMLElement;
            if (!mainRowEl) return;

            const mainRect = mainRowEl.getBoundingClientRect();
            const containerRect = containerRef.current!.getBoundingClientRect();

            // Start from middle bottom of main step
            const startX = mainRect.left - containerRect.left + mainRect.width / 2;
            const startY = mainRect.bottom - containerRect.top;

            step.branches.forEach((branch) => {
                const branchEl = containerRef.current?.querySelector(
                    `[data-branch-container-id="${branch.id}"]`
                ) as HTMLElement;
                if (!branchEl) return;

                const branchRect = branchEl.getBoundingClientRect();
                // End at top-left edge of branch container
                const targetX = branchRect.left - containerRect.left;
                const targetY = branchRect.top - containerRect.top;

                // Create straight line path
                const path = `M ${startX} ${startY} L ${targetX} ${targetY}`;

                newPaths.push({
                    path: path.replace(/\s+/g, ' ').trim(),
                    color: '#f97316',
                    dashed: true,
                    id: `arrow-${step.id}-${branch.id}`,
                });
            });
        });

        setArrowPaths(newPaths);
    }, [steps]);

    useEffect(() => {
        const update = () => updateArrows();
        update();
        window.addEventListener('resize', update);
        return () => window.removeEventListener('resize', update);
    }, [updateArrows]);

    if (steps.length === 0) {
        return (
            <div className="text-gray-500 w-full text-center py-8 mb-8">
                {t('sequence.noSteps')}
            </div>
        );
    }

    return (
        <div ref={containerRef} className="mb-8 overflow-x-auto relative min-h-[400px]">
            <BranchArrows arrowPaths={arrowPaths} />

            <MainSequenceRow
                steps={steps}
                positionMap={positionMap}
                availablePositions={availablePositions}
                activeTarget={activeTarget}
                onRemoveStep={onRemoveStep}
                onToggleFeint={onToggleFeint}
                onSelectTarget={onSelectTarget}
                onSetPositionOverride={onSetPositionOverride}
                onAddBranch={onAddBranch}
                isBlock={isBlock}
            />

            <BranchContainer
                steps={steps}
                activeTarget={activeTarget}
                availablePositions={availablePositions}
                onRemoveStepFromBranch={onRemoveStepFromBranch}
                onSelectTarget={onSelectTarget}
                onAddBranch={onAddBranch}
                isBlock={isBlock}
            />
        </div>
    );
};
