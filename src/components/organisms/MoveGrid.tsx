import React from 'react';
import { Action } from '../../types';
import { MoveButton } from '../molecules/MoveButton';

interface Props {
    actions: Action[];
    suggestedActionIds: string[];
    onActionClick: (action: Action) => void;
    getSuggestionRank: (actionId: string) => number | null;
}

export const MoveGrid: React.FC<Props> = ({ actions, suggestedActionIds, onActionClick, getSuggestionRank }) => {
    if (!actions) return null;

    const attacks = actions.filter((a) => a.type === 'attack');
    const parries = actions.filter((a) => a.type === 'parry');

    const renderGrid = (actionList: Action[], title: string) => (
        <div className="flex-1">
            <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3 px-1">{title}</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {actionList.map((action) => (
                    <MoveButton
                        key={action.id}
                        move={action} // Pass the full action object
                        suggestionRank={getSuggestionRank(action.id)}
                        onClick={onActionClick}
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
