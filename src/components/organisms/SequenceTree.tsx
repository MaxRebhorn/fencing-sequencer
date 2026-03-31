import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { SequenceNode, ReactionType, ActiveTarget, Action } from '../../types';
import { MainSequenceRow } from '../elements/Mainsequencerow';
import { BranchContainer } from '../elements/BranchContainer';

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
        id: string;
    }>>([]);

    const updateArrows = useCallback(() => {
        if (!containerRef.current) return;

        const newPaths: Array<{ path: string; color: string; id: string }> = [];

        steps.forEach((step) => {
            if (!step.isFeint || !step.branches) return;

            // Find the ActionCard specifically (inside the column)
            const mainColEl = containerRef.current?.querySelector(
                `[data-testid="main-step-column-${step.id}"]`
            ) as HTMLElement;
            if (!mainColEl) return;

            const mainRect = mainColEl.getBoundingClientRect();
            const containerRect = containerRef.current!.getBoundingClientRect();

            // Start point: Center bottom of the Action Card (roughly)
            const startX = mainRect.left - containerRect.left + mainRect.width / 2;
            const startY = (mainRect.top - containerRect.top) + 155; // Corrected start Y for new card/label layout

            step.branches.forEach((branch) => {
                const branchEl = containerRef.current?.querySelector(
                    `[data-branch-container-id="${branch.id}"]`
                ) as HTMLElement;
                if (!branchEl) return;

                const branchRect = branchEl.getBoundingClientRect();

                // Point definitively into the left edge (middle-height) of the branch row
                const targetX = branchRect.left - containerRect.left;
                const targetY = branchRect.top - containerRect.top + (branchRect.height / 2);

                // Bold Offset Manhattan Path: Down, then Right
                // 1. Move to start
                // 2. Line straight down to targetY level
                // 3. Line straight right to targetX
                const path = `M ${startX} ${startY} L ${startX} ${targetY} L ${targetX} ${targetY}`;

                newPaths.push({
                    path,
                    color: branch.reactionType === 'attackInTempo' ? '#f97316' : '#64748b',
                    id: `arrow-${step.id}-${branch.id}`,
                });
            });
        });

        setArrowPaths(newPaths);
    }, [steps]);

    useEffect(() => {
        const update = () => updateArrows();
        update();
        const timer = setTimeout(update, 200);
        window.addEventListener('resize', update);
        return () => {
            window.removeEventListener('resize', update);
            clearTimeout(timer);
        };
    }, [updateArrows, steps, activeTarget]);

    if (steps.length === 0) {
        return (
            <div className="text-gray-500 w-full text-center py-8 mb-8">
                {t('sequence.noSteps')}
            </div>
        );
    }

    return (
        <div ref={containerRef} className="mb-12 overflow-x-auto relative min-h-[800px] bg-slate-900/10 rounded-xl p-4 border border-slate-800/50">
            {/* SVG Overlay for Bold Offset Manhattan Arrows */}
            <svg className="absolute top-0 left-0 w-full h-full pointer-events-none z-0">
                <defs>
                    <marker
                        id="bold-arrowhead"
                        markerWidth="6"
                        markerHeight="6"
                        refX="5"
                        refY="3"
                        orient="auto"
                    >
                        <path d="M0,0 L6,3 L0,6 Z" fill="currentColor" />
                    </marker>

                    {/* Strong glow for arrows */}
                    <filter id="glow-strong" x="-30%" y="-30%" width="160%" height="160%">
                        <feGaussianBlur stdDeviation="5" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                </defs>

                {arrowPaths.map((p) => (
                    <g key={p.id} style={{ color: p.color }}>
                        {/* Glowing shadow path */}
                        <path
                            d={p.path}
                            stroke="currentColor"
                            strokeWidth="8"
                            fill="none"
                            className="opacity-10"
                            filter="url(#glow-strong)"
                        />
                        {/* Primary bold path */}
                        <path
                            d={p.path}
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="none"
                            markerEnd="url(#bold-arrowhead)"
                            className="transition-all duration-500"
                        />
                    </g>
                ))}
            </svg>

            <div className="relative z-10">
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

                <div className="mt-24"> {/* No global indent anymore; handled per node group */}
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
            </div>
        </div>
    );
};
