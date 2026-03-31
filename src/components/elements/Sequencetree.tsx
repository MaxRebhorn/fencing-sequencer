import React, {useState, useRef, useCallback, useEffect} from 'react';
import {Sword, Shield, Trash2, ChevronRight} from 'lucide-react';
import {useTranslation} from 'react-i18next';
import {SequenceNode, FeintBranch, ReactionType, ActiveTarget} from '../SequenceBuilder';
import {Move} from '../../types';

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
    isBlock: (prevMove: Move, currentMove: Move) => boolean;
}

const BRANCH_CONFIG: Record<ReactionType, {
    label: string;
    rowColor: string;
    labelColor: string;
    arrowColor: string;
    arrowDashed: boolean;
}> = {
    'no-reaction': {
        label: 'Bleiben',
        rowColor: 'border-gray-600 bg-gray-800/50 text-gray-300',
        labelColor: 'border-gray-500 bg-gray-800 text-gray-300',
        arrowColor: '#6b7280',
        arrowDashed: false,
    },
    'attackInTempo': {
        label: 'Angriff ins Tempo',
        rowColor: 'border-orange-600 bg-orange-950/30 text-orange-200',
        labelColor: 'border-orange-500 bg-orange-950/60 text-orange-300',
        arrowColor: '#f97316',
        arrowDashed: true,
    },
};

const FeintIcon: React.FC<{ active: boolean }> = ({active}) => (
    <svg viewBox="0 0 14 14" width="11" height="11" fill="none"
         strokeLinecap="round" strokeLinejoin="round"
         className={active ? 'text-cyan-300' : 'text-gray-500'}>
        <line x1="1.5" y1="12.5" x2="7.5" y2="5.5" stroke="currentColor" strokeWidth="1.4"/>
        <line x1="6.2" y1="7.0" x2="9.2" y2="4.0" stroke="currentColor" strokeWidth="1.2"/>
        <text x="8.8" y="6.2" fontSize="5.5" fill="currentColor" fontWeight="800" stroke="none">?</text>
    </svg>
);

interface PositionBadgeProps {
    nodeId: string;
    actor: 'player' | 'opponent';
    position: string;
    override?: string;
    availablePositions: string[];
    onSetOverride: (pos: string | undefined) => void;
}

