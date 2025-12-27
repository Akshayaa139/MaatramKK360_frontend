import React from 'react';
import { InlineMath, BlockMath } from 'react-katex';

interface MathTextProps {
    text: string;
    className?: string;
}

export const MathText: React.FC<MathTextProps> = ({ text, className }) => {
    if (!text) return null;

    // Split text by $$ (block math) and $ (inline math)
    // This regex matches $$...$$ or $...$
    const parts = text.split(/(\$\$.*?\$\$|\$.*?\$)/g);

    return (
        <span className={className}>
            {parts.map((part, index) => {
                if (part.startsWith('$$') && part.endsWith('$$')) {
                    const formula = part.slice(2, -2);
                    return <BlockMath key={index}>{formula}</BlockMath>;
                } else if (part.startsWith('$') && part.endsWith('$')) {
                    const formula = part.slice(1, -1);
                    return <InlineMath key={index}>{formula}</InlineMath>;
                }
                return <span key={index}>{part}</span>;
            })}
        </span>
    );
};
