import React from 'react';

interface Props {
    svgContent: string;
    className?: string;
}

export const ActionIcon: React.FC<Props> = ({ svgContent, className = "w-10 h-10" }) => {
    return (
        <div
            className={`${className} mx-auto mb-2`}
            dangerouslySetInnerHTML={{ __html: svgContent }}
        />
    );
};
