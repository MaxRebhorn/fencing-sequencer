

# Fencing Sequencer

This is an early prototype web tool for experimenting with HEMA fencing sequences. It is a fast, experimental implementation and far from finished — more a proof of concept than a polished app.

Live demo: [https://maxrebhorn.github.io/fencing-sequencer/](https://maxrebhorn.github.io/fencing-sequencer/)

## What It Is

The Fencing Sequencer allows you to:

* visualize sequences of cuts and parries using simple icons,
* explore suggested counter-actions based on enemy moves and your own parries,
* see recommendations for attacks where your opponent is slowest to defend and you can act quickest.

The current goal is to support fencing enthusiasts in thinking through sequences and counters, not to provide a full training tool.

### 1. Historical Source Management
- **Source Definition**: Create custom historical sources (e.g., "Angelo 1845", "Radaelli").
- **Action Mapping**: Assign specific names to generic technical actions (e.g., mapping `cut1` to "Cut 1" for Angelo but "Direct cut to head" for Radaelli).
- **Source Bundling**: Select a "Primary Source" for nomenclature and "Additional Sources" to bundle multiple technical systems into your active move list.

### 2. Action Repository
- **Technical Actions**: Repository of attacks, parries, feints, and "stay" actions.
- **SVG Symbol Editor**: Customize the visual representation of actions using a simple drawing interface.
- **Tactical Relationships**: Define which parries block which attacks, and the "ease of transition" between different moves to drive the recommendation engine.

### 3. Sequence Builder
- **Linear & Branching Flow**: Build sequences of actions between a fencer and an adversary.
- **Recommendation Engine**: Suggests technically sound follow-up actions based on the previous move (e.g., suggesting specific ripostes after a successful parry).
- **Feinting System**: Mark actions as feints to create branching "reaction" paths (e.g., if the opponent parries the feint vs. if they don't).
- **Positioning**: Override start and mid-sequence guard positions.

This tool is primarily for HEMA fencing enthusiasts interested in exploring combinations and counter-strategies. It’s not aimed at developers or production use.

## Usage Guide

### Mapping a new Source
1. Go to the **Sources** page using the book icon.
2. Click **Add New Source**.
3. Once created, use the **Settings** icon on the source card to edit its name or description.
4. Use the **Assign Action** button to select which technical moves belong to this system.
5. Click an action card within the source to define its specific name for that source.

### Creating a Sequence
1. Select **New Sequence** from the navbar.
2. Choose starting positions for both fencers.
3. Click actions in the grid to add them to the timeline.
4. **Yellow/Green Stars** indicate the recommendation engine's top choices for a realistic technical flow.
5. Use the **⚡** icon on an action to mark it as a feint and define opponent reactions.

### Customizing Actions
1. Select **Edit Actions** from the navbar.
2. Click any action to enter the editor.
3. Use the **SVG Editor** to change the symbol.
4. Update **Tactical Links** (e.g., "Blocks these attacks") to improve the recommendation engine's accuracy.

## Technical Stack
- **React + TypeScript**
- **Zustand**: For persistent state management (Moves, Sources, Sequences).
- **Tailwind CSS**: For styling and layout.
- **Lucide React**: Iconography.
- **i18next**: Multi-language support.
