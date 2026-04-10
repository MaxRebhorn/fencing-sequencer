export type ActionType = 'attack' | 'parry' | 'feint' | 'stay';

// New Action interface
export interface Action {
    id: string; // Generic internal ID (e.g., 'sabre_cut_1')
    sourceId: string; // The primary source this action belongs to (e.g., 'Meyer')
    sourceNames: Record<string, string>; // Names for this action in different sources (e.g., {"Meyer": "Oberhau", "Fabris": "Mandritto"})
    type: ActionType;
    svgContent: string;
    blocks?: string[];
    targetZone?: string;
    description?: string;
    fastestParries?: string[];
    slowestParries?: string[];
    easiestAttacks?: string[];
    isLongGuard?: boolean;
    povImage?: string; // Path to POV image
    opponentImage?: string; // Path to opponent image
}

// New Source interface
export interface Source {
    id: string; // Unique ID for the source (e.g., 'Meyer', 'Fabris')
    name: string; // Display name of the source (e.g., 'Joachim Meyer')
    description?: string;
    link?: string; // URL to PDF or Wiktenauer
    actionIds: string[]; // List of generic action IDs associated with this source
}

export type ReactionType = 'no-reaction' | 'attackInTempo';

export interface SequenceNode {
    id: string;
    move: Action; // Renamed from Move to Action
    actor: 'player' | 'opponent';
    isFeint?: boolean;
    positionOverride?: string;
    branches?: FeintBranch[];
    // Debug/Concept images (Base64 or blob URLs)
    debugPovImage?: string;
    debugOpponentImage?: string;
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

// New Sequence interface
export interface Sequence {
    id: string;
    name: string;
    steps: SequenceNode[];
    playerStart: string;
    opponentStart: string;
    createdAt: number;
    updatedAt: number;
}
