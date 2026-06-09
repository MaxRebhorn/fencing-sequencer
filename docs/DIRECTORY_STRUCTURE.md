# Directory Structure

```
fencing/
├── .env                              # VITE_DEBUG_MODE=true
├── .github/workflows/ci.yml          # CI: lint → test → build on push/PR
├── AI-Reference-Code/                # Placeholder for AI-generated code reference
├── dist/                             # Vite production build output (gh-pages target)
├── docs/                             # Architecture documentation
├── public/                           # Static assets served at root
│   ├── background.avif               # Background image for simulation visualizer
│   ├── favicon.svg                   # Browser tab icon
│   ├── icons.svg                     # Icon spritesheet (Vite boilerplate)
│   └── actions/                      # Reference images organized by perspective
│       ├── simulation_guide.svg      # Visual guide for simulation
│       ├── pov/                      # First-person point-of-view images
│       │   ├── attack/
│       │   │   ├── cut_1.svg
│       │   │   ├── cut_2.svg
│       │   │   ├── cut_3.svg
│       │   │   ├── cut_4.svg
│       │   │   └── cut_5.svg
│       │   └── parry/
│       │       ├── parry_1.svg through parry_7.svg
│       └── opponent/                 # Third-person opponent perspective images
│           └── parry/
│               ├── parry_1.svg through parry_5.svg
├── src/
│   ├── main.jsx                      # React entry point, mounts <App /> at #root
│   ├── App.jsx                       # Top-level: Home (default) vs DebugSimulation
│   ├── App.css                       # Legacy Vite boilerplate styles (mostly unused)
│   ├── index.css                     # Tailwind directives + custom .neon-* classes
│   ├── i18n.ts                       # i18next init (EN fallback, browser detection)
│   ├── types.ts                      # All shared TypeScript interfaces and types
│   ├── assets/                       # Vite/React boilerplate SVGs (unused)
│   ├── locales/                      # i18n translation files
│   │   ├── en/translation.json       # English strings (full coverage)
│   │   └── de/translation.json       # German strings (partial coverage)
│   ├── store/                        # Zustand state management
│   │   ├── moveStore.ts              # Action repository (CRUD + 17 seed actions)
│   │   ├── sourceStore.ts            # Historical source management (7 seed sources)
│   │   └── sequenceStore.ts          # Saved sequence persistence
│   ├── utils/                        # Pure logic, no React dependencies
│   │   ├── sequenceLogic.ts          # Position tracking, recommendations, branching
│   │   ├── sequenceLogic.test.ts     # Unit tests for core logic
│   │   └── githubContributions.ts    # Markdown generation + GitHub issue URL builder
│   ├── pages/                        # Top-level page components
│   │   ├── Home.tsx                  # Main SPA: view router + navbar + source resolution
│   │   └── DebugSimulation.tsx       # Debug page for image layer prototyping
│   └── components/                   # UI component hierarchy
│       ├── AddMoveForm.tsx           # Form for creating/editing actions
│       ├── SequenceBuilder.tsx       # LEGACY -- replaced by organisms/SequenceBuilder.tsx
│       ├── atoms/                    # Smallest reusable UI components
│       │   ├── ActionIcon.tsx        # SVG icon renderer for actions
│       │   ├── MoveIcon.tsx          # Alternative SVG icon renderer (simpler)
│       │   ├── AddBranchButton.tsx   # Button to add feint reaction branches
│       │   ├── LanguageSwitcher.tsx  # EN/DE language toggle
│       │   ├── PositionBadge.tsx     # Guard position display with override picker
│       │   └── SimulationPlaceholder.tsx  # Empty-state for simulation
│       ├── molecules/                # Composite components (atoms + interaction logic)
│       │   ├── ActionCard.tsx        # Step card in sequence tree (positions, feint, icons)
│       │   ├── MoveButton.tsx        # Action button with suggestion ranking badges
│       │   ├── ActorSelector.tsx     # Player/Opponent toggle segmented control
│       │   ├── StartPositionsSelect.tsx  # Dropdowns for starting guard positions
│       │   ├── BlockingInfoAlert.tsx # Alert showing which parries block an attack
│       │   └── ActionButtons.tsx     # Save/Simulate bottom action buttons
│       ├── organisms/                # Full-feature composite sections
│       │   ├── SequenceBuilder.tsx   # Main sequence editor (all state + logic)
│       │   ├── SequenceTree.tsx      # Tree visualization with SVG arrows
│       │   ├── MoveGrid.tsx          # Grid of attack/parry action buttons
│       │   ├── SourceSelector.tsx    # Source management (CRUD, assignment, naming)
│       │   └── ContributionTests.test.tsx  # Integration tests for contribution pipeline
│       └── elements/                 # LEGACY -- older components, partially migrated
│           ├── SimulationVisualizer.tsx   # Visual simulation with image layering + playback
│           ├── SimpleSvgEditor.tsx        # Interactive SVG symbol editor (drag handles)
│           ├── Mainsequencerow.tsx        # Main sequence row rendering
│           ├── BranchContainer.tsx        # Container for feint branch rows
│           ├── BranchRow.tsx              # Single feint reaction branch row
│           ├── Brancharrows.tsx           # Arrow rendering between steps
│           ├── Sequencetree.tsx           # Legacy tree visualizer
│           ├── Sequencetypes.ts           # Legacy duplicate type definitions
│           ├── Stepcard.tsx               # Legacy step card
│           ├── MoveGrid.tsx               # Legacy move grid
│           ├── MoveButton.tsx             # Legacy move button
│           ├── SequenceStepsList.tsx      # Legacy steps list
│           ├── Feintlabel.tsx             # Legacy feint label
│           ├── Positionbadge.tsx          # Legacy position badge
│           ├── ActorSelector.tsx          # Legacy actor selector
│           ├── ActionButtons.tsx          # Legacy action buttons
│           ├── StartPositionsSelect.tsx   # Legacy start positions
│           ├── BlockingInfoAlert.tsx      # Legacy blocking info
│           ├── SimulationPlaceholder.tsx  # Legacy placeholder
│           ├── Addbranchbutton.tsx        # Legacy add branch button
│           └── LanguageSwitcher.tsx       # Legacy language switcher
├── index.html                        # Vite entry HTML
├── package.json                      # Dependencies and scripts
├── vite.config.js                    # Vite config (React plugin, base: './')
├── tailwind.config.js                # Custom neon colors + glow shadows
├── postcss.config.js                 # Tailwind + autoprefixer
├── eslint.config.js                  # Flat ESLint 9 config
└── README.md                         # User-facing documentation
```

## Key Observations

### Active vs Legacy Components

The `elements/` directory contains an older generation of components from before the atomic design migration. The organism `SequenceBuilder.tsx` imports from both `molecules/` and `elements/`:

- **From molecules/ (new):** `StartPositionsSelect`, `BlockingInfoAlert`, `ActorSelector`, `ActionButtons`
- **From elements/ (legacy):** `SimulationVisualizer`

The top-level `src/components/SequenceBuilder.tsx` is a legacy duplicate that uses only `elements/` imports and is **not used** in the current app.

### Components Only in elements/ (Not Yet Migrated)

These have no counterpart in `atoms/`, `molecules/`, or `organisms/`:

- `SimulationVisualizer.tsx` -- Complex visual simulation system
- `SimpleSvgEditor.tsx` -- Interactive SVG drawing editor
- `Mainsequencerow.tsx` -- Main sequence row rendering
- `BranchContainer.tsx` -- Feint branch container
- `BranchRow.tsx` -- Single feint branch row
- `Brancharrows.tsx` -- SVG arrow connectors
