import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Source } from '../types';

interface SourceStore {
    availableSources: Source[];
    activeSourceId: string;
    additionalSourceIds: string[];
    setActiveSourceId: (id: string) => void;
    toggleAdditionalSourceId: (id: string) => void;
    addSource: (source: Source) => void;
    updateSource: (id: string, source: Partial<Source>) => void;
    removeSource: (id: string) => void;
}

const initialSources: Source[] = [
    {
        id: 'Meyer',
        name: 'Joachim Meyer',
        description: '16th Century German fencing master.',
        link: 'https://wiktenauer.com/wiki/Joachim_Meyer',
        actionIds: ['cut1', 'cut2', 'cut3', 'cut4', 'cut5', 'cut6', 'cut7', 'cut8', 'prime', 'seconde', 'tierce', 'quarte', 'quinte', 'sixte', 'septime']
    },
    {
        id: 'Angelo',
        name: 'Henry Charles Angelo',
        description: 'Infantry Sword Exercise, 1845.',
        link: 'https://archive.org/details/infantryswordexe00ange',
        actionIds: ['cut1', 'cut2', 'cut3', 'cut4', 'cut5', 'cut6', 'cut7', 'prime', 'seconde', 'tierce', 'quarte', 'quinte', 'sixte']
    },
    {
        id: 'Waite',
        name: 'John Musgrave Waite',
        description: 'Lessons in Sabre, Singlestick.',
        link: 'https://wiktenauer.com/wiki/John_Musgrave_Waite',
        actionIds: ['cut1', 'cut2', 'cut3', 'cut4', 'cut5', 'cut6', 'cut7', 'prime', 'seconde', 'tierce', 'quarte', 'quinte', 'sixte']
    },
    {
        id: 'Radaelli',
        name: 'Giuseppe Radaelli',
        description: 'Italian classical sabre tradition.',
        link: 'https://wiktenauer.com/wiki/Giuseppe_Radaelli',
        actionIds: ['molinello_head_right', 'molinello_head_left', 'molinello_flank_right', 'molinello_flank_left', 'molinello_face', 'thrust', 'prime', 'seconde', 'tierce', 'quarte', 'quinte', 'sixte', 'septime']
    },
    {
        id: 'Barbasetti',
        name: 'Luigi Barbasetti',
        description: 'The Art of the Sabre and the Epee.',
        link: 'https://archive.org/details/artofsabreandepe00barb',
        actionIds: ['cut1', 'cut2', 'cut3', 'cut4', 'cut5', 'thrust', 'prime', 'seconde', 'tierce', 'quarte', 'quinte', 'sixte', 'septime']
    },
    {
        id: 'Hutton',
        name: 'Alfred Hutton',
        description: 'Cold Steel, The Swordsman.',
        link: 'https://wiktenauer.com/wiki/Alfred_Hutton',
        actionIds: ['cut1', 'cut2', 'cut3', 'cut4', 'cut5', 'cut6', 'cut7', 'molinello_head_right', 'thrust', 'prime', 'seconde', 'tierce', 'quarte', 'quinte', 'hanging_guard']
    },
    {
        id: 'Roworth',
        name: 'Charles Roworth',
        description: 'Art of Defence on Foot.',
        link: 'https://wiktenauer.com/wiki/Charles_Roworth',
        actionIds: ['cut1', 'cut2', 'cut3', 'cut4', 'cut5', 'cut6', 'cut7', 'prime', 'seconde', 'tierce', 'quarte', 'hanging_guard']
    }
];

export const useSourceStore = create<SourceStore>()(
    persist(
        (set, get) => ({
            availableSources: initialSources,
            activeSourceId: 'Barbasetti',
            additionalSourceIds: [],
            setActiveSourceId: (id) => set({ activeSourceId: id }),
            toggleAdditionalSourceId: (id) => set((state) => {
                const index = state.additionalSourceIds.indexOf(id);
                if (index > -1) {
                    return { additionalSourceIds: state.additionalSourceIds.filter((sourceId) => sourceId !== id) };
                } else {
                    return { additionalSourceIds: [...state.additionalSourceIds, id] };
                }
            }),
            addSource: (source) => set((state) => ({ availableSources: [...state.availableSources, source] })),
            updateSource: (id, updatedSource) => set((state) => ({
                availableSources: state.availableSources.map((s) => (s.id === id ? { ...s, ...updatedSource } : s)),
            })),
            removeSource: (id) => set((state) => ({ availableSources: state.availableSources.filter((s) => s.id !== id) })),
        }),
        { name: 'source-storage' }
    )
);
