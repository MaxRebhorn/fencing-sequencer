export type ActionType = 'attack' | 'parry' | 'feint' | 'stay';

export interface BaseAction {
    id: string;
    sourceId: string;
    /** Names for this action in different sources/languages (e.g., {"Meyer": "Oberhau", "en": "Vertical Cut"}) */
    sourceNames: Record<string, string>;
    svgContent: string;
    description?: string;
    targetZone?: string;
}

export interface AttackAction extends BaseAction {
    type: 'attack';
    /** Actions that this attack can block (e.g., counter-attacks with opposition) */
    blocks?: string[];
    fastestParries?: string[];
    slowestParries?: string[];
}

export interface ParryAction extends BaseAction {
    type: 'parry';
    /** Actions that this parry blocks */
    blocks: string[];
    easiestAttacks?: string[];
}

export interface FeintAction extends BaseAction {
    type: 'feint';
}

export interface StayAction extends BaseAction {
    type: 'stay';
    isLongGuard?: boolean;
}

export type Action = AttackAction | ParryAction | FeintAction | StayAction;
