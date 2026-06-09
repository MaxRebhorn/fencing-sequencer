import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BranchContainer } from './BranchContainer';
import React from 'react';
import { SequenceNode, Action, ActiveTarget, ReactionType } from '../../types';

vi.mock('./BranchRow', () => ({
    BranchRow: ({ feintNodeId, branch }: { feintNodeId: string; branch: { id: string; reactionType: string } }) => (
        <div data-testid={`branch-row-${branch.id}`} />
    ),
}));

const createStep = (id: string, hasBranch = false, reactionType: ReactionType = 'no-reaction'): SequenceNode => ({
    id,
    move: { id, sourceId: 'test', sourceNames: { Custom: 'Test' }, type: 'attack', svgContent: '' },
    actor: 'player',
    ...(hasBranch ? {
        isFeint: true,
        branches: [{
            id: `br-${id}`,
            reactionType,
            label: reactionType,
            steps: [{ id: `${id}-step`, move: { id: `${id}-move`, sourceId: 'test', sourceNames: { Custom: 'Test' }, type: 'attack', svgContent: '' }, actor: 'player' as const }],
        }],
    } : {}),
});

const defaultProps = {
    activeTarget: { type: 'main' } as ActiveTarget,
    availablePositions: [] as string[],
    onRemoveStepFromBranch: vi.fn(),
    onSelectTarget: vi.fn(),
    onAddBranch: vi.fn(),
    isBlock: vi.fn(() => false),
};

describe('BranchContainer', () => {
    it('returns null when no steps have branches', () => {
        const steps = [createStep('1'), createStep('2')];
        const { container } = render(<BranchContainer {...defaultProps} steps={steps} />);
        expect(container.innerHTML).toBe('');
    });

    it('groups branches by parent feint step', () => {
        const steps = [createStep('feint-1', true), createStep('feint-2', true, 'attackInTempo')];
        render(<BranchContainer {...defaultProps} steps={steps} />);

        expect(screen.getByTestId('branch-row-br-feint-1')).toBeInTheDocument();
        expect(screen.getByTestId('branch-row-br-feint-2')).toBeInTheDocument();
    });

    it('applies marginLeft offset per step index', () => {
        const steps = [createStep('s0'), createStep('feint-1', true)];
        render(<BranchContainer {...defaultProps} steps={steps} />);

        const groupDiv = screen.getByTestId('branches-vertical-stack').firstElementChild as HTMLElement;
        expect(groupDiv.style.marginLeft).toBe('384px');
    });
});
