import { Move, SequenceNode, FeintBranch, ActiveTarget } from '../types';

export function cloneNodes(nodes: SequenceNode[]): SequenceNode[] {
    return JSON.parse(JSON.stringify(nodes));
}

export function isBlock(prev: Move, current: Move): boolean {
    return (
        current.type === 'parry' &&
        Array.isArray(current.blocks) &&
        current.blocks.includes(prev.id)
    );
}

export function inferPosition(
    move: Move,
    startPosition: string,
    wasParried: boolean
): string {
    if (move.type === 'parry') return move.name;
    if (move.type === 'attack') {
        if (wasParried) {
            return startPosition;
        }
        const fastest = move.fastestParries?.[0];
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
        const nextStep = steps[i + 1];
        const wasParried =
            !!nextStep &&
            nextStep.actor !== step.actor &&
            isBlock(step.move, nextStep.move);

        if (step.actor === 'player') {
            const derived = inferPosition(step.move, playerPos, wasParried);
            playerPos = step.positionOverride ?? derived;
        } else {
            const derived = inferPosition(step.move, opponentPos, wasParried);
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

    if (last.move.type === 'attack' && !last.isFeint) {
        return {
            actor: last.actor === 'player' ? 'opponent' : 'player',
            hint: 'Parade oder Angriff ins Tempo',
        };
    }

    if (last.isFeint) {
        return { actor: last.actor, hint: 'Echter Angriff' };
    }

    if (last.move.type === 'parry') {
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

export function analyzeAndSuggestMoves(
    ctx: SequenceNode[],
    actor: 'player' | 'opponent',
    moves: Move[],
    positionMap: Map<string, { player: string; opponent: string }>,
    playerStart: string,
    opponentStart: string
): string[] {
    if (ctx.length === 0) return [];

    const lastOppositeStep = [...ctx].reverse().find((s) => s.actor !== actor);
    if (!lastOppositeStep) return [];
    const lastSelfStep = [...ctx].reverse().find((s) => s.actor === actor);

    let isRiposteSituation = false;
    if (lastSelfStep?.move.type === 'parry') {
        const selfIndex = ctx.findIndex((s) => s.id === lastSelfStep.id);
        if (selfIndex > 0) {
            const prevStep = ctx[selfIndex - 1];
            if (prevStep.move.type === 'attack' && isBlock(prevStep.move, lastSelfStep.move)) {
                isRiposteSituation = true;
            }
        }
    }

    if (isRiposteSituation && actor === lastSelfStep?.actor) {
        const ourParry = lastSelfStep.move;
        const easiestAttacks = ourParry.easiestAttacks || [];
        const allAttacks = moves.filter((m) => m.type === 'attack');
        const scored = allAttacks.map((attack) => {
            const slowestCount = (attack.slowestParries || []).filter((pId: string) => {
                const parry = moves.find((m) => m.id === pId);
                return parry && parry.blocks?.includes(attack.id);
            }).length;
            const fastestCount = (attack.fastestParries || []).filter((pId: string) => {
                const parry = moves.find((m) => m.id === pId);
                return parry && parry.blocks?.includes(attack.id);
            }).length;
            const hardnessScore = slowestCount - fastestCount;
            const speedIndex = easiestAttacks.indexOf(attack.id);
            const speedBonus = speedIndex !== -1 ? 10 - speedIndex : 1;
            return { attack, score: hardnessScore * 3 + speedBonus };
        });
        scored.sort((a, b) => b.score - a.score);
        return scored.map((s) => s.attack.id);
    }

    const lastOppositeMove = lastOppositeStep.move;

    if (lastOppositeMove.type === 'attack') {
        const blockingParries = moves.filter(
            (m) => m.type === 'parry' && m.blocks?.includes(lastOppositeMove.id)
        );
        const currentPos = lastSelfStep
            ? positionMap.get(lastSelfStep.id)?.[actor] ?? (actor === 'player' ? playerStart : opponentStart)
            : (actor === 'player' ? playerStart : opponentStart);

        const easiestIds: string[] = lastOppositeMove.fastestParries || [];
        const hardestIds: string[] = lastOppositeMove.slowestParries || [];

        const scored = blockingParries.map((p) => {
            let score = 0;
            if (easiestIds.includes(p.id)) score += 10 - easiestIds.indexOf(p.id);
            if (hardestIds.includes(p.id)) score -= 5;
            if (p.name === currentPos || p.id === currentPos) score += 8;
            return { p, score };
        });
        scored.sort((a, b) => b.score - a.score);
        return scored.map((s) => s.p.id);
    }

    if (lastOppositeMove.type === 'parry') {
        const unblockedAttacks = moves.filter(
            (m) =>
                m.type === 'attack' &&
                (!lastOppositeMove.blocks || !lastOppositeMove.blocks.includes(m.id))
        );
        let sortedAttacks = [...unblockedAttacks];
        if (lastSelfStep?.move.type === 'parry') {
            const ourEasiestAttacks = lastSelfStep.move.easiestAttacks || [];
            const best = unblockedAttacks.filter((a) => ourEasiestAttacks.includes(a.id));
            const rest = unblockedAttacks.filter((a) => !ourEasiestAttacks.includes(a.id));
            best.sort((a, b) => ourEasiestAttacks.indexOf(a.id) - ourEasiestAttacks.indexOf(b.id));
            sortedAttacks = [...best, ...rest];
        }
        const parryEasiestIds = lastOppositeMove.easiestAttacks || [];
        const easiest = sortedAttacks.filter((a) => parryEasiestIds.includes(a.id));
        const others = sortedAttacks.filter((a) => !parryEasiestIds.includes(a.id));
        easiest.sort((a, b) => parryEasiestIds.indexOf(a.id) - parryEasiestIds.indexOf(b.id));
        return [...easiest, ...others].map((a) => a.id);
    }

    return [];
}

export function suggestAttacksForAttackInTempo(
    activeTarget: ActiveTarget,
    steps: SequenceNode[],
    moves: Move[],
    positionMap: Map<string, { player: string; opponent: string }>,
    playerStart: string,
    opponentStart: string
): string[] {
    if (activeTarget.type !== 'branch') return [];
    const feintNode = steps.find(s => s.id === activeTarget.feintNodeId);
    const branch = feintNode?.branches?.find(b => b.id === activeTarget.branchId);
    if (!branch || branch.reactionType !== 'attackInTempo') return [];

    const attacks = moves.filter(m => m.type === 'attack');
    const scored = attacks.map(attack => {
        const slowestCount = (attack.slowestParries || []).filter((pId: string) => {
            const parry = moves.find(m => m.id === pId);
            return parry && parry.blocks?.includes(attack.id);
        }).length;
        const fastestCount = (attack.fastestParries || []).filter((pId: string) => {
            const parry = moves.find(m => m.id === pId);
            return parry && parry.blocks?.includes(attack.id);
        }).length;
        const hardnessScore = slowestCount - fastestCount;
        const speedBonus = 10 - (attack.fastestParries?.length ?? 0);
        const score = hardnessScore * 3 + speedBonus;
        return { attack, score };
    });
    scored.sort((a, b) => b.score - a.score);
    return scored.map(s => s.attack.id);
}
