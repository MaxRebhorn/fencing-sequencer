import React from 'react';
import { Move } from '../../types';
import { MoveButton } from '../molecules/MoveButton';

interface Props {
    moves: Move[];
    suggestedMoveIds: string[];
    onMoveClick: (move: Move) => void;
    getSuggestionRank: (moveId: string) => number | null;
}

export const MoveGrid: React.FC<Props> = ({ moves, suggestedMoveIds, onMoveClick, getSuggestionRank }) => {
    const attacks = moves.filter((m) => m.type === 'attack');
    const parries = moves.filter((m) => m.type === 'parry');

    const renderGrid = (moveList: Move[], title: string) => (
        <div className="flex-1">
            <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3 px-1">{title}</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {moveList.map((move) => (
                    <MoveButton
                        key={move.id}
                        move={move}
                        suggestionRank={getSuggestionRank(move.id)}
                        onClick={onMoveClick}
                    />
                ))}
            </div>
        </div>
    );

    return (
        <div className="flex flex-col md:flex-row gap-8">
            {renderGrid(attacks, 'Attacks')}
            {renderGrid(parries, 'Parries')}
        </div>
    );
};
