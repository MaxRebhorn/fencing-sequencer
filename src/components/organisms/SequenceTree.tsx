import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { SequenceNode, ReactionType, ActiveTarget, Action } from '../../types';
import { MainSequenceRow } from '../elements/Mainsequencerow';
import { BranchContainer } from '../elements/BranchContainer';
import { ChevronDown, ChevronRight } from 'lucide-react';

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
        feintNodeId: string;
    }>>([]);
    const [collapsedNodes, setCollapsedNodes] = useState<string[]>([]);

    const toggleCollapse = (nodeId: string) => {
        setCollapsedNodes((prev) =>
            prev.includes(nodeId) ? prev.filter((id) => id !== nodeId) : [...prev, nodeId]
        );
    };

    const updateArrows = useCallback(() => {
        if (!containerRef.current) return;

        const newPaths: Array<{ path: string; color: string; id: string; feintNodeId: string }> = [];

        steps.forEach((step) => {
            if (!step.isFeint || !step.branches || step.branches.length === 0 || collapsedNodes.includes(step.id)) return;

            const mainColEl = containerRef.current?.querySelector(
                `[data-testid="main-step-column-${step.id}"]`
            ) as HTMLElement;
            if (!mainColEl) return;

            const mainRect = mainColEl.getBoundingClientRect();
            const containerRect = containerRef.current!.getBoundingClientRect();

            const startX = mainRect.left - containerRect.left + mainRect.width / 2;
            const startY = (mainRect.top - containerRect.top) + 155; 

            // Calculate vertical drop line that spans all branches
            // We find the Y-center of each branch to determine the horizontal extensions
            step.branches.forEach((branch, idx) => {
                const branchEl = containerRef.current?.querySelector(
                    `[data-branch-container-id="${branch.id}"]`
                ) as HTMLElement;
                if (!branchEl) return;

                const branchRect = branchEl.getBoundingClientRect();
                const targetX = branchRect.left - containerRect.left;
                const targetY = branchRect.top - containerRect.top + (branchRect.height / 2);

                // Manhattan path for EACH branch in the group
                const path = `M ${startX} ${startY} L ${startX} ${targetY} L ${targetX} ${targetY}`;

                newPaths.push({
                    path,
                    color: branch.reactionType === 'attackInTempo' ? '#f97316' : '#64748b',
                    id: `arrow-${step.id}-${branch.id}`,
                    feintNodeId: step.id,
                });
            });
        });

        setArrowPaths(newPaths);
    }, [steps, collapsedNodes]);

    useEffect(() => {
        const update = () => updateArrows();
        update();
        const timer = setTimeout(update, 200);
        window.addEventListener('resize', update);
        return () => {
            window.removeEventListener('resize', update);
            clearTimeout(timer);
        };
    }, [updateArrows, steps, activeTarget, collapsedNodes]);

    if (steps.length === 0) {
        return (
            <div className="text-gray-500 w-full text-center py-8 mb-8">
                {t('sequence.noSteps')}
            </div>
        );
    }

    const hasVisibleBranches = steps.some(step => 
        (step.isFeint || ((step.move as any).tempoOpening ?? 0) > 0) && 
        step.branches && 
        step.branches.length > 0 && 
        !collapsedNodes.includes(step.id)
    );

    return (
        <div 
            ref={containerRef} 
            className={`mb-12 overflow-x-auto relative bg-slate-900/10 rounded-xl p-4 border border-slate-800/50 transition-all duration-500 ${hasVisibleBranches ? 'min-h-[500px]' : 'min-h-0'}`}
        >
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
                    
                    <filter id="glow-strong" x="-30%" y="-30%" width="160%" height="160%">
                        <feGaussianBlur stdDeviation="5" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                </defs>
                
                {arrowPaths.map((p) => (
                    <g key={p.id} style={{ color: p.color }}>
                        <path
                            d={p.path}
                            stroke="currentColor"
                            strokeWidth="8"
                            fill="none"
                            className="opacity-10"
                            filter="url(#glow-strong)"
                        />
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

            {steps.map((step) => {
                if (!step.isFeint || !step.branches || step.branches.length === 0) return null;
                
                const isCollapsed = collapsedNodes.includes(step.id);
                
                const mainColEl = containerRef.current?.querySelector(
                    `[data-testid="main-step-column-${step.id}"]`
                ) as HTMLElement;
                if (!mainColEl) return null;

                const mainRect = mainColEl.getBoundingClientRect();
                const containerRect = containerRef.current!.getBoundingClientRect();

                const buttonX = mainRect.left - containerRect.left + mainRect.width / 2;
                const buttonY = (mainRect.top - containerRect.top) + 185; 

                return (
                    <button
                        key={`toggle-${step.id}`}
                        onClick={() => toggleCollapse(step.id)}
                        className={`absolute z-20 p-1.5 rounded-full border transition-all duration-300 ${
                            isCollapsed 
                            ? "bg-cyan-600 border-cyan-400 text-white shadow-[0_0_15px_rgba(6,182,212,0.5)] scale-110" 
                            : "bg-slate-700/80 border-slate-600 text-white hover:bg-slate-600 shadow-lg"
                        }`}
                        style={{
                            left: `${buttonX}px`,
                            top: `${buttonY}px`,
                            transform: 'translate(-50%, -50%)',
                        }}
                        title={isCollapsed ? "Show alternative tactical paths" : "Hide tactical paths"}
                    >
                        {isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                    </button>
                );
            })}

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

                {hasVisibleBranches && (
                    <div className="mt-24">
                        <BranchContainer
                            steps={steps}
                            activeTarget={activeTarget}
                            availablePositions={availablePositions}
                            onRemoveStepFromBranch={onRemoveStepFromBranch}
                            onSelectTarget={onSelectTarget}
                            onAddBranch={onAddBranch}
                            isBlock={isBlock}
                            collapsedNodes={collapsedNodes}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};
