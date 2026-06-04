import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

// ─── Types ────────────────────────────────────────────────────────────────────

export type BoardElementType =
  | 'text'
  | 'scale-bar'
  | 'north-arrow'
  | 'rect'
  | 'circle'
  | 'annotation';

export interface BoardElement {
  id: string;
  type: BoardElementType;
  /** Position on the A3 board as percentage 0-100 of sheet dimensions */
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  color: string;
  strokeColor: string;
  selected: boolean;
}

interface BoardElementsState {
  elements: BoardElement[];

  addElement: (el: Omit<BoardElement, 'id' | 'selected'>) => string;
  removeElement: (id: string) => void;
  removeElements: (ids: string[]) => void;
  moveElement: (id: string, x: number, y: number) => void;
  selectElement: (id: string) => void;
  clearSelection: () => void;
  updateElement: (id: string, updates: Partial<Omit<BoardElement, 'id'>>) => void;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useBoardElementsStore = create<BoardElementsState>()(
  immer((set) => ({
    elements: [],

    addElement: (el) => {
      const id = `board-el-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      set((s) => {
        s.elements.push({ ...el, id, selected: false });
      });
      return id;
    },

    removeElement: (id) =>
      set((s) => {
        s.elements = s.elements.filter((e) => e.id !== id);
      }),

    removeElements: (ids) =>
      set((s) => {
        s.elements = s.elements.filter((e) => !ids.includes(e.id));
      }),

    moveElement: (id, x, y) =>
      set((s) => {
        const el = s.elements.find((e) => e.id === id);
        if (el) { el.x = x; el.y = y; }
      }),

    selectElement: (id) =>
      set((s) => {
        s.elements.forEach((e) => { e.selected = e.id === id; });
      }),

    clearSelection: () =>
      set((s) => {
        s.elements.forEach((e) => { e.selected = false; });
      }),

    updateElement: (id, updates) =>
      set((s) => {
        const el = s.elements.find((e) => e.id === id);
        if (el) Object.assign(el, updates);
      }),
  }))
);
