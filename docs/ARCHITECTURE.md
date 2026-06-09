# Fencing Sequencer -- Architecture

## Overview

The Fencing Sequencer is a single-page React application for exploring HEMA (Historical European Martial Arts) fencing sequences. Users build sequences of attacks, parries, and feints between a fencer and an opponent, with a tactical recommendation engine suggesting realistic follow-up actions based on historical fencing theory.

**Live demo:** [maxrebhorn.github.io/fencing-sequencer](https://maxrebhorn.github.io/fencing-sequencer/)

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Bundler | Vite 8 | Dev server, HMR, production builds |
| UI | React 19 | Component-based UI |
| Language | TypeScript | Type safety across the codebase |
| State | Zustand 5 + `persist` middleware | Client-side state with localStorage persistence |
| Styling | Tailwind CSS 3.4 | Utility-first CSS with custom neon theme |
| Icons | Lucide React | SVG icon library |
| Animation | Framer Motion 12 | Component transitions and micro-interactions |
| Drag & Drop | dnd-kit 6/10 | Reorderable lists in the sequence tree |
| i18n | i18next + react-i18next | English/German multi-language support |
| IDs | uuid 13 | Unique ID generation |
| Testing | Vitest 4 + React Testing Library | Unit and integration tests |
| Linting | ESLint 9 (flat config) | Code quality |
| CI/CD | GitHub Actions | Lint → Test → Build on push/PR |
| Deployment | gh-pages | Deploys `dist/` to `live` branch |

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      App.jsx                             │
│  ┌──────────────┐          ┌──────────────────────────┐ │
│  │    Home.tsx   │          │  DebugSimulation.tsx     │ │
│  │  (default)    │          │  (/debug, debug mode)    │ │
│  │              │          │                          │ │
│  │  View-based  │          │  Image layer prototyping │ │
│  │  routing:    │          │  for simulation system   │ │
│  │  start       │          └──────────────────────────┘ │
│  │  addMove     │                                       │
│  │  newSequence │                                       │
│  │  moveList    │                                       │
│  │  editMove    │                                       │
│  │  sources     │                                       │
│  └──────┬───────┘                                       │
└─────────┼──────────────────────────────────────────────┘
          │
    ┌─────┴──────────────────────────┐
    │        Zustand Stores           │
    │  ┌──────────┐ ┌──────────────┐ │
    │  │moveStore │ │sourceStore   │ │
    │  │ (actions)│ │ (sources)    │ │
    │  └──────────┘ └──────────────┘ │
    │  ┌──────────────┐              │
    │  │sequenceStore │              │
    │  │ (saved seqs) │              │
    │  └──────────────┘              │
    └────────────────────────────────┘
          │
    ┌─────┴──────────────────────────┐
    │       Business Logic            │
    │  ┌────────────────────────────┐ │
    │  │ sequenceLogic.ts           │ │
    │  │ - Position tracking        │ │
    │  │ - Actor inference          │ │
    │  │ - Recommendation engine    │ │
    │  │ - Feint branching          │ │
    │  └────────────────────────────┘ │
    │  ┌────────────────────────────┐ │
    │  │ githubContributions.ts     │ │
    │  │ - Markdown generation      │ │
    │  │ - GitHub issue URL builder │ │
    │  └────────────────────────────┘ │
    └────────────────────────────────┘
          │
    ┌─────┴──────────────────────────┐
    │     Component Hierarchy         │
    │  organisms/  (full features)    │
    │  molecules/  (composite UI)     │
    │  atoms/      (base UI units)    │
    │  elements/   (legacy, mid-refactor) │
    └────────────────────────────────┘
```

## Core Design Decisions

### 1. No Framework Router

View switching is entirely state-based via a `View` union type in `Home.tsx`. There are no URL-driven routes except the debug page (accessed via `/debug` pathname check). This keeps the app simple as a single-page tool but means navigation state is lost on refresh.

### 2. localStorage-First Persistence

All three Zustand stores use the `persist` middleware to write to localStorage. This means:
- User-created actions, sources, and sequences survive browser sessions
- No backend or database required
- Data is siloed to the user's browser
- The `localStorage` keys are: `action-storage`, `source-storage`, `sequence-storage`

### 3. Multi-Source Nomenclature

Actions have a `sourceNames: Record<string, string>` field mapping different historical sources to their names for the technique. The active source controls which name is displayed. This lets the same technical action (`sabre_cut_1`) render as "Cut 1" (Angelo), "Direct cut to head (right)" (Radaelli), or "Wrath Cut (Zornhau)" (Meyer) depending on context.

### 4. SVG-Based Symbol System

Every fencing action stores its visual representation as raw SVG markup in `Action.svgContent`. The `SimpleSvgEditor` (an interactive editor with draggable handles) allows users to customize these symbols. SVGs are rendered via `dangerouslySetInnerHTML`.

### 5. Tactical Recommendation Engine

The `sequenceLogic.ts` module implements a scoring-based recommendation system that suggests technically sound follow-up actions based on:
- Blocking relationships (which parries block which attacks)
- Speed rankings (fastest/slowest parries for each attack)
- Ease of attack (easiest ripostes from a given parry position)
- Proximity bonus (prefer parries close to current guard position)
- Riposte hardness scoring (slowest minus fastest parry counts)

### 6. Feint Branching System

Actions can be marked as feints, creating branching "reaction" paths. Each branch has a `reactionType` (`no-reaction` or `attackInTempo`) and its own continuation steps. The `ActiveTarget` discriminated union (`{ type: 'main' }` | `{ type: 'branch', feintNodeId, branchId }`) tracks which context is currently being edited.

### 7. Hybrid Component Migration

The codebase is mid-refactor from a flat `elements/` structure to an atomic design hierarchy (`atoms/` → `molecules/` → `organisms/`). Some critical components (`SimulationVisualizer`, `SimpleSvgEditor`, tree-related components) still live in `elements/`. Duplicate components exist between the old and new structures.

## Key Files

| File | Purpose |
|---|---|
| `src/types.ts` | All shared TypeScript interfaces |
| `src/App.jsx` | Top-level component with debug routing |
| `src/pages/Home.tsx` | Main SPA container with view router + dynamic navbar |
| `src/store/moveStore.ts` | Action CRUD + 17 seed actions with SVG symbols |
| `src/store/sourceStore.ts` | Source CRUD + 7 seed historical sources |
| `src/store/sequenceStore.ts` | Saved sequence persistence |
| `src/utils/sequenceLogic.ts` | Position inference, actor switching, recommendations |
| `src/utils/githubContributions.ts` | Contribution pipeline (Markdown + GitHub issue URLs) |
| `src/i18n.ts` | i18next initialization (EN + DE) |
| `src/components/organisms/SequenceBuilder.tsx` | Main sequence editor (the core feature) |
| `src/components/elements/SimulationVisualizer.tsx` | Visual simulation with image compositing + playback |
