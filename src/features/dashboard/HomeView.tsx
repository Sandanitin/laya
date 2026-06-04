'use client';

import { useRouter } from 'next/navigation';
import { useDashboardStore } from '@/stores/dashboard-store';
import {
  Search, Plus, Clock, Star, ArrowRight, Pencil,
} from 'lucide-react';

const COLORS = [
  'linear-gradient(135deg, hsl(158,64%,32%), hsl(210,80%,36%))',
  'linear-gradient(135deg, hsl(270,60%,36%), hsl(210,80%,36%))',
  'linear-gradient(135deg, hsl(30,80%,36%), hsl(0,70%,40%))',
  'linear-gradient(135deg, hsl(200,70%,36%), hsl(158,64%,32%))',
  'linear-gradient(135deg, hsl(330,60%,36%), hsl(270,60%,36%))',
];

function timeAgo(ts: number) {
  const diff = Date.now() - ts;
  const hrs = Math.floor(diff / 3_600_000);
  if (hrs < 1) return 'Just now';
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function HomeView() {
  const router = useRouter();
  const projects = useDashboardStore((s) => s.projects);
  const searchQuery = useDashboardStore((s) => s.dashboard.searchQuery);
  const setSearchQuery = useDashboardStore((s) => s.setSearchQuery);
  const openProject = useDashboardStore((s) => s.openProject);
  const createProject = useDashboardStore((s) => s.createProject);

  const recentProjects = projects.slice(0, 8);

  const handleOpen = (id: string) => {
    openProject(id);
    router.push('/editor');
  };

  const handleCreate = () => {
    createProject();
    router.push('/editor');
  };

  return (
    <main className="flex-1 overflow-y-auto" style={{ background: 'hsl(var(--bg-void))' }}>
      {/* Hero */}
      <section
        className="relative px-12 py-20 overflow-hidden"
        style={{
          background: `
            radial-gradient(ellipse 60% 40% at 50% 0%, hsla(158,64%,52%,0.08) 0%, transparent 70%),
            hsl(var(--bg-void))
          `,
        }}
      >
        {/* Decorative grid lines */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `
              linear-gradient(hsl(var(--border-subtle)) 1px, transparent 1px),
              linear-gradient(90deg, hsl(var(--border-subtle)) 1px, transparent 1px)
            `,
            backgroundSize: '48px 48px',
            opacity: 0.3,
          }}
        />

        <div className="relative max-w-3xl fade-up">
          <div
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-6"
            style={{
              background: 'hsla(158, 64%, 52%, 0.12)',
              color: 'hsl(var(--brand-primary))',
              border: '1px solid hsla(158,64%,52%,0.22)',
            }}
          >
            <Star size={11} fill="currentColor" />
            Professional Architectural Suite
          </div>

          <h1
            className="text-5xl font-bold leading-tight mb-3"
            style={{ color: 'hsl(var(--text-primary))' }}
          >
            Start your design{' '}
            <span
              style={{
                background: 'linear-gradient(90deg, hsl(var(--brand-primary)), hsl(var(--brand-accent)))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              now.
            </span>
          </h1>
          <p className="text-lg mb-10" style={{ color: 'hsl(var(--text-secondary))' }}>
            Render, annotate, and present architectural floor plans with studio-grade precision.
          </p>

          {/* Search Bar */}
          <div className="relative max-w-xl">
            <Search
              size={17}
              className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: 'hsl(var(--text-muted))' }}
            />
            <input
              id="dashboard-search"
              type="text"
              placeholder="Search projects, templates, or files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>
        </div>
      </section>

      {/* Recent Projects */}
      <section className="px-12 pb-16">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Clock size={16} style={{ color: 'hsl(var(--text-muted))' }} />
            <h2 className="text-base font-semibold" style={{ color: 'hsl(var(--text-primary))' }}>
              Recent Projects
            </h2>
          </div>
          <button
            className="flex items-center gap-1 text-sm transition-colors"
            style={{ color: 'hsl(var(--brand-primary))' }}
          >
            View all <ArrowRight size={14} />
          </button>
        </div>

        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
          {/* Create New Card */}
          <button
            id="create-new-project-btn"
            onClick={handleCreate}
            className="project-card flex flex-col items-center justify-center gap-3 p-8 min-h-[180px] border-dashed"
            style={{
              borderStyle: 'dashed',
              borderColor: 'hsl(var(--border-default))',
            }}
          >
            <div
              className="flex items-center justify-center w-12 h-12 rounded-2xl"
              style={{ background: 'hsla(158,64%,52%,0.12)', color: 'hsl(var(--brand-primary))' }}
            >
              <Plus size={22} />
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: 'hsl(var(--text-primary))' }}>
                Create New
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--text-muted))' }}>
                Start from scratch
              </p>
            </div>
          </button>

          {/* Project Cards */}
          {recentProjects.map((proj, i) => (
            <button
              key={proj.id}
              id={`project-card-${proj.id}`}
              className="project-card text-left"
              onClick={() => handleOpen(proj.id)}
            >
              {/* Thumbnail */}
              <div
                className="h-[120px] w-full flex items-center justify-center relative overflow-hidden"
                style={{ background: COLORS[i % COLORS.length] }}
              >
                {/* Mock floor plan lines */}
                <svg width="100%" height="100%" viewBox="0 0 200 100" preserveAspectRatio="xMidYMid slice">
                  <rect x="20" y="10" width="80" height="50" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5"/>
                  <rect x="100" y="10" width="60" height="30" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5"/>
                  <rect x="20" y="60" width="50" height="30" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5"/>
                  <rect x="70" y="60" width="50" height="30" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5"/>
                  <line x1="100" y1="10" x2="100" y2="90" stroke="rgba(255,255,255,0.15)" strokeWidth="1"/>
                </svg>
                <div
                  className="absolute bottom-0 inset-x-0 h-1"
                  style={{ background: 'linear-gradient(transparent, rgba(0,0,0,0.3))' }}
                />
              </div>

              {/* Info */}
              <div className="px-3 py-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold truncate" style={{ color: 'hsl(var(--text-primary))' }}>
                    {proj.name}
                  </p>
                  <Pencil size={12} style={{ color: 'hsl(var(--text-muted))', flexShrink: 0 }} />
                </div>
                <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--text-muted))' }}>
                  Updated {timeAgo(proj.updatedAt)}
                </p>
              </div>
            </button>
          ))}
        </div>
      </section>
    </main>
  );
}
