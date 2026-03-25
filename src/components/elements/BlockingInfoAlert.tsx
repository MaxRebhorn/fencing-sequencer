import React from 'react';
import { Move } from '../../types';
import { useTranslation } from 'react-i18next';

interface BlockingInfo {
    attack: Move;
    parries: Move[];
    hasBlockingParries: boolean;
}

interface Props {
    blockingInfo: BlockingInfo | null;
}

export const BlockingInfoAlert: React.FC<Props> = ({ blockingInfo }) => {
    const { t } = useTranslation();
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
                    <span className="text-green-400" dangerouslySetInnerHTML={{
                        __html: t('sequence.blocking.canBlock', {
                            attack: blockingInfo.attack.name,
                            parries: blockingInfo.parries.map(p => p.name).join(', ')
                        })
                    }} />
                ) : (
                    <span className="text-yellow-400" dangerouslySetInnerHTML={{
                        __html: t('sequence.blocking.cannotBlock', {
                            attack: blockingInfo.attack.name
                        })
                    }} />
                )}
            </p>
        </div>
    );
};