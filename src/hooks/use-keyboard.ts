import { useEffect } from 'react';
import { useProjectStore } from '@/stores/project-store';
import { useSelectionStore } from '@/stores/selection-store';
import { CanvasCommandBus } from '@/lib/command-bus';

/**
 * Custom React hook that sets up global keyboard shortcuts for the editor workspace.
 * Prevents shortcuts from firing when the user is editing text inputs.
 */
export function useKeyboardShortcuts() {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      if (
        activeEl &&
        (activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'TEXTAREA' ||
          activeEl.tagName === 'SELECT' ||
          activeEl.getAttribute('contenteditable') === 'true')
      ) {
        return;
      }

      const isMac = typeof window !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const isCmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

      // Undo / Redo
      if (isCmdOrCtrl && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          useProjectStore.getState().redo();
        } else {
          useProjectStore.getState().undo();
        }
        return;
      }

      if (isCmdOrCtrl && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        useProjectStore.getState().redo();
        return;
      }

      // Single-key shortcuts
      switch (e.key.toLowerCase()) {
        case 'v':
          e.preventDefault();
          useProjectStore.getState().setActiveTool('select');
          break;
        case 'h':
          e.preventDefault();
          useProjectStore.getState().setActiveTool('pan');
          break;
        case 'c':
          e.preventDefault();
          useProjectStore.getState().setActiveTool('viewport-crop');
          break;
        case '0':
          e.preventDefault();
          CanvasCommandBus.dispatch({ type: 'VIEWPORT_FIT_ALL' });
          break;
        case 'escape':
          e.preventDefault();
          useSelectionStore.getState().clearSelection();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);
}
