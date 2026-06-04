/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useProjectStore } from '@/stores/project-store';
import { useSelectionStore } from '@/stores/selection-store';
import { useGeometryStore } from '@/stores/geometry-store';
import { useLayerStore } from '@/stores/layer-store';
import { useUiStore } from '@/stores/ui-store';
import { useViewportStore } from '@/stores/viewport-store';

import { CanvasEngine } from '@/features/studio/engine/canvas-engine';
import { CanvasCommandBus } from '@/lib/command-bus';
import { convertRawFloorPlanToGeometryObjects } from '@/lib/floorplan-parser';
import { loadWorkspaceFromCache } from '@/hooks/use-autosave';
import floorPlanRaw from '@/data/mockFloorPlan.json';
import BoardCanvas from './BoardCanvas';

export default function CadCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<CanvasEngine | null>(null);

  const [showCropDialog, setShowCropDialog] = useState(false);
  const [cropBounds, setCropBounds] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null);
  const [cropName, setCropName] = useState('Floor Plan View');
  const [cropScale, setCropScale] = useState('1:100');

  // Domain Store Bindings
  const mode = useProjectStore((s) => s.mode);
  const activeTool = useProjectStore((s) => s.activeTool);
  const saveViewAsset = useProjectStore((s) => s.saveViewAsset);

  const selectedRoomIds = useSelectionStore((s) => s.selectedIds);
  const selectOne = useSelectionStore((s) => s.selectOne);
  const selectMany = useSelectionStore((s) => s.selectMany);
  const toggleOne = useSelectionStore((s) => s.toggleOne);
  const clearSelection = useSelectionStore((s) => s.clearSelection);
  const setHover = useSelectionStore((s) => s.setHover);

  const roomStyles = useGeometryStore((s) => s.roomStyles);
  const layers = useLayerStore((s) => s.layers);
  const openPanel = useUiStore((s) => s.openPanel);

  // ─── Initialize Engine ──────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current) return;
    let active = true;
    let engine: CanvasEngine | null = null;

    async function init() {
      // 1. Try to load from IndexedDB cache first
      const projectId = useProjectStore.getState().id;
      const loadedFromCache = await loadWorkspaceFromCache(projectId);

      let objects;
      if (loadedFromCache) {
        objects = Array.from(useGeometryStore.getState().objects.values());
      } else {
        // Fallback to raw JSON floor plan
        objects = convertRawFloorPlanToGeometryObjects(floorPlanRaw);
        useGeometryStore.getState().loadObjects(objects);
      }

      // 2. Instantiate and mount PixiJS root engine
      engine = new CanvasEngine();
      engineRef.current = engine;
      if (!active || !containerRef.current) {
        engine.destroy();
        return;
      }
      await engine.init(containerRef.current);

      if (!active) {
        engine.destroy();
        return;
      }

      // 3. Populate engine with the loaded geometry objects
      CanvasCommandBus.dispatch({ type: 'GEOMETRY_LOADED', objects });

      // 4. Set initial selections, tools, and styles
      CanvasCommandBus.dispatch({ type: 'SELECTION_CHANGED', ids: useSelectionStore.getState().selectedIds });
      CanvasCommandBus.dispatch({ type: 'TOOL_CHANGED', tool: useProjectStore.getState().activeTool });

      // Apply initial style overrides
      useGeometryStore.getState().roomStyles.forEach((style, id) => {
        CanvasCommandBus.dispatch({
          type: 'OBJECT_STYLE_CHANGED',
          ids: [id],
          style: {
            fillColor: style.fillColor,
            fillOpacity: style.fillOpacity,
          },
        });
      });
    }

    init();

    // ─── Subscribe to Events from PixiJS Engine ──────────────────────────
    const cleanupFns = [
      CanvasCommandBus.onEvent('OBJECT_CLICKED', (evt) => {
        if (evt.multiSelect) {
          toggleOne(evt.id);
        } else {
          selectOne(evt.id);
          openPanel('patterns');
        }
      }),

      CanvasCommandBus.onEvent('OBJECT_HOVERED', (evt) => {
        setHover(evt.id);
      }),

      CanvasCommandBus.onEvent('CANVAS_CLICKED', (evt) => {
        clearSelection();
        const placing = useProjectStore.getState().placingElement;
        if (placing) {
          const x = evt.worldX;
          const y = evt.worldY;
          
          let coordinates: [number, number][] = [];
          let geomType: 'polygon' | 'polyline' | 'point' = 'polygon';
          const style = {
            fillColor: '#818cf8' as string | null,
            fillOpacity: 0.3,
            strokeColor: '#6366f1',
            strokeWidth: 2,
            strokeDashArray: [] as number[],
            patternId: null as string | null,
          };
          let name = 'New Element';
          let gType: import('@/types/geometry').GeometryType = 'annotation';
          
          if (placing === 'rect') {
            coordinates = [
              [x - 30, y - 20],
              [x + 30, y - 20],
              [x + 30, y + 20],
              [x - 30, y + 20]
            ];
            geomType = 'polygon';
            style.fillColor = '#3b82f6';
            style.strokeColor = '#2563eb';
            name = 'Rectangle';
            gType = 'symbol';
          } else if (placing === 'circle') {
            const radius = 25;
            for (let i = 0; i < 16; i++) {
              const angle = (i / 16) * Math.PI * 2;
              coordinates.push([
                x + Math.cos(angle) * radius,
                y + Math.sin(angle) * radius
              ]);
            }
            geomType = 'polygon';
            style.fillColor = '#10b981';
            style.strokeColor = '#059669';
            name = 'Circle';
            gType = 'symbol';
          } else if (placing === 'text') {
            coordinates = [
              [x - 40, y - 12],
              [x + 40, y - 12],
              [x + 40, y + 12],
              [x - 40, y + 12]
            ];
            geomType = 'polygon';
            style.fillColor = '#8b5cf6';
            style.strokeColor = '#7c3aed';
            name = 'Text Block';
            gType = 'annotation';
          } else if (placing === 'scale-bar') {
            coordinates = [
              [x - 50, y],
              [x + 50, y],
              [x + 50, y - 8],
              [x + 50, y + 8],
              [x - 50, y - 8],
              [x - 50, y + 8],
            ];
            geomType = 'polyline';
            style.fillColor = null;
            style.strokeColor = '#e2e8f0';
            name = 'Scale Bar';
            gType = 'annotation';
          } else if (placing === 'north-arrow') {
            coordinates = [
              [x, y - 30],
              [x + 12, y],
              [x + 4, y],
              [x + 4, y + 25],
              [x - 4, y + 25],
              [x - 4, y],
              [x - 12, y]
            ];
            geomType = 'polygon';
            style.fillColor = '#fbbf24';
            style.strokeColor = '#d97706';
            name = 'North Arrow';
            gType = 'annotation';
          } else if (placing === 'annotation') {
            coordinates = [
              [x - 40, y - 40],
              [x, y],
              [x - 8, y],
              [x, y],
              [x, y - 8],
            ];
            geomType = 'polyline';
            style.fillColor = null;
            style.strokeColor = '#94a3b8';
            name = 'Annotation Leader';
            gType = 'annotation';
          }
          
          const newObj: import('@/types/geometry').GeometryObject = {
            id: `element-${Date.now()}`,
            type: gType,
            layerId: gType === 'annotation' ? 'ANNOTATION' : 'FURNITURE',
            geometry: {
              type: geomType,
              coordinates,
              bbox: {
                minX: coordinates.reduce((min, pt) => Math.min(min, pt[0]), Infinity),
                minY: coordinates.reduce((min, pt) => Math.min(min, pt[1]), Infinity),
                maxX: coordinates.reduce((max, pt) => Math.max(max, pt[0]), -Infinity),
                maxY: coordinates.reduce((max, pt) => Math.max(max, pt[1]), -Infinity),
              }
            },
            style,
            metadata: {
              name,
              areaSqM: null,
              areaSqFt: null,
              perimeter: null,
              tags: [],
              properties: {},
            },
            relationships: {
              parentId: null,
              childIds: [],
              linkedBoardElementIds: [],
            },
            transform: {
              x: 0,
              y: 0,
              rotation: 0,
              scaleX: 1,
              scaleY: 1,
            },
            version: 1,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          const geometryStore = useGeometryStore.getState();
          useProjectStore.getState().executeCommand({
            label: `Place ${name}`,
            execute: () => {
              geometryStore.upsertObject(newObj);
              CanvasCommandBus.dispatch({ type: 'GEOMETRY_UPDATED', ids: [newObj.id], objects: [newObj] });
            },
            undo: () => {
              geometryStore.deleteObject(newObj.id);
              CanvasCommandBus.dispatch({ type: 'GEOMETRY_DELETED', ids: [newObj.id] });
            }
          });

          useProjectStore.getState().setPlacingElement(null);
          useUiStore.getState().addToast({
            type: 'success',
            message: `Placed "${name}"`,
            duration: 2000,
          });
        }
      }),

      CanvasCommandBus.onEvent('BOX_SELECT_COMPLETE', (evt) => {
        // Simple bounding box intersection check
        const bbox = evt.bbox;
        const objects = useGeometryStore.getState().objects;
        const ids: string[] = [];

        objects.forEach((obj) => {
          const oB = obj.geometry.bbox;
          const overlaps = !(
            oB.maxX < bbox.minX ||
            oB.minX > bbox.maxX ||
            oB.maxY < bbox.minY ||
            oB.minY > bbox.maxY
          );
          if (overlaps) ids.push(obj.id);
        });

        selectMany(ids);
      }),

      CanvasCommandBus.onEvent('CROP_BOX_COMPLETE', (evt) => {
        setCropBounds({
          x1: evt.bbox.minX,
          y1: evt.bbox.minY,
          x2: evt.bbox.maxX,
          y2: evt.bbox.maxY,
        });
        setShowCropDialog(true);
      }),

      CanvasCommandBus.onEvent('VIEWPORT_CHANGED', (evt) => {
        // Update Viewport State
        const viewport = (engineRef.current as any)?.viewport;
        if (viewport) {
          useViewportStore.getState().setViewport(
            { x: viewport.center.x, y: viewport.center.y },
            evt.zoom,
            {
              left: viewport.left,
              top: viewport.top,
              right: viewport.right,
              bottom: viewport.bottom,
            }
          );
        }
      }),

      CanvasCommandBus.onEvent('FPS_REPORT', (evt) => {
        useViewportStore.getState().reportPerformance(evt.fps, evt.visibleObjects);
      }),
    ];

    return () => {
      active = false;
      cleanupFns.forEach((fn) => fn());
      if (engine) {
        engine.destroy();
        engineRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  // ─── Sync Selection Changes to PixiJS ──────────────────────────────────
  useEffect(() => {
    CanvasCommandBus.dispatch({ type: 'SELECTION_CHANGED', ids: selectedRoomIds });
  }, [selectedRoomIds]);

  // ─── Sync Tool Changes to PixiJS ───────────────────────────────────────
  useEffect(() => {
    CanvasCommandBus.dispatch({ type: 'TOOL_CHANGED', tool: activeTool });
  }, [activeTool]);

  // ─── Sync Style Overrides to PixiJS ─────────────────────────────────────
  useEffect(() => {
    roomStyles.forEach((style, id) => {
      CanvasCommandBus.dispatch({
        type: 'OBJECT_STYLE_CHANGED',
        ids: [id],
        style: {
          fillColor: style.fillColor,
          fillOpacity: style.fillOpacity,
        },
      });
    });
  }, [roomStyles]);

  // ─── Sync Layer Visibility/Lock States to PixiJS ───────────────────────
  useEffect(() => {
    layers.forEach((layer) => {
      CanvasCommandBus.dispatch({
        type: 'LAYER_VISIBILITY_CHANGED',
        layerId: layer.id,
        visible: layer.visible,
      });
      CanvasCommandBus.dispatch({
        type: 'LAYER_LOCK_CHANGED',
        layerId: layer.id,
        locked: layer.locked,
      });
    });
  }, [layers]);

  // ─── Save Crop Handler ─────────────────────────────────────────────────
  const handleSaveCrop = useCallback(() => {
    if (!cropBounds) return;
    saveViewAsset({ name: cropName, bounds: cropBounds, scale: cropScale });
    setShowCropDialog(false);
    setCropBounds(null);
  }, [cropBounds, cropName, cropScale, saveViewAsset]);

  // ─── Board Mode — interactive A3 sheet ───────────────────────────────────
  if (mode === 'board') {
    return <BoardCanvas />;
  }

  // ─── Studio Mode (PixiJS Canvas Container) ─────────────────────────────
  return (
    <div
      className="relative w-full h-full"
      style={{ background: 'hsl(var(--canvas-bg))' }}
    >
      {/* Placement cursor ring overlay — visible when an element is queued */}
      {useProjectStore.getState().placingElement && (
        <div
          className="absolute inset-0 pointer-events-none flex items-end justify-center pb-16"
          style={{ zIndex: 20 }}
        >
          <div
            className="px-4 py-2 rounded-xl text-xs font-semibold"
            style={{
              background: 'hsl(158 64% 52% / 0.15)',
              border: '1px solid hsl(var(--brand-primary))',
              color: 'hsl(var(--brand-primary))',
              backdropFilter: 'blur(8px)',
            }}
          >
            Click on the canvas to place the element · Esc to cancel
          </div>
        </div>
      )}
      <div
        ref={containerRef}
        className="w-full h-full"
        style={{
          cursor: useProjectStore.getState().placingElement ? 'crosshair' :
                  activeTool === 'pan' ? 'grab' :
                  activeTool === 'viewport-crop' ? 'crosshair' : 'default',
        }}
      />

      {/* Tool hint pill */}
      <div
        className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full text-xs pointer-events-none"
        style={{
          background: 'var(--glass-bg)',
          backdropFilter: 'blur(var(--glass-blur))',
          border: '1px solid var(--glass-border)',
          color: 'hsl(var(--text-muted))',
          whiteSpace: 'nowrap',
          zIndex: 10,
        }}
      >
        {activeTool === 'select' && 'Click to select · Shift+Click for multi-select · Drag to box select'}
        {activeTool === 'pan' && 'Middle-mouse drag or scroll to navigate'}
        {activeTool === 'viewport-crop' && 'Drag to define a cropped view area'}
      </div>

      {/* Crop Save Dialog */}
      {showCropDialog && cropBounds && (
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ background: 'hsla(220,22%,7%,0.6)', backdropFilter: 'blur(4px)', zIndex: 100 }}
        >
          <div
            className="w-80 rounded-2xl p-5 flex flex-col gap-4"
            style={{
              background: 'hsl(var(--bg-elevated))',
              border: '1px solid hsl(var(--border-default))',
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            <h3 className="text-sm font-bold" style={{ color: 'hsl(var(--text-primary))' }}>
              Save Viewport Crop
            </h3>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium" style={{ color: 'hsl(var(--text-secondary))' }}>View Name</label>
              <input
                value={cropName}
                onChange={(e) => setCropName(e.target.value)}
                className="rounded-lg px-3 py-2 text-sm outline-none"
                style={{
                  background: 'hsl(var(--bg-surface))',
                  border: '1px solid hsl(var(--border-default))',
                  color: 'hsl(var(--text-primary))',
                }}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium" style={{ color: 'hsl(var(--text-secondary))' }}>Real-World Scale</label>
              <select
                value={cropScale}
                onChange={(e) => setCropScale(e.target.value)}
                className="rounded-lg px-3 py-2 text-sm outline-none"
                style={{
                  background: 'hsl(var(--bg-surface))',
                  border: '1px solid hsl(var(--border-default))',
                  color: 'hsl(var(--text-primary))',
                }}
              >
                {['1:50', '1:100', '1:200', '1:500'].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <button
                className="flex-1 py-2 rounded-lg text-sm font-medium"
                style={{
                  background: 'hsl(var(--bg-overlay))',
                  color: 'hsl(var(--text-secondary))',
                  border: '1px solid hsl(var(--border-default))',
                }}
                onClick={() => setShowCropDialog(false)}
              >
                Cancel
              </button>
              <button
                id="save-viewport-crop"
                className="flex-1 py-2 rounded-lg text-sm font-bold"
                style={{ background: 'hsl(var(--brand-primary))', color: 'hsl(220,22%,7%)' }}
                onClick={handleSaveCrop}
              >
                Save View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
