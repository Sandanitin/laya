'use client';

import { useEffect, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import TopBar from '@/features/studio/components/TopBar';
import LeftSidebar from '@/features/studio/components/LeftSidebar';
import ToastStack from '@/features/studio/components/ToastStack';
import { useUiStore } from '@/stores/ui-store';
import { useDashboardStore } from '@/stores/dashboard-store';
import { useProjectStore } from '@/stores/project-store';
import { useKeyboardShortcuts } from '@/hooks/use-keyboard';
import { useAutosave } from '@/hooks/use-autosave';

// Load canvas client-side only (no SSR) — PixiJS requires the browser
const CadCanvas = dynamic(() => import('@/features/studio/components/CadCanvas'), { ssr: false });

/**
 * Extracts project ID from URL query parameters to hydrate selected project.
 */
function EditorParamsHydrator() {
  const searchParams = useSearchParams();
  const openProject = useDashboardStore((s) => s.openProject);

  useEffect(() => {
    const pId = searchParams.get('projectId') || searchParams.get('id') || searchParams.get('project');
    if (pId) {
      openProject(pId);
    }
  }, [searchParams, openProject]);

  return null;
}

export default function EditorPage() {
  useKeyboardShortcuts();
  useAutosave();

  const isPaneOpen = useUiStore((s) => s.isPaneOpen);
  const currentProjectId = useDashboardStore((s) => s.currentProjectId);
  const projects = useDashboardStore((s) => s.projects);
  const setTitle = useProjectStore((s) => s.setTitle);

  // Sync active project title when currentProjectId updates
  useEffect(() => {
    if (currentProjectId) {
      const proj = projects.find((p) => p.id === currentProjectId);
      if (proj) {
        setTitle(proj.name);
      }
    }
  }, [currentProjectId, projects, setTitle]);

  return (
    <div
      className="flex flex-col h-screen overflow-hidden"
      style={{ background: 'hsl(var(--bg-void))' }}
    >
      <Suspense fallback={null}>
        <EditorParamsHydrator />
      </Suspense>

      {/* Universal Top Bar */}
      <TopBar />

      {/* Body: Sidebar + Canvas */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Desktop Sidebar Column ─────────────────────────────────── */}
        {/* Hidden on mobile — sidebar renders its own fixed bottom bar   */}
        <div
          className="hidden sm:flex flex-shrink-0 h-full relative transition-all duration-300"
          style={{
            width: isPaneOpen
              ? `calc(var(--toolbar-w) + var(--pane-w))`
              : `var(--toolbar-w)`,
          }}
        >
          <LeftSidebar />
        </div>

        {/* ── Main Canvas ─────────────────────────────────────────────── */}
        {/* pb-14 = room for mobile bottom icon bar (56px)                */}
        <div className="flex-1 overflow-hidden pb-14 sm:pb-0">
          <CadCanvas />
        </div>
      </div>

      {/* ── Mobile Sidebar ─────────────────────────────────────────────── */}
      {/* Rendered outside flex row so it's truly fixed-position           */}
      <div className="sm:hidden">
        <LeftSidebar />
      </div>

      {/* Toast notifications */}
      <ToastStack />
    </div>
  );
}
