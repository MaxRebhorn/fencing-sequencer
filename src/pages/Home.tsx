import React, { useState } from 'react';
import { Plus, Sword, Edit, BookOpen } from 'lucide-react';
import { AddMoveForm } from '../components/AddMoveForm';
import { SequenceBuilder } from '../components/organisms/SequenceBuilder';
import { Action } from '../types';
import { useMoveStore } from '../store/moveStore';
import { useSourceStore } from '../store/sourceStore';
import { LanguageSwitcher } from "../components/atoms/LanguageSwitcher";
import { useTranslation } from "react-i18next";
import { SourceSelector } from '../components/organisms/SourceSelector';

type View = 'start' | 'addMove' | 'newSequence' | 'moveList' | 'editMove' | 'sources';

const Home: React.FC = () => {
    const [currentView, setCurrentView] = useState<View>('start');
    const [selectedAction, setSelectedAction] = useState<Action | undefined>(undefined);
    const { actions } = useMoveStore();
    const { activeSourceId, additionalSourceIds, availableSources } = useSourceStore();
    const { t } = useTranslation();

    // Derived: Current set of actions based on active and additional sources
    const currentActions = React.useMemo(() => {
        const allSourceIds = [activeSourceId, ...additionalSourceIds];
        const allActionIds = new Set(
            availableSources
                .filter(s => allSourceIds.includes(s.id))
                .flatMap(s => s.actionIds)
        );

        return actions
            .filter(a => allActionIds.has(a.id))
            .map(a => ({
                ...a,
                name: a.sourceNames[activeSourceId] || a.sourceNames[a.sourceId] || a.id
            }));
    }, [actions, activeSourceId, additionalSourceIds, availableSources]);

    const renderContent = () => {
        switch (currentView) {
            case 'addMove':
                return <AddMoveForm onBack={() => setCurrentView('start')} />;
            case 'newSequence':
                return <SequenceBuilder onBack={() => setCurrentView('start')} />;
            case 'sources':
                return (
                    <div className="space-y-6">
                        <SourceSelector />
                        <div className="flex justify-center mt-6">
                            <button
                                onClick={() => setCurrentView('start')}
                                className="px-6 py-2 bg-neon-green text-gray-900 font-bold rounded-full hover:bg-neon-green/80 transition shadow-neon"
                            >
                                {t('home.backToStart')}
                            </button>
                        </div>
                    </div>
                );
            case 'moveList':
                return (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold neon-text text-center">{t('home.editTitle')}</h2>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                            {currentActions.map((action) => (
                                <div
                                    key={action.id}
                                    className="bg-gray-800 rounded-lg p-3 flex flex-col items-center border border-gray-700 hover:border-neon-green transition cursor-pointer"
                                    onClick={() => {
                                        setSelectedAction(action);
                                        setCurrentView('editMove');
                                    }}
                                >
                                    <div
                                        className="w-20 h-20 mb-2"
                                        dangerouslySetInnerHTML={{ __html: action.svgContent }}
                                    />
                                    <span className="text-sm font-semibold text-center">{action.name}</span>
                                    <span className="text-xs text-gray-400 capitalize">{action.type}</span>
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
                return selectedAction ? (
                    <AddMoveForm move={selectedAction as any} onBack={() => setCurrentView('moveList')} />
                ) : (
                    <div>{t('common.noMoveSelected')}</div>
                );
            default:
                return (
                    <div className="text-center">
                        <h2 className="text-3xl font-bold neon-text mb-4 tracking-wider uppercase">{t('home.welcome')}</h2>
                        <p className="text-gray-400 max-w-lg mx-auto mb-10">
                            {t('home.subtitle')}
                        </p>
                    </div>
                );
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-slate-800 flex flex-col">
            {/* Header */}
            <header className="bg-gray-800/60 backdrop-blur-md border-b border-gray-700 shadow-xl sticky top-0 z-50">
                <div className="container mx-auto px-4 py-3 flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-neon-green rounded-lg shadow-neon flex items-center justify-center transform rotate-12">
                            <Sword className="text-gray-900 -rotate-45" size={24} />
                        </div>
                        <h1 className="text-2xl font-black bg-gradient-to-r from-neon-green to-neon-blue bg-clip-text text-transparent uppercase italic tracking-tighter">
                            {t('header.title')}
                        </h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => setCurrentView('sources')}
                            className="p-2 text-gray-400 hover:text-neon-green hover:bg-neon-green/10 rounded-full transition"
                            title={t('sources.title')}
                        >
                            <BookOpen size={24} />
                        </button>
                        <LanguageSwitcher />
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 container mx-auto px-4 py-8 flex items-center justify-center overflow-hidden">
                <div className="w-full max-w-5xl">
                    {renderContent()}
                </div>
            </main>

            {/* Footer with round buttons */}
            <footer className="bg-gray-800/40 backdrop-blur-md border-t border-gray-800 py-6">
                <div className="container mx-auto px-4">
                    <div className="flex justify-center gap-8 md:gap-16">
                        {/* Button: Sources Selection */}
                        <button
                            onClick={() => setCurrentView('sources')}
                            className="group flex flex-col items-center gap-2"
                        >
                            <div className={`w-16 h-16 rounded-2xl bg-gray-800 group-hover:bg-neon-blue/20 border-2 transition-all duration-300 flex items-center justify-center ${currentView === 'sources' ? 'border-neon-blue shadow-neon-blue' : 'border-gray-700 hover:border-neon-blue'}`}>
                                <BookOpen size={28} className={`${currentView === 'sources' ? 'text-neon-blue' : 'text-gray-400 group-hover:text-neon-blue'} transition-colors`} />
                            </div>
                            <span className="text-[10px] uppercase font-black tracking-widest text-gray-500 group-hover:text-neon-blue transition-colors">{t('sources.title')}</span>
                        </button>

                        {/* Button: New Action */}
                        <button
                            onClick={() => setCurrentView('addMove')}
                            className="group flex flex-col items-center gap-2"
                        >
                            <div className={`w-16 h-16 rounded-2xl bg-gray-800 group-hover:bg-neon-green/20 border-2 transition-all duration-300 flex items-center justify-center ${currentView === 'addMove' ? 'border-neon-green shadow-neon' : 'border-gray-700 hover:border-neon-green'}`}>
                                <Plus size={28} className={`${currentView === 'addMove' ? 'text-neon-green' : 'text-gray-400 group-hover:text-neon-green'} transition-colors`} />
                            </div>
                            <span className="text-[10px] uppercase font-black tracking-widest text-gray-500 group-hover:text-neon-green transition-colors">{t('home.newAction')}</span>
                        </button>

                        {/* Button: New Sequence */}
                        <button
                            onClick={() => setCurrentView('newSequence')}
                            className="group flex flex-col items-center gap-2"
                        >
                            <div className={`w-20 h-20 rounded-full bg-gray-800 group-hover:bg-neon-green/20 border-4 transition-all duration-300 flex items-center justify-center -mt-4 ${currentView === 'newSequence' ? 'border-neon-green shadow-neon' : 'border-gray-700 hover:border-neon-green'}`}>
                                <Sword size={36} className={`${currentView === 'newSequence' ? 'text-neon-green' : 'text-gray-400 group-hover:text-neon-green'} transition-colors`} />
                            </div>
                            <span className="text-[10px] uppercase font-black tracking-widest text-gray-500 group-hover:text-neon-green transition-colors">{t('home.newSequence')}</span>
                        </button>

                        {/* Button: Edit Actions */}
                        <button
                            onClick={() => setCurrentView('moveList')}
                            className="group flex flex-col items-center gap-2"
                        >
                            <div className={`w-16 h-16 rounded-2xl bg-gray-800 group-hover:bg-neon-green/20 border-2 transition-all duration-300 flex items-center justify-center ${currentView === 'moveList' ? 'border-neon-green shadow-neon' : 'border-gray-700 hover:border-neon-green'}`}>
                                <Edit size={28} className={`${currentView === 'moveList' ? 'text-neon-green' : 'text-gray-400 group-hover:text-neon-green'} transition-colors`} />
                            </div>
                            <span className="text-[10px] uppercase font-black tracking-widest text-gray-500 group-hover:text-neon-green transition-colors">{t('home.editMoves')}</span>
                        </button>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Home;