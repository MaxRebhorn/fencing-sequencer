import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Action, ActionType } from '../types';

interface MoveStore {
    actions: Action[];
    addAction: (action: Action) => void;
    removeAction: (id: string) => void;
    updateAction: (id: string, action: Partial<Action>) => void;
    getActionById: (id: string) => Action | undefined;
    getActionsByType: (type: ActionType) => Action[];
}

const cutSymbols = {
    cut1: `<svg viewBox="0 0 100 100"><defs><marker id="arrow1" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><polygon points="0 0,8 4,0 8" fill="#ff4bd0"/></marker></defs><path d="M70 20 L30 70" stroke="#ff4bd0" stroke-width="4" marker-end="url(#arrow1)"/><circle cx="50" cy="50" r="35" fill="none" stroke="#ff4bd0" stroke-width="2"/><text x="50" y="55" font-size="20" text-anchor="middle" fill="#ff4bd0" font-weight="bold">1</text></svg>`,
    cut2: `<svg viewBox="0 0 100 100"><defs><marker id="arrow2" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><polygon points="0 0,8 4,0 8" fill="#ff4bd0"/></marker></defs><path d="M30 20 L70 70" stroke="#ff4bd0" stroke-width="4" marker-end="url(#arrow2)"/><circle cx="50" cy="50" r="35" fill="none" stroke="#ff4bd0" stroke-width="2"/><text x="50" y="55" font-size="20" text-anchor="middle" fill="#ff4bd0" font-weight="bold">2</text></svg>`,
    cut3: `<svg viewBox="0 0 100 100"><defs><marker id="arrow3" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><polygon points="0 0,8 4,0 8" fill="#ff4bd0"/></marker></defs><path d="M70 80 L30 30" stroke="#ff4bd0" stroke-width="4" marker-end="url(#arrow3)"/><circle cx="50" cy="50" r="35" fill="none" stroke="#ff4bd0" stroke-width="2"/><text x="50" y="55" font-size="20" text-anchor="middle" fill="#ff4bd0" font-weight="bold">3</text></svg>`,
    cut4: `<svg viewBox="0 0 100 100"><defs><marker id="arrow4" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><polygon points="0 0,8 4,0 8" fill="#ff4bd0"/></marker></defs><path d="M30 80 L70 30" stroke="#ff4bd0" stroke-width="4" marker-end="url(#arrow4)"/><circle cx="50" cy="50" r="35" fill="none" stroke="#ff4bd0" stroke-width="2"/><text x="50" y="55" font-size="20" text-anchor="middle" fill="#ff4bd0" font-weight="bold">4</text></svg>`,
    cut5: `<svg viewBox="0 0 100 100"><defs><marker id="arrow5" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><polygon points="0 0,8 4,0 8" fill="#ff4bd0"/></marker></defs><path d="M80 50 L20 50" stroke="#ff4bd0" stroke-width="4" marker-end="url(#arrow5)"/><circle cx="50" cy="50" r="35" fill="none" stroke="#ff4bd0" stroke-width="2"/><text x="50" y="55" font-size="20" text-anchor="middle" fill="#ff4bd0" font-weight="bold">5</text></svg>`,
    cut6: `<svg viewBox="0 0 100 100"><defs><marker id="arrow6" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><polygon points="0 0,8 4,0 8" fill="#ff4bd0"/></marker></defs><path d="M20 50 L80 50" stroke="#ff4bd0" stroke-width="4" marker-end="url(#arrow6)"/><circle cx="50" cy="50" r="35" fill="none" stroke="#ff4bd0" stroke-width="2"/><text x="50" y="55" font-size="20" text-anchor="middle" fill="#ff4bd0" font-weight="bold">6</text></svg>`,
    cut7: `<svg viewBox="0 0 100 100"><defs><marker id="arrow7" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><polygon points="0 0,8 4,0 8" fill="#ff4bd0"/></marker></defs><path d="M50 20 L50 80" stroke="#ff4bd0" stroke-width="4" marker-end="url(#arrow7)"/><circle cx="50" cy="50" r="35" fill="none" stroke="#ff4bd0" stroke-width="2"/><text x="50" y="55" font-size="20" text-anchor="middle" fill="#ff4bd0" font-weight="bold">7</text></svg>`,
    cut8: `<svg viewBox="0 0 100 100"><defs><marker id="arrow8" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><polygon points="0 0,8 4,0 8" fill="#ff4bd0"/></marker></defs><path d="M50 80 L50 20" stroke="#ff4bd0" stroke-width="4" marker-end="url(#arrow8)"/><circle cx="50" cy="50" r="35" fill="none" stroke="#ff4bd0" stroke-width="2"/><text x="50" y="55" font-size="20" text-anchor="middle" fill="#ff4bd0" font-weight="bold">8</text></svg>`,
    molinello: `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="30" fill="none" stroke="#ff4bd0" stroke-width="3" stroke-dasharray="5 5"/><path d="M70 30 A 30 30 0 1 1 30 70" stroke="#ff4bd0" stroke-width="3" fill="none"/></svg>`,
    thrust: `<svg viewBox="0 0 100 100"><line x1="50" y1="80" x2="50" y2="20" stroke="#ff4bd0" stroke-width="6"/><path d="M45 25 L50 15 L55 25" fill="#ff4bd0"/></svg>`
};

