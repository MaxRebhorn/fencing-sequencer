import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';

type Mode = 'attack' | 'parry';

interface Props {
    mode: Mode;
    label?: string;
    onChange: (svg: string) => void;
    initialSVG?: string;
}

export const SimpleSVGEditor: React.FC<Props> = ({ mode, label = '1', onChange, initialSVG }) => {
    const svgRef = useRef<SVGSVGElement | null>(null);
    const [positions, setPositions] = useState(() => ({
        back: { x: 50, y: 80 },
        front: { x: 50, y: 20 }
    }));
    const [dragging, setDragging] = useState<'back' | 'front' | null>(null);

    const markerIdRef = useRef(`arrow-${Math.random().toString(36).slice(2)}`);

    // Tracks whether we've already applied the initial SVG.
    // After that, onChange-triggered prop updates must NOT overwrite drag state.
    const isInitializedRef = useRef(false);

    useEffect(() => {
        // Only parse initialSVG once on mount (or when mode changes and we haven't initialized yet).
        if (isInitializedRef.current) return;
        if (!initialSVG) {
            isInitializedRef.current = true;
            return;
        }

        const parser = new DOMParser();
        const doc = parser.parseFromString(initialSVG, 'image/svg+xml');
        const path = doc.querySelector('path');
        const line = doc.querySelector('line');

        if (mode === 'attack' && path) {
            const d = path.getAttribute('d');
            if (d) {
                const match = d.match(/M([\d.]+)\s+([\d.]+)\s+L([\d.]+)\s+([\d.]+)/);
                if (match) {
                    setPositions({
                        back: { x: parseFloat(match[1]), y: parseFloat(match[2]) },
                        front: { x: parseFloat(match[3]), y: parseFloat(match[4]) }
                    });
                }
            }
        } else if (mode === 'parry' && line) {
            const x1 = parseFloat(line.getAttribute('x1') || '50');
            const y1 = parseFloat(line.getAttribute('y1') || '80');
            const x2 = parseFloat(line.getAttribute('x2') || '50');
            const y2 = parseFloat(line.getAttribute('y2') || '20');
            setPositions({ back: { x: x1, y: y1 }, front: { x: x2, y: y2 } });
        }

        isInitializedRef.current = true;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // intentionally empty — run only once on mount

    const getMousePos = useCallback((e: React.MouseEvent) => {
        if (!svgRef.current) return { x: 50, y: 50 };
        const rect = svgRef.current.getBoundingClientRect();
        return {
            x: ((e.clientX - rect.left) / rect.width) * 100,
            y: ((e.clientY - rect.top) / rect.height) * 100,
        };
    }, []);

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (!dragging) return;
        const pos = getMousePos(e);

        setPositions(prev => {
            if (dragging === 'back') {
                const offsetX = pos.x - prev.back.x;
                const offsetY = pos.y - prev.back.y;
                return {
                    back: { x: prev.back.x + offsetX, y: prev.back.y + offsetY },
                    front: { x: prev.front.x + offsetX, y: prev.front.y + offsetY }
                };
            } else if (dragging === 'front') {
                const dx = pos.x - prev.back.x;
                const dy = pos.y - prev.back.y;
                const currentLength = Math.sqrt(
                    Math.pow(prev.front.x - prev.back.x, 2) +
                    Math.pow(prev.front.y - prev.back.y, 2)
                );
                const angle = Math.atan2(dy, dx);
                return {
                    ...prev,
                    front: {
                        x: prev.back.x + currentLength * Math.cos(angle),
                        y: prev.back.y + currentLength * Math.sin(angle)
                    }
                };
            }
            return prev;
        });
    }, [dragging, getMousePos]);

    const handleMouseUp = useCallback(() => {
        setDragging(null);
    }, []);

    const svgString = useMemo(() => {
        const { back, front } = positions;

        if (mode === 'attack') {
            return `<svg viewBox="0 0 100 100">
  <defs>
    <marker id="${markerIdRef.current}" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
      <polygon points="0 0,8 4,0 8" fill="#ff4bd0"/>
    </marker>
  </defs>
  <path d="M${back.x} ${back.y} L${front.x} ${front.y}" stroke="#ff4bd0" stroke-width="4" marker-end="url(#${markerIdRef.current})"/>
  <circle cx="50" cy="50" r="35" fill="none" stroke="#ff4bd0" stroke-width="2"/>
  <text x="50" y="55" font-size="20" text-anchor="middle" fill="#ff4bd0" font-weight="bold">${label}</text>
</svg>`;
        }

        return `<svg viewBox="0 0 100 100">
  <circle cx="50" cy="50" r="30" fill="none" stroke="#00ff9d" stroke-width="2"/>
  <line x1="${back.x}" y1="${back.y}" x2="${front.x}" y2="${front.y}" stroke="#00ff9d" stroke-width="5"/>
  <circle cx="${back.x}" cy="${back.y}" r="4.87342" fill="#00ff9d"/>
  <circle cx="${front.x}" cy="${front.y}" r="4.87342" fill="#00ff9d"/>
  <text x="50" y="55" font-size="18" text-anchor="middle" fill="#00ff9d">${label}</text>
</svg>`;
    }, [positions, mode, label]);

    useEffect(() => {
        onChange(svgString);
    }, [svgString, onChange]);

    return (
        <div
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className="w-40 h-40 border border-gray-400 relative bg-gray-900 rounded"
        >
            <svg
                ref={svgRef}
                viewBox="0 0 100 100"
                className="w-full h-full"
                dangerouslySetInnerHTML={{ __html: svgString.replace(/<svg[^>]*>|<\/svg>/g, '') }}
            />

            {/* Back handle */}
            <div
                className="absolute w-4 h-4 bg-green-400 rounded-full cursor-move"
                style={{
                    left: `${positions.back.x}%`,
                    top: `${positions.back.y}%`,
                    transform: 'translate(-50%, -50%)',
                    pointerEvents: 'auto'
                }}
                onMouseDown={(e) => { e.stopPropagation(); setDragging('back'); }}
            />

            {/* Front handle */}
            <div
                className="absolute w-3 h-3 bg-yellow-400 rounded-full cursor-pointer"
                style={{
                    left: `${positions.front.x}%`,
                    top: `${positions.front.y}%`,
                    transform: 'translate(-50%, -50%)',
                    pointerEvents: 'auto'
                }}
                onMouseDown={(e) => { e.stopPropagation(); setDragging('front'); }}
            />
        </div>
    );
};