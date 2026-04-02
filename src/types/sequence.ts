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

// Helper to check if an action can be feinted
export const canBeFeinted = (action: Action): boolean => {
    return action.type === 'attack' || action.type === 'feint';
};

// Helper to check if a feint is "spoofed" (i.e. parried by preceding action)
export const isFeintSpoofed = (
    currentNode: SequenceNode,
    previousNode: SequenceNode | undefined,
    isBlockFn: (prev: Action, current: Action) => boolean
): boolean => {
    if (!currentNode.isFeint || !previousNode) return false;
    return previousNode.action.type === 'parry' && isBlockFn(previousNode.action, currentNode.action);
};
