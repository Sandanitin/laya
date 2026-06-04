'use client';

import { useDashboardStore } from '@/stores/dashboard-store';
import DashboardSidebar from '@/features/dashboard/DashboardSidebar';
import HomeView from '@/features/dashboard/HomeView';
import ProjectsView from '@/features/dashboard/ProjectsView';
import TemplatesView from '@/features/dashboard/TemplatesView';

export default function DashboardPage() {
  const section = useDashboardStore((s) => s.dashboard.section);

  return (
    <div className="flex h-screen" style={{ background: 'hsl(var(--bg-void))' }}>
      <DashboardSidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        {section === 'home' && <HomeView />}
        {section === 'projects' && <ProjectsView />}
        {section === 'templates' && <TemplatesView />}
      </div>
    </div>
  );
}
