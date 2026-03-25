import React from 'react';
import { Move } from '../../types';
import { MoveButton } from './MoveButton';

interface Props {
    moves: Move[];
    suggestedMoveIds: string[];
    onMoveClick: (move: Move) => void;
    getSuggestionRank: (moveId: string) => number | null; // passed from parent
}

export const MoveGrid: React.FC<Props> = ({
                                              moves,
                                              suggestedMoveIds,
                                              onMoveClick,
                                              getSuggestionRank,
                                          }) => {
    return (
        <div className="flex flex-wrap gap-3">
            {moves.map((move) => (
                <MoveButton
                    key={move.id}
                    move={move}
                    suggestionRank={getSuggestionRank(move.id)}
                    onClick={onMoveClick}
                />
            ))}
        </div>
    );
};