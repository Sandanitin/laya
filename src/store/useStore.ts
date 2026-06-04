import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

// ─── Types ─────────────────────────────────────────────────────────────────

export type EditorMode = 'studio' | 'board';

export type ToolbarTab =
  | 'templates'
  | 'patterns'
  | 'elements'
  | 'layers'
  | 'tools'
  | 'uploads'
  | 'projects';

export type LayerType = 'STRUCTURE' | 'OPENING' | 'FURNITURE' | 'ANNOTATION';

export type ActiveTool = 'select' | 'pan' | 'viewport-crop';

export interface LayerState {
  id: LayerType;
  label: string;
  visible: boolean;
  locked: boolean;
}

export interface RoomStyle {
  fillColor: string;
  fillOpacity: number;
  patternId: string | null;
}

export interface ViewAsset {
  id: string;
  name: string;
  bounds: { x1: number; y1: number; x2: number; y2: number };
  scale: string; // e.g. "1:100"
  createdAt: number;
}

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
  data: Record<string, unknown>;
}

export interface Project {
  id: string;
  name: string;
  thumbnail: string;
  updatedAt: number;
  createdAt: number;
}

export interface DashboardView {
  section: 'home' | 'projects' | 'templates';
  sidebarOpen: boolean;
  searchQuery: string;
  projectSort: 'date' | 'name';
  projectFilter: string;
}

export interface EditorState {
  mode: EditorMode;
  activeTab: ToolbarTab | null;
  isPaneOpen: boolean;
  activeTool: ActiveTool;
  projectTitle: string;
  autosaveStatus: 'saved' | 'saving' | 'unsaved';
  selectedRoomIds: string[];
  roomStyles: Record<string, RoomStyle>;
  layers: LayerState[];
  viewAssets: ViewAsset[];
  boardElements: BoardElement[];
  cropDraft: { x1: number; y1: number; x2: number; y2: number } | null;
  undoStack: unknown[];
  redoStack: unknown[];
}

export interface AppState {
  // Dashboard
  dashboard: DashboardView;
  projects: Project[];
  currentProjectId: string | null;

  // Editor
  editor: EditorState;

  // Dashboard Actions
  setDashboardSection: (section: DashboardView['section']) => void;
  setSidebarOpen: (open: boolean) => void;
  setSearchQuery: (q: string) => void;
  setProjectSort: (sort: DashboardView['projectSort']) => void;
  openProject: (id: string) => void;
  createProject: () => void;
  deleteProject: (id: string) => void;

  // Editor Actions
  setEditorMode: (mode: EditorMode) => void;
  setActiveTab: (tab: ToolbarTab | null) => void;
  setActiveTool: (tool: ActiveTool) => void;
  setProjectTitle: (title: string) => void;
  setAutosaveStatus: (status: EditorState['autosaveStatus']) => void;

  // Selection
  selectRoom: (id: string, multi: boolean) => void;
  clearSelection: () => void;

  // Styles
  setRoomStyle: (id: string, style: Partial<RoomStyle>) => void;

  // Layers
  toggleLayerVisibility: (id: LayerType) => void;
  toggleLayerLock: (id: LayerType) => void;

  // Viewport Crop
  setCropDraft: (draft: EditorState['cropDraft']) => void;
  saveViewAsset: (asset: Omit<ViewAsset, 'id' | 'createdAt'>) => void;
  deleteViewAsset: (id: string) => void;

  // Board
  addBoardElement: (el: Omit<BoardElement, 'id' | 'zIndex' | 'selected'>) => void;
  updateBoardElement: (id: string, updates: Partial<BoardElement>) => void;
  deleteBoardElement: (id: string) => void;
  selectBoardElement: (id: string | null) => void;

  // Undo / Redo
  undo: () => void;
  redo: () => void;
}

// ─── Mock Projects ──────────────────────────────────────────────────────────

