import Dexie, { type Table } from 'dexie';
import type { GeometryObject, Layer } from '@/types/geometry';

// ─── Schema Types ─────────────────────────────────────────────────────────────

export interface WorkspaceSnapshot {
  id: string;               // workspaceId
  title: string;
  mode: 'studio' | 'board';
  savedAt: number;          // Date.now()
}

export interface GeometrySnapshot {
  id: string;               // `${workspaceId}:${objectId}`
  workspaceId: string;
  object: GeometryObject;
  savedAt: number;
}

export interface LayerSnapshot {
  id: string;               // layerId
  workspaceId: string;
  data: unknown;            // Layer object
  savedAt: number;
}

export interface UndoEntry {
  id?: number;              // auto-increment
  workspaceId: string;
  patch: unknown;           // GeometryPatch[]
  timestamp: number;
}

// ─── Dexie Database ──────────────────────────────────────────────────────────

class LayaDatabase extends Dexie {
  workspaces!: Table<WorkspaceSnapshot>;
  geometry!: Table<GeometrySnapshot>;
  layers!: Table<LayerSnapshot>;
  undoHistory!: Table<UndoEntry>;

  constructor() {
    super('laya-db');
    this.version(1).stores({
      workspaces: 'id, savedAt',
      geometry: 'id, workspaceId, savedAt',
      layers: 'id, workspaceId, savedAt',
      undoHistory: '++id, workspaceId, timestamp',
    });
  }
}

export const db = new LayaDatabase();

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Save all geometry objects for a workspace (bulk upsert) */
export async function saveGeometry(
  workspaceId: string,
  objects: GeometryObject[]
): Promise<void> {
  const now = Date.now();
  const rows: GeometrySnapshot[] = objects.map((obj) => ({
    id: `${workspaceId}:${obj.id}`,
    workspaceId,
    object: obj,
    savedAt: now,
  }));
  await db.geometry.bulkPut(rows);
}

/** Load all geometry objects for a workspace */
export async function loadGeometry(workspaceId: string): Promise<GeometryObject[]> {
  const rows = await db.geometry.where('workspaceId').equals(workspaceId).toArray();
  return rows.map((r) => r.object);
}

/** Save a workspace snapshot */
export async function saveWorkspace(snapshot: WorkspaceSnapshot): Promise<void> {
  await db.workspaces.put(snapshot);
}

/** Save all layers for a workspace */
export async function saveLayers(workspaceId: string, layers: Layer[]): Promise<void> {
  const now = Date.now();
  const rows: LayerSnapshot[] = layers.map((layer) => ({
    id: `${workspaceId}:${layer.id}`,
    workspaceId,
    data: layer,
    savedAt: now,
  }));
  await db.layers.bulkPut(rows);
}

/** Load all layers for a workspace */
export async function loadLayers(workspaceId: string): Promise<Layer[]> {
  const rows = await db.layers.where('workspaceId').equals(workspaceId).toArray();
  return rows.map((r) => r.data as Layer);
}

/** Push an undo entry (keep last 100 entries per workspace) */
export async function pushUndoEntry(workspaceId: string, patch: unknown): Promise<void> {
  await db.undoHistory.add({ workspaceId, patch, timestamp: Date.now() });
  // Prune to last 100
  const allEntries = await db.undoHistory
    .where('workspaceId').equals(workspaceId)
    .sortBy('timestamp');
  if (allEntries.length > 100) {
    const toDelete = allEntries.slice(0, allEntries.length - 100);
    await db.undoHistory.bulkDelete(toDelete.map((e) => e.id!));
  }
}

/** Get undo history for a workspace */
export async function getUndoHistory(workspaceId: string): Promise<UndoEntry[]> {
  return db.undoHistory
    .where('workspaceId').equals(workspaceId)
    .sortBy('timestamp');
}
