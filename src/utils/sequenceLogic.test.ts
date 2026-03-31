import { describe, it, expect } from 'vitest';
import { isBlock, inferPosition, inferNextActor } from './sequenceLogic';
import { Action, SequenceNode } from '../types';

describe('Sequence Logic Utilities', () => {

    describe('isBlock()', () => {
        it('should correctly identify a blocking parry', () => {
            const attack: Action = { id: 'cut1', name: 'Cut 1', type: 'attack', svgContent: '' };
            const parry: Action = { id: 'prime', name: 'Prime', type: 'parry', blocks: ['cut1'], svgContent: '' };
            expect(isBlock(attack, parry)).toBe(true);
        });

        it('should return false if parry does not block the attack', () => {
            const attack: Action = { id: 'cut1', name: 'Cut 1', type: 'attack', svgContent: '' };
            const parry: Action = { id: 'seconde', name: 'Seconde', type: 'parry', blocks: ['cut4'], svgContent: '' };
            expect(isBlock(attack, parry)).toBe(false);
        });
    });

    describe('inferPosition()', () => {
        it('should return the parry name if the action is a parry', () => {
            const action: Action = { id: 'prime', name: 'Prime', type: 'parry', svgContent: '' };
            expect(inferPosition(action, 'any', false)).toBe('Prime');
        });

        it('should return the start position if an attack is successfully parried', () => {
            const action: Action = { id: 'cut1', name: 'Cut 1', type: 'attack', svgContent: '' };
            expect(inferPosition(action, 'Guard 3', true)).toBe('Guard 3');
        });
    });

    describe('inferNextActor()', () => {
        it('should suggest Adversary after a Fencer attack', () => {
            const step: SequenceNode = {
                id: '1',
                move: { id: 'cut1', name: 'Cut 1', type: 'attack', svgContent: '' },
                actor: 'player'
            };
            const result = inferNextActor([step], 'player');
            expect(result.actor).toBe('opponent');
        });
    });
});
