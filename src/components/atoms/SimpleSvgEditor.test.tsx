import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { SimpleSVGEditor } from './SimpleSvgEditor';
import React from 'react';

describe('SimpleSVGEditor', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('calls onChange on mount with attack SVG', () => {
        const onChange = vi.fn();
        render(<SimpleSVGEditor mode="attack" onChange={onChange} />);

        expect(onChange).toHaveBeenCalledTimes(1);
        const svg = onChange.mock.calls[0][0] as string;
        expect(svg).toContain('marker');
        expect(svg).toContain('path');
        expect(svg).toContain('#ff4bd0');
    });

    it('calls onChange on mount with parry SVG', () => {
        const onChange = vi.fn();
        render(<SimpleSVGEditor mode="parry" onChange={onChange} />);

        expect(onChange).toHaveBeenCalledTimes(1);
        const svg = onChange.mock.calls[0][0] as string;
        expect(svg).not.toContain('marker');
        expect(svg).toContain('line');
        expect(svg).toContain('#00ff9d');
    });

    it('renders drag handles', () => {
        const onChange = vi.fn();
        const { container } = render(<SimpleSVGEditor mode="attack" onChange={onChange} />);

        const handles = container.querySelectorAll('.cursor-move, .cursor-pointer');
        expect(handles.length).toBe(2);
    });

    it('renders circle outline for parry mode', () => {
        const onChange = vi.fn();
        const { container } = render(<SimpleSVGEditor mode="parry" onChange={onChange} />);

        expect(container.querySelector('svg')?.innerHTML).toContain('r="30"');
    });

    it('uses custom label in SVG', () => {
        const onChange = vi.fn();
        render(<SimpleSVGEditor mode="attack" label="X" onChange={onChange} />);

        const svg = onChange.mock.calls[0][0] as string;
        expect(svg).toContain('>X<');
    });

    it('parses initialSVG in attack mode and updates positions', () => {
        const onChange = vi.fn();
        const initialSVG = `<svg viewBox="0 0 100 100"><path d="M30 70 L60 20" stroke="#ff4bd0" stroke-width="4"/><circle cx="50" cy="50" r="35"/></svg>`;

        render(<SimpleSVGEditor mode="attack" initialSVG={initialSVG} onChange={onChange} />);

        // initialSVG effect fires after mount, triggering a second onChange with parsed positions
        expect(onChange).toHaveBeenCalledTimes(2);
        const svg = onChange.mock.calls[1][0] as string;
        expect(svg).toContain('M30 70');
        expect(svg).toContain('L60 20');
    });

    it('parses initialSVG in parry mode and updates positions', () => {
        const onChange = vi.fn();
        const initialSVG = `<svg viewBox="0 0 100 100"><line x1="20" y1="80" x2="80" y2="20" stroke="#00ff9d" stroke-width="5"/><circle cx="50" cy="50" r="30"/></svg>`;

        render(<SimpleSVGEditor mode="parry" initialSVG={initialSVG} onChange={onChange} />);

        expect(onChange).toHaveBeenCalledTimes(2);
        const svg = onChange.mock.calls[1][0] as string;
        expect(svg).toContain('x1="20"');
        expect(svg).toContain('y1="80"');
    });
});
