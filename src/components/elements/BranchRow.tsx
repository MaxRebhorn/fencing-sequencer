import React from 'react';
import { useTranslation } from 'react-i18next';
import { FeintBranch, Action } from '../../types';
import { ActionCard } from '../molecules/ActionCard';

interface Props {
    feintNodeId: string;
    branch: FeintBranch;
    isActiveBranch: boolean;
    availablePositions: string[];
    activeSimStepId?: string;
    onSelectBranch: () => void;
    onRemoveStep: (nodeId: string) => void;
    isBlock: (prevAction: Action, currentAction: Action) => boolean;
}

const BRANCH_CONFIG: Record<string, {
    label: string;
    rowColor: string;
    labelColor: string;
}> = {
    'no-reaction': {
        label: 'Stay / No Reaction',
        rowColor: 'border-slate-700 bg-slate-900/40 text-slate-300',
        labelColor: 'border-slate-600 bg-slate-800 text-slate-400',
    },
    'attackInTempo': {
        label: 'Attack in Tempo',
        rowColor: 'border-orange-900/50 bg-orange-950/20 text-orange-200',
        labelColor: 'border-orange-800/50 bg-orange-950/40 text-orange-400',
    },
};

export const BranchRow: React.FC<Props> = ({
                                               feintNodeId,
                                               branch,
                                               isActiveBranch,
                                               availablePositions,
                                               activeSimStepId,
                                               onSelectBranch,
                                               onRemoveStep,
                                               isBlock,
                                           }) => {
    const config = BRANCH_CONFIG[branch.reactionType] || BRANCH_CONFIG['no-reaction'];

    return (
        <div
            data-branch-container-id={branch.id}
            onClick={(e) => {
                e.stopPropagation();
                onSelectBranch();
            }}
            className={`
                shrink-0 rounded-lg border p-4 transition-all duration-300 cursor-pointer min-w-[200px]
                ${isActiveBranch
                ? `${config.rowColor} border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.15)] ring-1 ring-cyan-500/30`
                : `${config.rowColor} border-transparent hover:border-slate-600`
            }
            `}
        >
            <div
                className={`
                    inline-block text-[10px] font-bold tracking-wider uppercase mb-4 px-2 py-0.5 rounded border
                    ${config.labelColor}
                `}
            >
                {config.label}
            </div>

            <div className="flex flex-nowrap gap-3 items-start overflow-visible">
                {branch.steps.map((step, idx) => {
                    const prevStep = idx > 0 ? branch.steps[idx - 1] : undefined;
                    const isSimActive = activeSimStepId === step.id;

                    return (
                        <div key={step.id} className="flex items-center gap-3">
                            <ActionCard
                                step={step}
                                prevStep={prevStep}
                                availablePositions={availablePositions}
                                showFeintButton={false}
                                isActive={false}
                                isSimActive={isSimActive}
                                onRemove={() => onRemoveStep(step.id)}
                                isBlock={isBlock}
                            />
                            {idx < branch.steps.length - 1 && (
                                <div className={`font-light text-xl select-none transition-colors ${isSimActive ? 'text-yellow-500' : 'text-slate-600'}`}>→</div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
