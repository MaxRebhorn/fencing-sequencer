import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AddMoveForm } from '../AddMoveForm';
import { SourceSelector } from './SourceSelector';
import React from 'react';

// Mocking the stores to avoid actual state side effects during testing
vi.mock('../../store/moveStore', () => ({
    useMoveStore: () => ({
        actions: [],
        addAction: vi.fn(),
        updateAction: vi.fn(),
    }),
}));

vi.mock('../../store/sourceStore', () => ({
    useSourceStore: () => ({
        availableSources: [],
        activeSourceId: 'Custom',
        additionalSourceIds: [],
        setActiveSourceId: vi.fn(),
        toggleAdditionalSourceId: vi.fn(),
        addSource: vi.fn(),
        updateSource: vi.fn(),
        removeSource: vi.fn(),
    }),
}));

describe('Contribution Pipeline Tests', () => {
    describe('AddMoveForm Contribution', () => {
        it('should lock the submission package until a 10+ character comment is provided', () => {
            render(<AddMoveForm onBack={() => {}} />);
            
            const checkbox = screen.getByTestId('global-propose-checkbox');
            fireEvent.click(checkbox);
            
            // Should be visible but locked
            const submissionPackage = screen.getByTestId('submission-package');
            expect(submissionPackage.className).toContain('opacity-40');

            const commentInput = screen.getByTestId('contribution-comment-input');

            // Short comment
            fireEvent.change(commentInput, { target: { value: 'Fix error' } });
            expect(submissionPackage.className).toContain('opacity-40');

            // Long enough comment
            fireEvent.change(commentInput, { target: { value: 'Correcting technical data for the parry.' } });
            expect(submissionPackage.className).not.toContain('opacity-40');
            expect(submissionPackage.className).toContain('opacity-100');
        });
    });

    describe('SourceSelector Contribution', () => {
        it('should show preview and enable copy only when contribution requirements are met', () => {
            render(<SourceSelector />);
            
            const addBtn = screen.getByTestId('add-new-source-button');
            fireEvent.click(addBtn);
            
            const checkboxes = screen.getAllByTestId('global-propose-checkbox');
            fireEvent.click(checkboxes[0]);

            const commentInputs = screen.getAllByTestId('contribution-comment-input');
            fireEvent.change(commentInputs[0], { target: { value: 'New historical source for Radaelli system.' } });

            const submissionPackages = screen.getAllByTestId('submission-package');
            expect(submissionPackages[0].className).toContain('opacity-100');

            const previews = screen.getAllByTestId('contribution-preview');
            expect(previews[0].textContent).toContain('New historical source for Radaelli system.');
        });
    });
});
