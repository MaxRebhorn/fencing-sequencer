import React from 'react';
import { Sword, Shield, Trash2, Zap } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { SequenceNode } from '../../types/sequence';
import { Action } from '../../types/action';
import { PositionBadge } from '../atoms/PositionBadge';
import { FeintLabel } from '../atoms/FeintLabel';
import { ActionIcon } from '../atoms/ActionIcon';

interface Props {
    step: SequenceNode;
    prevStep?: SequenceNode;
    playerPosition?: string;
    opponentPosition?: string;
    availablePositions: string[];
    showFeintButton?: boolean;
    isActive?: boolean;
    onRemove: () => void;
    onToggleFeint?: () => void;
    onSetPositionOverride?: (pos: string | undefined) => void;
    isBlock: (prevAction: Action, currentAction: Action) => boolean;
    onClick?: () => void;
}

export const StepCard: React.FC<Props> = ({
                                              step,
                                              prevStep,
                                              playerPosition,
                                              opponentPosition,
                                              availablePositions,
                                              showFeintButton,
                                              isActive,
                                              onRemove,
                                              onToggleFeint,
                                              onSetPositionOverride,
                                              isBlock,
                                              onClick,
                                          }) => {
    const { t } = useTranslation();
    const blocked = prevStep && isBlock(prevStep.action, step.action);
    const canFeint = step.action.type === 'attack' || step.action.type === 'feint';
    const isFeigningSpoofed = step.isFeint && prevStep && prevStep.action.type === 'parry' && blocked;

    return (
        <div className="flex flex-col items-center gap-0.5">
            {(playerPosition || opponentPosition) && onSetPositionOverride && (
                <div className="flex gap-1 flex-wrap justify-center mb-0.5">
                    {playerPosition !== undefined && (
                        <PositionBadge
                            nodeId={step.id}
                            actor="player"
                            position={playerPosition}
                            override={step.actor === 'player' ? step.positionOverride : undefined}
                            availablePositions={availablePositions}
                            onSetOverride={step.actor === 'player' ? onSetPositionOverride : () => {}}
                        />
                    )}
                    {opponentPosition !== undefined && (
                        <PositionBadge
                            nodeId={step.id}
                            actor="opponent"
                            position={opponentPosition}
                            override={step.actor === 'opponent' ? step.positionOverride : undefined}
                            availablePositions={availablePositions}
                            onSetOverride={step.actor === 'opponent' ? onSetPositionOverride : () => {}}
                        />
                    )}
                </div>
            )}

            <div
                onClick={onClick}
                className={`
                    relative w-44 p-3 rounded-lg border transition cursor-pointer
                    ${step.actor === 'player'
                    ? isActive
                        ? 'bg-blue-900/50 border-blue-400 shadow-lg shadow-blue-500/20'
                        : 'bg-blue-900/30 border-blue-500'
                    : isActive
                        ? 'bg-red-900/50 border-red-400 shadow-lg shadow-red-500/20'
                        : 'bg-red-900/30 border-red-500'
                } ${step.isFeint ? 'ring-2 ring-cyan-400/50' : ''}
                `}
            >
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onRemove();
                    }}
                    className="absolute top-1 right-1 text-gray-400 hover:text-red-500 transition"
                >
                    <Trash2 size={14} />
                </button>

                {showFeintButton && canFeint && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggleFeint?.();
                        }}
                        title={t('sequence.toggleFeint')}
                        className={`absolute top-1 left-1 text-sm transition ${
                            step.isFeint
                                ? 'text-cyan-400 hover:text-cyan-300'
                                : 'text-gray-500 hover:text-cyan-400'
                        }`}
                    >
                        ⚡
                    </button>
                )}

                <ActionIcon svgContent={step.action.svgContent} className="w-10 h-10" />

                {step.isFeint && <FeintLabel />}

                <div className="flex justify-center mb-1">
                    {step.action.type === 'attack' && <Sword size={14} className="text-pink-400" />}
                    {step.action.type === 'parry' && (
                        <Shield size={14} className={blocked ? 'text-green-400' : 'text-gray-400'} />
                    )}
                    {step.action.type === 'feint' && <Zap size={14} className="text-cyan-400" />}
                </div>

                <div className="text-xs text-center font-medium">{step.action.name}</div>
                <div className="text-[10px] text-center text-gray-400">
                    {step.actor === 'player' ? t('actor.player_short') : t('actor.opponent_short')}
                </div>

                {step.action.type === 'parry' && prevStep && prevStep.action.type === 'attack' && blocked && (
                    <div className={`absolute -top-2 -left-2 ${isFeigningSpoofed ? 'bg-yellow-500' : 'bg-green-500'} text-white text-[10px] px-1 rounded-full`}>
                        {isFeigningSpoofed ? t('action.spoofed') : t('action.blocks')}
                    </div>
                )}
            </div>
        </div>
    );
};
