'use client';

import { useRef, useCallback } from 'react';
import { useProjectStore } from '@/stores/project-store';
import { useUiStore } from '@/stores/ui-store';
import { useBoardElementsStore, BoardElementType } from '@/stores/board-elements-store';

// ─── Element visual config ────────────────────────────────────────────────────

const ELEMENT_CONFIG: Record<BoardElementType, {
  color: string; strokeColor: string; defaultW: number; defaultH: number; label: string;
}> = {
  'text':        { color: '#8b5cf6', strokeColor: '#7c3aed', defaultW: 12, defaultH: 5,  label: 'Text Block'    },
  'scale-bar':   { color: 'none',    strokeColor: '#334155', defaultW: 15, defaultH: 2,  label: '1:100'         },
  'north-arrow': { color: '#fbbf24', strokeColor: '#d97706', defaultW: 5,  defaultH: 8,  label: 'North'         },
  'rect':        { color: '#3b82f6', strokeColor: '#2563eb', defaultW: 18, defaultH: 10, label: 'Rectangle'     },
  'circle':      { color: '#10b981', strokeColor: '#059669', defaultW: 10, defaultH: 10, label: 'Circle'        },
  'annotation':  { color: 'none',    strokeColor: '#64748b', defaultW: 14, defaultH: 6,  label: 'Annotation'    },
};

// ─── SVG Element Renderer ─────────────────────────────────────────────────────

