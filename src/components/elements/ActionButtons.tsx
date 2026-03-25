import React from 'react';
import { Save, Play } from 'lucide-react';

interface Props {
    onSave: () => void;
    onSimulate: () => void;
}

export const ActionButtons: React.FC<Props> = ({ onSave, onSimulate }) => {
    return (
        <div className="flex gap-4">
            <button
                onClick={onSave}
                className="flex-1 bg-gray-700 py-2 rounded flex justify-center items-center gap-2 hover:bg-gray-600 transition"
            >
                <Save size={16} /> Speichern
            </button>
            <button
                onClick={onSimulate}
                className="flex-1 bg-neon-green text-gray-900 py-2 rounded flex justify-center items-center gap-2 shadow-neon hover:bg-neon-green/80 transition"
            >
                <Play size={16} /> Simulieren
            </button>
        </div>
    );
};