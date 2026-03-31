exportclassMove
{

    export interface Move {
        id: string;
        name: string;
        type?: 'attack' | 'defense' | 'counter';
    }

    export interface SequenceStep {
        id: string;
        move: Move;
        actor: 'player' | 'opponent';
        type?: 'normal' | 'feint';
        branches?: SequenceBranch[];
    }

    export interface SequenceBranch {
        id: string;
        reaction: 'fall_rein' | 'stay' | 'counter';
        steps: SequenceStep[];
    }


}