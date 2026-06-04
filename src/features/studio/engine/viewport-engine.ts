/* eslint-disable @typescript-eslint/no-explicit-any */
import { CanvasCommandBus } from '@/lib/command-bus';

// ─── Constants ────────────────────────────────────────────────────────────────
const PLAN_CENTER_X = 502;
const PLAN_CENTER_Y = 441;
const PLAN_W = 800;
const PLAN_H = 700;
const PADDING = 60;

// ─── ViewportEngine ───────────────────────────────────────────────────────────
// Owns pan, zoom, fit operations on the pixi-viewport instance.
// Emits VIEWPORT_CHANGED events to React when pan/zoom changes.

export class ViewportEngine {
  private viewport: any;

  constructor(viewport: any, screenW: number, screenH: number) {
    this.viewport = viewport;

    viewport
      .drag({ mouseButtons: 'middle' })
      .pinch()
      .wheel({ smooth: 5 } as any)
      .decelerate()
      .clampZoom({ minScale: 0.05, maxScale: 12 });

    // Report viewport changes to React
    viewport.on('moved', () => this.reportState());
    viewport.on('zoomed', () => this.reportState());

    this.fitToContent(screenW, screenH);
  }

  fitToContent(screenW: number, screenH: number): void {
    const fitScale = Math.min(
      (screenW - PADDING * 2) / PLAN_W,
      (screenH - PADDING * 2) / PLAN_H,
    );
    this.viewport.setZoom(fitScale, true);
    this.viewport.moveCenter(PLAN_CENTER_X, PLAN_CENTER_Y);
    this.reportState();
  }

  zoomTo(scale: number, cx: number, cy: number): void {
    this.viewport.snap(cx, cy, { removeOnComplete: true });
    this.viewport.setZoom(scale, true);
    this.reportState();
  }

  panTo(worldX: number, worldY: number): void {
    this.viewport.moveCenter(worldX, worldY);
    this.reportState();
  }

  private reportState(): void {
    const vp = this.viewport;
    CanvasCommandBus.emit({
      type: 'VIEWPORT_CHANGED',
      pan: { x: vp.left, y: vp.top },
      zoom: vp.scale.x,
    });
  }

  get currentZoom(): number {
    return this.viewport.scale.x;
  }

  get worldBounds() {
    return {
      left: this.viewport.left,
      top: this.viewport.top,
      right: this.viewport.right,
      bottom: this.viewport.bottom,
    };
  }
}