const INITIAL_PROJECTS: Project[] = [
  { id: 'proj-1', name: 'Residence Villa A', thumbnail: '', updatedAt: Date.now() - 3600_000, createdAt: Date.now() - 86400_000 * 7 },
  { id: 'proj-2', name: 'Office Complex B', thumbnail: '', updatedAt: Date.now() - 7200_000, createdAt: Date.now() - 86400_000 * 14 },
  { id: 'proj-3', name: 'Museum Expansion', thumbnail: '', updatedAt: Date.now() - 3600_000 * 3, createdAt: Date.now() - 86400_000 * 30 },
  { id: 'proj-4', name: 'Urban Apartment', thumbnail: '', updatedAt: Date.now() - 3600_000 * 12, createdAt: Date.now() - 86400_000 * 45 },
  { id: 'proj-5', name: 'Retail Pavilion', thumbnail: '', updatedAt: Date.now() - 86400_000, createdAt: Date.now() - 86400_000 * 60 },
];

const INITIAL_LAYERS: LayerState[] = [
  { id: 'STRUCTURE',  label: 'Structure',  visible: true, locked: false },
  { id: 'OPENING',    label: 'Openings',   visible: true, locked: false },
  { id: 'FURNITURE',  label: 'Furniture',  visible: true, locked: false },
  { id: 'ANNOTATION', label: 'Annotations',visible: true, locked: false },
];

// ─── Store ──────────────────────────────────────────────────────────────────

