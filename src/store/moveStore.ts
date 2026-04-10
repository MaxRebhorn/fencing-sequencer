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
    cut5: `<svg viewBox="0 0 100 100"><defs><marker id="arrow5" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><polygon points="0 0,8 4,0 8" fill="#ff4bd0"/></marker></defs><path d="M50 20 L50 80" stroke="#ff4bd0" stroke-width="4" marker-end="url(#arrow5)"/><circle cx="50" cy="50" r="35" fill="none" stroke="#ff4bd0" stroke-width="2"/><text x="50" y="55" font-size="20" text-anchor="middle" fill="#ff4bd0" font-weight="bold">5</text></svg>`,
    cut6: `<svg viewBox="0 0 100 100"><defs><marker id="arrow6" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><polygon points="0 0,8 4,0 8" fill="#ff4bd0"/></marker></defs><path d="M20 70 L80 30" stroke="#ff4bd0" stroke-width="4" marker-end="url(#arrow6)"/><circle cx="50" cy="50" r="35" fill="none" stroke="#ff4bd0" stroke-width="2"/><text x="50" y="55" font-size="20" text-anchor="middle" fill="#ff4bd0" font-weight="bold">6</text></svg>`,
    cut7: `<svg viewBox="0 0 100 100"><defs><marker id="arrow7" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><polygon points="0 0,8 4,0 8" fill="#ff4bd0"/></marker></defs><path d="M80 70 L20 30" stroke="#ff4bd0" stroke-width="4" marker-end="url(#arrow7)"/><circle cx="50" cy="50" r="35" fill="none" stroke="#ff4bd0" stroke-width="2"/><text x="50" y="55" font-size="20" text-anchor="middle" fill="#ff4bd0" font-weight="bold">7</text></svg>`,
    molinello: `<svg viewBox="0 0 100 100"><defs><marker id="arrowM" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><polygon points="0 0,8 4,0 8" fill="#ff4bd0"/></marker></defs><circle cx="50" cy="50" r="35" fill="none" stroke="#ff4bd0" stroke-width="2"/><path d="M82 65 Q 85 85 65 85 Q 45 85 35 65 Q 25 45 45 25 Q 65 5 85 25 Q 95 35 85 55 L 65 65" stroke="#ff4bd0" stroke-width="3" fill="none" marker-end="url(#arrowM)" stroke-linecap="round"/><circle cx="82" cy="65" r="3" fill="#ff4bd0"/><text x="50" y="55" font-size="20" text-anchor="middle" fill="#ff4bd0" font-weight="bold">M</text></svg>`,
    thrust: `<svg viewBox="0 0 100 100"><defs><marker id="arrowT" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><polygon points="0 0,8 4,0 8" fill="#ff4bd0"/></marker></defs><circle cx="50" cy="50" r="35" fill="none" stroke="#ff4bd0" stroke-width="2"/><line x1="15" y1="50" x2="85" y2="50" stroke="#ff4bd0" stroke-width="4" marker-end="url(#arrowT)"/><circle cx="15" cy="50" r="3" fill="#ff4bd0"/><text x="50" y="55" font-size="20" text-anchor="middle" fill="#ff4bd0" font-weight="bold">T</text></svg>`
};

