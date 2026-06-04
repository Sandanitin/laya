import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { Layer } from '@/types/geometry';

// ─── Default Layers ───────────────────────────────────────────────────────────

const DEFAULT_LAYERS: Layer[] = [
  {
    id: 'STRUCTURE', workspaceId: 'default', parentId: null,
    name: 'Structure', type: 'geometry',
    visible: true, locked: false, isolated: false,
    colorOverride: null, opacity: 1, sortOrder: 0, children: [],
  },
  {
    id: 'OPENING', workspaceId: 'default', parentId: null,
    name: 'Openings', type: 'geometry',
    visible: true, locked: false, isolated: false,
    colorOverride: null, opacity: 1, sortOrder: 1, children: [],
  },
  {
    id: 'FURNITURE', workspaceId: 'default', parentId: null,
    name: 'Furniture', type: 'geometry',
    visible: true, locked: false, isolated: false,
    colorOverride: null, opacity: 1, sortOrder: 2, children: [],
  },
  {
    id: 'ANNOTATION', workspaceId: 'default', parentId: null,
    name: 'Annotations', type: 'annotation',
    visible: true, locked: false, isolated: false,
    colorOverride: null, opacity: 1, sortOrder: 3, children: [],
  },
];

// ─── State ────────────────────────────────────────────────────────────────────

interface LayerState {
  layers: Layer[];
  isolatedLayerId: string | null;

  // Actions
  setLayers: (layers: Layer[]) => void;
  toggleVisibility: (layerId: string) => void;
  toggleLock: (layerId: string) => void;
  isolateLayer: (layerId: string | null) => void;
  updateLayer: (layerId: string, updates: Partial<Layer>) => void;
  addLayer: (layer: Layer) => void;
  removeLayer: (layerId: string) => void;
  reorderLayers: (fromIndex: number, toIndex: number) => void;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useLayerStore = create<LayerState>()(
  immer((set) => ({
    layers: DEFAULT_LAYERS,
    isolatedLayerId: null,

    setLayers: (layers) =>
      set((s) => { s.layers = layers; }),

    toggleVisibility: (layerId) =>
      set((s) => {
        const layer = s.layers.find((l) => l.id === layerId);
        if (layer) layer.visible = !layer.visible;
      }),

    toggleLock: (layerId) =>
      set((s) => {
        const layer = s.layers.find((l) => l.id === layerId);
        if (layer) layer.locked = !layer.locked;
      }),

    isolateLayer: (layerId) =>
      set((s) => {
        s.isolatedLayerId = layerId;
        s.layers.forEach((l) => {
          l.isolated = layerId !== null && l.id !== layerId;
        });
      }),

    updateLayer: (layerId, updates) =>
      set((s) => {
        const idx = s.layers.findIndex((l) => l.id === layerId);
        if (idx !== -1) Object.assign(s.layers[idx], updates);
      }),

    addLayer: (layer) =>
      set((s) => { s.layers.push(layer); }),

    removeLayer: (layerId) =>
      set((s) => {
        s.layers = s.layers.filter((l) => l.id !== layerId);
      }),

    reorderLayers: (fromIndex, toIndex) =>
      set((s) => {
        const [moved] = s.layers.splice(fromIndex, 1);
        s.layers.splice(toIndex, 0, moved);
        s.layers.forEach((l, i) => { l.sortOrder = i; });
      }),
  }))
);
