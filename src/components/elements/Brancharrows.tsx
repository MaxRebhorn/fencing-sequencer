import React from 'react';

interface ArrowPath {
    path: string;
    color: string;
    dashed: boolean;
    id: string;
}

interface Props {
    arrowPaths: ArrowPath[];
}

export const BranchArrows: React.FC<Props> = ({ arrowPaths }) => {
    return (
        <svg
            className="absolute top-0 left-0 pointer-events-none"
            style={{ width: '100%', height: '100%', zIndex: 10 }}
        >
            <defs>
                <marker
                    id="arrowhead"
                    markerWidth="12"
                    markerHeight="12"
                    refX="10"
                    refY="6"
                    orient="auto"
                >
                    <polygon points="0 0, 12 6, 0 12" fill="#f97316" />
                </marker>
            </defs>

            {arrowPaths.map((arrow) => (
                <path
                    key={arrow.id}
                    d={arrow.path}
                    stroke={arrow.color}
                    strokeWidth="3"
                    fill="none"
                    markerEnd="url(#arrowhead)"
                    strokeDasharray={arrow.dashed ? '6,4' : 'none'}
                    strokeLinecap="round"
                />
            ))}
        </svg>
    );
};