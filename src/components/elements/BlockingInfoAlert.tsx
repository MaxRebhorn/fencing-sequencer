import React from 'react';
import { Move } from '../../types';

interface BlockingInfo {
    attack: Move;
    parries: Move[];
    hasBlockingParries: boolean;
}

interface Props {
    blockingInfo: BlockingInfo | null;
}

export const BlockingInfoAlert: React.FC<Props> = ({ blockingInfo }) => {
    if (!blockingInfo) return null;

    return (
        <div
            className={`mb-4 p-3 rounded-lg text-center ${
                blockingInfo.hasBlockingParries
                    ? 'bg-green-900/20 border border-green-500/30'
                    : 'bg-yellow-900/20 border border-yellow-500/30'
            }`}
        >
            <p className="text-sm">
                {blockingInfo.hasBlockingParries ? (
                    <span className="text-green-400">
            🛡️ <strong>{blockingInfo.attack.name}</strong> kann mit folgenden Paraden geblockt werden
            (nach Geschwindigkeit sortiert):
            <span className="font-bold ml-1">
              {blockingInfo.parries.map((p) => p.name).join(', ')}
            </span>
          </span>
                ) : (
                    <span className="text-yellow-400">
            ⚠️ <strong>{blockingInfo.attack.name}</strong> kann von keiner Parade geblockt werden!
          </span>
                )}
            </p>
        </div>
    );
};