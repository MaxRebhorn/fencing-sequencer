# Data Flow & State Management

## Store Architecture

All state is managed by three Zustand stores, each persisted to `localStorage` via the `persist` middleware.

```
┌──────────────────────────────────────────────────────────┐
│                     localStorage                         │
│  ┌─────────────────┐ ┌──────────────┐ ┌───────────────┐ │
│  │ action-storage   │ │source-storage│ │sequence-storage│ │
│  └────────┬────────┘ └──────┬───────┘ └───────┬───────┘ │
└───────────┼─────────────────┼─────────────────┼─────────┘
            │                 │                 │
    ┌───────┴───────┐ ┌───────┴───────┐ ┌───────┴───────┐
    │  moveStore     │ │ sourceStore   │ │sequenceStore  │
    │                │ │               │ │               │
    │ actions:       │ │ sources:      │ │ sequences:    │
    │   Action[]     │ │   Source[]    │ │   Sequence[]  │
    │                │ │               │ │               │
    │ addAction()    │ │ activeSourceId│ │ saveSequence()│
    │ removeAction() │ │ additionalIds │ │ deleteSeq()   │
    │ updateAction() │ │ addSource()   │ │ getById()     │
    │ getById()      │ │ updateSource()│ │               │
    │ getByType()    │ │ removeSource()│ │               │
    └───────────────┘ └───────────────┘ └───────────────┘
```

## moveStore.ts -- Action Repository

**Purpose:** Stores all fencing actions (attacks, parries, feints, stay).

**Seed data:** 17 predefined actions with full multi-source naming and SVG symbols:
- 9 attacks (cuts 1-7, molinello, thrust)
- 7 standard parries + 1 hanging guard
- 1 stay action

**Key interface:**
```typescript
interface MoveStore {
    actions: Action[];
    addAction: (action: Action) => void;
    removeAction: (id: string) => void;
    updateAction: (id: string, action: Partial<Action>) => void;
    getActionById: (id: string) => Action | undefined;
    getActionsByType: (type: ActionType) => Action[];
}
```

## sourceStore.ts -- Historical Source Management

**Purpose:** Tracks historical fencing sources and which actions belong to each.

**Seed data:** 7 predefined sources (Meyer, Angelo, Waite, Radaelli, Barbasetti, Hutton, Roworth) with `actionIds` arrays defining each source's curriculum.

**Active source defaults to `Barbasetti`.**

**Key interface:**
```typescript
interface SourceStore {
    availableSources: Source[];
    activeSourceId: string;          // Primary source for nomenclature
    additionalSourceIds: string[];   // Bundled sources to include
    setActiveSourceId: (id: string) => void;
    toggleAdditionalSourceId: (id: string) => void;
    addSource: (source: Source) => void;
    updateSource: (id: string, source: Partial<Source>) => void;
    removeSource: (id: string) => void;
}
```

## sequenceStore.ts -- Saved Sequences

**Purpose:** Persists complete sequences with steps, positions, and timestamps.

**Upsert behavior:** `saveSequence()` creates a new entry or updates an existing one if the same ID is provided.

```typescript
interface SequenceStore {
    savedSequences: SavedSequence[];
    saveSequence: (data, id?) => void;  // Upsert
    deleteSequence: (id: string) => void;
    getSequenceById: (id: string) => SavedSequence | undefined;
}
```

## Source-to-Action Resolution Pipeline

This is the core data derivation that determines which actions are visible at any time. It runs in `Home.tsx` as a `useMemo`:

```
activeSourceId ─────────┐
additionalSourceIds ────┤
                         ▼
            Filter availableSources by IDs
                         │
                         ▼
            Collect all actionIds from filtered sources
                         │
                         ▼
            Filter actions where:
              - action.id is in collected IDs
              - OR action.sourceId === 'Custom'
                         │
                         ▼
            Resolve display name:
              action.sourceNames[activeSourceId]
              || action.sourceNames[action.sourceId]
              || action.name
                         │
                         ▼
                   currentActions[]
```

This means:
- Selecting different primary sources changes action **names** (nomenclature)
- Toggling additional sources changes which actions are **visible** (curriculum)
- Custom user-created actions always appear regardless of source selection

## Recommendation Engine Data Flow

The tactical suggestion system in `sequenceLogic.ts`:

```
Steps[] + actor + actions[] + positionMap + start positions
                    │
                    ▼
         analyzeAndSuggestMoves()
                    │
        ┌───────────┼───────────────┐
        ▼           ▼               ▼
   Empty seq?   Last oppo      Last oppo
   → easiest    was attack?    was parry?
   attacks      → rank         → unblocked
   from guard   blocking       attacks,
                parries by     prioritize
                speed +        easiest
                proximity      ripostes
                    │
                    ▼
           suggestedActionIds: string[]
                    │
                    ▼
        MoveButton shows star ratings
        (1★, 2★, 3★ based on rank position)
```

### Recommendation Scoring

**After an opponent attack** (defensive situation):
- Parries that block the attack are scored by:
  - Speed bonus (`+10 - index` in fastestParries list)
  - Difficulty penalty (`-5` if in slowestParries list)
  - Proximity bonus (`+8` if the parry matches current guard position)

**After a successful parry** (riposte situation):
- All attacks are scored by "hardness":
  - `hardnessScore = (slowestParryCount - fastestParryCount) * 3`
  - `speedBonus` from the parry's `easiestAttacks` ranking
  - Higher score = harder for opponent to defend

## Feint Branching Flow

```
1. User marks step as feint (toggleFeint)
   → step.isFeint = true

2. User adds branch reaction (no-reaction | attackInTempo)
   → new FeintBranch added to step.branches[]

3. ActiveTarget switches to branch context
   → { type: 'branch', feintNodeId, branchId }

4. Subsequent actions go into branch.steps[]
   → Suggestions adapt to branch context

5. resolveContextSteps() merges:
   main steps up to feint + branch steps
```

## Position Tracking

`computePositions()` walks through the sequence step by step:

- **Parry:** Sets position to the parry name (e.g., "Tierce")
- **Attack:** If the next step is a blocking parry → reverts to previous guard. Otherwise → moves to the fastest parry
- **PositionOverride:** Manual overrides take precedence over inferred positions
- Result: `Map<stepId, { player: string, opponent: string }>`

## Actor Auto-Switch Logic

`inferNextActor()` determines whose turn it is:

| Last action | Next actor | Hint |
|---|---|---|
| Attack (not feint) | Opposite actor | "Parade oder Angriff ins Tempo" |
| Feint | Same actor | "Echter Angriff" |
| Parry | Same actor | "Riposte (Angriff)" |
| Other | Same actor | (none) |

## Contribution Pipeline

Users can submit actions or sources to the global library via GitHub Issues:

```
Action/Source object + comment (min 10 chars)
    │
    ▼
actionToMarkdown() / sourceToMarkdown()
    → YAML frontmatter + JSON data block
    │
    ▼
getGithubIssueUrl()
    → Pre-filled GitHub Issue URL for MaxRebhorn/fencing-sequencer
```
