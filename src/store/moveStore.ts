import {create} from 'zustand';
import {persist} from 'zustand/middleware';
import {Move} from '../types';

interface MoveStore {
    moves: Move[];
    addMove: (move: Move) => void;
    removeMove: (id: string) => void;
    updateMove: (id: string, move: Partial<Move>) => void;
    getMoveById: (id: string) => Move | undefined;
    getMovesByType: (type: 'attack' | 'parry' | 'feint') => Move[];
}

// Attack SVG Icons with ARROWS showing cut direction
const cutSymbols = {
    cut1: `<svg viewBox="0 0 100 100"><defs><marker id="arrow1" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><polygon points="0 0,8 4,0 8" fill="#ff4bd0"/></marker></defs><path d="M70 20 L30 70" stroke="#ff4bd0" stroke-width="4" marker-end="url(#arrow1)"/><circle cx="50" cy="50" r="35" fill="none" stroke="#ff4bd0" stroke-width="2"/><text x="50" y="55" font-size="20" text-anchor="middle" fill="#ff4bd0" font-weight="bold">1</text></svg>`,
    cut2: `<svg viewBox="0 0 100 100"><defs><marker id="arrow2" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><polygon points="0 0,8 4,0 8" fill="#ff4bd0"/></marker></defs><path d="M30 20 L70 70" stroke="#ff4bd0" stroke-width="4" marker-end="url(#arrow2)"/><circle cx="50" cy="50" r="35" fill="none" stroke="#ff4bd0" stroke-width="2"/><text x="50" y="55" font-size="20" text-anchor="middle" fill="#ff4bd0" font-weight="bold">2</text></svg>`,
    cut3: `<svg viewBox="0 0 100 100"><defs><marker id="arrow3" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><polygon points="0 0,8 4,0 8" fill="#ff4bd0"/></marker></defs><path d="M70 80 L30 30" stroke="#ff4bd0" stroke-width="4" marker-end="url(#arrow3)"/><circle cx="50" cy="50" r="35" fill="none" stroke="#ff4bd0" stroke-width="2"/><text x="50" y="55" font-size="20" text-anchor="middle" fill="#ff4bd0" font-weight="bold">3</text></svg>`,
    cut4: `<svg viewBox="0 0 100 100"><defs><marker id="arrow4" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><polygon points="0 0,8 4,0 8" fill="#ff4bd0"/></marker></defs><path d="M30 80 L70 30" stroke="#ff4bd0" stroke-width="4" marker-end="url(#arrow4)"/><circle cx="50" cy="50" r="35" fill="none" stroke="#ff4bd0" stroke-width="2"/><text x="50" y="55" font-size="20" text-anchor="middle" fill="#ff4bd0" font-weight="bold">4</text></svg>`,
    cut5: `<svg viewBox="0 0 100 100"><defs><marker id="arrow5" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><polygon points="0 0,8 4,0 8" fill="#ff4bd0"/></marker></defs><path d="M80 50 L20 50" stroke="#ff4bd0" stroke-width="4" marker-end="url(#arrow5)"/><circle cx="50" cy="50" r="35" fill="none" stroke="#ff4bd0" stroke-width="2"/><text x="50" y="55" font-size="20" text-anchor="middle" fill="#ff4bd0" font-weight="bold">5</text></svg>`,
    cut6: `<svg viewBox="0 0 100 100"><defs><marker id="arrow6" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><polygon points="0 0,8 4,0 8" fill="#ff4bd0"/></marker></defs><path d="M20 50 L80 50" stroke="#ff4bd0" stroke-width="4" marker-end="url(#arrow6)"/><circle cx="50" cy="50" r="35" fill="none" stroke="#ff4bd0" stroke-width="2"/><text x="50" y="55" font-size="20" text-anchor="middle" fill="#ff4bd0" font-weight="bold">6</text></svg>`,
    cut7: `<svg viewBox="0 0 100 100"><defs><marker id="arrow7" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><polygon points="0 0,8 4,0 8" fill="#ff4bd0"/></marker></defs><path d="M50 20 L50 80" stroke="#ff4bd0" stroke-width="4" marker-end="url(#arrow7)"/><circle cx="50" cy="50" r="35" fill="none" stroke="#ff4bd0" stroke-width="2"/><text x="50" y="55" font-size="20" text-anchor="middle" fill="#ff4bd0" font-weight="bold">7</text></svg>`,
    cut8: `<svg viewBox="0 0 100 100"><defs><marker id="arrow8" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><polygon points="0 0,8 4,0 8" fill="#ff4bd0"/></marker></defs><path d="M50 80 L50 20" stroke="#ff4bd0" stroke-width="4" marker-end="url(#arrow8)"/><circle cx="50" cy="50" r="35" fill="none" stroke="#ff4bd0" stroke-width="2"/><text x="50" y="55" font-size="20" text-anchor="middle" fill="#ff4bd0" font-weight="bold">8</text></svg>`,
};

