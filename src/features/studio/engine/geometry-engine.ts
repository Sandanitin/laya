/* eslint-disable @typescript-eslint/no-explicit-any */
import type { GeometryObject } from '@/types/geometry';
import { CanvasCommandBus } from '@/lib/command-bus';
import { toScreen } from '@/types/canvas';
import type { LayerEngine } from './layer-engine';

function getPIXI(): any {
  return (globalThis as any).PIXI;
}

export class GeometryEngine {
  private viewport: any;
  private layerEngine: LayerEngine;
  private graphicsMap: Map<string, { g: any; obj: GeometryObject }> = new Map();
  private styleOverrides: Map<string, Partial<GeometryObject['style']>> = new Map();

  constructor(viewport: any, layerEngine: LayerEngine) {
    this.viewport = viewport;
    this.layerEngine = layerEngine;
  }

  loadAll(objects: GeometryObject[]): void {
    // Clear existing graphics
    this.graphicsMap.forEach(({ g }) => {
      if (g.parent) {
        g.parent.removeChild(g);
      }
      g.destroy();
    });
    this.graphicsMap.clear();

    // Render new objects
    objects.forEach((obj) => this.renderObject(obj));
  }

  update(objects: GeometryObject[]): void {
    objects.forEach((obj) => this.renderObject(obj));
  }

  delete(ids: string[]): void {
    ids.forEach((id) => {
      const entry = this.graphicsMap.get(id);
      if (entry) {
        const { g } = entry;
        if (g.parent) {
          g.parent.removeChild(g);
        }
        g.destroy();
        this.graphicsMap.delete(id);
      }
    });
  }

  applyStyleOverrides(ids: string[], style: Partial<GeometryObject['style']>): void {
    ids.forEach((id) => {
      this.styleOverrides.set(id, style);
      const entry = this.graphicsMap.get(id);
      if (entry) {
        // Re-render to apply new overrides
        this.renderObject(entry.obj);
      }
    });
  }

  private renderObject(obj: GeometryObject): void {
    const PIXI = getPIXI();
    if (!PIXI) return;

    // Check if we already have a Graphics for this object
    const entry = this.graphicsMap.get(obj.id);
    let g: any;
    if (entry) {
      g = entry.g;
      g.clear();
    } else {
      g = new PIXI.Graphics();
      g.eventMode = 'static';
      g.cursor = 'pointer';
      g.layerType = obj.type;
      g.geometryId = obj.id;

      // Event handlers
      g.on('pointerover', () => {
        CanvasCommandBus.emit({ type: 'OBJECT_HOVERED', id: obj.id });
      });

      g.on('pointerout', () => {
        CanvasCommandBus.emit({ type: 'OBJECT_HOVERED', id: null });
      });

      g.on('pointerdown', (e: any) => {
        // Stop propagation so the viewport's pointerdown handler doesn't
        // also trigger, which would cause CANVAS_CLICKED to fire and
        // immediately clear the selection we're about to set.
        e.stopPropagation();
        const multi = !!(e.shiftKey ?? e.data?.originalEvent?.shiftKey ?? false);
        CanvasCommandBus.emit({ type: 'OBJECT_CLICKED', id: obj.id, multiSelect: multi });
      });
    }

    // Determine style
    const override = this.styleOverrides.get(obj.id) || {};
    const style = { ...obj.style, ...override };

    const fillHex = style.fillColor ? parseInt(style.fillColor.replace('#', ''), 16) : null;
    const strokeHex = parseInt(style.strokeColor.replace('#', ''), 16);
    const strokeWidth = style.strokeWidth ?? 1.5;
    const fillOpacity = style.fillOpacity ?? 0.22;

    // Draw geometry based on coordinates
    const coordinates = obj.geometry.coordinates;
    if (coordinates.length > 0) {
      const flat = coordinates.flatMap((pt) => toScreen(pt));

      if (obj.geometry.type === 'polygon' || obj.type === 'room') {
        g.hitArea = new PIXI.Polygon(flat);
        if (fillHex !== null) {
          g.poly(flat).fill({ color: fillHex, alpha: fillOpacity });
        }
        g.poly(flat).stroke({ color: strokeHex, width: strokeWidth, alpha: 0.95 });
      } else {
        // polyline or point or arc
        if (coordinates.length >= 2) {
          g.moveTo(flat[0], flat[1]);
          for (let i = 2; i < flat.length; i += 2) {
            g.lineTo(flat[i], flat[i + 1]);
          }
          g.stroke({ color: strokeHex, width: strokeWidth, alpha: 0.95 });
        }
      }
    }

    // Add to appropriate layer container
    const parentContainer = this.layerEngine.getOrCreateContainer(obj.layerId);
    if (parentContainer && g.parent !== parentContainer) {
      parentContainer.addChild(g);
    }

    if (!entry) {
      this.graphicsMap.set(obj.id, { g, obj });
    } else {
      entry.obj = obj;
    }
  }

  getGraphics(id: string): any {
    return this.graphicsMap.get(id)?.g;
  }
}
