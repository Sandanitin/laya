/* eslint-disable @typescript-eslint/no-explicit-any */

// ─── LayerEngine ──────────────────────────────────────────────────────────────
// Maintains a Map<layerId, PIXI.Container> mirroring the layer tree.
// All geometry objects are added to their layer's Container.
// Visibility/lock/isolation are applied at the Container level.

export class LayerEngine {
  private viewport: any;
  /** Map of layerId → PIXI.Container */
  private layerContainers: Map<string, any> = new Map();
  private isolatedLayerId: string | null = null;

  constructor(viewport: any) {
    this.viewport = viewport;
  }

  /** Get or create a Container for a given layer ID */
  getOrCreateContainer(layerId: string): any {
    if (!this.layerContainers.has(layerId)) {
      // We need a PIXI.Container — dynamically created (engine runs post-init)
      // Container class is stored after canvas-engine imports pixi
      const container = LayerEngine.createContainer();
      container.sortableChildren = true;
      container.layerId = layerId;
      this.layerContainers.set(layerId, container);
      this.viewport.addChild(container);
    }
    return this.layerContainers.get(layerId);
  }

  static createContainer(): any {
    // Container is available on globalThis after CanvasEngine.init()
    return (globalThis as any).__PIXI_CONTAINER_CLASS__
      ? new ((globalThis as any).__PIXI_CONTAINER_CLASS__)()
      : { children: [], visible: true, eventMode: 'passive', addChild: () => {}, layerId: '' };
  }

  setVisibility(layerId: string, visible: boolean): void {
    const container = this.layerContainers.get(layerId);
    if (container) container.visible = visible;
  }

  setLock(layerId: string, locked: boolean): void {
    const container = this.layerContainers.get(layerId);
    if (container) {
      container.eventMode = locked ? 'none' : 'passive';
      // Prevent pointer events on children when locked
      container.interactiveChildren = !locked;
    }
  }

  setIsolation(layerId: string | null): void {
    this.isolatedLayerId = layerId;
    this.layerContainers.forEach((container, id) => {
      if (layerId === null) {
        // Exit isolation — restore all
        container.visible = true;
        container.alpha = 1;
      } else {
        // Dim non-isolated layers
        container.visible = true;
        container.alpha = id === layerId ? 1 : 0.15;
      }
    });
  }

  /** Remove all children from a layer container */
  clearLayer(layerId: string): void {
    const container = this.layerContainers.get(layerId);
    if (container) container.removeChildren?.();
  }

  /** Remove a layer container entirely */
  removeLayer(layerId: string): void {
    const container = this.layerContainers.get(layerId);
    if (container) {
      this.viewport.removeChild(container);
      this.layerContainers.delete(layerId);
    }
  }

  destroy(): void {
    this.layerContainers.clear();
  }
}
