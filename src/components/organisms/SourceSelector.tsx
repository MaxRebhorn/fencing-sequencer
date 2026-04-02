import React, { useState, useMemo } from 'react';
import { useSourceStore } from '../../store/sourceStore';
import { useActionStore, useAllActions } from '../../store/actionStore';
import { useTranslation } from 'react-i18next';
import { Book, PlusCircle, CheckCircle, Edit, Trash2, X, Plus, Link as LinkIcon, ExternalLink, Settings } from 'lucide-react';
import { ActionIcon } from '../atoms/ActionIcon';
import { Action, Source } from '../../types';
import { v4 as uuidv4 } from 'uuid';
import { getActionName } from '../../utils/sequenceLogic';

export const SourceSelector: React.FC = () => {
    const { availableSources, activeSourceId, additionalSourceIds, setActiveSourceId, toggleAdditionalSourceId, addSource, updateSource, removeSource } = useSourceStore();
    const { updateAction } = useActionStore();
    const allActions = useAllActions();
    const { t } = useTranslation();

    const [isAddingSource, setIsAddingSource] = useState(false);
    const [editingSourceId, setEditingSourceId] = useState<string | null>(null);
    const [newSource, setNewSource] = useState<Partial<Source>>({ name: '', description: '', link: '', actionIds: [] });
    const [mappingAction, setMappingAction] = useState<Action | null>(null);
    const [assigningSourceId, setAssigningSourceId] = useState<string | null>(null);

    const handleAddSource = () => {
        if (!newSource.name) return;
        addSource({
            id: uuidv4(),
            name: newSource.name,
            description: newSource.description || '',
            link: newSource.link || '',
            actionIds: newSource.actionIds || []
        });
        setNewSource({ name: '', description: '', link: '', actionIds: [] });
        setIsAddingSource(false);
    };

    const handleUpdateSource = () => {
        if (!editingSourceId || !newSource.name) return;
        updateSource(editingSourceId, {
            name: newSource.name,
            description: newSource.description,
            link: newSource.link
        });
        setEditingSourceId(null);
        setNewSource({ name: '', description: '', link: '', actionIds: [] });
    };

    const startEditing = (source: Source) => {
        setNewSource({ name: source.name, description: source.description, link: source.link });
        setEditingSourceId(source.id);
        setIsAddingSource(false);
    };

    const handleUpdateMapping = (actionId: string, sourceId: string, newName: string) => {
        const action = allActions.find(a => a.id === actionId);
        if (action) {
            const updatedNames = { ...action.sourceNames, [sourceId]: newName };
            updateAction(actionId, { sourceNames: updatedNames });
        }
    };

    const handleToggleActionInSource = (sourceId: string, actionId: string) => {
        const source = availableSources.find(s => s.id === sourceId);
        if (!source) return;

        const updatedActionIds = source.actionIds.indexOf(actionId) !== -1
            ? source.actionIds.filter(id => id !== actionId)
            : [...source.actionIds, actionId];
        
        updateSource(sourceId, { actionIds: updatedActionIds });
    };

    const renderActionGrid = (sourceId: string) => {
        const source = availableSources.find(s => s.id === sourceId);
        if (!source) return null;

        const sourceActions = allActions.filter(a => source.actionIds.indexOf(a.id) !== -1);
        const attacks = sourceActions.filter(a => a.type === 'attack');
        const parries = sourceActions.filter(a => a.type === 'parry');

        return (
            <div className="space-y-4 mt-4">
                <div>
                    <h4 className="text-[10px] uppercase font-black text-pink-500 mb-2 tracking-widest">Attacks</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                        {attacks.map(a => (
                            <div key={a.id} className="bg-gray-900 border border-gray-700 rounded p-2 flex flex-col items-center group relative h-24 justify-between">
                                <ActionIcon svgContent={a.svgContent} className="w-8 h-8" />
                                <span className="text-[10px] text-center font-bold text-gray-300 line-clamp-2 w-full px-1 leading-tight">
                                    {getActionName(a, sourceId)}
                                </span>
                                <div className="absolute inset-0 bg-neon-blue/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded gap-2">
                                    <button onClick={() => setMappingAction(a)} title="Edit Names"><Edit size={14} className="text-white" /></button>
                                    <button onClick={() => handleToggleActionInSource(sourceId, a.id)} title="Remove from Source"><Trash2 size={14} className="text-red-400" /></button>
                                </div>
                            </div>
                        ))}
                        <button 
                            onClick={() => setAssigningSourceId(sourceId)}
                            className="bg-gray-900/30 border border-dashed border-gray-700 rounded p-2 flex flex-col items-center justify-center hover:border-neon-blue transition text-gray-500 hover:text-neon-blue h-24"
                        >
                            <Plus size={20} />
                            <span className="text-[8px] uppercase font-bold mt-1">Assign Action</span>
                        </button>
                    </div>
                </div>
                <div>
                    <h4 className="text-[10px] uppercase font-black text-neon-green mb-2 tracking-widest">Parries</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                        {parries.map(a => (
                            <div key={a.id} className="bg-gray-900 border border-gray-700 rounded p-2 flex flex-col items-center group relative h-24 justify-between">
                                <ActionIcon svgContent={a.svgContent} className="w-8 h-8" />
                                <span className="text-[10px] text-center font-bold text-gray-300 line-clamp-2 w-full px-1 leading-tight">
                                    {getActionName(a, sourceId)}
                                </span>
                                <div className="absolute inset-0 bg-neon-blue/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded gap-2">
                                    <button onClick={() => setMappingAction(a)} title="Edit Names"><Edit size={14} className="text-white" /></button>
                                    <button onClick={() => handleToggleActionInSource(sourceId, a.id)} title="Remove from Source"><Trash2 size={14} className="text-red-400" /></button>
                                </div>
                            </div>
                        ))}
                        <button 
                            onClick={() => setAssigningSourceId(sourceId)}
                            className="bg-gray-900/30 border border-dashed border-gray-700 rounded p-2 flex flex-col items-center justify-center hover:border-neon-blue transition text-gray-500 hover:text-neon-blue h-24"
                        >
                            <Plus size={20} />
                            <span className="text-[8px] uppercase font-bold mt-1">Assign Action</span>
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-8 pb-20 max-w-6xl mx-auto px-4">
            <div className="flex justify-between items-end border-b border-gray-800 pb-6">
                <div>
                    <h2 className="text-3xl font-black flex items-center gap-3 neon-text uppercase italic tracking-tighter">
                        <Book className="text-neon-green" />
                        Historical Sources
                    </h2>
                    <p className="text-gray-500 text-sm mt-1 uppercase font-bold tracking-widest">Source Mapping & Action Bundling</p>
                </div>
                <button 
                    onClick={() => {
                        setIsAddingSource(true);
                        setEditingSourceId(null);
                        setNewSource({ name: '', description: '', link: '', actionIds: [] });
                    }}
                    className="flex items-center gap-2 px-6 py-2 bg-neon-blue text-gray-900 rounded-full hover:bg-cyan-400 transition text-xs font-black uppercase tracking-widest shadow-[0_0_15px_rgba(0,243,255,0.3)]"
                >
                    <Plus size={16} />
                    Add New Source
                </button>
            </div>

            {(isAddingSource || editingSourceId) && (
                <div className="bg-gray-800 border-2 border-neon-blue shadow-neon-blue rounded-xl p-8 mb-8 animate-in fade-in slide-in-from-top-4 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-neon-blue/10 rounded-bl-full -mr-16 -mt-16" />
                    <h3 className="font-black uppercase tracking-widest mb-6 text-neon-blue flex items-center gap-2">
                        {editingSourceId ? <Settings size={20} /> : <PlusCircle size={20} />}
                        {editingSourceId ? 'Edit Historical Source' : 'Register New Fencing Source'}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] uppercase font-black text-gray-500 mb-1 tracking-widest">Source Name</label>
                                <input 
                                    type="text" 
                                    placeholder="e.g. Giuseppe Radaelli"
                                    value={newSource.name}
                                    onChange={e => setNewSource({...newSource, name: e.target.value})}
                                    className="w-full bg-gray-900 border border-gray-700 p-3 rounded text-white focus:border-neon-blue focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] uppercase font-black text-gray-500 mb-1 tracking-widest">Document Link (Optional)</label>
                                <div className="flex gap-2">
                                    <div className="bg-gray-900 border border-gray-700 p-3 rounded-l flex items-center text-gray-500"><LinkIcon size={16} /></div>
                                    <input 
                                        type="text" 
                                        placeholder="URL to PDF or Wiktenauer"
                                        value={newSource.link}
                                        onChange={e => setNewSource({...newSource, link: e.target.value})}
                                        className="w-full bg-gray-900 border border-gray-700 p-3 rounded-r text-white focus:border-neon-blue focus:outline-none"
                                    />
                                </div>
                            </div>
                        </div>
                        <div>
                            <label className="block text-[10px] uppercase font-black text-gray-500 mb-1 tracking-widest">Historical Context / Description</label>
                            <textarea 
                                placeholder="Describe the lineage, weapon focus, or system characteristics..."
                                value={newSource.description}
                                onChange={e => setNewSource({...newSource, description: e.target.value})}
                                className="w-full bg-gray-900 border border-gray-700 p-3 rounded text-white h-[108px] focus:border-neon-blue focus:outline-none resize-none"
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-gray-700">
                        <button 
                            onClick={() => {
                                setIsAddingSource(false);
                                setEditingSourceId(null);
                            }} 
                            className="text-xs uppercase font-black text-gray-500 hover:text-white transition"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={editingSourceId ? handleUpdateSource : handleAddSource} 
                            className="px-8 py-3 bg-neon-blue text-gray-900 font-black rounded-full uppercase text-xs tracking-widest shadow-neon-blue"
                        >
                            {editingSourceId ? 'Update Source Entry' : 'Create Source Entry'}
                        </button>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 gap-12">
                {availableSources.map((source) => {
                    const isActive = activeSourceId === source.id;
                    const isAdditional = additionalSourceIds.indexOf(source.id) !== -1;

                    return (
                        <div
                            key={source.id}
                            className={`relative p-8 rounded-2xl border-2 transition-all duration-500 ${
                                isActive
                                    ? 'bg-neon-green/5 border-neon-green shadow-neon'
                                    : isAdditional
                                    ? 'bg-neon-blue/5 border-neon-blue shadow-[0_0_20px_rgba(0,243,255,0.1)]'
                                    : 'bg-gray-800/20 border-gray-800'
                            }`}
                        >
                            <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-8">
                                <div className="flex-1">
                                    <div className="flex items-center gap-4 mb-2">
                                        <h3 className={`text-2xl font-black uppercase italic tracking-tighter leading-none ${isActive ? 'text-neon-green' : isAdditional ? 'text-neon-blue' : 'text-gray-200'}`}>
                                            {source.name}
                                        </h3>
                                        {isActive && <div className="bg-neon-green text-gray-900 text-[10px] px-2 py-0.5 rounded font-black uppercase tracking-tighter">PRIMARY</div>}
                                        {isAdditional && <div className="bg-neon-blue text-gray-900 text-[10px] px-2 py-0.5 rounded font-black uppercase tracking-tighter">BUNDLED</div>}
                                    </div>
                                    <p className="text-sm text-gray-500 font-medium max-w-2xl leading-relaxed">
                                        {source.description}
                                    </p>
                                    {source.link && (
                                        <a 
                                            href={source.link} 
                                            target="_blank" 
                                            rel="noopener noreferrer" 
                                            className="mt-3 inline-flex items-center gap-1.5 text-neon-blue text-[10px] font-black uppercase tracking-widest hover:underline"
                                        >
                                            <ExternalLink size={12} /> View Documentation
                                        </a>
                                    )}
                                </div>
                                
                                <div className="flex gap-2 shrink-0 bg-gray-900/50 p-2 rounded-full border border-gray-700/50">
                                    <button
                                        onClick={() => setActiveSourceId(source.id)}
                                        className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                                            isActive
                                                ? 'bg-neon-green text-gray-900 shadow-neon scale-105'
                                                : 'text-gray-500 hover:text-white'
                                        }`}
                                    >
                                        Set Primary
                                    </button>
                                    <button
                                        onClick={() => toggleAdditionalSourceId(source.id)}
                                        disabled={isActive}
                                        className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                                            isAdditional
                                                ? 'bg-neon-blue text-gray-900 shadow-neon-blue scale-105'
                                                : isActive
                                                ? 'text-gray-700 cursor-not-allowed'
                                                : 'text-gray-500 hover:text-white'
                                        }`}
                                    >
                                        Bundle
                                    </button>
                                    <div className="w-[1px] h-8 bg-gray-700 mx-1" />
                                    <button 
                                        onClick={() => startEditing(source)}
                                        className="p-2 text-gray-600 hover:text-neon-blue transition hover:scale-110"
                                        title="Edit Source Details"
                                    >
                                        <Settings size={18} />
                                    </button>
                                    <button 
                                        onClick={() => removeSource(source.id)}
                                        className="p-2 text-gray-600 hover:text-red-500 transition hover:scale-110"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>

                            <div className="bg-gray-900/60 rounded-xl p-6 border border-white/5 backdrop-blur-sm">
                                <div className="flex justify-between items-center mb-6">
                                    <div className="flex items-center gap-3">
                                        <span className="w-8 h-[2px] bg-gray-700" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Source Tactical Actions</span>
                                    </div>
                                    <span className="text-[10px] px-3 py-1 rounded bg-gray-800 text-gray-400 border border-gray-700 font-black tracking-widest">
                                        {source.actionIds.length} TECHNICAL MAPPINGS
                                    </span>
                                </div>
                                {renderActionGrid(source.id)}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Modal: Edit Mapping */}
            {mappingAction && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-950/90 backdrop-blur-md animate-in fade-in">
                    <div className="bg-gray-900 border border-gray-700 rounded-3xl p-8 max-w-md w-full shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-neon-blue via-neon-green to-neon-blue" />
                        <div className="flex justify-between items-start mb-8">
                            <div className="flex items-center gap-5">
                                <div className="bg-gray-800 p-4 rounded-2xl border border-gray-700 shadow-inner">
                                    <ActionIcon svgContent={mappingAction.svgContent} className="w-12 h-12" />
                                </div>
                                <div>
                                    <h3 className="font-black uppercase tracking-tighter text-xl italic text-white leading-none">Edit Name Mapping</h3>
                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Technical Action: {mappingAction.id}</p>
                                </div>
                            </div>
                            <button onClick={() => setMappingAction(null)} className="text-gray-500 hover:text-white bg-gray-800 p-1 rounded-full border border-gray-700 transition">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-5 mb-10">
                            <label className="block text-[10px] uppercase font-black text-gray-500 tracking-widest border-b border-gray-800 pb-2">Source Translations</label>
                            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-3 custom-scrollbar">
                                {availableSources.map(s => (
                                    <div key={s.id} className="flex flex-col gap-1.5 p-3 rounded-xl bg-gray-800/50 border border-transparent focus-within:border-neon-blue transition-colors">
                                        <div className="flex justify-between items-center">
                                            <span className="text-[9px] text-neon-blue font-black uppercase tracking-widest">{s.name}</span>
                                            {s.actionIds.indexOf(mappingAction.id) === -1 && <span className="text-[8px] text-gray-600 font-bold uppercase">Not Assigned</span>}
                                        </div>
                                        <input 
                                            type="text"
                                            value={mappingAction.sourceNames[s.id] || ''}
                                            onChange={(e) => handleUpdateMapping(mappingAction.id, s.id, e.target.value)}
                                            placeholder="Translate technical term..."
                                            className="bg-transparent text-sm font-bold text-white focus:outline-none w-full"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        <button 
                            onClick={() => setMappingAction(null)}
                            className="w-full py-4 bg-neon-green text-gray-900 font-black uppercase tracking-widest rounded-2xl shadow-neon hover:scale-[1.02] transition-transform"
                        >
                            Confirm Mappings
                        </button>
                    </div>
                </div>
            )}

            {/* Modal: Assign Action to Source */}
            {assigningSourceId && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-950/90 backdrop-blur-md animate-in fade-in">
                    <div className="bg-gray-900 border border-gray-700 rounded-3xl p-8 max-w-4xl w-full shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="flex justify-between items-start mb-8 shrink-0">
                            <div>
                                <h3 className="font-black uppercase tracking-tighter text-2xl italic text-neon-blue leading-none">Assign Existing Actions</h3>
                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">System Repository → {availableSources.find(s => s.id === assigningSourceId)?.name}</p>
                            </div>
                            <button onClick={() => setAssigningSourceId(null)} className="text-gray-500 hover:text-white bg-gray-800 p-1 rounded-full border border-gray-700 transition">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar space-y-8">
                            <div>
                                <h4 className="text-xs font-black uppercase tracking-widest text-pink-500 mb-4 border-b border-pink-500/20 pb-2">Attacks</h4>
                                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                                    {allActions.filter(a => a.type === 'attack').map(a => {
                                        const isAssigned = availableSources.find(s => s.id === assigningSourceId)?.actionIds.indexOf(a.id) !== -1;
                                        return (
                                            <button 
                                                key={a.id}
                                                onClick={() => handleToggleActionInSource(assigningSourceId, a.id)}
                                                className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-2 relative ${
                                                    isAssigned 
                                                    ? "bg-neon-blue/10 border-neon-blue" 
                                                    : "bg-gray-800/50 border-gray-700 hover:border-gray-500"
                                                }`}
                                            >
                                                <ActionIcon svgContent={a.svgContent} className="w-10 h-10" />
                                                <span className="text-[9px] font-black uppercase text-center tracking-tighter line-clamp-1">{getActionName(a, 'System')}</span>
                                                {isAssigned && <div className="absolute -top-2 -right-2 bg-neon-blue text-gray-900 rounded-full p-0.5"><CheckCircle size={14} /></div>}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                            <div>
                                <h4 className="text-xs font-black uppercase tracking-widest text-neon-green mb-4 border-b border-neon-green/20 pb-2">Parries</h4>
                                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                                    {allActions.filter(a => a.type === 'parry').map(a => {
                                        const isAssigned = availableSources.find(s => s.id === assigningSourceId)?.actionIds.indexOf(a.id) !== -1;
                                        return (
                                            <button 
                                                key={a.id}
                                                onClick={() => handleToggleActionInSource(assigningSourceId, a.id)}
                                                className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-2 relative ${
                                                    isAssigned 
                                                    ? "bg-neon-blue/10 border-neon-blue" 
                                                    : "bg-gray-800/50 border-gray-700 hover:border-gray-500"
                                                }`}
                                            >
                                                <ActionIcon svgContent={a.svgContent} className="w-10 h-10" />
                                                <span className="text-[9px] font-black uppercase text-center tracking-tighter line-clamp-1">{getActionName(a, 'System')}</span>
                                                {isAssigned && <div className="absolute -top-2 -right-2 bg-neon-blue text-gray-900 rounded-full p-0.5"><CheckCircle size={14} /></div>}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 pt-6 border-t border-gray-800 shrink-0">
                            <button 
                                onClick={() => setAssigningSourceId(null)}
                                className="w-full py-4 bg-neon-blue text-gray-900 font-black uppercase tracking-widest rounded-2xl shadow-neon-blue"
                            >
                                Finish Assignment
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
