import React from 'react';
import { Action } from '../../types/action';
import { ActionButton } from '../atoms/ActionButton';

interface Props {
    actions: Action[];
    onActionClick: (action: Action) => void;
    getSuggestionRank: (actionId: string) => number | null;
}

export const ActionGrid: React.FC<Props> = ({
    actions,
    onActionClick,
    getSuggestionRank,
}) => {
    return (
        <div className="flex flex-wrap gap-3">
            {actions.map((action) => (
                <ActionButton
                    key={action.id}
                    action={action}
                    suggestionRank={getSuggestionRank(action.id)}
                    onClick={onActionClick}
                />
            ))}
        </div>
    );
};
