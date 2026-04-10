import React, { useState, useMemo } from 'react';
import { ArrowLeft, Upload, Trash2, Layers, MonitorPlay, AlertCircle, Copy, Square } from 'lucide-react';
import { useMoveStore } from '../store/moveStore';
import { Action, SequenceNode } from '../types';
import { SequenceTree } from '../components/organisms/SequenceTree';
import { MoveGrid } from '../components/organisms/MoveGrid';
import { SimulationVisualizer } from '../components/elements/SimulationVisualizer';
import * as Logic from '../utils/sequenceLogic';

export const DebugSimulation: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const { actions } = useMoveStore();
    const [steps, setSteps] = useState<SequenceNode[]>([]);
    const [activeSimStepId, setActiveSimStepId] = useState<string | undefined>('');
    const [selectedActor, setSelectedActor] = useState<'player' | 'opponent'>('player');
    const [debugMode, setDebugMode] = useState<'dual' | 'single'>('dual');

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, stepId: string, type: 'pov' | 'opp') => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const dataUrl = event.target?.result as string;
                setSteps(prev => prev.map(s => {
                    if (s.id === stepId) {
                        const updated = { ...s };
                        if (type === 'pov') updated.debugPovImage = dataUrl;
                        else updated.debugOpponentImage = dataUrl;

                        // Sync images into move object for visualizer logic
                        updated.move = {
                            ...s.move,
                            povImage: type === 'pov' ? dataUrl : s.move.povImage,
                            opponentImage: type === 'opp' ? dataUrl : s.move.opponentImage
                        };
                        return updated;
                    }
                    return s;
                }));
            };
            reader.readAsDataURL(file);
        }
    };

    const addStep = (action: Action) => {
        const newId = `debug-${Date.now()}-${Math.random().toString(10).substr(2, 5)}`;
        const newNode: SequenceNode = {
            id: newId,
            move: { ...action },
            actor: selectedActor,
        };
        setSteps(prev => [...prev, newNode]);
        setActiveSimStepId(newId);
    };

    const removeStep = (id: string) => {
        setSteps(prev => prev.filter(s => s.id !== id));
        if (activeSimStepId === id) setActiveSimStepId('');
    };

    const positionMap = useMemo(
        () => Logic.computePositions(steps, 'sabre_parry_3', 'sabre_parry_3'),
        [steps]
    );

    return (
        <div className="min-h-screen bg-gray-950 text-white p-6 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="text-gray-400 hover:text-cyan-400 transition">
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold neon-text italic uppercase tracking-tighter">Prototyping Mode</h1>
                        <span className="text-[10px] text-pink-500 font-black tracking-widest uppercase italic">Conceptual Layer Testing</span>
                    </div>
                </div>

                {/* Mode Switcher */}
                <div className="flex bg-gray-900 p-1 rounded-xl border border-gray-800">
                    <button
                        onClick={() => setDebugMode('dual')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                            debugMode === 'dual' ? 'bg-cyan-500 text-black shadow-neon' : 'text-gray-500 hover:text-gray-300'
                        }`}
                    >
                        <Copy size={14} />
                        Dual Layer
                    </button>
                    <button
                        onClick={() => setDebugMode('single')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                            debugMode === 'single' ? 'bg-pink-600 text-white shadow-neon' : 'text-gray-500 hover:text-gray-300'
                        }`}
                    >
                        <Square size={14} />
                        Single Image
                    </button>
                </div>
            </div>

            {/* Visualizer – mit singleImageMode Prop */}
            <SimulationVisualizer
                steps={steps}
                activeStepId={activeSimStepId}
                onStepChange={setActiveSimStepId}
                playerStart="sabre_parry_3"
                opponentStart="sabre_parry_3"
                singleImageMode={debugMode === 'single'}
            />

            {/* Timeline Area */}
            <div className="mb-12">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-[10px] uppercase font-black text-gray-500 tracking-widest flex items-center gap-2">
                        <Layers size={14} />
                        Sequence Timeline
                    </h2>
                    {steps.length === 0 && (
                        <div className="flex items-center gap-2 text-yellow-500 text-[9px] font-bold uppercase animate-pulse">
                            <AlertCircle size={12} />
                            Add an action below to start
                        </div>
                    )}
                </div>

                <SequenceTree
                    steps={steps}
                    activeTarget={{ type: 'main' }}
                    positionMap={positionMap}
                    availablePositions={[]}
                    activeSimStepId={activeSimStepId}
                    onRemoveStep={removeStep}
                    onRemoveStepFromBranch={() => {}}
                    onToggleFeint={() => {}}
                    onAddBranch={() => {}}
                    onSelectTarget={() => {}}
                    onSetPositionOverride={() => {}}
                    isBlock={() => false}
                />
            </div>

            {/* Image Upload Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                {steps.map((step, idx) => (
                    <div
                        key={step.id}
                        className={`bg-gray-900/50 border transition-all duration-300 p-5 rounded-2xl flex flex-col gap-4 ${
                            activeSimStepId === step.id ? 'border-cyan-500 ring-1 ring-cyan-500/30 shadow-lg shadow-cyan-500/10' : 'border-gray-800 hover:border-gray-700'
                        }`}
                        onClick={() => setActiveSimStepId(step.id)}
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Phase {idx + 1} ({step.actor})</span>
                                <span className="text-xs font-bold text-white uppercase">{step.move.name}</span>
                            </div>
                            <button
                                onClick={(e) => { e.stopPropagation(); removeStep(step.id); }}
                                className="p-2 hover:bg-red-500/20 text-gray-600 hover:text-red-500 rounded-lg transition-colors"
                            >
                                <Trash2 size={16}/>
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className={`relative group transition-opacity ${debugMode === 'single' && step.actor !== 'player' ? 'opacity-20' : 'opacity-100'}`}>
                                <input type="file" id={`pov-${step.id}`} className="hidden" onChange={(e) => handleImageUpload(e, step.id, 'pov')} />
                                <label htmlFor={`pov-${step.id}`} className={`w-full aspect-[4/3] rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all ${step.debugPovImage ? 'border-cyan-500 bg-cyan-500/10' : 'border-gray-800 hover:border-cyan-500 bg-black/20'}`}>
                                    {step.debugPovImage ? <img src={step.debugPovImage} alt="POV" className="w-full h-full object-contain rounded-lg p-1" /> : <><Upload size={20} className="text-gray-600 group-hover:text-cyan-500 mb-1" /><span className="text-[8px] font-black uppercase text-gray-500">POV Image</span></>}
                                </label>
                                {debugMode === 'single' && step.actor !== 'player' && <div className="absolute inset-0 flex items-center justify-center pointer-events-none"><span className="text-[8px] font-black bg-black/80 px-2 py-1 rounded text-gray-500 uppercase">Disabled</span></div>}
                            </div>
                            <div className={`relative group transition-opacity ${debugMode === 'single' && step.actor !== 'opponent' ? 'opacity-20' : 'opacity-100'}`}>
                                <input type="file" id={`opp-${step.id}`} className="hidden" onChange={(e) => handleImageUpload(e, step.id, 'opp')} />
                                <label htmlFor={`opp-${step.id}`} className={`w-full aspect-[4/3] rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all ${step.debugOpponentImage ? 'border-pink-600 bg-pink-600/10' : 'border-gray-800 hover:border-pink-500 bg-black/20'}`}>
                                    {step.debugOpponentImage ? <img src={step.debugOpponentImage} alt="Opp" className="w-full h-full object-contain rounded-lg p-1" /> : <><Upload size={20} className="text-gray-600 group-hover:text-pink-500 mb-1" /><span className="text-[8px] font-black uppercase text-gray-500">Opponent</span></>}
                                </label>
                                {debugMode === 'single' && step.actor !== 'opponent' && <div className="absolute inset-0 flex items-center justify-center pointer-events-none"><span className="text-[8px] font-black bg-black/80 px-2 py-1 rounded text-gray-500 uppercase">Disabled</span></div>}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Add Action Section */}
            <div className="border-t border-gray-800 pt-12">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 italic">Select Action to Add</h3>
                    <div className="flex gap-2">
                        <button onClick={() => setSelectedActor('player')} className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${selectedActor === 'player' ? 'bg-cyan-500 text-black shadow-neon' : 'bg-gray-800 text-gray-400'}`}>Fencer</button>
                        <button onClick={() => setSelectedActor('opponent')} className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${selectedActor === 'opponent' ? 'bg-pink-600 text-white shadow-neon' : 'bg-gray-800 text-gray-400'}`}>Opponent</button>
                    </div>
                </div>
                <MoveGrid actions={actions} suggestedActionIds={[]} onActionClick={addStep} getSuggestionRank={() => null} />
            </div>
            <div className="h-32" />
        </div>
    );
};