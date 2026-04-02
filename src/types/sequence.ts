import { Action } from './action';

export type ReactionType = 'no-reaction' | 'attackInTempo';

export interface SequenceNode {
    id: string;
    action: Action;
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

export interface Sequence {
    id: string;
    name: string;
    steps: SequenceNode[];
    playerStart: string;
    opponentStart: string;
    createdAt: number;
    updatedAt: number;
    version: number;
}
