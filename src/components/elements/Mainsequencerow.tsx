import React from 'react';
import { useTranslation } from 'react-i18next';
import { SequenceNode, ActiveTarget } from '../SequenceBuilder';
import { Move } from '../../types';
import { StepCard } from './Stepcard';

interface Props {
    steps: SequenceNode[];
    positionMap: Map<string, { player: string; opponent: string }>;
    availablePositions: string[];
    activeTarget: ActiveTarget;
    onRemoveStep: (id: string) => void;
    onToggleFeint: (nodeId: string) => void;
    onSelectTarget: (target: ActiveTarget) => void;
    onSetPositionOverride: (nodeId: string, position: string | undefined) => void;
    isBlock: (prevMove: Move, currentMove: Move) => boolean;
}

export const MainSequenceRow: React.FC<Props> = ({
                                                     steps,
                                                     positionMap,
                                                     availablePositions,
                                                     activeTarget,
                                                     onRemoveStep,
                                                     onToggleFeint,
                                                     onSelectTarget,
                                                     onSetPositionOverride,
                                                     isBlock,
                                                 }) => {
    return (
        <div
            data-testid="main-sequence"
            className="flex flex-nowrap gap-2 items-start pb-2"
        >
            {steps.map((step, i) => {
                const prev = steps[i - 1];
                const positions = positionMap.get(step.id);
                const isActiveTar = activeTarget.type === 'main';

                return (
                    <div
                        key={step.id}
                        data-testid={`main-step-column-${step.id}`}
                        className="flex flex-col items-start"
                    >
                        <StepCard
                            step={step}
                            prevStep={prev}
                            playerPosition={positions?.player}
                            opponentPosition={positions?.opponent}
                            availablePositions={availablePositions}
                            showFeintButton={true}
                            isActive={isActiveTar}
                            onRemove={() => onRemoveStep(step.id)}
                            onToggleFeint={() => onToggleFeint(step.id)}
                            onSetPositionOverride={(pos) => onSetPositionOverride(step.id, pos)}
                            isBlock={isBlock}
                            onClick={() => onSelectTarget({ type: 'main' })}
                        />
                    </div>
                );
            })}
        </div>
    );
};