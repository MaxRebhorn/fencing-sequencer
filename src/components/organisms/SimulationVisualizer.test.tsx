import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SimulationVisualizer } from './SimulationVisualizer';
import React from 'react';
import { SequenceNode } from '../../types';

vi.mock('lucide-react', () => ({
    ChevronLeft: () => <div data-testid="icon-chevron-left" />,
    ChevronRight: () => <div data-testid="icon-chevron-right" />,
    Info: () => <div data-testid="icon-info" />,
    Play: () => <div data-testid="icon-play" />,
    Pause: () => <div data-testid="icon-pause" />,
    Gauge: () => <div data-testid="icon-gauge" />,
}));

vi.mock('../../store/moveStore', () => ({
    useMoveStore: () => ({ actions: [] }),
}));

const createStep = (id: string, actor: 'player' | 'opponent'): SequenceNode => ({
    id,
    move: { id, sourceId: 'test', sourceNames: { Custom: id }, type: 'attack', svgContent: '' },
    actor,
});

const defaultProps = {
    steps: [
        createStep('step-1', 'player'),
        createStep('step-2', 'opponent'),
    ],
    playerStart: 'start-player',
    opponentStart: 'start-opponent',
    onStepChange: vi.fn(),
    onTogglePlay: vi.fn(),
};

describe('SimulationVisualizer', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders background image', () => {
        render(<SimulationVisualizer {...defaultProps} />);
        expect(screen.getByAltText('Background')).toHaveAttribute('src', '/background.avif');
    });

    it('renders "Simulation View" overlay when at initial state', () => {
        render(<SimulationVisualizer {...defaultProps} activeStepId={undefined} />);
        expect(screen.getByText('Simulation View')).toBeInTheDocument();
    });

    it('renders player and opponent tags with Ready fallback when no name on action', () => {
        render(<SimulationVisualizer {...defaultProps} />);
        const readyTags = screen.getAllByText('Ready');
        expect(readyTags).toHaveLength(2);
    });

    it('shows "Initial" label when at index -1', () => {
        render(<SimulationVisualizer {...defaultProps} activeStepId={undefined} />);
        expect(screen.getByText('Initial')).toBeInTheDocument();
    });

    it('shows phase count when at a step position', () => {
        render(<SimulationVisualizer {...defaultProps} activeStepId="step-1" />);
        expect(screen.getByText('Phase 1 / 2')).toBeInTheDocument();
    });

    it('calls onStepChange when clicking the initial dot', () => {
        const onStepChange = vi.fn();
        render(<SimulationVisualizer {...defaultProps} onStepChange={onStepChange} />);

        // Find the initial dot button (w-2.5 h-2.5) vs step dots (w-2 h-2)
        const allButtons = screen.getAllByRole('button');
        const initialDot = allButtons.find(b => b.className.includes('w-2.5'));
        expect(initialDot).toBeDefined();
        fireEvent.click(initialDot!);
        expect(onStepChange).toHaveBeenCalledWith('');
    });

    it('toggles play/pause button', () => {
        const onTogglePlay = vi.fn();
        render(<SimulationVisualizer {...defaultProps} onTogglePlay={onTogglePlay} />);

        const playBtn = screen.getByText('Play Simulation');
        fireEvent.click(playBtn);
        expect(onTogglePlay).toHaveBeenCalledWith(true);
    });
});
