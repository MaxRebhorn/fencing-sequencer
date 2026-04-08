export * from './types/action';
export * from './types/source';
export * from './types/sequence';

export type ReactionType = 'no-reaction' | 'attackInTempo';

export interface FeintBranch {
    id: string;
    reactionType: ReactionType;
    label: string;
    steps: SequenceNode[];
}

export interface SequenceNode {
    id: string;
    move: Move;
    actor: 'player' | 'opponent';
    isFeint?: boolean;
    positionOverride?: string;
    branches?: FeintBranch[];
}

export type ActiveTarget =
    | { type: 'main' }
    | { type: 'branch'; feintNodeId: string; branchId: string };
