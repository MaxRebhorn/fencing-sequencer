import React from 'react';
import { Sword, Shield, Trash2 } from 'lucide-react';
import { SequenceStep } from '../../types'; // we'll need to export SequenceStep type from main or a types file

// This type should be defined somewhere; we'll import it.
// For now, we'll replicate the interface here but ideally export from a shared types file.
interface Step {
    id: string;
    move: {
        id: string;
        name: string;
        type: 'attack' | 'parry' | 'feint';
        svgContent: string;
        // other move properties are not used in this component
    };
    actor: 'player' | 'opponent';
}

interface Props {
    steps: Step[];
    onRemoveStep: (id: string) => void;
    isBlock: (prevMove: any, currentMove: any) => boolean;
}

export const SequenceStepsList: React.FC<Props> = ({ steps, onRemoveStep, isBlock }) => {
    if (steps.length === 0) {
        return (
            <div className="text-gray-500 w-full text-center py-8">
                Keine Schritte – wähle unten eine Aktion aus.
            </div>
        );
    }

    return (
        <div className="mb-8 overflow-visible">
            <div className="flex gap-4 items-center min-h-[140px] overflow-visible">
                {steps.map((step, i) => {
                    const prev = steps[i - 1];
                    const block = prev && isBlock(prev.move, step.move);

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
                                    dangerouslySetInnerHTML={{ __html: step.move.svgContent }}
                                />
                                <div className="flex justify-center mb-1">
                                    {step.move.type === 'attack' && <Sword size={14} className="text-pink-400" />}
                                    {step.move.type === 'parry' && (
                                        <Shield size={14} className={block ? 'text-green-400' : 'text-gray-400'} />
                                    )}
                                    {step.move.type === 'feint' && <div className="w-3 h-3 rounded-full bg-cyan-400" />}
                                </div>
                                <div className="text-xs text-center font-medium">{step.move.name}</div>
                                <div className="text-[10px] text-center text-gray-400">
                                    {step.actor === 'player' ? 'Du' : 'Gegner'}
                                </div>
                                {step.move.type === 'parry' && prev && prev.move.type === 'attack' && block && (
                                    <div className="absolute -top-2 -left-2 bg-green-500 text-white text-[10px] px-1 rounded-full">
                                        ✓ Blockt!
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