const parrySymbols = {
    prime: `<svg viewBox="0 0 100 100"><g><circle stroke-width="2" stroke="#00ff9d" fill="none" r="30" cy="50" cx="50"/><line transform="rotate(53.9242 14.1772 65.0633)" stroke="#00ff9d" stroke-width="5" y2="77.62153" x2="31.5768" y1="52.50506" x1="-3.22237"/><circle fill="#00ff9d" r="4.87342" cy="43.03798" cx="14.3038"/><text fill="#00ff9d" text-anchor="middle" font-size="18" y="55" x="50">1</text></g></svg>`,
    seconde: `<svg viewBox="0 0 100 100"><g><circle stroke-width="2" stroke="#00ff9d" fill="none" r="30" cy="50" cx="50"/><line transform="rotate(53.9242 89.3674 65.0633)" stroke="#00ff9d" stroke-width="5" y2="77.62153" x2="106.76667" y1="52.50506" x1="71.96751"/><circle fill="#00ff9d" r="4.87342" cy="43.03798" cx="89.49367"/><text fill="#00ff9d" text-anchor="middle" font-size="18" y="55" x="50">2</text></g></svg>`,
    tierce: `<svg viewBox="0 0 100 100"><g><circle stroke-width="2" stroke="#00ff9d" fill="none" r="30" cy="50" cx="50"/><line transform="rotate(53.9242 89.3674 40.5062)" stroke="#00ff9d" stroke-width="5" y2="53.06456" x2="106.76667" y1="27.9481" x1="71.96751"/><circle fill="#00ff9d" r="4.87342" cy="61.01266" cx="89.49367"/><text fill="#00ff9d" text-anchor="middle" font-size="18" y="55" x="50">3</text></g></svg>`,
    quarte: `<svg viewBox="0 0 100 100"><g><circle stroke-width="2" stroke="#00ff9d" fill="none" r="30" cy="50" cx="50"/><line transform="rotate(53.9242 11.6456 40.5062)" stroke="#00ff9d" stroke-width="5" y2="53.06456" x2="29.04515" y1="27.9481" x1="-5.75401"/><circle fill="#00ff9d" r="4.87342" cy="61.01266" cx="11.77215"/><text fill="#00ff9d" text-anchor="middle" font-size="18" y="55" x="50">4</text></g></svg>`,
    quinte: `<svg viewBox="0 0 100 100"><g><circle stroke-width="2" stroke="#00ff9d" fill="none" r="30" cy="50" cx="50"/><line transform="rotate(144.813 46.8354 11.8987)" stroke="#00ff9d" stroke-width="5" y2="24.45697" x2="64.23502" y1="-0.65949" x1="29.43586"/><path d="m71.77215,16.77215c-2.6925,0 -4.87342,-2.18092 -4.87342,-4.87342c0,-2.6925 2.18092,-4.87342 4.87342,-4.87342c2.6925,0 4.87342,2.18092 4.87342,4.87342c0,2.6925 -2.18092,4.87342 -4.87342,4.87342z" fill="#00ff9d"/><text fill="#00ff9d" text-anchor="middle" font-size="18" y="55" x="50">5</text></g></svg>`,
    sixte: `<svg viewBox="0 0 100 100"><g><circle stroke-width="2" stroke="#00ff9d" fill="none" r="30" cy="50" cx="50"/><line transform="rotate(144.813 52.4051 11.8987)" stroke="#00ff9d" stroke-width="5" y2="24.45697" x2="69.80464" y1="-0.65949" x1="35.00548"/><path d="m30.50633,16.77215c-2.6925,0 -4.87342,-2.18092 -4.87342,-4.87342c0,-2.6925 2.18092,-4.87342 4.87342,-4.87342c2.6925,0 4.87342,2.18092 4.87342,4.87342c0,2.6925 -2.18092,4.87342 -4.87342,4.87342z" fill="#00ff9d"/><text fill="#00ff9d" text-anchor="middle" font-size="18" y="55" x="50">6</text></g></svg>`,
    septime: `<svg viewBox="0 0 100 100"><g><circle stroke-width="2" stroke="#00ff9d" fill="none" r="30" cy="50" cx="50"/><line stroke="#00ff9d" transform="rotate(146.997 86.1364 34.3182)" stroke-width="5" y2="14.31818" x2="86.13637" y1="54.31818" x1="86.13637"/><circle fill="#00ff9d" r="5" cy="14.54546" cx="72.5"/><text fill="#00ff9d" text-anchor="middle" font-size="18" y="55" x="50">7</text></g></svg>`,
    hanging: `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="30" fill="none" stroke="#00ff9d" stroke-width="2"/><line x1="20" y1="20" x2="80" y2="20" stroke="#00ff9d" stroke-width="5"/><text x="50" y="55" font-size="14" text-anchor="middle" fill="#00ff9d">H</text></svg>`
};

