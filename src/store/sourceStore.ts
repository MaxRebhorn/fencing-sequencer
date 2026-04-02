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
        actionIds: ['sabre_cut_1', 'sabre_cut_2', 'sabre_cut_3', 'sabre_cut_4', 'sabre_cut_5', 'sabre_cut_6', 'sabre_cut_7', 'sabre_parry_1', 'sabre_parry_2', 'sabre_parry_3', 'sabre_parry_4', 'sabre_parry_5', 'sabre_parry_6', 'sabre_parry_7', 'stay_action']
    },
    {
        id: 'Angelo',
        name: 'Henry Charles Angelo',
        description: 'Infantry Sword Exercise, 1845.',
        link: 'https://archive.org/details/infantryswordexe00ange',
        actionIds: ['sabre_cut_1', 'sabre_cut_2', 'sabre_cut_3', 'sabre_cut_4', 'sabre_cut_5', 'sabre_cut_6', 'sabre_cut_7', 'sabre_parry_1', 'sabre_parry_2', 'sabre_parry_3', 'sabre_parry_4', 'sabre_parry_5', 'sabre_parry_6', 'stay_action']
    },
    {
        id: 'Waite',
        name: 'John Musgrave Waite',
        description: 'Lessons in Sabre, Singlestick.',
        link: 'https://wiktenauer.com/wiki/John_Musgrave_Waite',
        actionIds: ['sabre_cut_1', 'sabre_cut_2', 'sabre_cut_3', 'sabre_cut_4', 'sabre_cut_5', 'sabre_cut_6', 'sabre_cut_7', 'sabre_parry_1', 'sabre_parry_2', 'sabre_parry_3', 'sabre_parry_4', 'sabre_parry_5', 'sabre_parry_6', 'stay_action']
    },
    {
        id: 'Radaelli',
        name: 'Giuseppe Radaelli',
        description: 'Italian classical sabre tradition.',
        link: 'https://wiktenauer.com/wiki/Giuseppe_Radaelli',
        actionIds: ['sabre_molinello_head_right', 'sabre_thrust', 'sabre_parry_1', 'sabre_parry_2', 'sabre_parry_3', 'sabre_parry_4', 'sabre_parry_5', 'sabre_parry_6', 'sabre_parry_7', 'stay_action']
    },
    {
        id: 'Barbasetti',
        name: 'Luigi Barbasetti',
        description: 'The Art of the Sabre and the Epee.',
        link: 'https://archive.org/details/artofsabreandepe00barb',
        actionIds: ['sabre_cut_1', 'sabre_cut_2', 'sabre_cut_3', 'sabre_cut_4', 'sabre_cut_5', 'sabre_thrust', 'sabre_parry_1', 'sabre_parry_2', 'sabre_parry_3', 'sabre_parry_4', 'sabre_parry_5', 'sabre_parry_6', 'sabre_parry_7', 'stay_action']
    },
    {
        id: 'Hutton',
        name: 'Alfred Hutton',
        description: 'Cold Steel, The Swordsman.',
        link: 'https://wiktenauer.com/wiki/Alfred_Hutton',
        actionIds: ['sabre_cut_1', 'sabre_cut_2', 'sabre_cut_3', 'sabre_cut_4', 'sabre_cut_5', 'sabre_cut_6', 'sabre_cut_7', 'sabre_molinello_head_right', 'sabre_thrust', 'sabre_parry_1', 'sabre_parry_2', 'sabre_parry_3', 'sabre_parry_4', 'sabre_parry_5', 'sabre_hanging_guard', 'stay_action']
    },
    {
        id: 'Roworth',
        name: 'Charles Roworth',
        description: 'Art of Defence on Foot.',
        link: 'https://wiktenauer.com/wiki/Charles_Roworth',
        actionIds: ['sabre_cut_1', 'sabre_cut_2', 'sabre_cut_3', 'sabre_cut_4', 'sabre_cut_5', 'sabre_cut_6', 'sabre_cut_7', 'sabre_parry_1', 'sabre_parry_2', 'sabre_parry_3', 'sabre_parry_4', 'sabre_hanging_guard', 'stay_action']
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