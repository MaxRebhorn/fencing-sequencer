import React, { useState, useEffect, useMemo, useRef } from 'react';
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
    const [isScrolled, setIsScrolled] = useState(false);
    const [isAtBottom, setIsAtBottom] = useState(false);
    const footerRef = useRef<HTMLDivElement>(null);
    
    const { actions } = useMoveStore();
    const { activeSourceId, additionalSourceIds, availableSources } = useSourceStore();
    const { t } = useTranslation();

    // Scroll listener to handle dynamic navbar state and bottom detection
    useEffect(() => {
        const handleScroll = () => {
            const scrollTop = window.scrollY;
            const scrollHeight = document.documentElement.scrollHeight;
            const clientHeight = document.documentElement.clientHeight;

            setIsScrolled(scrollTop > 50);
            
            // Intersection detection for the bottom "landing zone"
            if (footerRef.current) {
                const rect = footerRef.current.getBoundingClientRect();
                // If the top of the footer is visible within the viewport
                setIsAtBottom(rect.top <= clientHeight);
            } else {
                // Fallback to standard scroll math
                setIsAtBottom(scrollTop + clientHeight >= scrollHeight - 10);
            }
        };
        
        window.addEventListener('scroll', handleScroll);
        window.addEventListener('resize', handleScroll);
        // Initial check with a small delay to allow content to render
        const timer = setTimeout(handleScroll, 100);
        
        return () => {
            window.removeEventListener('scroll', handleScroll);
            window.removeEventListener('resize', handleScroll);
            clearTimeout(timer);
        };
    }, [currentView]);

    // Navbar state logic
    const isNavbarShrunk = useMemo(() => {
        switch (currentView) {
            case 'sources':
                return false; 
            case 'addMove':
                return true; 
            case 'newSequence':
                return !isAtBottom; 
            case 'editMove':
                return !isAtBottom; 
            case 'moveList':
                return isScrolled && !isAtBottom;
            case 'start':
                return false; 
            default:
                return isScrolled;
        }
    }, [currentView, isScrolled, isAtBottom]);

    // Derived: Current set of actions
    const currentActions = React.useMemo(() => {
        const allSourceIds = [activeSourceId, ...additionalSourceIds];
        
        const filteredSourceActions = availableSources
            .filter(s => allSourceIds.indexOf(s.id) !== -1);
            
        const allActionIds: string[] = [];
        filteredSourceActions.forEach(s => {
            s.actionIds.forEach(id => {
                if (allActionIds.indexOf(id) === -1) {
                    allActionIds.push(id);
                }
            });
        });

        return actions
            .filter(a => allActionIds.indexOf(a.id) !== -1)
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
                    </div>
                );
            case 'moveList':
                return (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold neon-text text-center">{t('home.editTitle')}</h2>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                            {currentActions.map((action: Action) => (
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
                    <div className="text-center py-20">
                        <h2 className="text-3xl font-bold neon-text mb-4 uppercase">{t('home.welcome')}</h2>
                        <p className="text-gray-400 max-w-lg mx-auto mb-10">
                            {t('home.subtitle')}
                        </p>
                    </div>
                );
        }
    };
// Edit for push
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-slate-800 flex flex-col relative overflow-x-hidden">
            {/* Header */}
            <header className="bg-gray-800/60 backdrop-blur-md border-b border-gray-700 shadow-xl sticky top-0 z-50 shrink-0">
                <div className="container mx-auto px-4 py-4 flex justify-between items-center">
                    <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setCurrentView('start')}>
                        <div className="w-10 h-10 bg-neon-green rounded-full shadow-neon flex items-center justify-center">
                            <Sword className="text-gray-900" size={24} />
                        </div>
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-neon-green to-neon-blue bg-clip-text text-transparent">
                            {t('header.title')}
                        </h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => setCurrentView('sources')}
                            className="p-2 text-gray-400 hover:text-neon-green hover:bg-neon-green/10 rounded-full transition"
                        >
                            <BookOpen size={24} />
                        </button>
                        <LanguageSwitcher />
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 container mx-auto px-4 py-8 flex flex-col items-center">
                <div className="w-full max-w-5xl flex-1">
                    {renderContent()}
                </div>
            </main>

            {/* 
                Footer/Landing Zone 
                This serves as the 'attached' home for the navbar.
                When the viewport hits this, the navbar stops being 'fixed' and becomes 'relative'.
            */}
            <div ref={footerRef} className="w-full py-12 flex justify-center items-center shrink-0">
                <div className={`
                    transition-all duration-300 ease-in-out w-fit
                    ${!isAtBottom ? 'fixed bottom-8 left-1/2 -translate-x-1/2 z-50' : 'relative z-10'}
                `}>
                    <Navbar 
                        currentView={currentView} 
                        setCurrentView={setCurrentView} 
                        isShrunk={isNavbarShrunk} 
                        t={t} 
                    />
                </div>
            </div>
        </div>
    );
};

