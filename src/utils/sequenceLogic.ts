import { Action, SequenceNode, ActiveTarget } from '../types';

export function cloneNodes(nodes: SequenceNode[]): SequenceNode[] {
    // Priority 2: Using a more robust cloning method if available, or just simple spread for shallow
    // But for nested branches, we need deep. Using structuredClone (modern browser support)
    return typeof structuredClone === 'function'
        ? structuredClone(nodes)
        : JSON.parse(JSON.stringify(nodes));
}

export function isBlock(prev: Action, current: Action): boolean {
    if (!prev || !current) return false;

    // Priority 1: Attacks can now also block
    const isParryBlocking = current.type === 'parry' && current.blocks?.includes(prev.id);
    const isAttackBlocking = current.type === 'attack' && current.blocks?.includes(prev.id);

    return !!(isParryBlocking || isAttackBlocking);
}

export function inferPosition(
    action: Action,
    startPosition: string,
    wasParried: boolean
): string {
    if (!action) return startPosition;

    if (action.type === 'parry') {
        // Use the name from the active source if possible (Priority 3.8 logic can be added here)
        return action.id;
    }
    if (action.type === 'attack') {
        if (wasParried) {
            return startPosition;
        }
        const fastest = action.fastestParries?.[0];
        if (fastest) return fastest;
    }
    return startPosition;
}

export function computePositions(
    steps: SequenceNode[],
    playerStart: string,
    opponentStart: string
): Map<string, { player: string; opponent: string }> {
    const map = new Map<string, { player: string; opponent: string }>();
    let playerPos = playerStart;
    let opponentPos = opponentStart;

    for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        if (!step || !step.action) {
            map.set(step?.id || i.toString(), { player: playerPos, opponent: opponentPos });
            continue;
        }

        const nextStep = steps[i + 1];
        const wasParried =
            !!nextStep &&
            !!nextStep.action &&
            nextStep.actor !== step.actor &&
            isBlock(step.action, nextStep.action);

        if (step.actor === 'player') {
            const derived = inferPosition(step.action, playerPos, wasParried);
            playerPos = step.positionOverride ?? derived;
        } else {
            const derived = inferPosition(step.action, opponentPos, wasParried);
            opponentPos = step.positionOverride ?? derived;
        }

        map.set(step.id, { player: playerPos, opponent: opponentPos });
    }

    return map;
}

export function inferNextActor(
    contextSteps: SequenceNode[],
    currentActor: 'player' | 'opponent'
): { actor: 'player' | 'opponent'; hint: string } {
    if (contextSteps.length === 0) return { actor: currentActor, hint: '' };

    const last = contextSteps[contextSteps.length - 1];
    if (!last || !last.action) return { actor: currentActor, hint: '' };

    if (last.action.type === 'attack' && !last.isFeint) {
        return {
            actor: last.actor === 'player' ? 'opponent' : 'player',
            hint: 'Parade oder Angriff ins Tempo',
        };
    }

    if (last.isFeint) {
        return { actor: last.actor, hint: 'Echter Angriff' };
    }

    if (last.action.type === 'parry') {
        return { actor: last.actor, hint: 'Riposte (Angriff)' };
    }

    return { actor: currentActor, hint: '' };
}

export function resolveContextSteps(target: ActiveTarget, allSteps: SequenceNode[]): SequenceNode[] {
    if (target.type === 'main') return allSteps;
    const feintNode = allSteps.find((s) => s.id === target.feintNodeId);
    if (!feintNode?.branches) return allSteps;
    const branch = feintNode.branches.find((b) => b.id === target.branchId);
    if (!branch) return allSteps;
    const mainUpToFeint = allSteps.slice(
        0,
        allSteps.findIndex((s) => s.id === target.feintNodeId) + 1
    );
    return [...mainUpToFeint, ...branch.steps];
}

/**
 * Priority 3.8: Utility to get the action name based on active source
 */
export function getActionName(action: Action, activeSourceId: string): string {
    if (!action) return '';
    return action.sourceNames?.[activeSourceId] || action.sourceNames?.['System'] || action.id;
}

export function analyzeAndSuggestMoves(
    ctx: SequenceNode[],
    actor: 'player' | 'opponent',
    allActions: Action[],
    positionMap: Map<string, { player: string; opponent: string }>,
    playerStart: string,
    opponentStart: string
): string[] {
    if (ctx.length === 0) {
        return allActions.map(a => a.id);
    }

    const last = ctx[ctx.length - 1];
    if (!last || !last.action) return allActions.map(a => a.id);

    // 1. If we just parried an attack, suggest ripostes (attacks)
    if (last.actor === actor && last.action.type === 'parry') {
        return allActions
            .filter(a => a.type === 'attack')
            .map(a => a.id);
    }

    // 2. If the opponent just attacked, suggest parries that block that attack
    if (last.actor !== actor && last.action.type === 'attack' && !last.isFeint) {
        return allActions
            .filter(a => (a.type === 'parry' || a.type === 'attack') && a.blocks?.includes(last.action.id))
            .map(a => a.id);
    }

    // 3. If we are in a feint, suggest the real attack (usually same target or different)
    if (last.actor === actor && last.isFeint) {
        return allActions
            .filter(a => a.type === 'attack')
            .map(a => a.id);
    }

    // Default to all actions if no specific suggestion logic applies yet
    return allActions.map(a => a.id);
}

export function suggestAttacksForAttackInTempo(
    target: ActiveTarget,
    allSteps: SequenceNode[],
    allActions: Action[],
    positionMap: Map<string, { player: string; opponent: string }>,
    playerStart: string,
    opponentStart: string
): string[] {
    return allActions
        .filter(a => a.type === 'attack')
        .map(a => a.id);
}
