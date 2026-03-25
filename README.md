Fencing Sequencer

This is an early prototype web tool for experimenting with HEMA fencing sequences. It is a fast, experimental implementation and far from finished — more a proof of concept than a polished app.

Live demo: https://maxrebhorn.github.io/fencing-sequencer/

What It Is

The Fencing Sequencer allows you to:

visualize sequences of cuts and parries using simple icons,
explore suggested counter-actions based on enemy moves and your own parries,
see recommendations for attacks where your opponent is slowest to defend and you can act quickest.

The current goal is to support fencing enthusiasts in thinking through sequences and counters, not to provide a full training tool.

Current State
Prototype only: The interface is minimal and functional, not polished.
Icon-based visualization: SVGs currently represent moves with simple icons; no drag-and-drop editing.
Partial algorithm: Suggestions for optimal actions are semi-functional; based on your parry choice and enemy attack.
Experimental: Many features are missing, and UX is basic.
Intended Audience

This tool is primarily for HEMA fencing enthusiasts interested in exploring combinations and counter-strategies. It’s not aimed at developers or production use.

How It Works (Simplified)
Sequence visualization: Icons represent cuts, parries, and actions.
Counter-suggestion logic: The algorithm identifies possible attacks where the opponent is slowest to respond, based on your parry.
Interactive exploration: Users can experiment with different sequences and see recommended moves.
Notes

This project was implemented quickly to test ideas. Contributions or feedback from fencing practitioners are welcome, especially on refining the action-suggestion logic and improving clarity of move representation.