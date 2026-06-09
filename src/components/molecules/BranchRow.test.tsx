import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BranchRow } from './BranchRow';
import React from 'react';
import { FeintBranch, Action } from '../../types';

vi.mock('./ActionCard', () => ({
    ActionCard: ({ step }: { step: { id: string } }) => (
        <div data-testid={`branch-action-card-${step.id}`} />
    ),
}));

const createBranchStep = (id: string) => ({
    id,
    move: { id, sourceId: 'test', sourceNames: { Custom: id }, type: 'attack' as const, svgContent: '' },
    actor: 'player' as const,
});

const createBranch = (id: string, reactionType: 'no-reaction' | 'attackInTempo', stepCount: number): FeintBranch => ({
    id,
    reactionType,
    label: reactionType,
    steps: Array.from({ length: stepCount }, (_, i) => createBranchStep(`${id}-step-${i}`)),
});

const defaultProps = {
    feintNodeId: 'feint-1',
    branch: createBranch('branch-1', 'no-reaction', 2),
    isActiveBranch: false,
    availablePositions: [] as string[],
    onSelectBranch: vi.fn(),
    onRemoveStep: vi.fn(),
    isBlock: vi.fn(() => false),
};

describe('BranchRow', () => {
    it('renders correct label badge for no-reaction', () => {
        render(<BranchRow {...defaultProps} />);
        expect(screen.getByText('Stay / No Reaction')).toBeInTheDocument();
    });

    it('renders correct label badge for attackInTempo', () => {
        const attackBranch = createBranch('branch-2', 'attackInTempo', 1);
        render(<BranchRow {...defaultProps} branch={attackBranch} />);
        expect(screen.getByText('Attack in Tempo')).toBeInTheDocument();
    });

    it('renders ActionCards for each branch step', () => {
        const branch = createBranch('branch-3', 'no-reaction', 3);
        render(<BranchRow {...defaultProps} branch={branch} />);

        expect(screen.getByTestId('branch-action-card-branch-3-step-0')).toBeInTheDocument();
        expect(screen.getByTestId('branch-action-card-branch-3-step-1')).toBeInTheDocument();
        expect(screen.getByTestId('branch-action-card-branch-3-step-2')).toBeInTheDocument();
    });

    it('shows arrow separators between steps', () => {
        const branch = createBranch('branch-4', 'no-reaction', 2);
        render(<BranchRow {...defaultProps} branch={branch} />);

        const arrows = screen.getAllByText('→');
        expect(arrows).toHaveLength(1);
    });

    it('has no arrows for single step', () => {
        const branch = createBranch('branch-5', 'no-reaction', 1);
        render(<BranchRow {...defaultProps} branch={branch} />);

        expect(screen.queryByText('→')).not.toBeInTheDocument();
    });

    it('renders with data-branch-container-id attribute', () => {
        render(<BranchRow {...defaultProps} />);
        expect(screen.getByTestId('branch-action-card-branch-1-step-0').closest('[data-branch-container-id="branch-1"]')).toBeInTheDocument();
    });
});
