import React from 'react';
import { Plus } from 'lucide-react';
import { ReactionType } from '../../types';

interface Props {
    existingTypes: ReactionType[];
    onAdd: (type: ReactionType) => void;
}

export const AddBranchButton: React.FC<Props> = ({ existingTypes, onAdd }) => {
    const availableTypes: ReactionType[] = ['no-reaction', 'attackInTempo'].filter(
        (type) => !existingTypes.includes(type as ReactionType)
    ) as ReactionType[];

    if (availableTypes.length === 0) return null;

    const getLabel = (type: ReactionType): string => {
        const labels: Record<ReactionType, string> = {
            'no-reaction': 'Stay',
            'attackInTempo': 'Attack in Tempo',
        };
        return labels[type] || type;
    };

    return (
        <div className="flex flex-col gap-1 mt-2">
            {availableTypes.map((type) => (
                <button
                    key={type}
                    onClick={(e) => {
                        e.stopPropagation();
                        onAdd(type);
                    }}
                    className="group flex items-center gap-1.5 text-[10px] px-2 py-1 rounded border border-orange-500/40 text-orange-400 hover:border-orange-400 hover:bg-orange-950/30 transition-all whitespace-nowrap"
                >
                    <Plus size={10} className="group-hover:scale-125 transition-transform" />
                    <span>{getLabel(type)}</span>
                </button>
            ))}
        </div>
    );
};