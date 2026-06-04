'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useDashboardStore } from '@/stores/dashboard-store';
import {
  Search, ArrowUpDown, Grid2x2, List, Trash2, ExternalLink,
  CalendarDays, Type,
} from 'lucide-react';

function timeAgo(ts: number) {
  const diff = Date.now() - ts;
  const hrs = Math.floor(diff / 3_600_000);
  if (hrs < 1) return 'Just now';
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const GRADIENTS = [
  'linear-gradient(135deg, hsl(158,64%,28%), hsl(210,80%,32%))',
  'linear-gradient(135deg, hsl(270,60%,32%), hsl(210,80%,32%))',
  'linear-gradient(135deg, hsl(30,80%,32%), hsl(0,70%,36%))',
  'linear-gradient(135deg, hsl(200,70%,32%), hsl(158,64%,28%))',
  'linear-gradient(135deg, hsl(330,60%,32%), hsl(270,60%,32%))',
];

export default function ProjectsView() {
  const router = useRouter();
  const projects = useDashboardStore((s) => s.projects);
  const sort = useDashboardStore((s) => s.dashboard.projectSort);
  const setSort = useDashboardStore((s) => s.setProjectSort);
  const openProject = useDashboardStore((s) => s.openProject);
  const deleteProject = useDashboardStore((s) => s.deleteProject);

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filter, setFilter] = useState('');

  const sorted = [...projects]
    .filter((p) => p.name.toLowerCase().includes(filter.toLowerCase()))
    .sort((a, b) =>
      sort === 'date' ? b.updatedAt - a.updatedAt : a.name.localeCompare(b.name)
    );

  const handleOpen = (id: string) => {
    openProject(id);
    router.push('/editor');
  };

  return (
    <main className="flex-1 overflow-y-auto px-10 py-8" style={{ background: 'hsl(var(--bg-void))' }}>
      {/* Header */}
      <div className="mb-8 fade-up">
        <h1 className="text-2xl font-bold mb-1" style={{ color: 'hsl(var(--text-primary))' }}>
          All Projects
        </h1>
        <p className="text-sm" style={{ color: 'hsl(var(--text-muted))' }}>
          {projects.length} projects
        </p>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3 mb-6 fade-up stagger-1">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: 'hsl(var(--text-muted))' }} />
          <input
            id="projects-search"
            type="text"
            placeholder="Filter projects..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="search-input"
            style={{ paddingLeft: '36px' }}
          />
        </div>

        {/* Sort */}
        <div className="flex items-center gap-1 rounded-lg p-1"
          style={{ background: 'hsl(var(--bg-surface))', border: '1px solid hsl(var(--border-subtle))' }}>
          <button
            id="sort-by-date"
            onClick={() => setSort('date')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all"
            style={{
              background: sort === 'date' ? 'hsl(var(--bg-overlay))' : 'transparent',
              color: sort === 'date' ? 'hsl(var(--text-primary))' : 'hsl(var(--text-muted))',
            }}
          >
            <CalendarDays size={13} /> Date
          </button>
          <button
            id="sort-by-name"
            onClick={() => setSort('name')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all"
            style={{
              background: sort === 'name' ? 'hsl(var(--bg-overlay))' : 'transparent',
              color: sort === 'name' ? 'hsl(var(--text-primary))' : 'hsl(var(--text-muted))',
            }}
          >
            <Type size={13} /> Name
          </button>
        </div>

        {/* View toggle */}
        <div className="flex items-center gap-1 rounded-lg p-1"
          style={{ background: 'hsl(var(--bg-surface))', border: '1px solid hsl(var(--border-subtle))' }}>
          <button id="view-grid" onClick={() => setViewMode('grid')} className="toolbar-btn" style={{ width: 32, height: 32 }}>
            <Grid2x2 size={14} />
          </button>
          <button id="view-list" onClick={() => setViewMode('list')} className="toolbar-btn" style={{ width: 32, height: 32 }}>
            <List size={14} />
          </button>
        </div>
      </div>

      {/* Grid View */}
      {viewMode === 'grid' && (
        <div
          className="grid gap-4 fade-up stagger-2"
          style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}
        >
          {sorted.map((proj, i) => (
            <div key={proj.id} className="project-card group" id={`projects-grid-${proj.id}`}>
              <div
                className="h-32 cursor-pointer"
                style={{ background: GRADIENTS[i % GRADIENTS.length] }}
                onClick={() => handleOpen(proj.id)}
              >
                <svg width="100%" height="100%" viewBox="0 0 200 100" preserveAspectRatio="xMidYMid slice">
                  <rect x="20" y="10" width="80" height="50" fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="1.5"/>
                  <rect x="100" y="10" width="60" height="30" fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="1.5"/>
                  <rect x="20" y="60" width="50" height="30" fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="1.5"/>
                </svg>
              </div>
              <div className="px-3 py-3 flex items-start justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: 'hsl(var(--text-primary))' }}>
                    {proj.name}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--text-muted))' }}>
                    Updated {timeAgo(proj.updatedAt)}
                  </p>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                  <button onClick={() => handleOpen(proj.id)} className="toolbar-btn" style={{ width: 28, height: 28 }}>
                    <ExternalLink size={13} />
                  </button>
                  <button onClick={() => deleteProject(proj.id)} className="toolbar-btn" style={{ width: 28, height: 28, color: 'hsl(var(--error))' }}>
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div
          className="rounded-xl overflow-hidden fade-up stagger-2"
          style={{ border: '1px solid hsl(var(--border-subtle))' }}
        >
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: 'hsl(var(--bg-surface))', borderBottom: '1px solid hsl(var(--border-subtle))' }}>
                {['Name', 'Modified', 'Created', ''].map((h) => (
                  <th key={h} className="text-left px-4 py-3 font-medium text-xs"
                    style={{ color: 'hsl(var(--text-muted))' }}>
                    <span className="flex items-center gap-1">{h} {h === 'Name' && <ArrowUpDown size={11} />}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((proj, i) => (
                <tr
                  key={proj.id}
                  id={`projects-list-${proj.id}`}
                  className="group cursor-pointer transition-colors"
                  style={{
                    borderBottom: i < sorted.length - 1 ? '1px solid hsl(var(--border-subtle))' : 'none',
                  }}
                  onClick={() => handleOpen(proj.id)}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex-shrink-0"
                        style={{ background: GRADIENTS[i % GRADIENTS.length] }} />
                      <span className="font-medium" style={{ color: 'hsl(var(--text-primary))' }}>
                        {proj.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3" style={{ color: 'hsl(var(--text-muted))' }}>
                    {timeAgo(proj.updatedAt)}
                  </td>
                  <td className="px-4 py-3" style={{ color: 'hsl(var(--text-muted))' }}>
                    {timeAgo(proj.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={(e) => { e.stopPropagation(); handleOpen(proj.id); }}
                        className="toolbar-btn" style={{ width: 28, height: 28 }}>
                        <ExternalLink size={13} />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); deleteProject(proj.id); }}
                        className="toolbar-btn" style={{ width: 28, height: 28, color: 'hsl(var(--error))' }}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
