import React from 'react';
import { Action } from '../../types';
import { MoveButton } from './MoveButton';

interface Props {
    actions: Action[];
    suggestedActionIds: string[];
    onActionClick: (action: Action) => void;
    getSuggestionRank: (actionId: string) => number | null;
}

export const ActionGrid: React.FC<Props> = ({
    actions,
    suggestedActionIds,
    onActionClick,
    getSuggestionRank,
}) => {
    return (
        <div className="flex flex-wrap gap-3">
            {actions.map((action) => (
                <MoveButton
                    key={action.id}
                    move={action}
                    suggestionRank={getSuggestionRank(action.id)}
                    onClick={onActionClick}
                />
            ))}
        </div>
    );
};
