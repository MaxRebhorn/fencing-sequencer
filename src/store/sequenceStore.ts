import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { SequenceNode } from '../types';

export interface SavedSequence {
    id: string;
    name: string;
    steps: SequenceNode[];
    playerStart: string;
    opponentStart: string;
    createdAt: number;
}

interface SequenceStore {
    savedSequences: SavedSequence[];
    saveSequence: (sequence: Omit<SavedSequence, 'id' | 'createdAt'>, id?: string) => void;
    deleteSequence: (id: string) => void;
    getSequenceById: (id: string) => SavedSequence | undefined;
}

export const useSequenceStore = create<SequenceStore>()(
    persist(
        (set, get) => ({
            savedSequences: [],
            saveSequence: (data, id) => {
                const newId = id || Date.now().toString();
                const newSequence: SavedSequence = {
                    ...data,
                    id: newId,
                    createdAt: Date.now(),
                };

                set((state) => {
                    const existingIndex = state.savedSequences.findIndex((s) => s.id === newId);
                    if (existingIndex > -1) {
                        const updated = [...state.savedSequences];
                        updated[existingIndex] = newSequence;
                        return { savedSequences: updated };
                    }
                    return { savedSequences: [newSequence, ...state.savedSequences] };
                });
            },
            deleteSequence: (id) => set((state) => ({
                savedSequences: state.savedSequences.filter((s) => s.id !== id),
            })),
            getSequenceById: (id) => get().savedSequences.find((s) => s.id === id),
        }),
        { name: 'sequence-storage' }
    )
);