const PositionBadge: React.FC<PositionBadgeProps> = ({
                                                         actor, position, override, availablePositions, onSetOverride,
                                                     }) => {
    const [open, setOpen] = useState(false);
    const isOverridden = !!override;
    const display = override ?? position;

    return (
        <div className="relative">
            <button
                title={`Position ${actor === 'player' ? 'Spieler' : 'Gegner'} – klicken zum Überschreiben`}
                onClick={() => setOpen((v) => !v)}
                className={`
                    text-[9px] px-1.5 py-0.5 rounded border flex items-center gap-1 leading-none transition
                    ${actor === 'player'
                    ? isOverridden
                        ? 'border-blue-400 bg-blue-900/60 text-blue-200'
                        : 'border-blue-700/50 bg-blue-900/20 text-blue-400/70'
                    : isOverridden
                        ? 'border-red-400 bg-red-900/60 text-red-200'
                        : 'border-red-700/50 bg-red-900/20 text-red-400/70'
                }
                    hover:opacity-100 opacity-80
                `}
            >
                <span className="opacity-60">{actor === 'player' ? 'S' : 'G'}:</span>
                <span className="font-medium">{display || '—'}</span>
                {isOverridden && <span className="opacity-50 text-[8px]">*</span>}
            </button>

            {open && (
                <div
                    className="absolute top-full left-0 mt-1 z-30 bg-gray-900 border border-gray-600 rounded shadow-lg min-w-[130px]">
                    <div className="text-[9px] text-gray-500 px-2 pt-1.5 pb-1 border-b border-gray-700">
                        Position wählen
                    </div>
                    {isOverridden && (
                        <button
                            onClick={() => {
                                onSetOverride(undefined);
                                setOpen(false);
                            }}
                            className="w-full text-left text-[10px] px-2 py-1 text-gray-400 hover:bg-gray-800 italic"
                        >
                            ↩ Berechnet ({position})
                        </button>
                    )}
                    {availablePositions.map((pos) => (
                        <button
                            key={pos}
                            onClick={() => {
                                onSetOverride(pos);
                                setOpen(false);
                            }}
                            className={`
                                w-full text-left text-[10px] px-2 py-1 hover:bg-gray-700 transition
                                ${pos === display ? 'text-white font-semibold' : 'text-gray-300'}
                            `}
                        >
                            {pos}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

interface StepCardProps {
    step: SequenceNode;
    prevStep?: SequenceNode;
    playerPosition?: string;
    opponentPosition?: string;
    availablePositions: string[];
    showFeintButton?: boolean;
    onRemove: () => void;
    onToggleFeint?: () => void;
    onSetPositionOverride?: (pos: string | undefined) => void;
    isBlock: (prevMove: Move, currentMove: Move) => boolean;
    onClick?: () => void;
}

const StepCard: React.FC<StepCardProps> = ({
                                               step,
                                               prevStep,
                                               playerPosition,
                                               opponentPosition,
                                               availablePositions,
                                               showFeintButton,
                                               onRemove,
                                               onToggleFeint,
                                               onSetPositionOverride,
                                               isBlock,
                                               onClick,
                                           }) => {
    const blocked = prevStep && isBlock(prevStep.move, step.move);
    const canFeint = step.move.type === 'attack' || step.move.type === 'feint';

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
                            onSetOverride={step.actor === 'player' ? onSetPositionOverride : () => {
                            }}
                        />
                    )}
                    {opponentPosition !== undefined && (
                        <PositionBadge
                            nodeId={step.id}
                            actor="opponent"
                            position={opponentPosition}
                            override={step.actor === 'opponent' ? step.positionOverride : undefined}
                            availablePositions={availablePositions}
                            onSetOverride={step.actor === 'opponent' ? onSetPositionOverride : () => {
                            }}
                        />
                    )}
                </div>
            )}

            <div
                data-step-id={step.id}
                className={`
                    relative w-[6.5rem] p-2.5 rounded-lg border transition-all select-none cursor-pointer
                    ${step.actor === 'player'
                    ? 'bg-blue-900/30 border-blue-500'
                    : 'bg-red-900/30 border-red-500'}
                    ${step.isFeint ? 'ring-2 ring-cyan-400 ring-offset-1 ring-offset-gray-900' : ''}
                `}
                onClick={onClick}
            >
                {showFeintButton && canFeint && onToggleFeint && (
                    <button
                        title={step.isFeint ? 'Finte aufheben' : 'Als Finte markieren'}
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggleFeint();
                        }}
                        className={`
                            absolute top-1 left-1 z-10 w-[18px] h-[18px] flex items-center justify-center
                            rounded border transition
                            ${step.isFeint
                            ? 'border-cyan-500 bg-cyan-900/60'
                            : 'border-gray-600 bg-gray-800/60 hover:border-cyan-500'}
                        `}
                    >
                        <FeintIcon active={!!step.isFeint}/>
                    </button>
                )}

                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onRemove();
                    }}
                    className="absolute top-1 right-1 z-10 text-gray-500 hover:text-red-500 transition"
                >
                    <Trash2 size={11}/>
                </button>

                {step.move.type === 'parry' && blocked && (
                    <div className="absolute -top-2 -left-2 bg-green-500 text-white text-[9px] px-1 rounded-full z-10">
                        Blockt
                    </div>
                )}

                <div
                    className="w-8 h-8 mx-auto mt-3 mb-1.5 text-white"
                    dangerouslySetInnerHTML={{__html: step.move.svgContent}}
                />

                <div className="flex justify-center mb-0.5">
                    {step.move.type === 'attack' && <Sword size={11} className="text-pink-400"/>}
                    {step.move.type === 'parry' && (
                        <Shield size={11} className={blocked ? 'text-green-400' : 'text-gray-400'}/>
                    )}
                    {step.move.type === 'feint' && <div className="w-2.5 h-2.5 rounded-full bg-cyan-400"/>}
                    {(step.move as any).type === 'stay' && <div className="w-2.5 h-2.5 rounded-full bg-gray-400"/>}
                </div>

                <div className="text-[11px] text-center font-medium truncate leading-tight">{step.move.name}</div>
                <div className="text-[9px] text-center text-gray-500 mt-0.5">
                    {step.actor === 'player' ? 'Spieler' : 'Gegner'}
                </div>
            </div>
        </div>
    );
};

interface BranchRowProps {
    feintNodeId: string;
    branch: FeintBranch;
    isActiveBranch: boolean;
    availablePositions: string[];
    onSelectBranch: () => void;
    onRemoveStep: (nodeId: string) => void;
    isBlock: (prevMove: Move, currentMove: Move) => boolean;
}

