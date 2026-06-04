/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ActiveTool } from '@/types/canvas';
import { CanvasCommandBus } from '@/lib/command-bus';
import { toWorld } from '@/types/canvas';

function getPIXI(): any {
  return (globalThis as any).PIXI;
}

export class InteractionEngine {
  private viewport: any;
  private canvas: HTMLCanvasElement;
  private tool: ActiveTool = 'select';
  private overlay: any = null;
  private dragStart: { x: number; y: number } | null = null;
  private isDragging = false;

  constructor(viewport: any, canvas: HTMLCanvasElement) {
    this.viewport = viewport;
    this.canvas = canvas;

    const PIXI = getPIXI();
    if (PIXI) {
      this.overlay = new PIXI.Graphics();
      this.overlay.zIndex = 200; // Drag overlay renders on top of everything
      this.viewport.addChild(this.overlay);
    }

    this.setupEvents();
  }

  setTool(tool: ActiveTool): void {
    this.tool = tool;

    // Adjust viewport drag settings depending on tool
    if (tool === 'pan') {
      this.viewport.drag({ mouseButtons: 'left' });
      this.canvas.style.cursor = 'grab';
    } else {
      this.viewport.drag({ mouseButtons: 'middle' });
      this.canvas.style.cursor = tool === 'viewport-crop' ? 'crosshair' : 'default';
    }
  }

  private setupEvents(): void {
    this.viewport.eventMode = 'static';

    this.viewport.on('pointerdown', (e: any) => {
      console.log('interaction-engine pointerdown:', { button: e.button, tool: this.tool, target: e.target });
      // Only care about left click/touch (button 0) for drawing selection/crops
      if (e.button !== 0 || this.tool === 'pan') return;

      const localPos = this.viewport.toLocal(e.global);
      this.dragStart = { x: localPos.x, y: localPos.y };
      this.isDragging = true;
    });

    this.viewport.on('pointermove', (e: any) => {
      if (!this.isDragging || !this.dragStart) return;

      const localPos = this.viewport.toLocal(e.global);
      this.drawDragOverlay(this.dragStart.x, this.dragStart.y, localPos.x, localPos.y);
    });

    this.viewport.on('pointerup', (e: any) => {
      this.handleDragEnd(e);
    });

    this.viewport.on('pointerupoutside', (e: any) => {
      this.handleDragEnd(e);
    });
  }

  private drawDragOverlay(x1: number, y1: number, x2: number, y2: number): void {
    this.overlay.clear();

    const minX = Math.min(x1, x2);
    const minY = Math.min(y1, y2);
    const w = Math.abs(x2 - x1);
    const h = Math.abs(y2 - y1);

    if (w < 5 && h < 5) return;

    if (this.tool === 'viewport-crop') {
      // Crop outline: orange/yellow dashed style
      this.overlay
        .rect(minX, minY, w, h)
        .fill({ color: 0xfbbf24, alpha: 0.1 })
        .stroke({ color: 0xfbbf24, width: 1.5, alpha: 0.8 });
    } else if (this.tool === 'select') {
      // Selection outline: blue translucent selection box
      this.overlay
        .rect(minX, minY, w, h)
        .fill({ color: 0x3b82f6, alpha: 0.15 })
        .stroke({ color: 0x3b82f6, width: 1.5, alpha: 0.8 });
    }
  }

  private handleDragEnd(e: any): void {
    console.log('interaction-engine handleDragEnd:', { isDragging: this.isDragging, dragStart: this.dragStart });
    if (!this.isDragging || !this.dragStart) return;

    this.isDragging = false;
    this.overlay.clear();

    const localPos = this.viewport.toLocal(e.global);
    const x1 = this.dragStart.x;
    const y1 = this.dragStart.y;
    const x2 = localPos.x;
    const y2 = localPos.y;

    this.dragStart = null;

    const dx = Math.abs(x2 - x1);
    const dy = Math.abs(y2 - y1);

    console.log('interaction-engine handleDragEnd click dimensions:', { dx, dy, target: e.target });

    if (dx > 8 && dy > 8) {
      // Convert PIXI world coords back to raw CAD coords
      const [wX1, wY1] = toWorld(x1, y1);
      const [wX2, wY2] = toWorld(x2, y2);

      const bbox = {
        minX: Math.min(wX1, wX2),
        minY: Math.min(wY1, wY2),
        maxX: Math.max(wX1, wX2),
        maxY: Math.max(wY1, wY2),
      };

      if (this.tool === 'viewport-crop') {
        CanvasCommandBus.emit({ type: 'CROP_BOX_COMPLETE', bbox });
      } else if (this.tool === 'select') {
        CanvasCommandBus.emit({ type: 'BOX_SELECT_COMPLETE', bbox });
      }
    } else {
      // Clean click on background -> clear selection
      const [worldX, worldY] = toWorld(x2, y2);
      console.log('interaction-engine emitting CANVAS_CLICKED:', { worldX, worldY, targetHasGeometryId: !!(e.target && e.target.geometryId) });
      if (!e.target || !e.target.geometryId) {
        CanvasCommandBus.emit({ type: 'CANVAS_CLICKED', worldX, worldY });
      }
    }
  }

  destroy(): void {
    if (this.viewport && this.overlay) {
      this.viewport.removeChild(this.overlay);
      this.overlay.destroy();
    }
  }
}
