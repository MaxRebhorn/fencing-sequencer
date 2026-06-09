# Component Architecture

## Hierarchy

The codebase is **mid-migration** from a flat `elements/` directory to an atomic design pattern. Current state:

```
pages/
├── Home.tsx                    ← View router + source resolution + navbar
└── DebugSimulation.tsx         ← Standalone debug page

components/
├── AddMoveForm.tsx             ← Action create/edit form (full feature, not categorized)
│
├── organisms/                  ← Full-feature composite sections
│   ├── SequenceBuilder.tsx     ← Main sequence editor (all state, logic, orchestration)
│   ├── SequenceTree.tsx        ← Tree visualization with dnd-kit drag & drop
│   ├── MoveGrid.tsx            ← Grid of attack/parry action buttons
│   └── SourceSelector.tsx      ← Full source management UI
│
├── molecules/                  ← Composite UI with interaction logic
│   ├── ActionCard.tsx          ← Step display in sequence tree
│   ├── MoveButton.tsx          ← Action button with suggestion star badges
│   ├── ActorSelector.tsx       ← Player/Opponent toggle
│   ├── StartPositionsSelect.tsx← Guard position dropdowns
│   ├── BlockingInfoAlert.tsx   ← Parry-blocking info alert
│   └── ActionButtons.tsx       ← Save/Simulate action buttons
│
├── atoms/                      ← Smallest reusable UI primitives
│   ├── ActionIcon.tsx          ← SVG icon renderer
│   ├── MoveIcon.tsx            ← Alternative SVG renderer
│   ├── AddBranchButton.tsx     ← Feint branch creation button
│   ├── LanguageSwitcher.tsx    ← EN/DE toggle
│   ├── PositionBadge.tsx       ← Guard position display + override
│   └── SimulationPlaceholder.tsx← Empty-state for simulator
│
└── elements/                   ← LEGACY -- duplicates and not-yet-migrated
    ├── SimulationVisualizer.tsx← ★ Complex: image compositing + playback
    ├── SimpleSvgEditor.tsx     ← ★ Complex: interactive SVG drawing
    ├── Mainsequencerow.tsx     ← Main sequence row
    ├── BranchContainer.tsx     ← Feint branch container
    ├── BranchRow.tsx           ← Single branch row
    ├── Brancharrows.tsx        ← SVG arrow connectors
    ├── Sequencetree.tsx        ← Legacy tree (superseded by organisms/SequenceTree)
    ├── Sequencetypes.ts        ← Legacy type duplicates
    ├── Stepcard.tsx            ← Legacy (superseded by molecules/ActionCard)
    ├── MoveGrid.tsx            ← Legacy (superseded by organisms/MoveGrid)
    ├── MoveButton.tsx          ← Legacy (superseded by molecules/MoveButton)
    ├── SequenceStepsList.tsx   ← Legacy (unused)
    ├── Feintlabel.tsx          ← Legacy
    ├── Positionbadge.tsx       ← Legacy (superseded by atoms/PositionBadge)
    ├── ActorSelector.tsx       ← Legacy (superseded by molecules/ActorSelector)
    ├── ActionButtons.tsx       ← Legacy (superseded by molecules/ActionButtons)
    ├── StartPositionsSelect.tsx← Legacy (superseded by molecules/StartPositionsSelect)
    ├── BlockingInfoAlert.tsx   ← Legacy (superseded by molecules/BlockingInfoAlert)
    ├── SimulationPlaceholder.tsx← Legacy (superseded by atoms/SimulationPlaceholder)
    ├── Addbranchbutton.tsx     ← Legacy (superseded by atoms/AddBranchButton)
    └── LanguageSwitcher.tsx    ← Legacy (superseded by atoms/LanguageSwitcher)
```

## Active Imports (What Actually Runs)