// Parry SVG Icons – blade positions showing where they block
const parrySymbols = {
    prime: `<svg viewBox="0 0 100 100">
     <g>
  <circle id="svg_1" stroke-width="2" stroke="#00ff9d" fill="none" r="30" cy="50" cx="50"/>
  <line transform="rotate(53.9242 14.1772 65.0633)" stroke="#00ff9d" id="svg_2" stroke-width="5" y2="77.62153" x2="31.5768" y1="52.50506" x1="-3.22237"/>
  <circle stroke="null" id="svg_3" fill="#00ff9d" r="4.87342" cy="43.03798" cx="14.3038"/>
  <text id="svg_4" fill="#00ff9d" text-anchor="middle" font-size="18" y="55" x="50">1</text>
 </g>
  </svg>`,

    seconde: `<svg viewBox="0 0 100 100">
 <g>
  <circle id="svg_1" stroke-width="2" stroke="#00ff9d" fill="none" r="30" cy="50" cx="50"/>
  <line transform="rotate(53.9242 89.3674 65.0633)" stroke="#00ff9d" id="svg_2" stroke-width="5" y2="77.62153" x2="106.76667" y1="52.50506" x1="71.96751"/>
  <circle stroke="null" id="svg_3" fill="#00ff9d" r="4.87342" cy="43.03798" cx="89.49367"/>
  <text style="cursor: text;" id="svg_4" fill="#00ff9d" text-anchor="middle" font-size="18" y="55" x="50">2</text>
 </g>
  </svg>`,

    tierce: `<svg viewBox="0 0 100 100">
   <g>
 
  <circle id="svg_1" stroke-width="2" stroke="#00ff9d" fill="none" r="30" cy="50" cx="50"/>
  <line transform="rotate(53.9242 89.3674 40.5062)" stroke="#00ff9d" id="svg_2" stroke-width="5" y2="53.06456" x2="106.76667" y1="27.9481" x1="71.96751"/>
  <circle stroke="null" id="svg_3" fill="#00ff9d" r="4.87342" cy="61.01266" cx="89.49367"/>
  <text style="cursor: text;" id="svg_4" fill="#00ff9d" text-anchor="middle" font-size="18" y="55" x="50">3</text>
 </g>
  </svg>`,

    quarte: `<svg viewBox="0 0 100 100">
    <g>
  <circle id="svg_1" stroke-width="2" stroke="#00ff9d" fill="none" r="30" cy="50" cx="50"/>
  <line transform="rotate(53.9242 11.6456 40.5062)" stroke="#00ff9d" id="svg_2" stroke-width="5" y2="53.06456" x2="29.04515" y1="27.9481" x1="-5.75401"/>
  <circle stroke="null" id="svg_3" fill="#00ff9d" r="4.87342" cy="61.01266" cx="11.77215"/>
  <text style="cursor: move;" id="svg_4" fill="#00ff9d" text-anchor="middle" font-size="18" y="55" x="50">4</text>
 </g>
  </svg>`,

    quinte: `<svg viewBox="0 0 100 100">
     <g>
  <circle id="svg_1" stroke-width="2" stroke="#00ff9d" fill="none" r="30" cy="50" cx="50"/>
  <line transform="rotate(144.813 46.8354 11.8987)" stroke="#00ff9d" id="svg_2" stroke-width="5" y2="24.45697" x2="64.23502" y1="-0.65949" x1="29.43586"/>
  <path id="svg_3" d="m71.77215,16.77215c-2.6925,0 -4.87342,-2.18092 -4.87342,-4.87342c0,-2.6925 2.18092,-4.87342 4.87342,-4.87342c2.6925,0 4.87342,2.18092 4.87342,4.87342c0,2.6925 -2.18092,4.87342 -4.87342,4.87342z" opacity="undefined" stroke="null" fill="#00ff9d"/>
  <text id="svg_4" fill="#00ff9d" text-anchor="middle" font-size="18" y="55" x="50">5</text>
 </g>
  </svg>`,

    sixte: `<svg viewBox="0 0 100 100">
     <g>
  <circle id="svg_1" stroke-width="2" stroke="#00ff9d" fill="none" r="30" cy="50" cx="50"/>
  <line transform="rotate(144.813 52.4051 11.8987)" stroke="#00ff9d" id="svg_2" stroke-width="5" y2="24.45697" x2="69.80464" y1="-0.65949" x1="35.00548"/>
  <path id="svg_3" d="m30.50633,16.77215c-2.6925,0 -4.87342,-2.18092 -4.87342,-4.87342c0,-2.6925 2.18092,-4.87342 4.87342,-4.87342c2.6925,0 4.87342,2.18092 4.87342,4.87342c0,2.6925 -2.18092,4.87342 -4.87342,4.87342z" opacity="undefined" stroke="null" fill="#00ff9d"/>
  <text style="cursor: text;" id="svg_4" fill="#00ff9d" text-anchor="middle" font-size="18" y="55" x="50">6</text>
 </g>
  </svg>`,

    septime: `<svg viewBox="0 0 100 100">
     <g>
  <circle id="svg_1" stroke-width="2" stroke="#00ff9d" fill="none" r="30" cy="50" cx="50"/>
  <line stroke="#00ff9d" transform="rotate(146.997 86.1364 34.3182)" id="svg_2" stroke-width="5" y2="14.31818" x2="86.13637" y1="54.31818" x1="86.13637"/>
  <circle id="svg_3" fill="#00ff9d" r="5" cy="14.54546" cx="72.5"/>
  <text id="svg_4" fill="#00ff9d" text-anchor="middle" font-size="18" y="55" x="50">7</text>
 </g>
  </svg>`,

    longTierce: `<svg viewBox="0 0 100 100">
    <circle cx="50" cy="50" r="30" fill="none" stroke="#00ff9d" stroke-width="2"/>
    <line x1="80" y1="20" x2="80" y2="80" stroke="#00ff9d" stroke-width="5" stroke-dasharray="4 4"/>
    <circle cx="80" cy="80" r="5" fill="#00ff9d"/>
    <text x="50" y="55" font-size="14" text-anchor="middle" fill="#00ff9d">L3</text>
  </svg>`,

    longSickle: `<svg viewBox="0 0 100 100">
  <g>
  <circle id="svg_1" stroke-width="2" stroke="#00ff9d" fill="none" r="30" cy="49.25926" cx="48.51852"/>
  <path transform="rotate(28.3879 64.4647 53.9248)" stroke="#00ff9d" id="svg_2" d="m64.4647,27.60278l0,52.64403" opacity="undefined" stroke-dasharray="4 4" stroke-width="5"/>
  <circle id="svg_3" fill="#00ff9d" r="5" cy="26.41975" cx="79.75309"/>
  <text style="cursor: move;" id="svg_4" fill="#00ff9d" text-anchor="middle" font-size="14" y="55" x="50">L2</text>
 </g>
  </svg>`,
};

