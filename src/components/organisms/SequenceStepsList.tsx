import React from 'react';
import { Sword, Shield, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { SequenceNode } from '../../types/sequence';
import { Action } from '../../types/action';

interface Props {
    steps: SequenceNode[];
    onRemoveStep: (id: string) => void;
    isBlock: (prevAction: Action, currentAction: Action) => boolean;
}

export const SequenceStepsList: React.FC<Props> = ({ steps, onRemoveStep, isBlock }) => {
    const { t } = useTranslation();

    if (steps.length === 0) {
        return (
            <div className="text-gray-500 w-full text-center py-8">
                {t('sequence.noSteps')}
            </div>
        );
    }

    return (
        <div className="mb-8 overflow-visible">
            <div className="flex gap-4 items-center min-h-[140px] overflow-visible">
                {steps.map((step, i) => {
                    const prev = steps[i - 1];
                    const block = prev && isBlock(prev.action, step.action);

                    return (
                        <div key={step.id} className="flex items-center gap-2">
                            <div
                                className={`w-44 p-3 rounded-lg relative border ${
                                    step.actor === 'player'
                                        ? 'bg-blue-900/30 border-blue-500'
                                        : 'bg-red-900/30 border-red-500'
                                }`}
                            >
                                <button
                                    onClick={() => onRemoveStep(step.id)}
                                    className="absolute top-1 right-1 text-gray-400 hover:text-red-500"
                                >
                                    <Trash2 size={14} />
                                </button>
                                <div
                                    className="w-10 h-10 mx-auto mb-2"
                                    dangerouslySetInnerHTML={{ __html: step.action.svgContent }}
                                />
                                <div className="flex justify-center mb-1">
                                    {step.action.type === 'attack' && <Sword size={14} className="text-pink-400" />}
                                    {step.action.type === 'parry' && (
                                        <Shield size={14} className={block ? 'text-green-400' : 'text-gray-400'} />
                                    )}
                                    {step.action.type === 'feint' && <div className="w-3 h-3 rounded-full bg-cyan-400" />}
                                </div>
                                <div className="text-xs text-center font-medium">{step.action.name}</div>
                                <div className="text-[10px] text-center text-gray-400">
                                    {step.actor === 'player' ? t('actor.player_short') : t('actor.opponent_short')}
                                </div>
                                {step.action.type === 'parry' && prev && prev.action.type === 'attack' && block && (
                                    <div className="absolute -top-2 -left-2 bg-green-500 text-white text-[10px] px-1 rounded-full">
                                        {t('action.blocks')}
                                    </div>
                                )}
                            </div>
                            {i < steps.length - 1 && <div className="text-gray-500 text-sm">→</div>}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
