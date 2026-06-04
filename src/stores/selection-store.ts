import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { SelectionMode } from '@/types/canvas';

// ─── State ────────────────────────────────────────────────────────────────────

interface SelectionState {
  /** Currently selected object IDs */
  selectedIds: string[];
  /** Object currently under the pointer (hover) */
  hoverTargetId: string | null;
  /** Active selection mode */
  mode: SelectionMode;

  // Actions
  selectOne: (id: string) => void;
  selectMany: (ids: string[]) => void;
  toggleOne: (id: string) => void;
  addToSelection: (id: string) => void;
  removeFromSelection: (id: string) => void;
  clearSelection: () => void;
  setHover: (id: string | null) => void;
  setMode: (mode: SelectionMode) => void;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useSelectionStore = create<SelectionState>()(
  immer((set) => ({
    selectedIds: [],
    hoverTargetId: null,
    mode: 'single',

    selectOne: (id) =>
      set((s) => { s.selectedIds = [id]; }),

    selectMany: (ids) =>
      set((s) => { s.selectedIds = ids; }),

    toggleOne: (id) =>
      set((s) => {
        const idx = s.selectedIds.indexOf(id);
        if (idx === -1) s.selectedIds.push(id);
        else s.selectedIds.splice(idx, 1);
      }),

    addToSelection: (id) =>
      set((s) => {
        if (!s.selectedIds.includes(id)) s.selectedIds.push(id);
      }),

    removeFromSelection: (id) =>
      set((s) => {
        s.selectedIds = s.selectedIds.filter((sid) => sid !== id);
      }),

    clearSelection: () =>
      set((s) => { s.selectedIds = []; }),

    setHover: (id) =>
      set((s) => { s.hoverTargetId = id; }),

    setMode: (mode) =>
      set((s) => { s.mode = mode; }),
  }))
);
