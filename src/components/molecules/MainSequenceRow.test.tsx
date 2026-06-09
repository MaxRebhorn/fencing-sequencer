import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MainSequenceRow } from './MainSequenceRow';
import React from 'react';
import { SequenceNode, ActiveTarget, Action, ReactionType } from '../../types';

vi.mock('./ActionCard', () => ({
    ActionCard: ({ step }: { step: SequenceNode }) => (
        <div data-testid={`action-card-${step.id}`} />
    ),
}));

vi.mock('../atoms/AddBranchButton', () => ({
    AddBranchButton: ({ onAdd }: { onAdd: (type: ReactionType) => void }) => (
        <button data-testid="add-branch-button" onClick={() => onAdd('attackInTempo')} />
    ),
}));

const createStep = (id: string, actor: 'player' | 'opponent' = 'player', isFeint = false): SequenceNode => ({
    id,
    move: { id, sourceId: 'test', sourceNames: { Custom: id }, type: 'attack', svgContent: '' },
    actor,
    isFeint,
});

const defaultProps = {
    positionMap: new Map(),
    availablePositions: [] as string[],
    activeTarget: { type: 'main' } as ActiveTarget,
    onRemoveStep: vi.fn(),
    onToggleFeint: vi.fn(),
    onSelectTarget: vi.fn(),
    onSetPositionOverride: vi.fn(),
    onAddBranch: vi.fn(),
    isBlock: vi.fn(() => false),
};

describe('MainSequenceRow', () => {
    it('renders all steps as ActionCards', () => {
        const steps = [createStep('1'), createStep('2')];
        render(<MainSequenceRow {...defaultProps} steps={steps} />);

        expect(screen.getByTestId('action-card-1')).toBeInTheDocument();
        expect(screen.getByTestId('action-card-2')).toBeInTheDocument();
    });

    it('renders AddBranchButton for feint steps', () => {
        const steps = [createStep('1', 'player', true)];
        render(<MainSequenceRow {...defaultProps} steps={steps} />);

        expect(screen.getByTestId('add-branch-button')).toBeInTheDocument();
    });

    it('does not render AddBranchButton for non-feint steps', () => {
        const steps = [createStep('1', 'player', false)];
        render(<MainSequenceRow {...defaultProps} steps={steps} />);

        expect(screen.queryByTestId('add-branch-button')).not.toBeInTheDocument();
    });

    it('renders "Phase N" labels for each step', () => {
        const steps = [createStep('1'), createStep('2')];
        render(<MainSequenceRow {...defaultProps} steps={steps} />);

        expect(screen.getByText('Phase 1')).toBeInTheDocument();
        expect(screen.getByText('Phase 2')).toBeInTheDocument();
    });

    it('highlights active simulation step with yellow text', () => {
        const steps = [createStep('1'), createStep('2')];
        render(<MainSequenceRow {...defaultProps} steps={steps} activeSimStepId="2" />);

        const phaseLabels = screen.getAllByText(/Phase \d/);
        expect(phaseLabels[0].className).toContain('text-slate-600');
        expect(phaseLabels[1].className).toContain('text-yellow-500');
    });

    it('handles empty steps array', () => {
        render(<MainSequenceRow {...defaultProps} steps={[]} />);

        expect(screen.getByTestId('main-sequence')).toBeInTheDocument();
        expect(screen.queryByTestId(/action-card-/)).not.toBeInTheDocument();
    });
});