const parryBlocks: Record<string, string[]> = {
    prime: ['cut4','cut8'],        // tief innen – blockiert aufwärts innen und vertikale aufwärts
    seconde: ['cut3','cut7'],      // tief außen – blockiert aufwärts außen und vertikale abwärts
    tierce: ['cut6'],              // horizontal innen (links → rechts)
    quarte: ['cut2','cut6'],       // hoch innen – blockiert diagonal oben links → unten rechts + horizontal innen
    quinte: ['cut1','cut2','cut7'],// hoch zentral / über Kopf – blockiert diagonale oben + vertikal abwärts
    sixte: ['cut1','cut5','cut7'],        // hoch außen – blockiert diagonale oben rechts + horizontale außen
    septime: ['cut4','cut5'],      // tief innen außen – blockiert aufwärts innen + horizontal außen
    longTierce: ['cut1','cut2','cut3','cut4','cut5','cut6','cut7','cut8'],
    longSickle: ['cut1','cut2','cut3','cut4','cut5','cut6','cut7','cut8'],
};

// All 8 cuts (attacks)
// fastetst and slowest paries describe the easiest parries and hardest parries to switch to if one is parried after making one of these cuts
const attackMoves: Move[] = [
    {
        id: 'cut1',
        name: 'Cut 1 - Downward Diagonal Outside',
        type: 'attack',
        svgContent: cutSymbols.cut1,
        blocks: [],
        targetZone: 'high_outside',
        description: '↓↘︎ to cheek',
        fastestParries: ['sixte'],          // 1.–4. Parade nach Ease
        slowestParries: ['prime', 'septime']  // am längsten/unbequem
    },
    {
        id: 'cut2',
        name: 'Cut 2 - Downward Diagonal Inside',
        type: 'attack',
        svgContent: cutSymbols.cut2,
        blocks: [],
        targetZone: 'high_inside',
        description: '↓↙︎ to cheek',
        fastestParries: ['quinte'],
        slowestParries: ['seconde']
    },
    {
        id: 'cut3',
        name: 'Cut 3 - Upward Diagonal Outside',
        type: 'attack',
        svgContent: cutSymbols.cut3,
        blocks: [],
        targetZone: 'low_outside',
        description: '↑↖︎ to knee',
        fastestParries: ['Septime', 'Seconde'],
        slowestParries: ['Quarte', 'Quinte']
    },
    {
        id: 'cut4',
        name: 'Cut 4 - Upward Diagonal Inside',
        type: 'attack',
        svgContent: cutSymbols.cut4,
        blocks: [],
        targetZone: 'low_inside',
        description: '↑↗︎ to knee',
        fastestParries: ['Prime', 'Seconde'],
        slowestParries: ['Quarte', 'Quinte', 'Tierce']
    },
    {
        id: 'cut5',
        name: 'Cut 5 - Horizontal Outside',
        type: 'attack',
        svgContent: cutSymbols.cut5,
        blocks: [],
        targetZone: 'mid_outside',
        description: '→ to belly',
        fastestParries: ['Sixte', 'Septime'],
        slowestParries: ['Prime', 'Seconde']
    },
    {
        id: 'cut6',
        name: 'Cut 6 - Horizontal Inside',
        type: 'attack',
        svgContent: cutSymbols.cut6,
        blocks: [],
        targetZone: 'mid_inside',
        description: '← to belly',
        fastestParries: ['Sixte', 'Quarte'],
        slowestParries: ['Quinte', 'Septime']
    },
    {
        id: 'cut7',
        name: 'Cut 7 - Vertical Down',
        type: 'attack',
        svgContent: cutSymbols.cut7,
        blocks: [],
        targetZone: 'high_center',
        description: '↓ to head',
        fastestParries: ['Septime', 'Quinte'],
        slowestParries: []  // keine speziellen Hindernisse genannt
    },
    {
        id: 'cut8',
        name: 'Cut 8 - Vertical Up',
        type: 'attack',
        svgContent: cutSymbols.cut8,
        blocks: [],
        targetZone: 'low_center',
        description: '↑ to body',
        fastestParries: ['Prime', 'Seconde'],
        slowestParries: []
    },
];