const parrySymbols = {
    prime: `<svg viewBox="0 0 100 100"><g><circle stroke-width="2" stroke="#00ff9d" fill="none" r="30" cy="50" cx="50"/><line transform="rotate(53.9242 14.1772 65.0633)" stroke="#00ff9d" stroke-width="5" y2="77.62153" x2="31.5768" y1="52.50506" x1="-3.22237"/><circle fill="#00ff9d" r="4.87342" cy="43.03798" cx="14.3038"/><text fill="#00ff9d" text-anchor="middle" font-size="18" y="55" x="50">1</text></g></svg>`,
    seconde: `<svg viewBox="0 0 100 100"><g><circle stroke-width="2" stroke="#00ff9d" fill="none" r="30" cy="50" cx="50"/><line transform="rotate(53.9242 89.3674 65.0633)" stroke="#00ff9d" stroke-width="5" y2="77.62153" x2="106.76667" y1="52.50506" x1="71.96751"/><circle fill="#00ff9d" r="4.87342" cy="43.03798" cx="89.49367"/><text fill="#00ff9d" text-anchor="middle" font-size="18" y="55" x="50">2</text></g></svg>`,
    tierce: `<svg viewBox="0 0 100 100"><g><circle stroke-width="2" stroke="#00ff9d" fill="none" r="30" cy="50" cx="50"/><line transform="rotate(53.9242 89.3674 40.5062)" stroke="#00ff9d" stroke-width="5" y2="53.06456" x2="106.76667" y1="27.9481" x1="71.96751"/><circle fill="#00ff9d" r="4.87342" cy="61.01266" cx="89.49367"/><text fill="#00ff9d" text-anchor="middle" font-size="18" y="55" x="50">3</text></g></svg>`,
    quarte: `<svg viewBox="0 0 100 100"><g><circle stroke-width="2" stroke="#00ff9d" fill="none" r="30" cy="50" cx="50"/><line transform="rotate(53.9242 11.6456 40.5062)" stroke="#00ff9d" stroke-width="5" y2="53.06456" x2="29.04515" y1="27.9481" x1="-5.75401"/><circle fill="#00ff9d" r="4.87342" cy="61.01266" cx="11.77215"/><text fill="#00ff9d" text-anchor="middle" font-size="18" y="55" x="50">4</text></g></svg>`,
    quinte: `<svg viewBox="0 0 100 100"><g><circle stroke-width="2" stroke="#00ff9d" fill="none" r="30" cy="50" cx="50"/><line transform="rotate(144.813 46.8354 11.8987)" stroke="#00ff9d" stroke-width="5" y2="24.45697" x2="64.23502" y1="-0.65949" x1="29.43586"/><path d="m71.77215,16.77215c-2.6925,0 -4.87342,-2.18092 -4.87342,-4.87342c0,-2.6925 2.18092,-4.87342 4.87342,-4.87342c2.6925,0 4.87342,2.18092 4.87342,4.87342c0,2.6925 -2.18092,4.87342 -4.87342,4.87342z" fill="#00ff9d"/><text fill="#00ff9d" text-anchor="middle" font-size="18" y="55" x="50">5</text></g></svg>`,
    sixte: `<svg viewBox="0 0 100 100"><g><circle stroke-width="2" stroke="#00ff9d" fill="none" r="30" cy="50" cx="50"/><line transform="rotate(144.813 52.4051 11.8987)" stroke="#00ff9d" stroke-width="5" y2="24.45697" x2="69.80464" y1="-0.65949" x1="35.00548"/><path d="m30.50633,16.77215c-2.6925,0 -4.87342,-2.18092 -4.87342,-4.87342c0,-2.6925 2.18092,-4.87342 4.87342,-4.87342c2.6925,0 4.87342,2.18092 4.87342,4.87342c0,2.6925 -2.18092,4.87342 -4.87342,4.87342z" fill="#00ff9d"/><text fill="#00ff9d" text-anchor="middle" font-size="18" y="55" x="50">6</text></g></svg>`,
    septime: `<svg viewBox="0 0 100 100"><g><circle stroke-width="2" stroke="#00ff9d" fill="none" r="30" cy="50" cx="50"/><line stroke="#00ff9d" transform="rotate(146.997 86.1364 34.3182)" stroke-width="5" y2="14.31818" x2="86.13637" y1="54.31818" x1="86.13637"/><circle fill="#00ff9d" r="5" cy="14.54546" cx="72.5"/><text fill="#00ff9d" text-anchor="middle" font-size="18" y="55" x="50">7</text></g></svg>`,
    hanging: `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="35" fill="none" stroke="#00ff9d" stroke-width="2"/><line x1="20" y1="30" x2="80" y2="70" stroke="#00ff9d" stroke-width="5"/><circle cx="20" cy="30" r="4" fill="#00ff9d"/><text x="50" y="55" font-size="20" text-anchor="middle" fill="#00ff9d" font-weight="bold">H</text></svg>`
};

