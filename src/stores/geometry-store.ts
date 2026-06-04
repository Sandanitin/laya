import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { enableMapSet } from 'immer';
import type { GeometryObject } from '@/types/geometry';

enableMapSet();

// ─── Room Style (inspector overrides) ────────────────────────────────────────

export interface RoomStyle {
  fillColor: string;
  fillOpacity: number;
  patternId: string | null;
}

const DEFAULT_ROOM_STYLE: RoomStyle = {
  fillColor: '#166534',
  fillOpacity: 0.22,
  patternId: null,
};

// ─── State ────────────────────────────────────────────────────────────────────

interface GeometryState {
  /** All geometry objects indexed by ID — O(1) lookup */
  objects: Map<string, GeometryObject>;
  /** IDs that need re-rendering */
  dirtyIds: Set<string>;
  /** Room style overrides (inspector changes) */
  roomStyles: Map<string, RoomStyle>;
  /** Increments on every mutation — used by engine to detect changes */
  version: number;

  // Actions
  loadObjects: (objects: GeometryObject[]) => void;
  upsertObject: (object: GeometryObject) => void;
  upsertObjects: (objects: GeometryObject[]) => void;
  deleteObject: (id: string) => void;
  deleteObjects: (ids: string[]) => void;
  clearDirty: () => void;
  setRoomStyle: (id: string, updates: Partial<RoomStyle>) => void;
  setRoomStyles: (ids: string[], updates: Partial<RoomStyle>) => void;
  getRoomStyle: (id: string) => RoomStyle;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useGeometryStore = create<GeometryState>()(
  immer((set, get) => ({
    objects: new Map(),
    dirtyIds: new Set(),
    roomStyles: new Map(),
    version: 0,

    loadObjects: (objects) =>
      set((s) => {
        s.objects = new Map(objects.map((o) => [o.id, o]));
        s.dirtyIds = new Set(objects.map((o) => o.id));
        s.version += 1;
      }),

    upsertObject: (object) =>
      set((s) => {
        s.objects.set(object.id, object);
        s.dirtyIds.add(object.id);
        s.version += 1;
      }),

    upsertObjects: (objects) =>
      set((s) => {
        objects.forEach((o) => {
          s.objects.set(o.id, o);
          s.dirtyIds.add(o.id);
        });
        s.version += 1;
      }),

    deleteObject: (id) =>
      set((s) => {
        s.objects.delete(id);
        s.dirtyIds.add(id); // engine uses delete signal
        s.version += 1;
      }),

    deleteObjects: (ids) =>
      set((s) => {
        ids.forEach((id) => {
          s.objects.delete(id);
          s.dirtyIds.add(id);
        });
        s.version += 1;
      }),

    clearDirty: () =>
      set((s) => { s.dirtyIds = new Set(); }),

    setRoomStyle: (id, updates) =>
      set((s) => {
        const current = s.roomStyles.get(id) ?? { ...DEFAULT_ROOM_STYLE };
        s.roomStyles.set(id, { ...current, ...updates });
        s.dirtyIds.add(id);
        s.version += 1;
      }),

    setRoomStyles: (ids, updates) =>
      set((s) => {
        ids.forEach((id) => {
          const current = s.roomStyles.get(id) ?? { ...DEFAULT_ROOM_STYLE };
          s.roomStyles.set(id, { ...current, ...updates });
          s.dirtyIds.add(id);
        });
        s.version += 1;
      }),

    getRoomStyle: (id) => {
      return get().roomStyles.get(id) ?? { ...DEFAULT_ROOM_STYLE };
    },
  }))
);
