import React from 'react';
import { User, Bot } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Props {
    selectedActor: 'player' | 'opponent';
    onSelectActor: (actor: 'player' | 'opponent') => void;
}

export const ActorSelector: React.FC<Props> = ({ selectedActor, onSelectActor }) => {
    const { t } = useTranslation();
    return (
        <div className="flex justify-center my-6">
            <div className="bg-gray-800 rounded-full p-1 flex items-center shadow-lg">
                <button
                    onClick={() => onSelectActor('player')}
                    className={`px-6 py-2 rounded-full transition-all flex items-center space-x-2 ${
                        selectedActor === 'player'
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'text-gray-400 hover:text-white'
                    }`}
                >
                    <User size={18} />
                    <span>{t('actor.player')}</span>
                </button>
                <button
                    onClick={() => onSelectActor('opponent')}
                    className={`px-6 py-2 rounded-full transition-all flex items-center space-x-2 ${
                        selectedActor === 'opponent'
                            ? 'bg-red-600 text-white shadow-md'
                            : 'text-gray-400 hover:text-white'
                    }`}
                >
                    <Bot size={18} />
                    <span>{t('actor.opponent')}</span>
                </button>
            </div>
        </div>
    );
};
