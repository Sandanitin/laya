import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

// ─── Types ───────────────────────────────────────────────────────────────────

export type PanelId =
  | 'templates' | 'patterns' | 'elements' | 'layers'
  | 'tools' | 'uploads' | 'projects' | 'properties';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  duration?: number;
}

export interface ModalState {
  id: string;
  props?: Record<string, unknown>;
}

// ─── State ────────────────────────────────────────────────────────────────────

interface UiState {
  /** Currently open contextual panel (null = closed) */
  activePanel: PanelId | null;
  /** Whether the contextual pane is visible */
  isPaneOpen: boolean;
  /** Modal stack — top is visible */
  modalStack: ModalState[];
  /** Toast queue */
  toasts: Toast[];

  // Actions
  setActivePanel: (panel: PanelId | null) => void;
  openPanel: (panel: PanelId) => void;
  closePanel: () => void;
  pushModal: (modal: ModalState) => void;
  popModal: () => void;
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useUiStore = create<UiState>()(
  immer((set) => ({
    activePanel: null,
    isPaneOpen: false,
    modalStack: [],
    toasts: [],

    setActivePanel: (panel) =>
      set((s) => {
        if (s.activePanel === panel) {
          // Toggle: clicking active tab closes pane
          s.activePanel = null;
          s.isPaneOpen = false;
        } else {
          s.activePanel = panel;
          s.isPaneOpen = panel !== null;
        }
      }),

    openPanel: (panel) =>
      set((s) => {
        s.activePanel = panel;
        s.isPaneOpen = true;
      }),

    closePanel: () =>
      set((s) => {
        s.activePanel = null;
        s.isPaneOpen = false;
      }),

    pushModal: (modal) =>
      set((s) => {
        s.modalStack.push(modal);
      }),

    popModal: () =>
      set((s) => {
        s.modalStack.pop();
      }),

    addToast: (toast) =>
      set((s) => {
        s.toasts.push({ ...toast, id: `toast-${Date.now()}` });
      }),

    removeToast: (id) =>
      set((s) => {
        s.toasts = s.toasts.filter((t) => t.id !== id);
      }),
  }))
);