const BranchRow: React.FC<BranchRowProps> = ({
                                                 branch,
                                                 isActiveBranch,
                                                 availablePositions,
                                                 onSelectBranch,
                                                 onRemoveStep,
                                                 isBlock,
                                             }) => {
    const cfg = BRANCH_CONFIG[branch.reactionType];
    const labelRef = useRef<HTMLDivElement>(null);

    return (
        <div
            data-branch-container-id={branch.id}
            className="flex items-center gap-0 mt-0"
        >
            <div
                ref={labelRef}
                data-branch-label-id={branch.id}
                className={`shrink-0 self-center mr-2 px-2 py-0.5 rounded text-[10px] font-semibold border tracking-wide whitespace-nowrap ${cfg.labelColor}`}
            >
                {cfg.label}
            </div>
            <div
                className={`
    flex flex-nowrap items-center gap-2 min-h-[80px] px-2.5 py-2 rounded-lg
    border cursor-pointer transition-all
    ${cfg.rowColor}
    ${isActiveBranch ? 'opacity-100 ring-1 ring-current' : 'opacity-55 hover:opacity-80'}
`}
                onClick={onSelectBranch}
            >
                {branch.steps.length === 0 && (
                    <span className="text-[10px] opacity-40 italic">Aktion wählen…</span>
                )}
                {branch.steps.map((step, i) => {
                    const prev = branch.steps[i - 1];
                    return (
                        <React.Fragment key={step.id}>
                            <StepCard
                                step={step}
                                prevStep={prev}
                                availablePositions={availablePositions}
                                onRemove={() => onRemoveStep(step.id)}
                                isBlock={isBlock}
                                showFeintButton={false}
                            />
                            {i < branch.steps.length - 1 && (
                                <ChevronRight size={13} className="text-gray-600 shrink-0"/>
                            )}
                        </React.Fragment>
                    );
                })}
            </div>
        </div>
    );
};

interface AddBranchButtonProps {
    node: SequenceNode;
    existingTypes: ReactionType[];
    onAdd: (type: ReactionType) => void;
}

function getAvailableBranchTypes(node: SequenceNode): ReactionType[] {
    const isFeint = !!node.isFeint;
    const hasExplicitTempoOpening = (node.move as any).tempoOpening === true;
    const available: ReactionType[] = [];
    if (isFeint) {
        available.push('no-reaction');
        available.push('attackInTempo');
    } else if (hasExplicitTempoOpening) {
        available.push('attackInTempo');
    }
    return available;
}

