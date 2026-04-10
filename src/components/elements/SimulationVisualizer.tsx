import React, { useState, useEffect, useMemo, useRef, forwardRef } from 'react';
import { ChevronLeft, ChevronRight, Info, Play, Pause, Gauge } from 'lucide-react';
import { SequenceNode, Action } from '../../types';
import { useMoveStore } from '../../store/moveStore';

interface SimulationVisualizerProps {
    steps: SequenceNode[];
    activeStepId?: string;
    onStepChange?: (stepId: string) => void;
    playerStart: string;
    opponentStart: string;
    isExternalPlaying?: boolean;
    onTogglePlay?: (playing: boolean) => void;
    singleImageMode?: boolean; // true = nur aktueller Schritt, false = kumulativ
}

export const SimulationVisualizer = forwardRef<HTMLDivElement, SimulationVisualizerProps>(({
                                                                                               steps,
                                                                                               activeStepId,
                                                                                               onStepChange,
                                                                                               playerStart,
                                                                                               opponentStart,
                                                                                               isExternalPlaying = false,
                                                                                               onTogglePlay,
                                                                                               singleImageMode = false
                                                                                           }, ref) => {
    const { actions } = useMoveStore();
    const [isPlaying, setIsPlaying] = useState(isExternalPlaying);
    const [playbackSpeed, setPlaybackSpeed] = useState(1.5);
    const [showSpeedSlider, setShowSpeedSlider] = useState(false);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Flacht den Baum für die Slideshow ab
    const flattenedSteps = useMemo(() => {
        const flat: SequenceNode[] = [];
        const processNodes = (nodes: SequenceNode[]) => {
            nodes.forEach(node => {
                flat.push(node);
                if (node.branches) {
                    node.branches.forEach(branch => processNodes(branch.steps));
                }
            });
        };
        processNodes(steps);
        return flat;
    }, [steps]);

    // Berechnet den aktuellen Index basierend auf der activeStepId
    const currentIndex = useMemo(() => {
        if (!activeStepId) return -1;
        return flattenedSteps.findIndex(s => s.id === activeStepId);
    }, [activeStepId, flattenedSteps]);

    // Berechnet den Zustand beider Fechter für den aktuellen Index
    const fencerState = useMemo(() => {
        const pStart = actions.find(a => a.id === playerStart || a.name === playerStart);
        const oStart = actions.find(a => a.id === opponentStart || a.name === opponentStart);

        if (currentIndex === -1 || flattenedSteps.length === 0) {
            return { player: pStart, opponent: oStart };
        }

        // SINGLE IMAGE MODE: nur die Aktion des aktuellen Schritts anzeigen
        if (singleImageMode) {
            const currentStep = flattenedSteps[currentIndex];
            if (!currentStep) return { player: pStart, opponent: oStart };
            if (currentStep.actor === 'player') {
                return { player: currentStep.move, opponent: null };
            } else {
                return { player: null, opponent: currentStep.move };
            }
        }

        // DUAL / KUMULATIV MODUS: Historie beider Fechter akkumulieren
        let lastPlayerAction: Action | undefined;
        let lastOpponentAction: Action | undefined;

        for (let i = 0; i <= currentIndex; i++) {
            const step = flattenedSteps[i];
            if (step.actor === 'player') lastPlayerAction = step.move;
            else lastOpponentAction = step.move;
        }

        return {
            player: lastPlayerAction || pStart,
            opponent: lastOpponentAction || oStart
        };
    }, [currentIndex, flattenedSteps, actions, playerStart, opponentStart, singleImageMode]);

    useEffect(() => {
        setIsPlaying(isExternalPlaying);
    }, [isExternalPlaying]);

    // Auto-Play Logik
    useEffect(() => {
        if (isPlaying && flattenedSteps.length > 0) {
            timerRef.current = setInterval(() => {
                const nextIdx = currentIndex + 1 >= flattenedSteps.length ? 0 : currentIndex + 1;
                onStepChange?.(flattenedSteps[nextIdx].id);
            }, playbackSpeed * 1000);
        } else {
            if (timerRef.current) clearInterval(timerRef.current);
        }
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [isPlaying, playbackSpeed, flattenedSteps, currentIndex, onStepChange]);

    const handleStepChange = (dir: number) => {
        setIsPlaying(false);
        onTogglePlay?.(false);

        const nextIdx = currentIndex + dir;
        if (nextIdx >= -1 && nextIdx < flattenedSteps.length) {
            if (nextIdx === -1) {
                onStepChange?.(''); // Reset to initial
            } else {
                onStepChange?.(flattenedSteps[nextIdx].id);
            }
        }
    };

    const toggleLocalPlay = () => {
        const newState = !isPlaying;
        setIsPlaying(newState);
        onTogglePlay?.(newState);
    };

    const currentStep = flattenedSteps[currentIndex];

    return (
        <div ref={ref} className="flex flex-col gap-6 bg-slate-900/50 rounded-2xl p-6 border border-slate-800 shadow-2xl mb-10 group scroll-mt-10">
            {/* Display Area */}
            <div className="relative aspect-video bg-black rounded-xl overflow-hidden flex items-center justify-center border border-slate-700 shadow-inner group-hover:border-slate-500 transition-colors">

                {/* 1. Base Layer: Opponent */}
                {fencerState.opponent?.opponentImage ? (
                    <img
                        key={`opp-${fencerState.opponent.id}-${currentIndex}`}
                        src={fencerState.opponent.opponentImage}
                        alt="Opponent"
                        className="absolute inset-0 w-full h-full object-contain z-10 transition-opacity duration-300"
                    />
                ) : (
                    fencerState.opponent && (
                        <div key={`opp-svg-${fencerState.opponent.id}`} className="absolute inset-0 flex items-center justify-center opacity-10 z-0">
                            <div className="w-48 h-48" dangerouslySetInnerHTML={{ __html: fencerState.opponent.svgContent }} />
                        </div>
                    )
                )}

                {/* 2. Top Layer: Player */}
                {fencerState.player?.povImage ? (
                    <img
                        key={`pov-${fencerState.player.id}-${currentIndex}`}
                        src={fencerState.player.povImage}
                        alt="Player"
                        className="absolute inset-0 w-full h-full object-contain z-20 pointer-events-none transition-opacity duration-300"
                    />
                ) : (
                    fencerState.player && (
                        <div key={`pov-svg-${fencerState.player.id}`} className="absolute inset-0 flex items-center justify-center opacity-20 z-0 scale-150">
                            <div className="w-32 h-32 text-cyan-500" dangerouslySetInnerHTML={{ __html: fencerState.player.svgContent }} />
                        </div>
                    )
                )}

                {/* Actor Info Tags – mit visuellem Feedback für Single Mode */}
                <div className="absolute top-4 left-4 right-4 flex justify-between z-30 pointer-events-none">
                    <div className={`px-4 py-1.5 rounded-lg backdrop-blur-md border transition-all duration-500 ${
                        singleImageMode && currentStep?.actor !== 'player'
                            ? 'bg-black/20 border-white/5 text-gray-600 opacity-50'
                            : (currentStep?.actor === 'player' ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400 shadow-neon-sm' : 'bg-black/40 border-white/10 text-gray-500')
                    }`}>
                        <span className="text-[10px] font-black uppercase tracking-tighter mr-2 opacity-60">Fencer:</span>
                        <span className="text-xs font-bold uppercase">{fencerState.player?.name || 'Ready'}</span>
                    </div>
                    <div className={`px-4 py-1.5 rounded-lg backdrop-blur-md border transition-all duration-500 ${
                        singleImageMode && currentStep?.actor !== 'opponent'
                            ? 'bg-black/20 border-white/5 text-gray-600 opacity-50'
                            : (currentStep?.actor === 'opponent' ? 'bg-pink-600/20 border-pink-500 text-pink-400 shadow-neon-sm' : 'bg-black/40 border-white/10 text-gray-500')
                    }`}>
                        <span className="text-[10px] font-black uppercase tracking-tighter mr-2 opacity-60">Opponent:</span>
                        <span className="text-xs font-bold uppercase">{fencerState.opponent?.name || 'Ready'}</span>
                    </div>
                </div>

                {currentIndex === -1 && flattenedSteps.length > 0 && (
                    <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center backdrop-blur-sm z-40">
                        <Info size={32} className="text-cyan-500 mb-2 animate-pulse" />
                        <div className="text-white font-black italic uppercase tracking-widest text-lg">Simulation View</div>
                    </div>
                )}
            </div>

            {/* Pagination & Controls */}
            <div className="flex flex-col items-center gap-6">
                <div className="flex items-center gap-6">
                    <button
                        onClick={() => handleStepChange(-1)}
                        className="text-slate-500 hover:text-white transition-colors"
                        disabled={currentIndex <= -1}
                    >
                        <ChevronLeft size={24} />
                    </button>

                    <div className="flex items-center gap-2.5 px-6 py-3 bg-slate-800/40 rounded-full border border-white/5 shadow-inner">
                        <button
                            onClick={() => onStepChange?.('')}
                            className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                                currentIndex === -1 ? 'bg-cyan-400 shadow-neon-sm scale-125' : 'bg-slate-600'
                            }`}
                        />
                        {flattenedSteps.map((step, idx) => (
                            <button
                                key={step.id}
                                onClick={() => onStepChange?.(step.id)}
                                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                                    currentIndex === idx ? 'bg-neon-green shadow-neon-sm scale-150' : 'bg-slate-600'
                                }`}
                            />
                        ))}
                    </div>

                    <button
                        onClick={() => handleStepChange(1)}
                        className="text-slate-500 hover:text-white transition-colors"
                        disabled={currentIndex >= flattenedSteps.length - 1}
                    >
                        <ChevronRight size={24} />
                    </button>
                </div>

                {/* Secondary Controls: Play & Speed */}
                <div className="flex items-center gap-8 w-full max-w-md px-4">
                    <button
                        onClick={toggleLocalPlay}
                        className={`flex items-center gap-2 px-6 py-2 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all ${
                            isPlaying
                                ? 'bg-pink-600/20 border border-pink-500 text-pink-500 shadow-neon-sm'
                                : 'bg-neon-green/10 border border-neon-green/30 text-neon-green hover:bg-neon-green/20'
                        }`}
                    >
                        {isPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
                        {isPlaying ? 'Stop' : 'Play Simulation'}
                    </button>

                    <div className="flex-1 flex items-center gap-3">
                        <button
                            onClick={() => setShowSpeedSlider(!showSpeedSlider)}
                            className={`p-2 rounded-lg transition-colors ${showSpeedSlider ? 'text-neon-green bg-white/5' : 'text-slate-500 hover:text-white'}`}
                        >
                            <Gauge size={18} />
                        </button>
                        {showSpeedSlider && (
                            <div className="flex-1 flex items-center gap-3 animate-in fade-in slide-in-from-left-2">
                                <input
                                    type="range" min="0.5" max="3" step="0.1"
                                    value={playbackSpeed}
                                    onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
                                    className="flex-1 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-neon-green"
                                />
                                <span className="text-[10px] text-neon-green font-mono min-w-[35px]">{playbackSpeed}s</span>
                            </div>
                        )}
                    </div>

                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-600 whitespace-nowrap">
                        {currentIndex === -1 ? 'Initial' : `Phase ${currentIndex + 1} / ${flattenedSteps.length}`}
                    </div>
                </div>
            </div>
        </div>
    );
});

SimulationVisualizer.displayName = 'SimulationVisualizer';