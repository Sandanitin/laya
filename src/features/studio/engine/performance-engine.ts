/* eslint-disable @typescript-eslint/no-explicit-any */
import { CanvasCommandBus } from '@/lib/command-bus';
import { useGeometryStore } from '@/stores/geometry-store';
import { CANVAS_SCALE, CANVAS_OFFSET_X, CANVAS_OFFSET_Y } from '@/types/canvas';

export class PerformanceEngine {
  private viewport: any;
  private app: any;
  private cullingIntervalId: any;
  private fpsIntervalId: any;
  private frameCount = 0;
  private lastTime = performance.now();
  private lastFps = 60;
  private tickerFn: () => void;

  constructor(viewport: any, app: any) {
    this.viewport = viewport;
    this.app = app;

    // Track frames for FPS
    this.tickerFn = () => {
      this.frameCount++;
    };
    this.app.ticker.add(this.tickerFn);

    // Setup culling loop every 100ms
    this.cullingIntervalId = setInterval(() => this.runCulling(), 100);

    // Setup FPS reporting every 1s
    this.fpsIntervalId = setInterval(() => this.reportFps(), 1000);
  }

  private runCulling(): void {
    if (!this.viewport) return;

    const vpLeft = this.viewport.left;
    const vpRight = this.viewport.right;
    const vpTop = this.viewport.top;
    const vpBottom = this.viewport.bottom;

    const objects = useGeometryStore.getState().objects;
    // Traverse all children in all layers
    this.viewport.children.forEach((layerContainer: any) => {
      if (layerContainer.layerId) {
        layerContainer.children.forEach((child: any) => {
          if (child.geometryId) {
            const obj = objects.get(child.geometryId);
            if (obj) {
              const minX = obj.geometry.bbox.minX * CANVAS_SCALE + CANVAS_OFFSET_X;
              const maxX = obj.geometry.bbox.maxX * CANVAS_SCALE + CANVAS_OFFSET_X;
              const minY = obj.geometry.bbox.minY * CANVAS_SCALE + CANVAS_OFFSET_Y;
              const maxY = obj.geometry.bbox.maxY * CANVAS_SCALE + CANVAS_OFFSET_Y;

              const isVisible = !(
                maxX < vpLeft ||
                minX > vpRight ||
                maxY < vpTop ||
                minY > vpBottom
              );

              child.visible = isVisible;
            }
          }
        });
      }
    });

    // Level of Detail (LOD) check based on zoom
    const zoom = this.viewport.scale.x;
    let lodLevel: 'full' | 'normal' | 'simplified' | 'overview' = 'normal';
    if (zoom > 1.5) {
      lodLevel = 'full';
    } else if (zoom < 0.25) {
      lodLevel = 'overview';
    } else if (zoom < 0.5) {
      lodLevel = 'simplified';
    }

    CanvasCommandBus.dispatch({ type: 'LOD_CHANGED', level: lodLevel });
  }

  private reportFps(): void {
    const now = performance.now();
    const elapsed = now - this.lastTime;
    this.lastFps = Math.round((this.frameCount * 1000) / (elapsed || 1));
    this.frameCount = 0;
    this.lastTime = now;

    // Count visible objects
    let visibleObjects = 0;
    this.viewport.children.forEach((layerContainer: any) => {
      if (layerContainer.layerId) {
        layerContainer.children.forEach((child: any) => {
          if (child.visible) visibleObjects++;
        });
      }
    });

    CanvasCommandBus.emit({
      type: 'FPS_REPORT',
      fps: this.lastFps,
      visibleObjects,
    });
  }

  destroy(): void {
    clearInterval(this.cullingIntervalId);
    clearInterval(this.fpsIntervalId);
    if (this.app && this.app.ticker) {
      this.app.ticker.remove(this.tickerFn);
    }
  }
}
