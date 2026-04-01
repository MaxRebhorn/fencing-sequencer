import React from 'react';
import { Sword, Shield, Trash2, Zap } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { SequenceNode, Action } from '../../types';
import { PositionBadge } from '../atoms/PositionBadge';
import { ActionIcon } from '../atoms/ActionIcon';
import { useSourceStore } from '../../store/sourceStore';

interface Props {
    step: SequenceNode;
    prevStep?: SequenceNode;
    fencerPosition?: string;
    adversaryPosition?: string;
    availablePositions: string[];
    showFeintButton?: boolean;
    isActive?: boolean;
    onRemove: () => void;
    onToggleFeint?: () => void;
    onSetPositionOverride?: (pos: string | undefined) => void;
    isBlock: (prevAction: Action, currentAction: Action) => boolean;
    onClick?: () => void;
}

export const ActionCard: React.FC<Props> = ({
                                              step,
                                              prevStep,
                                              fencerPosition,
                                              adversaryPosition,
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
    const { activeSourceId } = useSourceStore();
    const blocked = prevStep && isBlock(prevStep.move, step.move);
    const canFeint = step.move.type === 'attack' || step.move.type === 'feint';
    const isFeigningSpoofed = step.isFeint && prevStep && prevStep.move.type === 'parry' && blocked;

    // Dynamically resolve the action name based on the active source
    const displayName = step.move.sourceNames[activeSourceId] || step.move.name;

    return (
        <div className="flex flex-col items-center gap-0.5">
            {(fencerPosition || adversaryPosition) && onSetPositionOverride && (
                <div className="flex gap-1 flex-wrap justify-center mb-0.5">
                    {fencerPosition !== undefined && (
                        <PositionBadge
                            actor="player"
                            position={fencerPosition}
                            override={step.actor === 'player' ? step.positionOverride : undefined}
                            availablePositions={availablePositions}
                            onSetOverride={step.actor === 'player' ? onSetPositionOverride : () => {}}
                        />
                    )}
                    {adversaryPosition !== undefined && (
                        <PositionBadge
                            actor="opponent"
                            position={adversaryPosition}
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
                    relative w-44 p-3 rounded-lg border transition-all duration-300 cursor-pointer overflow-hidden
                    ${step.actor === 'player'
                    ? isActive
                        ? 'bg-blue-900/50 border-blue-400 shadow-lg shadow-blue-500/20'
                        : 'bg-blue-900/30 border-blue-500'
                    : isActive
                        ? 'bg-red-900/50 border-red-400 shadow-lg shadow-red-500/20'
                        : 'bg-red-900/30 border-red-500'
                } ${step.isFeint ? 'ring-2 ring-cyan-400/50' : ''}
                group
                `}
            >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onRemove();
                    }}
                    className="absolute top-1 right-1 text-gray-500 hover:text-red-500 transition-colors z-10"
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
                        className={`absolute top-1 left-1 text-sm transition-transform hover:scale-125 z-10 ${
                            step.isFeint
                                ? 'text-cyan-400 drop-shadow-neon'
                                : 'text-gray-600 hover:text-cyan-400'
                        }`}
                    >
                        ⚡
                    </button>
                )}

                <div className="mb-2 relative">
                    <ActionIcon svgContent={step.move.svgContent} />
                    {step.isFeint && (
                        <div className="absolute -top-1 -right-1 bg-cyan-500 text-gray-900 text-[8px] px-1 font-black rounded uppercase tracking-tighter shadow-neon animate-pulse">FEINT</div>
                    )}
                </div>

                <div className="flex justify-center gap-1 mb-2">
                    {step.move.type === 'attack' && <Sword size={12} className="text-pink-500" />}
                    {step.move.type === 'parry' && (
                        <Shield size={12} className={blocked ? 'text-neon-green' : 'text-gray-600'} />
                    )}
                    {step.move.type === 'feint' && <Zap size={12} className="text-cyan-400" />}
                </div>

                {/* Bottom title area */}
                <div className="mt-auto pt-2 border-t border-white/5">
                    <div className="text-[11px] text-center font-black uppercase tracking-tight leading-tight mb-1 truncate text-gray-100">
                        {displayName}
                    </div>
                    <div className="text-[8px] text-center text-gray-500 font-bold uppercase tracking-widest opacity-60">
                        {step.actor === 'player' ? 'Fencer' : 'Adversary'}
                    </div>
                </div>

                {step.move.type === 'parry' && prevStep && prevStep.move.type === 'attack' && blocked && (
                    <div className={`absolute bottom-0 right-0 left-0 h-0.5 ${isFeigningSpoofed ? 'bg-yellow-500' : 'bg-neon-green'}`} />
                )}
            </div>
        </div>
    );
};
