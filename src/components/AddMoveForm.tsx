import React, { useState } from 'react';
import { useMoveStore } from '../store/moveStore';
import { Move, MoveType } from '../types';
import { Save, X, ArrowLeft } from 'lucide-react';

interface AddMoveFormProps {
    onBack: () => void;
}

export const AddMoveForm: React.FC<AddMoveFormProps> = ({ onBack }) => {
    const { addMove, moves } = useMoveStore();
    const [formData, setFormData] = useState({
        name: '',
        type: 'attack' as MoveType,
        svgContent: '',
        blocks: [] as string[],
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const newMove: Move = {
            id: Date.now().toString(),
            name: formData.name,
            type: formData.type,
            svgContent: formData.svgContent || getDefaultSVG(formData.type),
            blocks: formData.blocks,
        };

        addMove(newMove);

        setFormData({
            name: '',
            type: 'attack',
            svgContent: '',
            blocks: [],
        });
    };

    const getDefaultSVG = (type: MoveType): string => {
        switch (type) {
            case 'attack':
                return `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="30" fill="none" stroke="#ff4bd0" stroke-width="3"/><line x1="50" y1="20" x2="50" y2="80" stroke="#ff4bd0" stroke-width="3"/></svg>`;
            case 'parry':
                return `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="30" fill="none" stroke="#00ff9d" stroke-width="3"/><path d="M35 35 L65 65 M65 35 L35 65" stroke="#00ff9d" stroke-width="3"/></svg>`;
            case 'feint':
                return `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="30" fill="none" stroke="#00d4ff" stroke-width="3"/><path d="M35 35 L50 50 L65 35" stroke="#00d4ff" stroke-width="3" fill="none"/></svg>`;
        }
    };

    const handleBlockToggle = (moveId: string) => {
        setFormData(prev => ({
            ...prev,
            blocks: prev.blocks.includes(moveId)
                ? prev.blocks.filter(id => id !== moveId)
                : [...prev.blocks, moveId]
        }));
    };

    return (
        <div className="max-w-2xl mx-auto">
            <button
                onClick={onBack}
                className="mb-4 flex items-center space-x-2 text-gray-400 hover:text-neon-green transition-colors"
            >
                <ArrowLeft size={20} />
                <span>Zurück</span>
            </button>

            <h2 className="text-2xl font-bold mb-6 neon-text">Neue Aktion erstellen</h2>

            <form onSubmit={handleSubmit} className="card space-y-6">
                <div>
                    <label className="block text-sm font-medium mb-2 text-gray-300">
                        Name der Aktion
                    </label>
                    <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-neon-green focus:ring-1 focus:ring-neon-green text-white"
                        placeholder="z.B. 'Angriff Hoch'"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-2 text-gray-300">
                        Aktionstyp
                    </label>
                    <select
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value as MoveType })}
                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-neon-green text-white"
                    >
                        <option value="attack">Angriff</option>
                        <option value="parry">Parade</option>
                        <option value="feint">Finte</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-2 text-gray-300">
                        SVG-Code (optional)
                    </label>
                    <textarea
                        value={formData.svgContent}
                        onChange={(e) => setFormData({ ...formData, svgContent: e.target.value })}
                        rows={4}
                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-neon-green font-mono text-sm"
                        placeholder="<svg>...</svg>"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                        Falls leer, wird ein Standard-SVG verwendet
                    </p>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-2 text-gray-300">
                        Blockt folgende Aktionen
                    </label>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                        {moves.map(move => (
                            <label key={move.id} className="flex items-center space-x-3 p-2 hover:bg-gray-700 rounded cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.blocks.includes(move.id)}
                                    onChange={() => handleBlockToggle(move.id)}
                                    className="w-4 h-4 text-neon-green rounded focus:ring-neon-green"
                                />
                                <span>{move.name}</span>
                                <span className="text-xs text-gray-500">({move.type})</span>
                            </label>
                        ))}
                    </div>
                    {moves.length === 0 && (
                        <p className="text-sm text-gray-500">Erstelle zuerst andere Aktionen, um Block-Regeln zu definieren</p>
                    )}
                </div>

                <div className="flex justify-end space-x-3">
                    <button
                        type="button"
                        onClick={() => {
                            setFormData({
                                name: '',
                                type: 'attack',
                                svgContent: '',
                                blocks: [],
                            });
                        }}
                        className="px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors flex items-center space-x-2"
                    >
                        <X size={18} />
                        <span>Zurücksetzen</span>
                    </button>

                    <button
                        type="submit"
                        className="px-4 py-2 bg-neon-green text-gray-900 rounded-lg hover:bg-neon-green/80 transition-colors flex items-center space-x-2 shadow-neon"
                    >
                        <Save size={18} />
                        <span>Aktion speichern</span>
                    </button>
                </div>
            </form>

            {formData.name && (
                <div className="mt-8 card">
                    <h3 className="text-lg font-semibold mb-3">Vorschau</h3>
                    <div className="flex items-center space-x-4">
                        <div
                            className="w-32 h-32 bg-gray-700 rounded-lg p-2"
                            dangerouslySetInnerHTML={{
                                __html: formData.svgContent || getDefaultSVG(formData.type)
                            }}
                        />
                        <div>
                            <p className="font-semibold">{formData.name}</p>
                            <p className="text-sm text-gray-400">
                                Typ: {formData.type === 'attack' && 'Angriff'}
                                {formData.type === 'parry' && 'Parade'}
                                {formData.type === 'feint' && 'Finte'}
                            </p>
                            {formData.blocks.length > 0 && (
                                <p className="text-xs text-neon-green mt-1">
                                    Blockt {formData.blocks.length} Aktion(en)
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};