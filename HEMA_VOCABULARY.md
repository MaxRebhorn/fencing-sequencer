# HEMA Sabre Fencing - Project Terminology

This document defines the unified vocabulary used throughout the platform to ensure consistency between the code, the user interface, and Historical European Martial Arts (HEMA) theory.

## 1. Actors (Fencers)
To avoid "gamified" language, we use technical fencing terms:

| Old Term | New Term | Description |
| :--- | :--- | :--- |
| Player | **Fencer** | The primary actor whose perspective the training flow is built from. |
| Opponent | **Adversary** | The person reacting to or initiating actions against the Fencer. |

## 2. Structural Terms
| Term | Description |
| :--- | :--- |
| **Action** | A single technical movement (Cut, Parry, Thrust, etc.). In code, this replaces "Move" or "Step". |
| **Sequence** | A chronological series of Actions involving both fencers. |
| **Phase** | A distinct part of an engagement (e.g., Initial Attack, Defense, Riposte). |
| **Branch** | A divergence in the sequence based on a fencer's reaction (e.g., if the adversary parries vs. if they are hit). |

## 3. Action Types
| Term | HEMA Context | Code Type |
| :--- | :--- | :--- |
| **Cut** | A blow delivered with the edge of the sabre. | `attack` |
| **Point** | A thrusting attack with the tip. | `attack` |
| **Parry** | A defensive movement to intercept an adversary's blade. | `parry` |
| **Feint** | A deceptive action intended to provoke a specific parry. | `feint` |
| **Stay** | Maintaining position or waiting for an opening. | `stay` |

## 4. JSON Structure (The `Action` Object)
Actions are stored as JSON objects. Understanding these properties is crucial for the suggestion algorithm.

```json
{
  "id": "cut1", 
  "name": "Cut 1",
  "type": "attack",
  "svgContent": "<svg>...</svg>",
  "targetZone": "high_outside",
  "description": "Downward diagonal cut to the head/cheek.",
  
  "blocks": ["cut3", "cut8"], 
  // (For Parries) List of Action IDs this action can successfully defend against.

  "fastestParries": ["sixte", "quinte"],
  // (For Attacks) The most ergonomically efficient parries to transition to 
  // if this attack is failed or parried.

  "easiestAttacks": ["cut2", "cut7"],
  // (For Parries) The most natural Ripostes (attacks) to follow this parry.
  
  "isLongGuard": false
  // Specific to sabre guards that keep the arm extended.
}
```

## 5. Logic Definitions
- **Tempo**: The "time" or opportunity in which an action occurs. An "Attack in Tempo" happens during the adversary's preparation.
- **Riposte**: An attack made by the fencer who has just parried an attack.
- **Remise**: A second attack made immediately after the first is parried, without returning to guard.