export const useStore = create<AppState>()(
  immer((set, get) => ({
    // ── Dashboard Initial State ──────────────────────────────────────────
    dashboard: {
      section: 'home',
      sidebarOpen: true,
      searchQuery: '',
      projectSort: 'date',
      projectFilter: '',
    },
    projects: INITIAL_PROJECTS,
    currentProjectId: null,

    // ── Editor Initial State ─────────────────────────────────────────────
    editor: {
      mode: 'studio',
      activeTab: null,
      isPaneOpen: false,
      activeTool: 'select',
      projectTitle: 'Untitled Project',
      autosaveStatus: 'saved',
      selectedRoomIds: [],
      roomStyles: {},
      layers: INITIAL_LAYERS,
      viewAssets: [],
      boardElements: [],
      cropDraft: null,
      undoStack: [],
      redoStack: [],
    },

    // ── Dashboard Actions ────────────────────────────────────────────────
    setDashboardSection: (section) =>
      set((s) => { s.dashboard.section = section; }),

    setSidebarOpen: (open) =>
      set((s) => { s.dashboard.sidebarOpen = open; }),

    setSearchQuery: (q) =>
      set((s) => { s.dashboard.searchQuery = q; }),

    setProjectSort: (sort) =>
      set((s) => { s.dashboard.projectSort = sort; }),

    openProject: (id) =>
      set((s) => { s.currentProjectId = id; }),

    createProject: () => {
      const newProj: Project = {
        id: `proj-${Date.now()}`,
        name: 'New Project',
        thumbnail: '',
        updatedAt: Date.now(),
        createdAt: Date.now(),
      };
      set((s) => {
        s.projects.unshift(newProj);
        s.currentProjectId = newProj.id;
        s.editor.projectTitle = newProj.name;
      });
    },

    deleteProject: (id) =>
      set((s) => {
        s.projects = s.projects.filter((p) => p.id !== id);
        if (s.currentProjectId === id) s.currentProjectId = null;
      }),

    // ── Editor Actions ───────────────────────────────────────────────────
    setEditorMode: (mode) =>
      set((s) => {
        s.editor.mode = mode;
        // Reset tab-specific state when switching modes
        if (mode === 'board' && s.editor.activeTab === 'layers') {
          s.editor.activeTab = null;
          s.editor.isPaneOpen = false;
        }
      }),

    setActiveTab: (tab) =>
      set((s) => {
        if (s.editor.activeTab === tab && s.editor.isPaneOpen) {
          // Toggle close if same tab clicked
          s.editor.isPaneOpen = false;
          s.editor.activeTab = null;
        } else {
          s.editor.activeTab = tab;
          s.editor.isPaneOpen = tab !== null;
        }
      }),

    setActiveTool: (tool) =>
      set((s) => { s.editor.activeTool = tool; }),

    setProjectTitle: (title) =>
      set((s) => {
        s.editor.projectTitle = title;
        s.editor.autosaveStatus = 'unsaved';
      }),

    setAutosaveStatus: (status) =>
      set((s) => { s.editor.autosaveStatus = status; }),

    // ── Selection ────────────────────────────────────────────────────────
    selectRoom: (id, multi) =>
      set((s) => {
        if (multi) {
          const idx = s.editor.selectedRoomIds.indexOf(id);
          if (idx === -1) s.editor.selectedRoomIds.push(id);
          else s.editor.selectedRoomIds.splice(idx, 1);
        } else {
          s.editor.selectedRoomIds = [id];
          // Auto-open properties pane
          s.editor.activeTab = 'patterns';
          s.editor.isPaneOpen = true;
        }
      }),

    clearSelection: () =>
      set((s) => { s.editor.selectedRoomIds = []; }),

    // ── Styles ───────────────────────────────────────────────────────────
    setRoomStyle: (id, style) =>
      set((s) => {
        const prev = s.editor.roomStyles[id] ?? {
          fillColor: '#4ade80', fillOpacity: 0.35, patternId: null,
        };
        s.editor.roomStyles[id] = { ...prev, ...style };
        s.editor.autosaveStatus = 'unsaved';
      }),

    // ── Layers ───────────────────────────────────────────────────────────
    toggleLayerVisibility: (id) =>
      set((s) => {
        const layer = s.editor.layers.find((l) => l.id === id);
        if (layer) layer.visible = !layer.visible;
      }),

    toggleLayerLock: (id) =>
      set((s) => {
        const layer = s.editor.layers.find((l) => l.id === id);
        if (layer) layer.locked = !layer.locked;
      }),

    // ── Viewport Crop ────────────────────────────────────────────────────
    setCropDraft: (draft) =>
      set((s) => { s.editor.cropDraft = draft; }),

    saveViewAsset: (asset) =>
      set((s) => {
        s.editor.viewAssets.push({
          ...asset,
          id: `va-${Date.now()}`,
          createdAt: Date.now(),
        });
        s.editor.cropDraft = null;
      }),

    deleteViewAsset: (id) =>
      set((s) => {
        s.editor.viewAssets = s.editor.viewAssets.filter((v) => v.id !== id);
      }),

    // ── Board ────────────────────────────────────────────────────────────
    addBoardElement: (el) =>
      set((s) => {
        const maxZ = s.editor.boardElements.reduce((m, e) => Math.max(m, e.zIndex), 0);
        s.editor.boardElements.push({
          ...el,
          id: `el-${Date.now()}`,
          zIndex: maxZ + 1,
          selected: false,
        });
      }),

    updateBoardElement: (id, updates) =>
      set((s) => {
        const el = s.editor.boardElements.find((e) => e.id === id);
        if (el) Object.assign(el, updates);
      }),

    deleteBoardElement: (id) =>
      set((s) => {
        s.editor.boardElements = s.editor.boardElements.filter((e) => e.id !== id);
      }),

    selectBoardElement: (id) =>
      set((s) => {
        s.editor.boardElements.forEach((e) => { e.selected = e.id === id; });
      }),

    // ── Undo / Redo ──────────────────────────────────────────────────────
    undo: () => {
      const { editor } = get();
      if (editor.undoStack.length === 0) return;
      set((s) => {
        const prev = s.editor.undoStack.pop();
        s.editor.redoStack.push(JSON.parse(JSON.stringify(s.editor)));
        if (prev) Object.assign(s.editor, prev);
      });
    },

    redo: () => {
      const { editor } = get();
      if (editor.redoStack.length === 0) return;
      set((s) => {
        const next = s.editor.redoStack.pop();
        s.editor.undoStack.push(JSON.parse(JSON.stringify(s.editor)));
        if (next) Object.assign(s.editor, next);
      });
    },
  }))
);
