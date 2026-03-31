export type MoveType = 'attack' | 'parry' | 'feint' | 'stay';

export interface Move {
    id: string;
    name: string;
    type: MoveType;
    svgContent: string;
    blocks?: string[];
    targetZone?: string;
    description?: string;
    fastestParries?: string[];
    slowestParries?: string[];
    easiestAttacks?: string[];
    isLongGuard?: boolean;
}

export type ReactionType = 'no-reaction' | 'attackInTempo';

export interface SequenceNode {
    id: string;
    move: Move;
    actor: 'player' | 'opponent';
    isFeint?: boolean;
    positionOverride?: string;
    branches?: FeintBranch[];
}

export interface FeintBranch {
    id: string;
    reactionType: ReactionType;
    label: string;
    steps: SequenceNode[];
}

export type ActiveTarget =
    | { type: 'main' }
    | { type: 'branch'; feintNodeId: string; branchId: string };
