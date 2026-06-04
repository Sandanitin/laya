import * as Comlink from 'comlink';
import RBush from 'rbush';
import type { BBox } from '../types/geometry';

interface SpatialItem {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  id: string;
}

class GeometryWorker {
  private rtree = new RBush<SpatialItem>();
  private itemsMap = new Map<string, SpatialItem>();

  load(items: SpatialItem[]): void {
    this.rtree.clear();
    this.itemsMap.clear();
    items.forEach((item) => {
      this.itemsMap.set(item.id, item);
    });
    this.rtree.load(items);
  }

  insert(item: SpatialItem): void {
    this.remove(item.id);
    this.itemsMap.set(item.id, item);
    this.rtree.insert(item);
  }

  remove(id: string): void {
    const existing = this.itemsMap.get(id);
    if (existing) {
      this.rtree.remove(existing);
      this.itemsMap.delete(id);
    }
  }

  query(bbox: BBox): string[] {
    const results = this.rtree.search({
      minX: bbox.minX,
      minY: bbox.minY,
      maxX: bbox.maxX,
      maxY: bbox.maxY,
    });
    return results.map((r) => r.id);
  }

  clear(): void {
    this.rtree.clear();
    this.itemsMap.clear();
  }
}

Comlink.expose(GeometryWorker);
export type { GeometryWorker };
