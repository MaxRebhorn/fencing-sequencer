import { Move } from '../../types'; // adjust path as needed

export type ReactionType = 'no-reaction' | 'attackInTempo';

export interface SequenceNode {
id: string;
move: Move;
actor: 'player' | 'opponent';
isFeint?: boolean;
positionOverride?: string;
// Only present if this node is a feint and branches have been added
branches?: FeintBranch[];
}

export interface FeintBranch {
id: string;
reactionType: ReactionType;
label: string; // e.g. "Bleiben", "Angriff ins Tempo"
steps: SequenceNode[]; // the continuation after the reaction - can contain attacks marked as feints
}

// Helper to check if a move can be feinted
export const canBeFeinted = (move: Move): boolean => {
return move.type === 'attack' || move.type === 'feint';
};

// Helper to check if a feint is "spoofed" (i.e. parried by preceding move)
export const isFeintSpoofed = (
currentNode: SequenceNode,
previousNode: SequenceNode | undefined,
isBlockFn: (prev: Move, current: Move) => boolean
): boolean => {
    if (!currentNode.isFeint || !previousNode) return false;
    return previousNode.move.type === 'parry' && isBlockFn(previousNode.move, currentNode.move);
};