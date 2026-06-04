/* eslint-disable @typescript-eslint/no-explicit-any */
import type { CanvasCommand } from '@/types/canvas';
import { CanvasCommandBus } from '@/lib/command-bus';
import { ViewportEngine } from './viewport-engine';
import { GeometryEngine } from './geometry-engine';
import { LayerEngine } from './layer-engine';
import { SelectionEngine } from './selection-engine';
import { PerformanceEngine } from './performance-engine';
import { InteractionEngine } from './interaction-engine';

// ─── CanvasEngine ─────────────────────────────────────────────────────────────
// Root engine. Owns the PIXI.Application lifecycle.
// All sub-engines are children of this engine.
// React never touches PIXI objects — it dispatches CanvasCommands.

export class CanvasEngine {
  private app: any = null;
  private viewport: any = null;
  private cleanupFns: Array<() => void> = [];

  // Sub-engines
  viewportEngine!: ViewportEngine;
  geometryEngine!: GeometryEngine;
  layerEngine!: LayerEngine;
  selectionEngine!: SelectionEngine;
  performanceEngine!: PerformanceEngine;
  interactionEngine!: InteractionEngine;

  private resizeObserver: ResizeObserver | null = null;

  async init(container: HTMLDivElement): Promise<void> {
    const [pixiModule, { Viewport }] = await Promise.all([
      import('pixi.js'),
      import('pixi-viewport'),
    ]);
    const { Application, Container } = pixiModule;
    (globalThis as any).PIXI = pixiModule;
    (globalThis as any).__PIXI_CONTAINER_CLASS__ = Container;

    const w = container.clientWidth;
    const h = container.clientHeight;

    // ── PIXI Application ────────────────────────────────────────────────────
    this.app = new Application();
    await this.app.init({
      width: w,
      height: h,
      backgroundColor: 0x0d1117,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    });

    this.app.canvas.style.width = '100%';
    this.app.canvas.style.height = '100%';
    container.appendChild(this.app.canvas);

    // ── pixi-viewport ────────────────────────────────────────────────────────
    this.viewport = new Viewport({
      screenWidth: w,
      screenHeight: h,
      worldWidth: 1600,
      worldHeight: 1400,
      events: this.app.renderer.events,
    });

    this.viewport.sortableChildren = true;
    this.app.stage.addChild(this.viewport);

    // ── Sub-engines (order matters — layer before geometry before selection) ─
    this.viewportEngine   = new ViewportEngine(this.viewport, w, h);
    this.layerEngine      = new LayerEngine(this.viewport);
    this.geometryEngine   = new GeometryEngine(this.viewport, this.layerEngine);
    this.selectionEngine  = new SelectionEngine(this.viewport);
    this.performanceEngine = new PerformanceEngine(this.viewport, this.app);
    this.interactionEngine = new InteractionEngine(this.viewport, this.app.canvas);

    // ── Fit to floor plan on init ────────────────────────────────────────────
    this.viewportEngine.fitToContent(w, h);

    // ── Wire command bus ─────────────────────────────────────────────────────
    this.subscribeToCommands();

    // ── Resize handling ──────────────────────────────────────────────────────
    this.resizeObserver = new ResizeObserver(() => {
      const nw = container.clientWidth;
      const nh = container.clientHeight;
      this.app.renderer.resize(nw, nh);
      this.viewport.resize(nw, nh);
    });
    this.resizeObserver.observe(container);
  }

  private subscribeToCommands(): void {
    const on = <T extends CanvasCommand['type']>(
      type: T,
      handler: (cmd: Extract<CanvasCommand, { type: T }>) => void
    ) => {
      const unsub = CanvasCommandBus.onCommand(type, handler);
      this.cleanupFns.push(unsub);
    };

    // Geometry
    on('GEOMETRY_LOADED', (cmd) => this.geometryEngine.loadAll(cmd.objects));
    on('GEOMETRY_UPDATED', (cmd) => this.geometryEngine.update(cmd.objects));
    on('GEOMETRY_DELETED', (cmd) => this.geometryEngine.delete(cmd.ids));

    // Layer
    on('LAYER_VISIBILITY_CHANGED', (cmd) =>
      this.layerEngine.setVisibility(cmd.layerId, cmd.visible));
    on('LAYER_LOCK_CHANGED', (cmd) =>
      this.layerEngine.setLock(cmd.layerId, cmd.locked));
    on('LAYER_ISOLATED', (cmd) =>
      this.layerEngine.setIsolation(cmd.layerId));

    // Selection
    on('SELECTION_CHANGED', (cmd) =>
      this.selectionEngine.setSelection(cmd.ids));
    on('OBJECT_STYLE_CHANGED', (cmd) =>
      this.geometryEngine.applyStyleOverrides(cmd.ids, cmd.style));

    // Tool
    on('TOOL_CHANGED', (cmd) =>
      this.interactionEngine.setTool(cmd.tool));

    // Viewport
    on('VIEWPORT_FIT_ALL', () => {
      const { width, height } = this.app.screen;
      this.viewportEngine.fitToContent(width, height);
    });
  }

  destroy(): void {
    this.cleanupFns.forEach((fn) => fn());
    this.cleanupFns = [];
    this.resizeObserver?.disconnect();
    this.performanceEngine?.destroy();
    if (this.app) {
      this.app.destroy({ removeView: true });
      this.app = null;
    }
    CanvasCommandBus.clear();
  }
}
