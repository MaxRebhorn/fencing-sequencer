import { Move } from './types'; // adjust path as needed

export type ReactionType = 'falls-for-feint' | 'no-reaction' | 'counter-attack';

export interface SequenceNode {
id: string;
move: Move;
actor: 'player' | 'opponent';
isFeint?: boolean;
// Only present if this node is a feint and branches have been added
branches?: FeintBranch[];
}

export interface FeintBranch {
id: string;
reactionType: ReactionType;
label: string; // e.g. "Fällt auf Finte rein", "Bleiben", "Gegenangriff"
steps: SequenceNode[]; // the continuation after the reaction
}