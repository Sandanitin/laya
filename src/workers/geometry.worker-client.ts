/* eslint-disable @typescript-eslint/no-explicit-any */
import * as Comlink from 'comlink';
import type { BBox, SpatialItem } from '@/types/geometry';
import type { GeometryWorker } from './geometry.worker';

class GeometryWorkerClient {
  private worker: Worker | null = null;
  private api: Comlink.Remote<GeometryWorker> | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      // Next.js natively compiles Web Workers via URL constructor
      this.worker = new Worker(new URL('./geometry.worker.ts', import.meta.url));
      const WorkerProxy: any = Comlink.wrap(this.worker);
      // Instantiate the GeometryWorker class exposed by the worker
      WorkerProxy.then((ExposedClass: any) => {
        this.api = new ExposedClass();
      }).catch((err: any) => {
        console.error('Failed to initialize GeometryWorker proxy:', err);
      });
    }
  }

  async load(items: SpatialItem[]): Promise<void> {
    if (!this.api) {
      // Wait a brief moment if not initialized yet
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    if (this.api) {
      await this.api.load(items);
    }
  }

  async insert(item: SpatialItem): Promise<void> {
    if (this.api) {
      await this.api.insert(item);
    }
  }

  async remove(id: string): Promise<void> {
    if (this.api) {
      await this.api.remove(id);
    }
  }

  async query(bbox: BBox): Promise<string[]> {
    if (!this.api) return [];
    return await this.api.query(bbox);
  }

  async clear(): Promise<void> {
    if (this.api) {
      await this.api.clear();
    }
  }

  terminate(): void {
    this.worker?.terminate();
  }
}

// Singleton client instance
export const geometryWorkerClient = new GeometryWorkerClient();
