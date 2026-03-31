import React, { useState } from 'react';
import { Plus, Sword, Edit } from 'lucide-react';
import { AddMoveForm } from '../components/AddMoveForm';
import { SequenceBuilder } from '../components/organisms/SequenceBuilder';
import { Move } from '../types';
import { useMoveStore } from '../store/moveStore';
import { LanguageSwitcher } from "../components/elements/LanguageSwitcher";
import { useTranslation } from "react-i18next";

type View = 'start' | 'addMove' | 'newSequence' | 'moveList' | 'editMove';

const Home: React.FC = () => {
    const [currentView, setCurrentView] = useState<View>('start');
    const [selectedMove, setSelectedMove] = useState<Move | undefined>(undefined);
    const { moves } = useMoveStore();
    const { t } = useTranslation();

    const renderContent = () => {
        switch (currentView) {
            case 'addMove':
                return <AddMoveForm onBack={() => setCurrentView('start')} />;
            case 'newSequence':
                return <SequenceBuilder onBack={() => setCurrentView('start')} />;
            case 'moveList':
                return (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold neon-text text-center">{t('home.editTitle')}</h2>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                            {moves.map((move) => (
                                <div
                                    key={move.id}
                                    className="bg-gray-800 rounded-lg p-3 flex flex-col items-center border border-gray-700 hover:border-neon-green transition cursor-pointer"
                                    onClick={() => {
                                        setSelectedMove(move);
                                        setCurrentView('editMove');
                                    }}
                                >
                                    <div
                                        className="w-20 h-20 mb-2"
                                        dangerouslySetInnerHTML={{ __html: move.svgContent }}
                                    />
                                    <span className="text-sm font-semibold text-center">{move.name}</span>
                                    <span className="text-xs text-gray-400 capitalize">{move.type}</span>
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-center mt-6">
                            <button
                                onClick={() => setCurrentView('start')}
                                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded transition"
                            >
                                {t('home.backToStart')}
                            </button>
                        </div>
                    </div>
                );
            case 'editMove':
                return selectedMove ? (
                    <AddMoveForm move={selectedMove} onBack={() => setCurrentView('moveList')} />
                ) : (
                    <div>{t('common.noMoveSelected')}</div>
                );
            default:
                return (
                    <div className="text-center">
                        <h2 className="text-3xl font-bold neon-text mb-4">{t('home.welcome')}</h2>
                    </div>
                );
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex flex-col">
            {/* Header */}
            <header className="bg-gray-800/80 backdrop-blur-sm border-b border-gray-700 shadow-lg sticky top-0 z-10">
                <div className="container mx-auto px-4 py-4 flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-neon-green rounded-full shadow-neon"></div>
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-neon-green to-neon-blue bg-clip-text text-transparent">
                            {t('header.title')}
                        </h1>
                    </div>
                    <LanguageSwitcher />
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 container mx-auto px-4 py-8 flex items-center justify-center">
                <div className="w-full max-w-4xl">
                    {renderContent()}
                </div>
            </main>

            {/* Footer with round buttons */}
            <footer className="bg-gray-800/80 backdrop-blur-sm border-t border-gray-700 py-6">
                <div className="container mx-auto px-4">
                    <div className="flex justify-center gap-8">
                        {/* Button: New Action */}
                        <button
                            onClick={() => setCurrentView('addMove')}
                            className="group flex flex-col items-center gap-2"
                        >
                            <div className="w-20 h-20 rounded-full bg-gray-700 group-hover:bg-neon-green/20 border-2 border-neon-green shadow-neon group-hover:shadow-neon-blue transition-all duration-300 flex items-center justify-center">
                                <Plus size={32} className="text-neon-green group-hover:scale-110 transition-transform" />
                            </div>
                            <span className="text-sm text-gray-400 group-hover:text-neon-green">{t('home.newAction')}</span>
                        </button>

                        {/* Button: New Sequence */}
                        <button
                            onClick={() => setCurrentView('newSequence')}
                            className="group flex flex-col items-center gap-2"
                        >
                            <div className="w-24 h-24 rounded-full bg-gray-700 group-hover:bg-neon-green/20 border-2 border-neon-green shadow-neon group-hover:shadow-neon-blue transition-all duration-300 flex items-center justify-center">
                                <Sword size={40} className="text-neon-green group-hover:scale-110 transition-transform" />
                            </div>
                            <span className="text-sm text-gray-400 group-hover:text-neon-green">{t('home.newSequence')}</span>
                        </button>

                        {/* Button: Edit Moves */}
                        <button
                            onClick={() => setCurrentView('moveList')}
                            className="group flex flex-col items-center gap-2"
                        >
                            <div className="w-20 h-20 rounded-full bg-gray-700 group-hover:bg-neon-green/20 border-2 border-neon-green shadow-neon group-hover:shadow-neon-blue transition-all duration-300 flex items-center justify-center">
                                <Edit size={32} className="text-neon-green group-hover:scale-110 transition-transform" />
                            </div>
                            <span className="text-sm text-gray-400 group-hover:text-neon-green">{t('home.editMoves')}</span>
                        </button>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Home;
