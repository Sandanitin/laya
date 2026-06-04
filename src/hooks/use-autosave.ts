import { useEffect, useRef } from 'react';
import { useProjectStore } from '@/stores/project-store';
import { useGeometryStore } from '@/stores/geometry-store';
import { useLayerStore } from '@/stores/layer-store';
import { saveWorkspace, saveGeometry, saveLayers, loadGeometry, loadLayers, db } from '@/lib/dexie';

/**
 * Loads a saved workspace snapshot, geometry objects, and layer settings from IndexedDB cache.
 * Returns true if cache was hit and loaded, false otherwise.
 */
export async function loadWorkspaceFromCache(projectId: string): Promise<boolean> {
  try {
    const ws = await db.workspaces.get(projectId);
    if (!ws) return false;

    const geom = await loadGeometry(projectId);
    const layers = await loadLayers(projectId);

    if (geom && geom.length > 0) {
      useGeometryStore.getState().loadObjects(geom);
    }
    if (layers && layers.length > 0) {
      useLayerStore.getState().setLayers(layers);
    }

    const setAutosaveStatus = useProjectStore.getState().setAutosaveStatus;
    // Set title and mode directly to avoid triggering 'unsaved' state immediately
    useProjectStore.setState({
      title: ws.title,
      mode: ws.mode,
    });
    setAutosaveStatus('saved');
    return true;
  } catch (err) {
    console.error('Failed to load workspace from cache:', err);
    return false;
  }
}

/**
 * Hook to automatically write editor state (workspace metadata, geometry, layers)
 * to IndexedDB. Debounces writes by 30 seconds after any changes.
 */
export function useAutosave() {
  const projectId = useProjectStore((s) => s.id);
  const title = useProjectStore((s) => s.title);
  const mode = useProjectStore((s) => s.mode);
  const autosaveStatus = useProjectStore((s) => s.autosaveStatus);
  const setAutosaveStatus = useProjectStore((s) => s.setAutosaveStatus);

  const objects = useGeometryStore((s) => s.objects);
  const version = useGeometryStore((s) => s.version);
  const layers = useLayerStore((s) => s.layers);

  const isInitial = useRef(true);

  // 1. Mark status as 'unsaved' whenever geometry version or layers array changes
  useEffect(() => {
    if (isInitial.current) {
      isInitial.current = false;
      return;
    }
    if (useProjectStore.getState().autosaveStatus === 'saved') {
      useProjectStore.getState().setAutosaveStatus('unsaved');
    }
  }, [version, layers]);

  // 2. Perform 30-second debounced save when state is 'unsaved'
  useEffect(() => {
    if (autosaveStatus !== 'unsaved') return;

    const timer = setTimeout(async () => {
      setAutosaveStatus('saving');
      try {
        await Promise.all([
          saveWorkspace({
            id: projectId,
            title,
            mode,
            savedAt: Date.now(),
          }),
          saveGeometry(projectId, Array.from(objects.values())),
          saveLayers(projectId, layers),
        ]);
        setAutosaveStatus('saved');
      } catch (err) {
        console.error('Autosave failed:', err);
        setAutosaveStatus('error');
      }
    }, 30000); // 30s debounce

    return () => clearTimeout(timer);
  }, [projectId, title, mode, objects, layers, autosaveStatus, setAutosaveStatus]);

  // 3. Save immediately on page unload if there are unsaved changes
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (useProjectStore.getState().autosaveStatus === 'unsaved') {
        const activeProjectId = useProjectStore.getState().id;
        const activeTitle = useProjectStore.getState().title;
        const activeMode = useProjectStore.getState().mode;
        const activeObjects = useGeometryStore.getState().objects;
        const activeLayers = useLayerStore.getState().layers;

        // Use synchronous or background save on close (best-effort)
        Promise.all([
          saveWorkspace({
            id: activeProjectId,
            title: activeTitle,
            mode: activeMode,
            savedAt: Date.now(),
          }),
          saveGeometry(activeProjectId, Array.from(activeObjects.values())),
          saveLayers(activeProjectId, activeLayers),
        ]).then(() => {
          useProjectStore.getState().setAutosaveStatus('saved');
        }).catch((err) => {
          console.error('Emergency save on unload failed:', err);
        });
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);
}
