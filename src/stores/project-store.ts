import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { enableMapSet } from 'immer';
import type { ActiveTool } from '@/types/canvas';

enableMapSet();

// ─── Types ───────────────────────────────────────────────────────────────────

export type EditorMode = 'studio' | 'board';
export type AutosaveStatus = 'saved' | 'saving' | 'unsaved' | 'error';

export interface ViewAsset {
  id: string;
  name: string;
  bounds: { x1: number; y1: number; x2: number; y2: number };
  scale: string;
  createdAt: number;
}

// ─── Undo/Redo Command ────────────────────────────────────────────────────────

export interface Command {
  label: string;
  execute: () => void;
  undo: () => void;
}

// ─── State ────────────────────────────────────────────────────────────────────

interface ProjectState {
  id: string;
  title: string;
  mode: EditorMode;
  activeTool: ActiveTool;
  autosaveStatus: AutosaveStatus;
  viewAssets: ViewAsset[];
  placingElement: string | null;

  // Undo/Redo stacks
  undoStack: Command[];
  redoStack: Command[];

  // Actions
  setTitle: (title: string) => void;
  setMode: (mode: EditorMode) => void;
  setActiveTool: (tool: ActiveTool) => void;
  setAutosaveStatus: (status: AutosaveStatus) => void;
  saveViewAsset: (asset: Omit<ViewAsset, 'id' | 'createdAt'>) => void;
  removeViewAsset: (id: string) => void;
  setPlacingElement: (el: string | null) => void;

  // Command pattern undo/redo
  executeCommand: (command: Command) => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useProjectStore = create<ProjectState>()(
  immer((set, get) => ({
    id: 'workspace-default',
    title: 'Untitled Project',
    mode: 'studio',
    activeTool: 'select',
    autosaveStatus: 'saved',
    viewAssets: [],
    placingElement: null,
    undoStack: [],
    redoStack: [],

    setTitle: (title) =>
      set((s) => {
        s.title = title;
        s.autosaveStatus = 'unsaved';
      }),

    setMode: (mode) =>
      set((s) => { s.mode = mode; }),

    setActiveTool: (tool) =>
      set((s) => { s.activeTool = tool; }),

    setAutosaveStatus: (status) =>
      set((s) => { s.autosaveStatus = status; }),

    saveViewAsset: (asset) =>
      set((s) => {
        s.viewAssets.push({
          ...asset,
          id: `va-${Date.now()}`,
          createdAt: Date.now(),
        });
      }),

    removeViewAsset: (id) =>
      set((s) => {
        s.viewAssets = s.viewAssets.filter((v) => v.id !== id);
      }),

    setPlacingElement: (el) =>
      set((s) => { s.placingElement = el; }),

    executeCommand: (command) => {
      command.execute();
      set((s) => {
        s.undoStack.push(command);
        // Cap undo stack at 100
        if (s.undoStack.length > 100) s.undoStack.shift();
        // Clear redo when new command is executed
        s.redoStack = [];
        s.autosaveStatus = 'unsaved';
      });
    },

    undo: () => {
      const { undoStack } = get();
      if (undoStack.length === 0) return;
      const command = undoStack[undoStack.length - 1];
      command.undo();
      set((s) => {
        s.undoStack.pop();
        s.redoStack.push(command);
        s.autosaveStatus = 'unsaved';
      });
    },

    redo: () => {
      const { redoStack } = get();
      if (redoStack.length === 0) return;
      const command = redoStack[redoStack.length - 1];
      command.execute();
      set((s) => {
        s.redoStack.pop();
        s.undoStack.push(command);
        s.autosaveStatus = 'unsaved';
      });
    },

    canUndo: () => get().undoStack.length > 0,
    canRedo: () => get().redoStack.length > 0,
  }))
);