function BoardSVGElement({
  el,
  sheetW,
  sheetH,
  onSelect,
  onDelete,
}: {
  el: import('@/stores/board-elements-store').BoardElement;
  sheetW: number;
  sheetH: number;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const px = (el.x / 100) * sheetW;
  const py = (el.y / 100) * sheetH;
  const pw = (el.width / 100) * sheetW;
  const ph = (el.height / 100) * sheetH;

  const baseProps = {
    onClick: (e: React.MouseEvent) => { e.stopPropagation(); onSelect(el.id); },
    style: { cursor: 'pointer' },
  };

  const renderShape = () => {
    switch (el.type) {
      case 'rect':
        return (
          <rect x={0} y={0} width={pw} height={ph}
            fill={el.color} fillOpacity={0.35}
            stroke={el.strokeColor} strokeWidth={1.5} rx={3} />
        );
      case 'circle':
        return (
          <ellipse cx={pw / 2} cy={ph / 2} rx={pw / 2} ry={ph / 2}
            fill={el.color} fillOpacity={0.35}
            stroke={el.strokeColor} strokeWidth={1.5} />
        );
      case 'text':
        return (
          <>
            <rect x={0} y={0} width={pw} height={ph}
              fill={el.color} fillOpacity={0.15}
              stroke={el.strokeColor} strokeWidth={1} rx={4} strokeDasharray="4,3" />
            <text x={6} y={ph / 2 + 4} fontSize={10} fill={el.strokeColor} fontFamily="Inter, sans-serif">
              {el.label}
            </text>
          </>
        );
      case 'scale-bar':
        return (
          <>
            <line x1={0} y1={ph / 2} x2={pw} y2={ph / 2} stroke={el.strokeColor} strokeWidth={2} />
            <line x1={0} y1={0} x2={0} y2={ph} stroke={el.strokeColor} strokeWidth={2} />
            <line x1={pw / 2} y1={ph / 4} x2={pw / 2} y2={ph * 3 / 4} stroke={el.strokeColor} strokeWidth={1.5} />
            <line x1={pw} y1={0} x2={pw} y2={ph} stroke={el.strokeColor} strokeWidth={2} />
            <text x={pw / 2} y={ph - 1} textAnchor="middle" fontSize={8} fill={el.strokeColor} fontFamily="Inter, sans-serif">
              {el.label}
            </text>
          </>
        );
      case 'north-arrow':
        return (
          <>
            <polygon
              points={`${pw / 2},0 ${pw * 0.7},${ph * 0.65} ${pw / 2},${ph * 0.5} ${pw * 0.3},${ph * 0.65}`}
              fill={el.color} stroke={el.strokeColor} strokeWidth={1.5} />
            <polygon
              points={`${pw / 2},${ph * 0.5} ${pw * 0.7},${ph * 0.65} ${pw / 2},${ph} ${pw * 0.3},${ph * 0.65}`}
              fill="none" stroke={el.strokeColor} strokeWidth={1.5} />
            <text x={pw / 2} y={ph - 2} textAnchor="middle" fontSize={9} fontWeight="bold"
              fill={el.strokeColor} fontFamily="Inter, sans-serif">N</text>
          </>
        );
      case 'annotation':
        return (
          <>
            <line x1={0} y1={ph} x2={pw * 0.6} y2={0} stroke={el.strokeColor} strokeWidth={1.5} />
            <line x1={pw * 0.6} y1={0} x2={pw} y2={0} stroke={el.strokeColor} strokeWidth={1.5} />
            <circle cx={0} cy={ph} r={3} fill={el.strokeColor} />
            <rect x={pw * 0.6} y={-ph * 0.6} width={pw * 0.4} height={ph * 0.55}
              fill="white" stroke={el.strokeColor} strokeWidth={1} rx={2} />
            <text x={pw * 0.6 + 3} y={-ph * 0.6 + ph * 0.38} fontSize={8}
              fill={el.strokeColor} fontFamily="Inter, sans-serif">{el.label}</text>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <g transform={`translate(${px}, ${py})`} {...baseProps}>
      {renderShape()}

      {/* Selection ring + controls */}
      {el.selected && (
        <>
          <rect x={-3} y={-3} width={pw + 6} height={ph + 6}
            fill="none" stroke="#38bdf8" strokeWidth={1.5}
            strokeDasharray="5,3" rx={4} />
          {/* Delete button */}
          <g
            transform={`translate(${pw + 4}, ${-12})`}
            onClick={(e) => { e.stopPropagation(); onDelete(el.id); }}
            style={{ cursor: 'pointer' }}
          >
            <rect x={0} y={0} width={18} height={18} rx={4}
              fill="#ef4444" opacity={0.9} />
            <text x={9} y={13} textAnchor="middle" fontSize={10}
              fill="white" fontFamily="Inter, sans-serif">×</text>
          </g>
        </>
      )}
    </g>
  );
}

// ─── BoardCanvas ──────────────────────────────────────────────────────────────

export default function BoardCanvas() {
  const elements = useBoardElementsStore((s) => s.elements);
  const addElement = useBoardElementsStore((s) => s.addElement);
  const removeElement = useBoardElementsStore((s) => s.removeElement);
  const selectElement = useBoardElementsStore((s) => s.selectElement);
  const clearSelection = useBoardElementsStore((s) => s.clearSelection);

  const placing = useProjectStore((s) => s.placingElement) as BoardElementType | null;
  const setPlacing = useProjectStore((s) => s.setPlacingElement);
  const executeCommand = useProjectStore((s) => s.executeCommand);
  const addToast = useUiStore((s) => s.addToast);

  const sheetRef = useRef<SVGSVGElement>(null);
  const SHEET_W = 1122; // A3 landscape px at 96dpi (420mm)
  const SHEET_H = 794;  // A3 landscape px at 96dpi (297mm)

  const handleSheetClick = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!placing) {
      clearSelection();
      return;
    }

    const svg = sheetRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const scaleX = SHEET_W / rect.width;
    const scaleY = SHEET_H / rect.height;
    const rawX = (e.clientX - rect.left) * scaleX;
    const rawY = (e.clientY - rect.top) * scaleY;

    const cfg = ELEMENT_CONFIG[placing];
    if (!cfg) return;

    // Convert to percentage
    const xPct = Math.max(0, Math.min(100 - cfg.defaultW, (rawX / SHEET_W) * 100 - cfg.defaultW / 2));
    const yPct = Math.max(0, Math.min(100 - cfg.defaultH, (rawY / SHEET_H) * 100 - cfg.defaultH / 2));

    const newEl = {
      type: placing,
      x: xPct,
      y: yPct,
      width: cfg.defaultW,
      height: cfg.defaultH,
      label: cfg.label,
      color: cfg.color,
      strokeColor: cfg.strokeColor,
    };

    executeCommand({
      label: `Place ${cfg.label}`,
      execute: () => {
        addElement(newEl);
      },
      undo: () => {
        // find the most recently added element of this type near these coords and remove it
        const all = useBoardElementsStore.getState().elements;
        const match = [...all].reverse().find(
          (el) => el.type === placing && Math.abs(el.x - xPct) < 2 && Math.abs(el.y - yPct) < 2
        );
        if (match) removeElement(match.id);
      },
    });

    addToast({ type: 'success', message: `Placed "${cfg.label}" on board`, duration: 2000 });
    setPlacing(null);
  }, [placing, addElement, removeElement, setPlacing, executeCommand, addToast, clearSelection]);

  return (
    <div
      className="w-full h-full flex items-center justify-center overflow-auto"
      style={{ background: 'hsl(var(--canvas-bg))' }}
    >
      {/* A3 Sheet */}
      <div
        className="relative shadow-2xl flex-shrink-0"
        style={{
          width: 'min(90vw, 1122px)',
          aspectRatio: '1122 / 794',
          background: 'hsl(0, 0%, 98%)',
          borderRadius: '4px',
          border: '1px solid hsl(var(--border-default))',
        }}
      >
        {/* Grid overlay */}
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: 'linear-gradient(hsl(var(--border-subtle)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border-subtle)) 1px, transparent 1px)',
          backgroundSize: '40px 40px', opacity: 0.3,
        }} />

        {/* Placement cursor hint */}
        {placing && (
          <div
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            style={{ zIndex: 20 }}
          >
            <div className="px-4 py-2 rounded-xl text-sm font-semibold"
              style={{
                background: 'hsl(158 64% 52% / 0.15)',
                border: '1px solid hsl(var(--brand-primary))',
                color: 'hsl(var(--brand-primary))',
                backdropFilter: 'blur(8px)',
              }}>
              Click anywhere on the sheet to place "{ELEMENT_CONFIG[placing]?.label}"
            </div>
          </div>
        )}

        {/* SVG interactive layer — fills entire sheet */}
        <svg
          ref={sheetRef}
          className="absolute inset-0 w-full h-full"
          viewBox={`0 0 ${SHEET_W} ${SHEET_H}`}
          style={{ cursor: placing ? 'crosshair' : 'default', zIndex: 10 }}
          onClick={handleSheetClick}
        >
          {/* Title block */}
          <rect x={SHEET_W - 260} y={SHEET_H - 80} width={256} height={76}
            fill="white" stroke="hsl(220 10% 70%)" strokeWidth={1} />
          <line x1={SHEET_W - 260} y1={SHEET_H - 55} x2={SHEET_W - 4} y2={SHEET_H - 55}
            stroke="hsl(220 10% 70%)" strokeWidth={0.8} />
          <text x={SHEET_W - 250} y={SHEET_H - 63} fontSize={11} fontWeight="bold"
            fill="hsl(220 10% 25%)" fontFamily="Inter, sans-serif">LAYA</text>
          <text x={SHEET_W - 250} y={SHEET_H - 43} fontSize={9}
            fill="hsl(220 10% 45%)" fontFamily="Inter, sans-serif">Project Title</text>
          <text x={SHEET_W - 250} y={SHEET_H - 30} fontSize={9}
            fill="hsl(220 10% 45%)" fontFamily="Inter, sans-serif">Scale: 1:100</text>
          <text x={SHEET_W - 250} y={SHEET_H - 17} fontSize={9}
            fill="hsl(220 10% 45%)" fontFamily="Inter, sans-serif">Date: 2026</text>

          {/* Center hint when empty */}
          {elements.length === 0 && !placing && (
            <>
              <text x={SHEET_W / 2} y={SHEET_H / 2 - 10} textAnchor="middle" fontSize={15}
                fill="hsl(220 10% 65%)" fontFamily="Inter, sans-serif" fontWeight="500">
                A3 Board — 297 × 420 mm
              </text>
              <text x={SHEET_W / 2} y={SHEET_H / 2 + 14} textAnchor="middle" fontSize={11}
                fill="hsl(220 10% 70%)" fontFamily="Inter, sans-serif">
                Select an element from the sidebar, then click to place it
              </text>
            </>
          )}

          {/* Placed elements */}
          {elements.map((el) => (
            <BoardSVGElement
              key={el.id}
              el={el}
              sheetW={SHEET_W}
              sheetH={SHEET_H}
              onSelect={selectElement}
              onDelete={(id) => {
                executeCommand({
                  label: 'Delete Board Element',
                  execute: () => removeElement(id),
                  undo: () => {
                    const snapshot = useBoardElementsStore.getState().elements;
                    const found = snapshot.find(e => e.id === id);
                    // Recreate with same id via direct state patch (best-effort)
                    if (!found) addElement({ type: el.type, x: el.x, y: el.y, width: el.width, height: el.height, label: el.label, color: el.color, strokeColor: el.strokeColor });
                  },
                });
              }}
            />
          ))}
        </svg>
      </div>
    </div>
  );
}
