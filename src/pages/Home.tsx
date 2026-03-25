import React, { useState } from 'react';
import { Plus, Sword, Edit } from 'lucide-react';
import { AddMoveForm } from '../components/AddMoveForm';
import { SequenceBuilder } from '../components/SequenceBuilder';
import { Move } from '../types';
import { useMoveStore } from '../store/moveStore';

type View = 'start' | 'addMove' | 'newSequence' | 'moveList' | 'editMove';

const Home: React.FC = () => {
    const [currentView, setCurrentView] = useState<View>('start');
    const [selectedMove, setSelectedMove] = useState<Move | undefined>(undefined);
    const { moves } = useMoveStore();

    const renderContent = () => {
        switch (currentView) {
            case 'addMove':
                return <AddMoveForm onBack={() => setCurrentView('start')} />;
            case 'newSequence':
                return <SequenceBuilder onBack={() => setCurrentView('start')} />;
            case 'moveList':
                return (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold neon-text text-center">Edit Existing Moves</h2>
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
                                ← Back to Start
                            </button>
                        </div>
                    </div>
                );
            case 'editMove':
                return selectedMove ? (
                    <AddMoveForm move={selectedMove} onBack={() => setCurrentView('moveList')} />
                ) : (
                    <div>No move selected</div>
                );
            default:
                return (
                    <div className="text-center">
                        <h2 className="text-3xl font-bold neon-text mb-4">Willkommen beim Fecht-Kombo-Editor</h2>
                        <p className="text-gray-400">Erstelle deine eigenen Fechtsequenzen mit realistischen SVG-Animationen</p>
                    </div>
                );
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex flex-col">
            {/* Header */}
            <header className="bg-gray-800/80 backdrop-blur-sm border-b border-gray-700 shadow-lg sticky top-0 z-10">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-neon-green rounded-full shadow-neon"></div>
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-neon-green to-neon-blue bg-clip-text text-transparent">
                            Fecht-Kombo-Editor
                        </h1>
                    </div>
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
                        {/* Button: Neue Aktion */}
                        <button
                            onClick={() => setCurrentView('addMove')}
                            className="group flex flex-col items-center gap-2"
                        >
                            <div className="w-20 h-20 rounded-full bg-gray-700 group-hover:bg-neon-green/20 border-2 border-neon-green shadow-neon group-hover:shadow-neon-blue transition-all duration-300 flex items-center justify-center">
                                <Plus size={32} className="text-neon-green group-hover:scale-110 transition-transform" />
                            </div>
                            <span className="text-sm text-gray-400 group-hover:text-neon-green">Neue Aktion</span>
                        </button>

                        {/* Button: Neue Sequenz */}
                        <button
                            onClick={() => setCurrentView('newSequence')}
                            className="group flex flex-col items-center gap-2"
                        >
                            <div className="w-24 h-24 rounded-full bg-gray-700 group-hover:bg-neon-green/20 border-2 border-neon-green shadow-neon group-hover:shadow-neon-blue transition-all duration-300 flex items-center justify-center">
                                <Sword size={40} className="text-neon-green group-hover:scale-110 transition-transform" />
                            </div>
                            <span className="text-sm text-gray-400 group-hover:text-neon-green">Neue Sequenz</span>
                        </button>

                        {/* Button: Bewegungen bearbeiten (replaces Simulate) */}
                        <button
                            onClick={() => setCurrentView('moveList')}
                            className="group flex flex-col items-center gap-2"
                        >
                            <div className="w-20 h-20 rounded-full bg-gray-700 group-hover:bg-neon-green/20 border-2 border-neon-green shadow-neon group-hover:shadow-neon-blue transition-all duration-300 flex items-center justify-center">
                                <Edit size={32} className="text-neon-green group-hover:scale-110 transition-transform" />
                            </div>
                            <span className="text-sm text-gray-400 group-hover:text-neon-green">Bewegungen bearbeiten</span>
                        </button>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Home;