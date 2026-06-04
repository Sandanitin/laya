/* eslint-disable @typescript-eslint/no-explicit-any */
import { useGeometryStore } from '@/stores/geometry-store';
import { toScreen } from '@/types/canvas';

function getPIXI(): any {
  return (globalThis as any).PIXI;
}

export class SelectionEngine {
  private viewport: any;
  private container: any = null;
  private selectionSet: Set<string> = new Set();

  constructor(viewport: any) {
    this.viewport = viewport;
    const PIXI = getPIXI();
    if (PIXI) {
      this.container = new PIXI.Container();
      this.container.zIndex = 100; // Selection outlines render above geometry
      this.viewport.addChild(this.container);
    }
  }

  setSelection(ids: string[]): void {
    this.selectionSet = new Set(ids);
    this.redrawSelection();
  }

  private redrawSelection(): void {
    const PIXI = getPIXI();
    if (!PIXI) return;

    // Lazy initialization of container if not done during constructor
    if (!this.container) {
      this.container = new PIXI.Container();
      this.container.zIndex = 100;
      this.viewport.addChild(this.container);
    }

    this.container.removeChildren();

    if (this.selectionSet.size === 0) return;

    const objects = useGeometryStore.getState().objects;

    this.selectionSet.forEach((id) => {
      const obj = objects.get(id);
      if (!obj) return;

      const g = new PIXI.Graphics();
      const coordinates = obj.geometry.coordinates;

      if (coordinates.length > 0) {
        const flat = coordinates.flatMap((pt) => toScreen(pt));

        if (obj.geometry.type === 'polygon' || obj.type === 'room') {
          // Draw soft filled glow + outer border
          g.poly(flat)
            .fill({ color: 0x22d3ee, alpha: 0.15 })
            .stroke({ color: 0x22d3ee, width: 2.5, alpha: 0.95 });
        } else {
          // For line segments / polylines
          if (coordinates.length >= 2) {
            g.moveTo(flat[0], flat[1]);
            for (let i = 2; i < flat.length; i += 2) {
              g.lineTo(flat[i], flat[i + 1]);
            }
            g.stroke({ color: 0x22d3ee, width: 3.0, alpha: 0.95 });
          }
        }
      }

      this.container.addChild(g);
    });
  }

  destroy(): void {
    if (this.viewport && this.container) {
      this.viewport.removeChild(this.container);
      this.container.destroy({ children: true });
    }
  }
}
