import React from 'react';
import { useTranslation } from 'react-i18next';
import { FeintBranch } from '../SequenceBuilder';
import { Move } from '../../types';
import { StepCard } from './Stepcard';

interface Props {
    feintNodeId: string;
    branch: FeintBranch;
    isActiveBranch: boolean;
    availablePositions: string[];
    onSelectBranch: () => void;
    onRemoveStep: (nodeId: string) => void;
    isBlock: (prevMove: Move, currentMove: Move) => boolean;
}

const BRANCH_CONFIG: Record<string, {
    label: string;
    rowColor: string;
    labelColor: string;
}> = {
    'no-reaction': {
        label: 'Bleiben',
        rowColor: 'border-gray-600 bg-gray-800/50 text-gray-300',
        labelColor: 'border-gray-500 bg-gray-800 text-gray-300',
    },
    'attackInTempo': {
        label: 'Angriff ins Tempo',
        rowColor: 'border-orange-600 bg-orange-950/30 text-orange-200',
        labelColor: 'border-orange-500 bg-orange-950/60 text-orange-300',
    },
};

export const BranchRow: React.FC<Props> = ({
                                               feintNodeId,
                                               branch,
                                               isActiveBranch,
                                               availablePositions,
                                               onSelectBranch,
                                               onRemoveStep,
                                               isBlock,
                                           }) => {
    const { t } = useTranslation();
    const config = BRANCH_CONFIG[branch.reactionType] || BRANCH_CONFIG['no-reaction'];

    return (
        <div
            data-branch-container-id={branch.id}
            onClick={onSelectBranch}
            className={`
                mb-2 rounded border px-3 py-2 transition cursor-pointer
                ${isActiveBranch
                ? `${config.rowColor} border-2 shadow-lg`
                : `${config.rowColor}`
            }
            `}
        >
            <div
                className={`
                    text-[10px] font-semibold mb-1 px-2 py-1 rounded border text-center
                    ${isActiveBranch ? 'ring-1 ring-yellow-400' : ''}
                    ${config.labelColor}
                `}
            >
                {config.label}
            </div>

            <div className="flex flex-wrap gap-1">
                {branch.steps.map((step, idx) => {
                    const prevStep = idx > 0 ? branch.steps[idx - 1] : undefined;

                    return (
                        <div key={step.id} className="flex items-center gap-1">
                            <StepCard
                                step={step}
                                prevStep={prevStep}
                                availablePositions={availablePositions}
                                showFeintButton={true}
                                isActive={false}
                                onRemove={() => onRemoveStep(step.id)}
                                onToggleFeint={() => {}}
                                isBlock={isBlock}
                            />
                            {idx < branch.steps.length - 1 && (
                                <div className="text-gray-500 text-sm">→</div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};