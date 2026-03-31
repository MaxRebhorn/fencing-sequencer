import React from 'react';

interface Props {
    svgContent: string;
    className?: string;
}

export const MoveIcon: React.FC<Props> = ({ svgContent, className = "w-8 h-8" }) => {
    return (
        <div
            className={`${className} mx-auto`}
            dangerouslySetInnerHTML={{ __html: svgContent }}
        />
    );
};
