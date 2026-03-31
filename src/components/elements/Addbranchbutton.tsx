import React from 'react';
import { useTranslation } from 'react-i18next';
import { SequenceNode } from '../SequenceBuilder';
import { ReactionType } from '../SequenceBuilder';

interface Props {
    node: SequenceNode;
    existingTypes: ReactionType[];
    onAdd: (type: ReactionType) => void;
}

export const AddBranchButton: React.FC<Props> = ({ node, existingTypes, onAdd }) => {
    const { t } = useTranslation();
    const availableTypes: ReactionType[] = ['no-reaction', 'attackInTempo'].filter(
        (type) => !existingTypes.includes(type as ReactionType)
    ) as ReactionType[];

    if (availableTypes.length === 0) return null;

    const getLabel = (type: ReactionType): string => {
        const labels: Record<ReactionType, string> = {
            'no-reaction': 'Bleiben',
            'attackInTempo': 'Angriff ins Tempo',
        };
        return labels[type] || type;
    };

    return (
        <div className="flex flex-col gap-1">
            {availableTypes.map((type) => (
                <button
                    key={type}
                    onClick={() => onAdd(type)}
                    className="text-[10px] px-2 py-1 rounded border border-orange-500/40 text-orange-400 hover:border-orange-400 hover:bg-orange-950/30 transition whitespace-nowrap"
                >
                    + {getLabel(type)}
                </button>
            ))}
        </div>
    );
};