import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ViewportBounds {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export type LodLevel = 'full' | 'normal' | 'simplified' | 'overview';

// ─── State ────────────────────────────────────────────────────────────────────

interface ViewportState {
  /** World coordinates of the center of the viewport */
  centerX: number;
  centerY: number;
  /** Current zoom scale */
  zoom: number;
  /** Viewport bounds in world coordinates */
  bounds: ViewportBounds;
  /** Current LOD level derived from zoom */
  lod: LodLevel;
  /** FPS (reported by PerformanceEngine) */
  fps: number;
  /** Visible object count (reported by PerformanceEngine) */
  visibleCount: number;

  // Actions
  setViewport: (center: { x: number; y: number }, zoom: number, bounds: ViewportBounds) => void;
  setLod: (lod: LodLevel) => void;
  reportPerformance: (fps: number, visibleCount: number) => void;
}

// ─── LOD thresholds ──────────────────────────────────────────────────────────

function computeLod(zoom: number): LodLevel {
  if (zoom >= 1.5) return 'full';
  if (zoom >= 0.5) return 'normal';
  if (zoom >= 0.1) return 'simplified';
  return 'overview';
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useViewportStore = create<ViewportState>()(
  immer((set) => ({
    centerX: 502,
    centerY: 441,
    zoom: 1,
    bounds: { left: 0, top: 0, right: 1400, bottom: 900 },
    lod: 'normal',
    fps: 60,
    visibleCount: 0,

    setViewport: (center, zoom, bounds) =>
      set((s) => {
        s.centerX = center.x;
        s.centerY = center.y;
        s.zoom = zoom;
        s.bounds = bounds;
        s.lod = computeLod(zoom);
      }),

    setLod: (lod) =>
      set((s) => {
        s.lod = lod;
      }),

    reportPerformance: (fps, visibleCount) =>
      set((s) => {
        s.fps = fps;
        s.visibleCount = visibleCount;
      }),
  }))
);
