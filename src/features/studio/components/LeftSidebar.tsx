'use client';

import { useRef } from 'react';
import { useSelectionStore } from '@/stores/selection-store';
import { useGeometryStore } from '@/stores/geometry-store';
import { useLayerStore } from '@/stores/layer-store';
import { useProjectStore } from '@/stores/project-store';
import { useUiStore, PanelId } from '@/stores/ui-store';
import { CanvasCommandBus } from '@/lib/command-bus';
import {
  LayoutTemplate, Brush, Box, Layers, Wrench, Upload, FolderOpen,
  Eye, EyeOff, Lock, Unlock, PlusCircle, MousePointer,
  Hand, Crop, X,
} from 'lucide-react';

type ToolbarTab = PanelId;
type LayerType = string;

// ─── Toolbar Icon Config ──────────────────────────────────────────────────

const STUDIO_TABS: { id: ToolbarTab; icon: React.ElementType; label: string }[] = [
  { id: 'templates', icon: LayoutTemplate, label: 'Templates' },
  { id: 'patterns',  icon: Brush,          label: 'Patterns'  },
  { id: 'elements',  icon: Box,            label: 'Elements'  },
  { id: 'layers',    icon: Layers,         label: 'Layers'    },
  { id: 'tools',     icon: Wrench,         label: 'Tools'     },
  { id: 'uploads',   icon: Upload,         label: 'Uploads'   },
  { id: 'projects',  icon: FolderOpen,     label: 'Projects'  },
];

const BOARD_TABS: { id: ToolbarTab; icon: React.ElementType; label: string }[] = [
  { id: 'templates', icon: LayoutTemplate, label: 'Templates' },
  { id: 'patterns',  icon: Brush,          label: 'Patterns'  },
  { id: 'elements',  icon: Box,            label: 'Elements'  },
  { id: 'tools',     icon: Wrench,         label: 'Tools'     },
  { id: 'uploads',   icon: Upload,         label: 'Uploads'   },
  { id: 'projects',  icon: FolderOpen,     label: 'Projects'  },
];

// ─── Colour Swatches ─────────────────────────────────────────────────────

const SWATCHES = [
  '#4ade80','#86efac','#22d3ee','#60a5fa','#a78bfa',
  '#f472b6','#fb923c','#facc15','#e2e8f0','#94a3b8',
  '#1e293b','#0f172a','#d97706','#7c3aed','#dc2626',
];

const PATTERNS = [
  { id: 'wood', label: 'Wood', lines: ['#c9a96e','#b8945c','#d4b07e'] },
  { id: 'concrete', label: 'Concrete', lines: ['#9ca3af','#6b7280','#9ca3af'] },
  { id: 'tile', label: 'Tile', lines: ['#e2e8f0','#cbd5e1','#e2e8f0'] },
  { id: 'brick', label: 'Brick', lines: ['#b45309','#92400e','#b45309'] },
  { id: 'grass', label: 'Grass', lines: ['#4ade80','#22c55e','#4ade80'] },
  { id: 'marble', label: 'Marble', lines: ['#f1f5f9','#e2e8f0','#cbd5e1'] },
];

// ─── Pane content sub-components ─────────────────────────────────────────

function PaneHeader({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div
      className="flex items-center justify-between px-4 py-3 border-b"
      style={{ borderColor: 'hsl(var(--border-subtle))' }}
    >
      <span className="text-xs font-semibold uppercase tracking-widest"
        style={{ color: 'hsl(var(--text-muted))' }}>
        {title}
      </span>
      <button className="toolbar-btn" style={{ width: 24, height: 24 }} onClick={onClose}>
        <X size={13} />
      </button>
    </div>
  );
}