const initialActions: Action[] = [
    {
        id: 'sabre_cut_1', sourceId: 'System',
        sourceNames: {
            Angelo: 'Cut 1',
            Waite: 'Cut 1',
            Roworth: 'Cut 1',
            Radaelli: 'Direct cut to head (right)',
            Barbasetti: 'Cut to head (right)',
            Hutton: 'Downward diagonal right → left',
            Meyer: 'Wrath Cut (Zornhau) - right side'
        },
        type: 'attack', svgContent: cutSymbols.cut1,
        name: 'Cut 1 (Diagonal Outside)',
        description: 'Downward diagonal from the outside (high) aimed at the cheek.'
    },
    {
        id: 'sabre_cut_2', sourceId: 'System',
        sourceNames: {
            Angelo: 'Cut 2',
            Waite: 'Cut 2',
            Roworth: 'Cut 2',
            Radaelli: 'Direct cut to head (left)',
            Barbasetti: 'Cut to head (left)',
            Hutton: 'Downward diagonal left → right',
            Meyer: 'Wrath Cut (Zornhau) - left side'
        },
        type: 'attack', svgContent: cutSymbols.cut2,
        povImage: '/actions/pov/atack/cut_2.svg',
        name: 'Cut 2 (Diagonal Inside)',
        description: 'Downward diagonal from the inside (high) aimed at the cheek.'
    },
    {
        id: 'sabre_cut_3', sourceId: 'System',
        sourceNames: {
            Angelo: 'Cut 3',
            Waite: 'Cut 3',
            Roworth: 'Cut 3',
            Radaelli: 'Direct cut to flank (right)',
            Barbasetti: 'Cut to flank (right)',
            Hutton: 'Horizontal cut (right → left)',
            Meyer: 'Middle Cut (Mittelhau) - right to left'
        },
        type: 'attack', svgContent: cutSymbols.cut3,
        name: 'Cut 3 (Horizontal Outside)',
        description: 'Horizontal or slightly upward diagonal from the outside aimed at the side.'
    },
    {
        id: 'sabre_cut_4', sourceId: 'System',
        sourceNames: {
            Angelo: 'Cut 4',
            Waite: 'Cut 4',
            Roworth: 'Cut 4',
            Radaelli: 'Direct cut to flank (left)',
            Barbasetti: 'Cut to flank (left)',
            Hutton: 'Horizontal cut (left → right)',
            Meyer: 'Middle Cut (Mittelhau) - left to right'
        },
        type: 'attack', svgContent: cutSymbols.cut4,
        name: 'Cut 4 (Horizontal Inside)',
        description: 'Horizontal or slightly upward diagonal from the inside aimed at the side.'
    },
    {
        id: 'sabre_cut_5', sourceId: 'System',
        sourceNames: {
            Angelo: 'Cut 5',
            Waite: 'Cut 5',
            Roworth: 'Cut 5',
            Barbasetti: 'Cut to face',
            Hutton: 'Downward cut (head)',
            Meyer: 'High Cut (Oberhau)'
        },
        type: 'attack', svgContent: cutSymbols.cut5,
        name: 'Cut 5 (Vertical Down)',
        description: 'Vertical downward cut aimed at the top of the head.'
    },
    {
        id: 'sabre_cut_6', sourceId: 'System',
        sourceNames: {
            Angelo: 'Cut 6',
            Waite: 'Cut 6',
            Roworth: 'Cut 6 (low outside)',
            Hutton: 'Rising cut (right)',
            Meyer: 'Low Cut (Unterhau) - right side'
        },
        type: 'attack', svgContent: cutSymbols.cut6,
        name: 'Cut 6 (Rising Outside)',
        description: 'Upward diagonal from the outside.'
    },
    {
        id: 'sabre_cut_7', sourceId: 'System',
        sourceNames: {
            Angelo: 'Cut 7',
            Waite: 'Cut 7',
            Roworth: 'Cut 7 (low inside)',
            Hutton: 'Rising cut (left)',
            Meyer: 'Low Cut (Unterhau) - left side'
        },
        type: 'attack', svgContent: cutSymbols.cut7,
        name: 'Cut 7 (Rising Inside)',
        description: 'Upward diagonal from the inside.'
    },
    {
        id: 'sabre_molinello_head_right', sourceId: 'Radaelli',
        sourceNames: { Radaelli: 'Molinello to head (right)', Barbasetti: 'Circular cut to head (right)', Hutton: 'Moulinet head' },
        type: 'attack', svgContent: cutSymbols.molinello, name: 'Molinello Head Right',
        description: 'A circular molinello cut delivered to the right side of the adversary\'s head.'
    },
    {
        id: 'sabre_thrust', sourceId: 'System',
        sourceNames: { Radaelli: 'Thrust', Barbasetti: 'Thrust', Hutton: 'Thrust', Angelo: 'Thrust', Waite: 'Thrust' },
        type: 'attack', svgContent: cutSymbols.thrust, name: 'Thrust',
        description: 'A direct thrust with the point of the sabre.'
    },
    {
        id: 'sabre_parry_1', sourceId: 'System',
        sourceNames: { Angelo: 'Prime', Waite: 'Prime', Radaelli: 'Prima', Barbasetti: 'Prima', Hutton: 'Prime' },
        type: 'parry', svgContent: parrySymbols.prime, blocks: ['sabre_cut_3', 'sabre_cut_7'], name: 'Prime',
        description: 'First parry protecting the low inside line.'
    },
    {
        id: 'sabre_parry_2', sourceId: 'System',
        sourceNames: { Angelo: 'Second', Waite: 'Second', Radaelli: 'Seconda', Barbasetti: 'Seconda', Hutton: 'Second' },
        type: 'parry', svgContent: parrySymbols.seconde, blocks: ['sabre_cut_4', 'sabre_cut_6'], name: 'Second',
        description: 'Second parry protecting the low outside line.'
    },
    {
        id: 'sabre_parry_3', sourceId: 'System',
        sourceNames: { Angelo: 'Tierce', Waite: 'Tierce', Radaelli: 'Terza', Barbasetti: 'Terza', Hutton: 'Tierce', Roworth: 'Outside guard' },
        type: 'parry', svgContent: parrySymbols.tierce, blocks: ['sabre_cut_1', 'sabre_cut_3'], name: 'Tierce',
        description: 'Third parry protecting the outside line (mid/high).'
    },
    {
        id: 'sabre_parry_4', sourceId: 'System',
        sourceNames: { Angelo: 'Quarte', Waite: 'Quarte', Radaelli: 'Quarta', Barbasetti: 'Quarta', Hutton: 'Quarte', Roworth: 'Inside guard' },
        type: 'parry', svgContent: parrySymbols.quarte, blocks: ['sabre_cut_2', 'sabre_cut_4'], name: 'Quarte',
        description: 'Fourth parry protecting the inside line (mid/high).'
    },
    {
        id: 'sabre_parry_5', sourceId: 'System',
        sourceNames: { Angelo: 'Quinte', Waite: 'Quinte', Radaelli: 'Quinta', Barbasetti: 'Quinta', Hutton: 'Head parry' },
        type: 'parry', svgContent: parrySymbols.quinte, blocks: ['sabre_cut_5'],
        povImage: '/actions/pov/parry/5_parry.png',
        opponentImage: '/actions/opponent/parry/parry_5.svg',
        name: 'Quinte',
        description: 'Fifth parry protecting the head from vertical downward cuts.'
    },
    {
        id: 'sabre_parry_6', sourceId: 'System',
        sourceNames: { Angelo: 'Sixte', Waite: 'Sixte', Radaelli: 'Sesta', Barbasetti: 'Sesta' },
        type: 'parry', svgContent: parrySymbols.sixte, blocks: ['sabre_cut_1'], name: 'Sixte',
        description: 'Sixth parry protecting the high inside line.'
    },
    {
        id: 'sabre_parry_7', sourceId: 'System',
        sourceNames: { Radaelli: 'Settima', Barbasetti: 'Settima' },
        type: 'parry', svgContent: parrySymbols.septime, blocks: ['sabre_cut_5', 'sabre_cut_7'], name: 'Settima',
        description: 'Seventh parry, often a hanging or situational defense.'
    },
    {
        id: 'sabre_hanging_guard', sourceId: 'Roworth',
        sourceNames: { Roworth: 'Hanging guard', Hutton: 'Hanging guard' },
        type: 'parry', svgContent: parrySymbols.hanging, blocks: ['sabre_cut_5'], name: 'Hanging Guard',
        description: 'A diagonal protective guard that covers the head and upper body.'
    },
    {
        id: 'stay_action', sourceId: 'System',
        sourceNames: { System: 'Stay', Meyer: 'Bleiben' },
        type: 'stay', svgContent: '<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="2"><circle cx="20" cy="20" r="14"/><line x1="20" y1="12" x2="20" y2="28"/><line x1="12" y1="20" x2="28" y2="20"/></svg>',
        name: 'Stay',
        description: 'Maintain the current position or wait for an opportunity.'
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
