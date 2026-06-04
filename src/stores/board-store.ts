/* eslint-disable @typescript-eslint/no-explicit-any */
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

export interface BoardElement {
  id: string;
  type: 'view-asset' | 'scale-bar' | 'north-arrow' | 'text' | 'image';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  zIndex: number;
  selected: boolean;
  data: Record<string, any>;
}

interface BoardState {
  boardElements: BoardElement[];

  addBoardElement: (el: Omit<BoardElement, 'id' | 'zIndex' | 'selected'>) => void;
  updateBoardElement: (id: string, updates: Partial<BoardElement>) => void;
  deleteBoardElement: (id: string) => void;
  selectBoardElement: (id: string | null) => void;
}

export const useBoardStore = create<BoardState>()(
  immer((set) => ({
    boardElements: [],

    addBoardElement: (el) =>
      set((s) => {
        const maxZ = s.boardElements.reduce((m, e) => Math.max(m, e.zIndex), 0);
        s.boardElements.push({
          ...el,
          id: `el-${Date.now()}`,
          zIndex: maxZ + 1,
          selected: false,
        });
      }),

    updateBoardElement: (id, updates) =>
      set((s) => {
        const el = s.boardElements.find((e) => e.id === id);
        if (el) Object.assign(el, updates);
      }),

    deleteBoardElement: (id) =>
      set((s) => {
        s.boardElements = s.boardElements.filter((e) => e.id !== id);
      }),

    selectBoardElement: (id) =>
      set((s) => {
        s.boardElements.forEach((e) => {
          e.selected = e.id === id;
        });
      }),
  }))
);