function RoomInspectorPane() {
  const selectedIds = useSelectionStore((s) => s.selectedIds);
  const roomStyles = useGeometryStore((s) => s.roomStyles);
  const setRoomStyle = useGeometryStore((s) => s.setRoomStyle);
  const opacityStartRef = useRef<number | null>(null);

  if (selectedIds.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 gap-2 px-6 text-center">
        <MousePointer size={24} style={{ color: 'hsl(var(--text-muted))' }} />
        <p className="text-xs" style={{ color: 'hsl(var(--text-muted))' }}>
          Click a room on the canvas to inspect its properties
        </p>
      </div>
    );
  }

  const id = selectedIds[0];
  const style = roomStyles.get(id) ?? { fillColor: '#166534', fillOpacity: 0.22, patternId: null };

  const handleStyleChange = (updates: Partial<import('@/stores/geometry-store').RoomStyle>) => {
    const geometryStore = useGeometryStore.getState();
    const oldStyles = new Map<string, import('@/stores/geometry-store').RoomStyle>();
    selectedIds.forEach((rid) => {
      oldStyles.set(rid, geometryStore.getRoomStyle(rid));
    });

    useProjectStore.getState().executeCommand({
      label: 'Change Room Style',
      execute: () => {
        geometryStore.setRoomStyles(selectedIds, updates);
        selectedIds.forEach((rid) => {
          CanvasCommandBus.dispatch({
            type: 'OBJECT_STYLE_CHANGED',
            ids: [rid],
            style: updates,
          });
        });
      },
      undo: () => {
        selectedIds.forEach((rid) => {
          const old = oldStyles.get(rid);
          if (old) {
            geometryStore.setRoomStyle(rid, old);
            CanvasCommandBus.dispatch({
              type: 'OBJECT_STYLE_CHANGED',
              ids: [rid],
              style: old,
            });
          }
        });
      },
    });
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="rounded-xl p-3" style={{ background: 'hsl(var(--bg-elevated))' }}>
        <p className="text-xs font-semibold mb-1" style={{ color: 'hsl(var(--text-muted))' }}>
          {selectedIds.length > 1 ? `${selectedIds.length} rooms selected` : 'Selected Room'}
        </p>
        <p className="text-sm font-bold" style={{ color: 'hsl(var(--text-primary))' }}>
          {id.replace('room-', '').replace(/-/g, ' ').toUpperCase()}
        </p>
      </div>

      {/* Fill Color */}
      <div>
        <p className="text-xs font-semibold mb-2" style={{ color: 'hsl(var(--text-secondary))' }}>Fill Color</p>
        <div className="grid grid-cols-5 gap-1.5">
          {SWATCHES.map((c) => (
            <button
              key={c}
              className="w-full aspect-square rounded-lg border-2 transition-transform hover:scale-110"
              style={{
                background: c,
                borderColor: style.fillColor === c ? 'white' : 'transparent',
                boxShadow: style.fillColor === c ? '0 0 0 1px hsl(var(--brand-primary))' : 'none',
              }}
              onClick={() => handleStyleChange({ fillColor: c })}
            />
          ))}
        </div>
      </div>

      {/* Opacity */}
      <div>
        <div className="flex justify-between mb-2">
          <p className="text-xs font-semibold" style={{ color: 'hsl(var(--text-secondary))' }}>Opacity</p>
          <span className="text-xs" style={{ color: 'hsl(var(--text-muted))' }}>
            {Math.round(style.fillOpacity * 100)}%
          </span>
        </div>
        <input
          type="range" min="0.05" max="1" step="0.05"
          value={style.fillOpacity}
          onMouseDown={() => { opacityStartRef.current = style.fillOpacity; }}
          onTouchStart={() => { opacityStartRef.current = style.fillOpacity; }}
          onChange={(e) => selectedIds.forEach((rid) => setRoomStyle(rid, { fillOpacity: +e.target.value }))}
          onMouseUp={(e) => {
            const val = +((e.target as HTMLInputElement).value);
            if (opacityStartRef.current !== null && opacityStartRef.current !== val) {
              const startVal = opacityStartRef.current;
              useProjectStore.getState().executeCommand({
                label: 'Change Opacity',
                execute: () => {
                  useGeometryStore.getState().setRoomStyles(selectedIds, { fillOpacity: val });
                  selectedIds.forEach((rid) => {
                    CanvasCommandBus.dispatch({
                      type: 'OBJECT_STYLE_CHANGED',
                      ids: [rid],
                      style: { fillOpacity: val },
                    });
                  });
                },
                undo: () => {
                  useGeometryStore.getState().setRoomStyles(selectedIds, { fillOpacity: startVal });
                  selectedIds.forEach((rid) => {
                    CanvasCommandBus.dispatch({
                      type: 'OBJECT_STYLE_CHANGED',
                      ids: [rid],
                      style: { fillOpacity: startVal },
                    });
                  });
                },
              });
            }
            opacityStartRef.current = null;
          }}
          onTouchEnd={(e) => {
            const val = +((e.target as HTMLInputElement).value);
            if (opacityStartRef.current !== null && opacityStartRef.current !== val) {
              const startVal = opacityStartRef.current;
              useProjectStore.getState().executeCommand({
                label: 'Change Opacity',
                execute: () => {
                  useGeometryStore.getState().setRoomStyles(selectedIds, { fillOpacity: val });
                  selectedIds.forEach((rid) => {
                    CanvasCommandBus.dispatch({
                      type: 'OBJECT_STYLE_CHANGED',
                      ids: [rid],
                      style: { fillOpacity: val },
                    });
                  });
                },
                undo: () => {
                  useGeometryStore.getState().setRoomStyles(selectedIds, { fillOpacity: startVal });
                  selectedIds.forEach((rid) => {
                    CanvasCommandBus.dispatch({
                      type: 'OBJECT_STYLE_CHANGED',
                      ids: [rid],
                      style: { fillOpacity: startVal },
                    });
                  });
                },
              });
            }
            opacityStartRef.current = null;
          }}
          className="w-full"
          style={{ accentColor: 'hsl(var(--brand-primary))' }}
        />
      </div>

      {/* Pattern */}
      <div>
        <p className="text-xs font-semibold mb-2" style={{ color: 'hsl(var(--text-secondary))' }}>Pattern Hatch</p>
        <div className="grid grid-cols-3 gap-2">
          {PATTERNS.map((p) => (
            <button
              key={p.id}
              className={`pattern-card ${style.patternId === p.id ? 'selected' : ''}`}
              onClick={() => handleStyleChange({ patternId: style.patternId === p.id ? null : p.id })}
            >
              <div className="h-10 flex flex-col justify-evenly overflow-hidden px-1 rounded-lg"
                style={{ background: 'hsl(var(--bg-overlay))' }}>
                {p.lines.map((c, i) => (
                  <div key={i} className="h-0.5 w-full rounded-full" style={{ background: c, opacity: 0.9 }} />
                ))}
              </div>
              <p className="text-center text-xs mt-1 pb-1" style={{ color: 'hsl(var(--text-muted))' }}>{p.label}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function PatternsPane() {
  return (
    <div className="flex flex-col gap-4 p-4">
      <p className="text-xs" style={{ color: 'hsl(var(--text-muted))' }}>
        Select a room on the canvas, then choose a material.
      </p>
      <RoomInspectorPane />
    </div>
  );
}

function LayersPane() {
  const layers = useLayerStore((s) => s.layers);
  const toggleVis = useLayerStore((s) => s.toggleVisibility);
  const toggleLock = useLayerStore((s) => s.toggleLock);

  return (
    <div className="flex flex-col gap-1 p-3">
      {layers.map((layer) => (
        <div
          key={layer.id}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors"
          style={{ background: 'hsl(var(--bg-elevated))' }}
        >
          <div
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{
              background: ({
                STRUCTURE: 'hsl(210,80%,60%)',
                OPENING: 'hsl(38,92%,58%)',
                FURNITURE: 'hsl(270,60%,66%)',
                ANNOTATION: 'hsl(0,0%,60%)',
              } as Record<string, string>)[layer.id] || 'hsl(0,0%,60%)',
            }}
          />
          <span
            className="flex-1 text-xs font-medium"
            style={{ color: layer.visible ? 'hsl(var(--text-primary))' : 'hsl(var(--text-muted))' }}
          >
            {layer.name}
          </span>
          <button
            className="toolbar-btn"
            style={{ width: 26, height: 26 }}
            onClick={() => toggleLock(layer.id as LayerType)}
            title={layer.locked ? 'Unlock' : 'Lock'}
          >
            {layer.locked ? <Lock size={12} /> : <Unlock size={12} />}
          </button>
          <button
            className="toolbar-btn"
            style={{ width: 26, height: 26 }}
            onClick={() => toggleVis(layer.id as LayerType)}
            title={layer.visible ? 'Hide' : 'Show'}
          >
            {layer.visible ? <Eye size={12} /> : <EyeOff size={12} />}
          </button>
        </div>
      ))}
    </div>
  );
}

function ToolsPane() {
  const mode = useProjectStore((s) => s.mode);
  const activeTool = useProjectStore((s) => s.activeTool);
  const setTool = useProjectStore((s) => s.setActiveTool);

  const studioTools = [
    { id: 'select' as const, icon: MousePointer, label: 'Select', desc: 'Click & Shift+Click' },
    { id: 'pan' as const, icon: Hand, label: 'Pan', desc: 'Middle-mouse or Space+drag' },
    { id: 'viewport-crop' as const, icon: Crop, label: 'Viewport Crop', desc: 'Draw scale bounding box' },
  ];

  const boardTools = [
    { id: 'select' as const, icon: MousePointer, label: 'Select', desc: 'Move & resize elements' },
    { id: 'pan' as const, icon: Hand, label: 'Pan', desc: 'Navigate the board' },
  ];

  const tools = mode === 'studio' ? studioTools : boardTools;

  return (
    <div className="flex flex-col gap-2 p-3">
      {tools.map(({ id, icon: Icon, label, desc }) => (
        <button
          key={id}
          id={`tool-${id}`}
          onClick={() => setTool(id)}
          className="flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all"
          style={{
            background: activeTool === id ? 'hsla(158,64%,52%,0.12)' : 'hsl(var(--bg-elevated))',
            border: activeTool === id ? '1px solid hsla(158,64%,52%,0.28)' : '1px solid transparent',
          }}
        >
          <Icon size={16} style={{ color: activeTool === id ? 'hsl(var(--brand-primary))' : 'hsl(var(--text-muted))' }} />
          <div>
            <p className="text-xs font-semibold" style={{ color: 'hsl(var(--text-primary))' }}>{label}</p>
            <p className="text-xs" style={{ color: 'hsl(var(--text-muted))' }}>{desc}</p>
          </div>
        </button>
      ))}
    </div>
  );
}

// Color palettes per template preset — applied to all rooms as a batch
const TEMPLATE_PRESETS: { label: string; fill: string; opacity: number; desc: string }[] = [
  { label: 'Nordic Minimal',    fill: '#e2e8f0', opacity: 0.18, desc: 'Cool whites & soft greys' },
  { label: 'Brutalist Concrete',fill: '#6b7280', opacity: 0.30, desc: 'Raw concrete greys' },
  { label: 'Warm Terracotta',   fill: '#b45309', opacity: 0.22, desc: 'Earthy oranges & clay' },
  { label: 'Dark Studio',       fill: '#1e293b', opacity: 0.50, desc: 'Deep charcoal tones' },
  { label: 'Blueprint',         fill: '#1d4ed8', opacity: 0.20, desc: 'Classic technical blue' },
  { label: 'Forest Green',      fill: '#166534', opacity: 0.22, desc: 'Natural sage & moss' },
];

function TemplatesPane() {
  const objects = useGeometryStore((s) => s.objects);
  const addToast = useUiStore((s) => s.addToast);

  const applyPreset = (preset: typeof TEMPLATE_PRESETS[number]) => {
    const allIds = Array.from(objects.keys());
    if (allIds.length === 0) {
      addToast({ type: 'info', message: 'No rooms loaded yet', duration: 2000 });
      return;
    }

    const geometryStore = useGeometryStore.getState();
    const oldStyles = new Map<string, import('@/stores/geometry-store').RoomStyle>();
    allIds.forEach((id) => {
      oldStyles.set(id, geometryStore.getRoomStyle(id));
    });

    useProjectStore.getState().executeCommand({
      label: `Apply Theme: ${preset.label}`,
      execute: () => {
        geometryStore.setRoomStyles(allIds, { fillColor: preset.fill, fillOpacity: preset.opacity, patternId: null });
        allIds.forEach((id) => {
          CanvasCommandBus.dispatch({
            type: 'OBJECT_STYLE_CHANGED',
            ids: [id],
            style: { fillColor: preset.fill, fillOpacity: preset.opacity },
          });
        });
      },
      undo: () => {
        allIds.forEach((id) => {
          const old = oldStyles.get(id);
          if (old) {
            geometryStore.setRoomStyle(id, old);
            CanvasCommandBus.dispatch({
              type: 'OBJECT_STYLE_CHANGED',
              ids: [id],
              style: old,
            });
          }
        });
      },
    });

    addToast({ type: 'success', message: `Applied "${preset.label}"`, duration: 2000 });
  };

  return (
    <div className="flex flex-col gap-2 p-3">
      <p className="text-xs px-1 mb-1" style={{ color: 'hsl(var(--text-muted))' }}>
        Apply a colour theme to all rooms
      </p>
      {TEMPLATE_PRESETS.map((p) => (
        <button
          key={p.label}
          onClick={() => applyPreset(p)}
          className="text-left px-4 py-3 rounded-xl text-xs font-medium transition-all hover:scale-[1.02] active:scale-[0.98]"
          style={{
            background: 'hsl(var(--bg-elevated))',
            color: 'hsl(var(--text-secondary))',
            border: '1px solid transparent',
            borderLeftColor: p.fill,
            borderLeftWidth: '3px',
          }}
        >
          <span style={{ color: 'hsl(var(--text-primary))' }}>{p.label}</span>
          <br />
          <span style={{ color: 'hsl(var(--text-muted))' }}>{p.desc}</span>
        </button>
      ))}
    </div>
  );
}

type ElementDef = { label: string; type: string; desc: string };

const ELEMENT_DEFS: ElementDef[] = [
  { label: 'Text Block',   type: 'text',         desc: 'Free text annotation' },
  { label: 'Scale Bar',    type: 'scale-bar',    desc: 'Metric reference bar' },
  { label: 'North Arrow',  type: 'north-arrow',  desc: 'Orientation indicator' },
  { label: 'Rectangle',    type: 'rect',         desc: 'Rectangular shape' },
  { label: 'Circle',       type: 'circle',       desc: 'Circular shape' },
  { label: 'Annotation',   type: 'annotation',   desc: 'Leader line label' },
];

function ElementsPane() {
  const addToast = useUiStore((s) => s.addToast);
  const setTool  = useProjectStore((s) => s.setActiveTool);
  const setPlacing = useProjectStore((s) => s.setPlacingElement);

  const handleAdd = (el: ElementDef) => {
    setTool('select');
    setPlacing(el.type);
    addToast({
      type: 'info',
      message: `"${el.label}" placement — click on canvas`,
      duration: 3000,
    });
  };

  return (
    <div className="flex flex-col gap-2 p-3">
      <p className="text-xs px-1 mb-1" style={{ color: 'hsl(var(--text-muted))' }}>
        Click an element to begin placing it
      </p>
      <div className="grid grid-cols-2 gap-2">
        {ELEMENT_DEFS.map((el) => (
          <button
            key={el.type}
            id={`element-${el.type}`}
            onClick={() => handleAdd(el)}
            className="flex flex-col items-center gap-2 p-3 rounded-xl text-xs font-medium transition-all hover:scale-[1.03] active:scale-95"
            style={{
              background: 'hsl(var(--bg-elevated))',
              color: 'hsl(var(--text-secondary))',
              border: '1px solid hsl(var(--border-subtle))',
            }}
            title={el.desc}
          >
            <PlusCircle size={18} style={{ color: 'hsl(var(--brand-primary))' }} />
            {el.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function UploadsPane() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const addToast = useUiStore((s) => s.addToast);

  const processFile = (file: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const json = JSON.parse(ev.target?.result as string);
        // Accept either a raw floor plan array or {objects: [...]}
        const raw = Array.isArray(json) ? json : json.objects ?? json.rooms ?? [];
        if (!Array.isArray(raw) || raw.length === 0) {
          addToast({ type: 'error', message: 'No geometry found in file', duration: 3000 });
          return;
        }
        // Convert to GeometryObjects — full shim including required fields
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const now = new Date().toISOString();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const objs = raw.map((r: any, i: number) => ({
          id: r.id ?? `upload-${i}`,
          type: (r.type ?? 'room') as import('@/types/geometry').GeometryType,
          layerId: r.layerId ?? r.layer ?? 'STRUCTURE',
          geometry: r.geometry ?? {
            type: 'polygon' as const,
            coordinates: r.points ?? [],
            bbox: r.bbox ?? { minX: 0, minY: 0, maxX: 0, maxY: 0 },
          },
          style: r.style ?? {
            fillColor: '#166534',
            fillOpacity: 0.22,
            strokeColor: '#1a4731',
            strokeWidth: 1,
            strokeDashArray: [],
            patternId: null,
          },
          metadata: r.metadata ?? {
            name: r.name ?? `Room ${i + 1}`,
            areaSqM: r.areaSqM ?? null,
            areaSqFt: r.areaSqFt ?? null,
            perimeter: r.perimeter ?? null,
            tags: r.tags ?? [],
            properties: r.properties ?? {},
          },
          relationships: r.relationships ?? {
            parentId: null,
            childIds: [],
            linkedBoardElementIds: [],
          },
          transform: r.transform ?? {
            x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1,
          },
          version: r.version ?? 1,
          createdAt: r.createdAt ?? now,
          updatedAt: now,
        } satisfies import('@/types/geometry').GeometryObject));

        const geometryStore = useGeometryStore.getState();
        const oldObjects = Array.from(geometryStore.objects.values());

        useProjectStore.getState().executeCommand({
          label: 'Upload Floor Plan',
          execute: () => {
            geometryStore.loadObjects(objs);
            CanvasCommandBus.dispatch({ type: 'GEOMETRY_LOADED', objects: objs });
          },
          undo: () => {
            geometryStore.loadObjects(oldObjects);
            CanvasCommandBus.dispatch({ type: 'GEOMETRY_LOADED', objects: oldObjects });
          },
        });

        addToast({ type: 'success', message: `Loaded ${objs.length} objects from "${file.name}"`, duration: 3000 });
      } catch {
        addToast({ type: 'error', message: 'Invalid JSON — could not parse file', duration: 3000 });
      }
    };
    reader.readAsText(file);
  };

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    processFile(files[0]);
  };

  return (
    <div className="flex flex-col items-center gap-3 p-4">
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,.geojson"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <div
        className="w-full rounded-xl border-2 border-dashed flex flex-col items-center gap-2 py-8 cursor-pointer transition-colors"
        style={{ borderColor: 'hsl(var(--border-default))' }}
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = 'hsl(var(--brand-primary))'; }}
        onDragLeave={(e) => { e.currentTarget.style.borderColor = 'hsl(var(--border-default))'; }}
        onDrop={(e) => {
          e.preventDefault();
          e.currentTarget.style.borderColor = 'hsl(var(--border-default))';
          handleFiles(e.dataTransfer.files);
        }}
      >
        <Upload size={22} style={{ color: 'hsl(var(--text-muted))' }} />
        <p className="text-xs text-center" style={{ color: 'hsl(var(--text-muted))' }}>
          Drag & drop a JSON floor plan or<br />
          <span style={{ color: 'hsl(var(--brand-primary))' }}>click to browse files</span>
        </p>
        <p className="text-xs" style={{ color: 'hsl(var(--text-muted))', opacity: 0.6 }}>Accepts .json · .geojson</p>
      </div>
    </div>
  );
}

function ProjectsPane() {
  return (
    <div className="flex flex-col gap-2 p-3">
      <p className="text-xs" style={{ color: 'hsl(var(--text-muted))' }}>Reference other project files</p>
    </div>
  );
}

// ─── Main Sidebar ─────────────────────────────────────────────────────────

export default function LeftSidebar() {
  const mode = useProjectStore((s) => s.mode);
  const activeTab = useUiStore((s) => s.activePanel);
  const isPaneOpen = useUiStore((s) => s.isPaneOpen);
  const setActiveTab = useUiStore((s) => s.setActivePanel);
  const selectedRoomIds = useSelectionStore((s) => s.selectedIds);

  const tabs = mode === 'studio' ? STUDIO_TABS : BOARD_TABS;

  const PANE_CONTENT: Partial<Record<ToolbarTab, React.ReactNode>> = {
    templates: <TemplatesPane />,
    patterns: selectedRoomIds.length > 0 ? <RoomInspectorPane /> : <PatternsPane />,
    elements: <ElementsPane />,
    layers: <LayersPane />,
    tools: <ToolsPane />,
    uploads: <UploadsPane />,
    projects: <ProjectsPane />,
  };

  const PANE_TITLES: Record<ToolbarTab, string> = {
    templates: 'Templates',
    patterns: selectedRoomIds.length > 0 ? 'Room Properties' : 'Patterns',
    elements: 'Elements',
    layers: 'CAD Layers',
    tools: 'Tools',
    uploads: 'Uploads',
    projects: 'Projects',
    properties: 'Properties',
  };

  return (
    <>
      {/* ── Desktop: Left vertical sidebar ───────────────────────────── */}
      <div className="hidden sm:flex h-full relative" style={{ zIndex: 40 }}>
        {/* Narrow Toolbar Strip */}
        <div
          className="flex flex-col items-center py-3 gap-1 flex-shrink-0"
          style={{
            width: 'var(--toolbar-w)',
            background: 'hsl(var(--bg-surface))',
            borderRight: '1px solid hsl(var(--border-subtle))',
          }}
        >
          {tabs.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              id={`toolbar-${id}`}
              className={`toolbar-btn ${activeTab === id && isPaneOpen ? 'active' : ''}`}
              title={label}
              onClick={() => setActiveTab(id)}
            >
              <Icon size={18} />
            </button>
          ))}
        </div>

        {/* Contextual Pane */}
        {isPaneOpen && activeTab && (
          <div
            className="flex flex-col pane-enter overflow-hidden"
            style={{
              width: 'var(--pane-w)',
              background: 'hsl(var(--bg-surface))',
              borderRight: '1px solid hsl(var(--border-subtle))',
              position: 'absolute',
              left: 'var(--toolbar-w)',
              top: 0,
              bottom: 0,
              zIndex: 30,
              boxShadow: 'var(--shadow-md)',
            }}
          >
            <PaneHeader
              title={PANE_TITLES[activeTab]}
              onClose={() => setActiveTab(null)}
            />
            <div className="flex-1 overflow-y-auto">
              {PANE_CONTENT[activeTab]}
            </div>
          </div>
        )}
      </div>

      {/* ── Mobile: Bottom icon bar + slide-up sheet ───────────────── */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0" style={{ zIndex: 50 }}>
        {/* Slide-up pane */}
        {isPaneOpen && activeTab && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0"
              style={{ background: 'hsla(220,22%,7%,0.6)', zIndex: 48 }}
              onClick={() => setActiveTab(null)}
            />
            {/* Pane sheet */}
            <div
              className="fixed left-0 right-0 bottom-14 rounded-t-2xl overflow-hidden"
              style={{
                background: 'hsl(var(--bg-surface))',
                borderTop: '1px solid hsl(var(--border-subtle))',
                maxHeight: '65vh',
                zIndex: 49,
                boxShadow: '0 -12px 40px hsla(0,0%,0%,0.5)',
                animation: 'slideUp 0.25s cubic-bezier(0.16,1,0.3,1) both',
              }}
            >
              {/* Drag handle */}
              <div className="flex justify-center py-2">
                <div className="w-10 h-1 rounded-full" style={{ background: 'hsl(var(--border-default))' }} />
              </div>
              <PaneHeader
                title={PANE_TITLES[activeTab]}
                onClose={() => setActiveTab(null)}
              />
              <div className="overflow-y-auto" style={{ maxHeight: 'calc(65vh - 80px)' }}>
                {PANE_CONTENT[activeTab]}
              </div>
            </div>
          </>
        )}

        {/* Bottom icon bar */}
        <div
          className="flex items-center justify-around px-2 py-1"
          style={{
            height: '56px',
            background: 'hsl(var(--bg-surface))',
            borderTop: '1px solid hsl(var(--border-subtle))',
          }}
        >
          {tabs.slice(0, 6).map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              id={`mobile-toolbar-${id}`}
              className="flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl transition-all"
              style={{
                color: activeTab === id && isPaneOpen ? 'hsl(var(--brand-primary))' : 'hsl(var(--text-muted))',
                background: activeTab === id && isPaneOpen ? 'hsla(158,64%,52%,0.12)' : 'transparent',
              }}
              onClick={() => setActiveTab(id)}
            >
              <Icon size={20} />
              <span className="text-[9px] font-medium">{label}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