// Parry moves
// easiestAttacks = gerankt nach Geschwindigkeit / Einfachheit aus dieser Parade
// Reihenfolge ist relevant für Parsing/Logik: 1 = easiest, 2 = next easiest, usw.
const parryMoves: Move[] = [
    {
        id: 'prime', name: 'Parade 1 (Prime)', type: 'parry',
        svgContent: parrySymbols.prime,
        blocks: parryBlocks.prime, targetZone: 'low_inside',
        description: 'Low inside – blocks rising cuts inside + vertical up',
        easiestAttacks: ['cut4','cut2']
    },
    {
        id: 'seconde', name: 'Parade 2 (Seconde)', type: 'parry',
        svgContent: parrySymbols.seconde,
        blocks: parryBlocks.seconde, targetZone: 'low_outside',
        description: 'Low outside – blocks rising cuts outside + vertical down',
        easiestAttacks: ['cut8','cut4']
    },
    {
        id: 'tierce', name: 'Parade 3 (Tierce)', type: 'parry',
        svgContent: parrySymbols.tierce,
        blocks: parryBlocks.tierce, targetZone: 'mid_inside',
        description: 'Horizontal inside',
        easiestAttacks: ['cut1','cut5','cut2']
    },
    {
        id: 'quarte', name: 'Parade 4 (Quarte)', type: 'parry',
        svgContent: parrySymbols.quarte,
        blocks: parryBlocks.quarte, targetZone: 'high_inside',
        description: 'High inside – diagonal cuts',
        easiestAttacks: ['cut2','cut4','cut6']
    },
    {
        id: 'quinte', name: 'Parade 5 (Quinte)', type: 'parry',
        svgContent: parrySymbols.quinte,
        blocks: parryBlocks.quinte, targetZone: 'high_center',
        description: 'High central / overhead – diagonal + vertical',
        easiestAttacks: ['cut1','cut7','cut5','cut2']
    },
    {
        id: 'sixte', name: 'Parade 6 (Sixte)', type: 'parry',
        svgContent: parrySymbols.sixte,
        blocks: parryBlocks.sixte, targetZone: 'high_outside',
        description: 'High outside – diagonal + horizontal',
        easiestAttacks: ['cut2','cut6','cut7','cut4']
    },
    {
        id: 'septime', name: 'Parade 7 (Septime)', type: 'parry',
        svgContent: parrySymbols.septime,
        blocks: parryBlocks.septime, targetZone: 'low_inside',
        description: 'Low inside – rising + horizontal',
        easiestAttacks: ['cut7','cut2','cut1','cut3']
    },
    {
        id: 'longTierce', name: 'Long Guard (Tierce)', type: 'parry',
        svgContent: parrySymbols.longTierce,
        blocks: parryBlocks.longTierce, targetZone: 'all',
        description: 'Extended high outside guard – blocks all directions',
        isLongGuard: true,
        easiestAttacks: [] // none, because you cannot attack from long guard
    },
    {
        id: 'longSickle', name: 'Long Guard (Sickle)', type: 'parry',
        svgContent: parrySymbols.longSickle,
        blocks: parryBlocks.longSickle, targetZone: 'all',
        description: 'Extended low inside guard – blocks all directions',
        isLongGuard: true,
        easiestAttacks: []
    },
];

export const useMoveStore = create<MoveStore>()(
    persist(
        (set, get) => ({
            moves: [...attackMoves, ...parryMoves],
            addMove: (move) => set((state) => ({ moves: [...state.moves, move] })),
            removeMove: (id) => set((state) => ({ moves: state.moves.filter((m) => m.id !== id) })),
            updateMove: (id, updatedMove) => set((state) => ({
                moves: state.moves.map((m) => (m.id === id ? { ...m, ...updatedMove } : m)),
            })),
            getMoveById: (id) => get().moves.find((m) => m.id === id),
            getMovesByType: (type) => get().moves.filter((m) => m.type === type),
        }),
        { name: 'move-storage' }
    )
);