interface NavbarProps {
    currentView: View;
    setCurrentView: (view: View) => void;
    isShrunk: boolean;
    t: any;
}

const Navbar: React.FC<NavbarProps> = ({ currentView, setCurrentView, isShrunk, t }) => {
    return (
        <nav className={`
            bg-gray-900/90 backdrop-blur-xl border border-gray-700 shadow-2xl rounded-full
            transition-all duration-500 flex items-center justify-center
            ${isShrunk ? 'px-4 py-2 gap-4' : 'px-8 py-4 gap-8 md:gap-12'}
        `}>
            <NavButton 
                onClick={() => setCurrentView('sources')} 
                active={currentView === 'sources'} 
                shrunk={isShrunk} 
                icon={<BookOpen size={isShrunk ? 20 : 28} />} 
                label={t('sources.title')} 
                color="blue"
            />
            <NavButton 
                onClick={() => setCurrentView('addMove')} 
                active={currentView === 'addMove'} 
                shrunk={isShrunk} 
                icon={<Plus size={isShrunk ? 20 : 28} />} 
                label={t('home.newAction')} 
                color="green"
            />
            <NavButton 
                onClick={() => setCurrentView('newSequence')} 
                active={currentView === 'newSequence'} 
                shrunk={isShrunk} 
                icon={<Sword size={isShrunk ? 24 : 36} />} 
                label={t('home.newSequence')} 
                color="green"
                isCenter
            />
            <NavButton 
                onClick={() => setCurrentView('moveList')} 
                active={currentView === 'moveList'} 
                shrunk={isShrunk} 
                icon={<Edit size={isShrunk ? 20 : 28} />} 
                label={t('home.editMoves')} 
                color="green"
            />
        </nav>
    );
}

interface NavButtonProps {
    onClick: () => void;
    active: boolean;
    shrunk: boolean;
    icon: React.ReactNode;
    label: string;
    color: 'blue' | 'green';
    isCenter?: boolean;
}

const NavButton: React.FC<NavButtonProps> = ({ onClick, active, shrunk, icon, label, color, isCenter }) => {
    const activeBorder = color === 'blue' ? 'border-neon-blue shadow-neon-blue' : 'border-neon-green shadow-neon';
    const activeText = color === 'blue' ? 'text-neon-blue' : 'text-neon-green';
    const hoverBg = color === 'blue' ? 'group-hover:bg-neon-blue/20' : 'group-hover:bg-neon-green/20';
    const hoverBorder = color === 'blue' ? 'hover:border-neon-blue' : 'hover:border-neon-green';

    return (
        <button onClick={onClick} className="group flex flex-col items-center transition-all duration-300">
            <div className={`
                rounded-full bg-gray-800 transition-all duration-300 flex items-center justify-center
                ${shrunk ? 'w-12 h-12' : isCenter ? 'w-20 h-20 -mt-8 shadow-neon' : 'w-16 h-16'}
                ${isCenter ? 'border-4' : 'border-2'}
                ${active ? activeBorder : `border-gray-700 ${hoverBorder}`}
                ${hoverBg}
            `}>
                <div className={`${active ? activeText : `text-gray-400 group-hover:${activeText}`} transition-all`}>
                    {icon}
                </div>
            </div>
            {!shrunk && (
                <span className={`text-[10px] mt-1 uppercase font-bold tracking-widest text-gray-500 group-hover:${activeText} transition-colors`}>
                    {label}
                </span>
            )}
        </button>
    );
};

export default Home;
