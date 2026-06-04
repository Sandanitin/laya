// ─── Canvas Command Types ────────────────────────────────────────────────────
// All React → PixiJS communication flows through these typed commands.
// The CanvasCommandBus emits these; the CanvasEngine processes them.

import type { BBox, GeometryObject, Layer } from './geometry';

export type ActiveTool = 'select' | 'pan' | 'viewport-crop' | 'paint-select' | 'annotate';

export type SelectionMode = 'single' | 'multi' | 'box' | 'polygon' | 'paint' | 'magic' | 'rule';

// ─── Commands ────────────────────────────────────────────────────────────────

export type CanvasCommand =
  // Geometry
  | { type: 'GEOMETRY_LOADED'; objects: GeometryObject[] }
  | { type: 'GEOMETRY_UPDATED'; ids: string[]; objects: GeometryObject[] }
  | { type: 'GEOMETRY_DELETED'; ids: string[] }
  // Layer
  | { type: 'LAYER_VISIBILITY_CHANGED'; layerId: string; visible: boolean }
  | { type: 'LAYER_LOCK_CHANGED'; layerId: string; locked: boolean }
  | { type: 'LAYER_ORDER_CHANGED'; layers: Layer[] }
  | { type: 'LAYER_ISOLATED'; layerId: string | null }
  // Selection
  | { type: 'SELECTION_CHANGED'; ids: string[] }
  | { type: 'HOVER_CHANGED'; id: string | null }
  | { type: 'SELECTION_MODE_CHANGED'; mode: SelectionMode }
  // Tool
  | { type: 'TOOL_CHANGED'; tool: ActiveTool }
  // Viewport
  | { type: 'VIEWPORT_FIT_ALL' }
  | { type: 'VIEWPORT_ZOOM_TO'; scale: number; cx: number; cy: number }
  | { type: 'VIEWPORT_PAN_TO'; worldX: number; worldY: number }
  // Style
  | { type: 'OBJECT_STYLE_CHANGED'; ids: string[]; style: Partial<GeometryObject['style']> }
  // Performance
  | { type: 'LOD_CHANGED'; level: 'full' | 'normal' | 'simplified' | 'overview' }
  // Collaboration
  | { type: 'CURSOR_MOVED'; userId: string; worldX: number; worldY: number; color: string; name: string }
  | { type: 'CURSOR_LEFT'; userId: string }
  | { type: 'OBJECT_LOCKED'; id: string; userId: string; color: string }
  | { type: 'OBJECT_UNLOCKED'; id: string };

// ─── Canvas Events (PixiJS → React) ──────────────────────────────────────────

export type CanvasEvent =
  | { type: 'OBJECT_CLICKED'; id: string; multiSelect: boolean }
  | { type: 'OBJECT_HOVERED'; id: string | null }
  | { type: 'CANVAS_CLICKED'; worldX: number; worldY: number }
  | { type: 'BOX_SELECT_COMPLETE'; bbox: BBox }
  | { type: 'CROP_BOX_COMPLETE'; bbox: BBox }
  | { type: 'VIEWPORT_CHANGED'; pan: { x: number; y: number }; zoom: number }
  | { type: 'FPS_REPORT'; fps: number; visibleObjects: number };

// ─── Vector Render Styles (by layer type) ────────────────────────────────────

export interface VectorRenderStyle {
  color: number;   // hex int e.g. 0xe2e8f0
  width: number;
  alpha: number;
}

export const VECTOR_RENDER_STYLES: Record<string, VectorRenderStyle> = {
  STRUCTURE:  { color: 0xe2e8f0, width: 2.5, alpha: 0.95 },
  OPENING:    { color: 0xfbbf24, width: 1.5, alpha: 0.85 },
  FURNITURE:  { color: 0x818cf8, width: 1.0, alpha: 0.70 },
  ANNOTATION: { color: 0x64748b, width: 0.8, alpha: 0.50 },
};

// ─── Coordinate Transform ────────────────────────────────────────────────────

export const CANVAS_SCALE = 0.72;
export const CANVAS_OFFSET_X = 60;
export const CANVAS_OFFSET_Y = 60;

export function toScreen(pt: [number, number]): [number, number] {
  return [pt[0] * CANVAS_SCALE + CANVAS_OFFSET_X, pt[1] * CANVAS_SCALE + CANVAS_OFFSET_Y];
}

export function toWorld(screenX: number, screenY: number): [number, number] {
  return [
    (screenX - CANVAS_OFFSET_X) / CANVAS_SCALE,
    (screenY - CANVAS_OFFSET_Y) / CANVAS_SCALE,
  ];
}