`organisms/SequenceBuilder.tsx` imports:
- `molecules/StartPositionsSelect` (new)
- `molecules/BlockingInfoAlert` (new)
- `molecules/ActorSelector` (new)
- `organisms/SequenceTree` (new)
- `organisms/MoveGrid` (new)
- `molecules/ActionButtons` (new)
- `elements/SimulationVisualizer` (legacy -- not yet migrated)

`Home.tsx` imports:
- `AddMoveForm` (top-level)
- `organisms/SequenceBuilder` (new)
- `organisms/SourceSelector` (new)
- `atoms/LanguageSwitcher` (new)

## Key Components in Detail

### Home.tsx (`src/pages/Home.tsx`)

The single-page app container. Manages:
- **View routing** via `currentView` state: `'start' | 'addMove' | 'newSequence' | 'moveList' | 'editMove' | 'sources'`
- **Source-to-action resolution** via `useMemo` (see Data Flow doc)
- **Dynamic navbar** with scroll-based shrink/expand behavior
- **Floating bottom navbar** ("Landing Zone" pattern) that transitions between `fixed` and `relative` positioning based on whether the user has scrolled to the bottom

The navbar is a separate `Navbar` component within the same file, using `NavButton` sub-components. It renders as a pill-shaped floating element with green/blue neon glow effects.

### SequenceBuilder (`organisms/SequenceBuilder.tsx`)

The core feature component. Manages:
- **Steps** as `SequenceNode[]` state
- **Actor selection** with auto-switch mode
- **ActiveTarget** (main sequence vs feint branch editing)
- **Suggestions** via `sequenceLogic.analyzeAndSuggestMoves()`
- **Position tracking** via `sequenceLogic.computePositions()`
- **Save/Load** dialogs for sequence persistence
- **Simulation** integration with `SimulationVisualizer`
- **Test sequence generator** for debug mode

### SimulationVisualizer (`elements/SimulationVisualizer.tsx`)

The most complex visual component. Features:
- **Image layering system**: composites background, opponent POV, and player POV images
- **Two display modes**:
  - `dual` (default): Shows latest action for both fencers (cumulative)
  - `single`: Shows only the current step's actor
- **Auto-play** with configurable speed (0.5s-3s intervals)
- **Step navigation** with prev/next controls
- **Flattened tree traversal** for playback (walks branches depth-first)

### SimpleSvgEditor (`elements/SimpleSvgEditor.tsx`)

Interactive SVG symbol editor with:
- Draggable handle points for modifying attack paths and parry lines
- Real-time SVG preview
- Used by `AddMoveForm` for customizing action symbols

## Styling System

### Tailwind Custom Theme (`tailwind.config.js`)

Custom neon colors with matching glow shadows:
- `neon-green` / `neon-blue` / `neon-purple` / `neon-pink`
- `shadow-neon` / `shadow-neon-blue` / etc.

### Custom CSS Utilities (`src/index.css`)

```css
.neon-text        /* Glowing text effect */
.neon-border      /* Glowing border effect */
.card             /* Standard card style */
```

### Dynamic Navbar States

The navbar transitions between states:
- **Expanded**: Large icons (28-36px), labels visible, `px-8 py-4`
- **Shrunk**: Small icons (20-24px), labels hidden, `px-4 py-2`
- **Fixed**: When scrolled down, floats above content
- **Relative**: At page bottom, sits inline to avoid overlapping content

Shrink triggers vary by view:
- `addMove`: Always shrunk
- `newSequence`: Shrunk unless at bottom
- `moveList`: Shrunk when scrolled and not at bottom
- `start`/`sources`: Never shrunk

## i18n Integration

- Initialized in `src/i18n.ts` with browser language detection
- `fallbackLng: 'en'`
- Translation files: `src/locales/en/translation.json`, `src/locales/de/translation.json`
- Components use `useTranslation()` hook: `const { t } = useTranslation()`
- Keys follow namespaced patterns: `home.welcome`, `sources.title`, `header.title`
- German coverage is partial (fewer keys than English)