const initialActions: Action[] = [
    {
        id: 'cut1', sourceId: 'System',
        sourceNames: { Meyer: 'Cut 1', Angelo: 'Cut 1', Waite: 'Cut 1', Roworth: 'Cut 1', Radaelli: 'Direct cut to head (right)', Barbasetti: 'Cut to head (right)', Hutton: 'Downward diagonal right → left' },
        type: 'attack', svgContent: cutSymbols.cut1, name: 'Cut 1'
    },
    {
        id: 'cut2', sourceId: 'System',
        sourceNames: { Meyer: 'Cut 2', Angelo: 'Cut 2', Waite: 'Cut 2', Roworth: 'Cut 2', Radaelli: 'Direct cut to head (left)', Barbasetti: 'Cut to head (left)', Hutton: 'Downward diagonal left → right' },
        type: 'attack', svgContent: cutSymbols.cut2, name: 'Cut 2'
    },
    {
        id: 'cut3', sourceId: 'System',
        sourceNames: { Meyer: 'Cut 3', Angelo: 'Cut 3', Waite: 'Cut 3', Roworth: 'Cut 3', Radaelli: 'Direct cut to flank (right)', Barbasetti: 'Cut to flank (right)', Hutton: 'Horizontal cut (right → left)' },
        type: 'attack', svgContent: cutSymbols.cut3, name: 'Cut 3'
    },
    {
        id: 'cut4', sourceId: 'System',
        sourceNames: { Meyer: 'Cut 4', Angelo: 'Cut 4', Waite: 'Cut 4', Roworth: 'Cut 4', Radaelli: 'Direct cut to flank (left)', Barbasetti: 'Cut to flank (left)', Hutton: 'Horizontal cut (left → right)' },
        type: 'attack', svgContent: cutSymbols.cut4, name: 'Cut 4'
    },
    {
        id: 'cut5', sourceId: 'System',
        sourceNames: { Meyer: 'Cut 5', Angelo: 'Cut 5', Waite: 'Cut 5', Roworth: 'Cut 5', Barbasetti: 'Cut to face', Hutton: 'Downward cut (head)' },
        type: 'attack', svgContent: cutSymbols.cut7, name: 'Cut 5'
    },
    {
        id: 'cut6', sourceId: 'System',
        sourceNames: { Meyer: 'Cut 6', Angelo: 'Cut 6', Waite: 'Cut 6', Roworth: 'Cut 6', Hutton: 'Rising cut (right)' },
        type: 'attack', svgContent: cutSymbols.cut3, name: 'Cut 6'
    },
    {
        id: 'cut7', sourceId: 'System',
        sourceNames: { Meyer: 'Cut 7', Angelo: 'Cut 7', Waite: 'Cut 7', Roworth: 'Cut 7', Hutton: 'Rising cut (left)' },
        type: 'attack', svgContent: cutSymbols.cut4, name: 'Cut 7'
    },
    {
        id: 'cut8', sourceId: 'System',
        sourceNames: { Meyer: 'Cut 8' },
        type: 'attack', svgContent: cutSymbols.cut8, name: 'Cut 8'
    },
    {
        id: 'molinello_head_right', sourceId: 'Radaelli',
        sourceNames: { Radaelli: 'Molinello to head (right)', Barbasetti: 'Circular cut to head (right)', Hutton: 'Moulinet head' },
        type: 'attack', svgContent: cutSymbols.molinello, name: 'Molinello Head Right'
    },
    {
        id: 'molinello_head_left', sourceId: 'Radaelli',
        sourceNames: { Radaelli: 'Molinello to head (left)', Barbasetti: 'Circular cut to head (left)' },
        type: 'attack', svgContent: cutSymbols.molinello, name: 'Molinello Head Left'
    },
    {
        id: 'molinello_flank_right', sourceId: 'Radaelli',
        sourceNames: { Radaelli: 'Molinello to flank (right)', Barbasetti: 'Circular cut to flank (right)' },
        type: 'attack', svgContent: cutSymbols.molinello, name: 'Molinello Flank Right'
    },
    {
        id: 'molinello_flank_left', sourceId: 'Radaelli',
        sourceNames: { Radaelli: 'Molinello to flank (left)', Barbasetti: 'Circular cut to flank (left)' },
        type: 'attack', svgContent: cutSymbols.molinello, name: 'Molinello Flank Left'
    },
    {
        id: 'molinello_face', sourceId: 'Radaelli',
        sourceNames: { Radaelli: 'Molinello to face' },
        type: 'attack', svgContent: cutSymbols.molinello, name: 'Molinello Face'
    },
    {
        id: 'thrust', sourceId: 'Radaelli',
        sourceNames: { Radaelli: 'Thrust', Barbasetti: 'Thrust', Hutton: 'Thrust' },
        type: 'attack', svgContent: cutSymbols.thrust, name: 'Thrust'
    },
    {
        id: 'prime', sourceId: 'System',
        sourceNames: { Meyer: 'Prime', Angelo: 'Prime', Waite: 'Prime', Radaelli: 'Prima', Barbasetti: 'Prima', Hutton: 'Prime' },
        type: 'parry', svgContent: parrySymbols.prime, blocks: ['cut3', 'cut7'], name: 'Prime'
    },
    {
        id: 'seconde', sourceId: 'System',
        sourceNames: { Meyer: 'Second', Angelo: 'Second', Waite: 'Second', Radaelli: 'Seconda', Barbasetti: 'Seconda', Hutton: 'Second' },
        type: 'parry', svgContent: parrySymbols.seconde, blocks: ['cut4', 'cut6'], name: 'Second'
    },
    {
        id: 'tierce', sourceId: 'System',
        sourceNames: { Meyer: 'Tierce', Angelo: 'Tierce', Waite: 'Tierce', Radaelli: 'Terza', Barbasetti: 'Terza', Hutton: 'Tierce', Roworth: 'Outside guard' },
        type: 'parry', svgContent: parrySymbols.tierce, blocks: ['cut1', 'cut3'], name: 'Tierce'
    },
    {
        id: 'quarte', sourceId: 'System',
        sourceNames: { Meyer: 'Quarte', Angelo: 'Quarte', Waite: 'Quarte', Radaelli: 'Quarta', Barbasetti: 'Quarta', Hutton: 'Quarte', Roworth: 'Inside guard' },
        type: 'parry', svgContent: parrySymbols.quarte, blocks: ['cut2', 'cut4'], name: 'Quarte'
    },
    {
        id: 'quinte', sourceId: 'System',
        sourceNames: { Meyer: 'Quinte', Angelo: 'Quinte', Waite: 'Quinte', Radaelli: 'Quinta', Barbasetti: 'Quinta', Hutton: 'Head parry' },
        type: 'parry', svgContent: parrySymbols.quinte, blocks: ['cut5'], name: 'Quinte'
    },
    {
        id: 'sixte', sourceId: 'System',
        sourceNames: { Meyer: 'Sixte', Angelo: 'Sixte', Waite: 'Sixte', Radaelli: 'Sesta', Barbasetti: 'Sesta' },
        type: 'parry', svgContent: parrySymbols.sixte, blocks: ['cut1'], name: 'Sixte'
    },
    {
        id: 'septime', sourceId: 'System',
        sourceNames: { Meyer: 'Septime', Radaelli: 'Settima', Barbasetti: 'Settima' },
        type: 'parry', svgContent: parrySymbols.septime, blocks: ['cut7'], name: 'Septime'
    },
    {
        id: 'hanging_guard', sourceId: 'Roworth',
        sourceNames: { Roworth: 'Hanging guard', Hutton: 'Hanging guard' },
        type: 'parry', svgContent: parrySymbols.hanging, blocks: ['cut5'], name: 'Hanging Guard'
    }
];

export const useMoveStore = create<MoveStore>()(
    persist(
        (set, get) => ({
            actions: initialActions,
            addAction: (action) => set((state) => ({ actions: [...state.actions, action] })),
            removeAction: (id) => set((state) => ({ actions: state.actions.filter((a) => a.id !== id) })),
            updateAction: (id, updatedAction) => set((state) => ({
                actions: state.actions.map((a) => (a.id === id ? { ...a, ...updatedAction } : a)),
            })),
            getActionById: (id) => get().actions.find((a) => a.id === id),
            getActionsByType: (type) => get().actions.filter((a) => a.type === type),
        }),
        { name: 'action-storage' }
    )
);