const AddBranchButton: React.FC<AddBranchButtonProps> = ({node, existingTypes, onAdd}) => {
    const [open, setOpen] = useState(false);
    const available = getAvailableBranchTypes(node).filter((t) => !existingTypes.includes(t));
    if (available.length === 0) return null;

    return (
        <div className="mt-1 ml-8">
            {open ? (
                <div className="flex gap-2 items-center flex-wrap">
                    {available.map((type) => {
                        const cfg = BRANCH_CONFIG[type];
                        return (
                            <button
                                key={type}
                                onClick={() => {
                                    onAdd(type);
                                    setOpen(false);
                                }}
                                className={`text-[10px] px-2 py-0.5 rounded border transition opacity-80 hover:opacity-100 ${cfg.rowColor}`}
                            >
                                + {cfg.label}
                            </button>
                        );
                    })}
                    <button onClick={() => setOpen(false)} className="text-[10px] text-gray-500 hover:text-gray-300">✕
                    </button>
                </div>
            ) : (
                <button
                    onClick={() => setOpen(true)}
                    className="text-[10px] text-gray-600 hover:text-cyan-400 border border-dashed border-gray-700 hover:border-cyan-800 rounded px-2 py-0.5 transition"
                >
                    + Reaktionszweig
                </button>
            )}
        </div>
    );
};

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
    const {t} = useTranslation();
    const containerRef = useRef<HTMLDivElement>(null);
    const [arrowPaths, setArrowPaths] = useState<Array<{
        path: string;
        color: string;
        dashed: boolean;
        id: string
    }>>([]);

    const updateArrows = useCallback(() => {
        if (!containerRef.current) return;

        const newPaths: Array<{ path: string; color: string; dashed: boolean; id: string }> = [];
        const containerRect = containerRef.current.getBoundingClientRect();

        steps.forEach((step) => {
            if (!step.isFeint) return;

            const mainCardElement = containerRef.current?.querySelector(`[data-step-id="${step.id}"]`) as HTMLElement;
            if (!mainCardElement) return;

            step.branches?.forEach((branch) => {
                if (branch.reactionType !== 'attackInTempo') return;

                const branchContainer = containerRef.current?.querySelector(
                    `[data-branch-container-id="${branch.id}"]`
                ) as HTMLElement;

                if (!branchContainer) return;

                const mainRect = mainCardElement.getBoundingClientRect();
                const branchRect = branchContainer.getBoundingClientRect();

                // Start: untere Mitte der Hauptkarte
                const startX = mainRect.left + (mainRect.width / 2) - containerRect.left;
                const startY = mainRect.bottom - containerRect.top;

                // Ziel: linke Seite des Branch-Containers, vertikal mittig
                const targetX = branchRect.left - containerRect.left;
                const targetY = branchRect.top + (branchRect.height / 2) - containerRect.top;

                // Entscheide, ob der Branch rechts oder links von der Hauptkarte liegt
                const isBranchToTheRight = targetX > startX;

                const verticalOffset = 24; // Abstand nach unten
                const horizontalGap = 8;   // Abstand vor dem Andockpunkt

                let path;

                if (isBranchToTheRight) {
                    // Branch liegt rechts: runter → rüber → rein (von links)
                    path = `
                    M ${startX} ${startY}
                    L ${startX} ${startY + verticalOffset}
                    L ${targetX + horizontalGap} ${startY + verticalOffset}
                    L ${targetX + horizontalGap} ${targetY}
                    L ${targetX} ${targetY}
                `;
                } else {
                    // Branch liegt links: runter → rüber nach links → rein (von rechts)
                    path = `
                    M ${startX} ${startY}
                    L ${startX} ${startY + verticalOffset}
                    L ${targetX - horizontalGap} ${startY + verticalOffset}
                    L ${targetX - horizontalGap} ${targetY}
                    L ${targetX} ${targetY}
                `;
                }

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
        <div ref={containerRef} className="mb-8 overflow-x-auto relative">
            <svg
                className="absolute top-0 left-0 pointer-events-none"
                style={{width: '100%', height: '100%', zIndex: 10}}
            >
                {/* Pfeilspitze Definition */}
                <defs>
                    <marker
                        id="arrowhead"
                        markerWidth="12"
                        markerHeight="12"
                        refX="10"
                        refY="6"
                        orient="auto"
                    >
                        <polygon points="0 0, 12 6, 0 12" fill="#f97316" />
                    </marker>
                </defs>

                {arrowPaths.map((arrow) => (
                    <path
                        key={arrow.id}
                        d={arrow.path}
                        stroke={arrow.color}
                        strokeWidth="3"
                        fill="none"
                        markerEnd="url(#arrowhead)"
                        strokeDasharray={arrow.dashed ? '6,4' : 'none'}
                        strokeLinecap="round"
                    />
                ))}
            </svg>

            <div
                data-testid="main-sequence"
                className="flex flex-nowrap gap-2 items-start pb-2"
            >
                {steps.map((step, i) => {
                    const prev = steps[i - 1];
                    const positions = positionMap.get(step.id);

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
                                onRemove={() => onRemoveStep(step.id)}
                                onToggleFeint={() => onToggleFeint(step.id)}
                                onSetPositionOverride={(pos) => onSetPositionOverride(step.id, pos)}
                                isBlock={isBlock}
                                onClick={() => onSelectTarget({type: 'main'})}
                            />
                        </div>
                    );
                })}
            </div>

            <div
                data-testid="branches-flex"
                className="flex flex-nowrap gap-2 mt-6"
            >
                {steps.map((step) => {
                    const hasBranches = step.isFeint || ((step.move as any).tempoOpening ?? 0) > 0;
                    const existingBranchTypes = step.branches?.map((b) => b.reactionType) ?? [];

                    return (
                        <div
                            key={step.id}
                            data-testid={`branch-column-${step.id}`}
                            className="flex flex-col items-start"
                            style={{minWidth: '7rem'}}
                        >
                            {hasBranches && (
                                <>
                                    <div
                                        data-testid={`vertical-connector-${step.id}`}
                                        className="w-px h-4 bg-gray-600 ml-4 mb-2"
                                    />

                                    {step.branches?.map((branch) => {
                                        const isActiveBranch =
                                            activeTarget.type === 'branch' &&
                                            (activeTarget as any).feintNodeId === step.id &&
                                            (activeTarget as any).branchId === branch.id;

                                        return (
                                            <BranchRow
                                                key={branch.id}
                                                feintNodeId={step.id}
                                                branch={branch}
                                                isActiveBranch={isActiveBranch}
                                                availablePositions={availablePositions}
                                                onSelectBranch={() =>
                                                    onSelectTarget({
                                                        type: 'branch',
                                                        feintNodeId: step.id,
                                                        branchId: branch.id,
                                                    })
                                                }
                                                onRemoveStep={(nodeId) =>
                                                    onRemoveStepFromBranch(step.id, branch.id, nodeId)
                                                }
                                                isBlock={isBlock}
                                            />
                                        );
                                    })}

                                    <div className="mt-2 ml-8">
                                        <AddBranchButton
                                            node={step}
                                            existingTypes={existingBranchTypes}
                                            onAdd={(type) => onAddBranch(step.id, type)}
                                        />
                                    </div>
                                </>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};