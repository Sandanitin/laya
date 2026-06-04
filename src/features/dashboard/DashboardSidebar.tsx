'use client';

import { useDashboardStore } from '@/stores/dashboard-store';
import {
  FolderOpen, LayoutTemplate, Bell, ChevronLeft, ChevronRight,
  Layers,
} from 'lucide-react';

const NAV_TOP = [
  { id: 'home', icon: Layers, label: 'LAYA' },
  { id: 'projects', icon: FolderOpen, label: 'Projects' },
  { id: 'templates', icon: LayoutTemplate, label: 'Templates' },
] as const;

export default function DashboardSidebar() {
  const section = useDashboardStore((s) => s.dashboard.section);
  const sidebarOpen = useDashboardStore((s) => s.dashboard.sidebarOpen);
  const setSection = useDashboardStore((s) => s.setDashboardSection);
  const setSidebarOpen = useDashboardStore((s) => s.setSidebarOpen);

  return (
    <aside
      className="flex flex-col h-full transition-all duration-300"
      style={{
        width: sidebarOpen ? '200px' : '60px',
        background: 'hsl(var(--bg-surface))',
        borderRight: '1px solid hsl(var(--border-subtle))',
        flexShrink: 0,
      }}
    >
      {/* Logo / Brand */}
      <div
        className="flex items-center gap-3 px-3 py-4 border-b"
        style={{ borderColor: 'hsl(var(--border-subtle))' }}
      >
        <div
          className="flex items-center justify-center rounded-xl flex-shrink-0"
          style={{
            width: 36, height: 36,
            background: 'linear-gradient(135deg, hsl(var(--brand-primary)), hsl(var(--brand-accent)))',
          }}
        >
          <span className="text-black font-black text-sm">L</span>
        </div>
        {sidebarOpen && (
          <span
            className="font-bold text-base tracking-tight"
            style={{ color: 'hsl(var(--text-primary))' }}
          >
            LAYA
          </span>
        )}
      </div>

      {/* Top Nav Items */}
      <nav className="flex flex-col gap-1 p-2 flex-1">
        {NAV_TOP.slice(1).map(({ id, icon: Icon, label }) => {
          const active = section === id;
          return (
            <button
              key={id}
              id={`sidebar-nav-${id}`}
              onClick={() => setSection(id as 'home' | 'projects' | 'templates')}
              className="flex items-center gap-3 rounded-xl px-2 py-2.5 transition-all duration-150 text-left w-full"
              style={{
                background: active
                  ? 'hsla(158, 64%, 52%, 0.12)'
                  : 'transparent',
                color: active
                  ? 'hsl(var(--brand-primary))'
                  : 'hsl(var(--text-secondary))',
                border: active
                  ? '1px solid hsla(158, 64%, 52%, 0.22)'
                  : '1px solid transparent',
              }}
            >
              <Icon size={18} className="flex-shrink-0" />
              {sidebarOpen && (
                <span className="text-sm font-medium">{label}</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom: Notifications + Profile */}
      <div
        className="flex flex-col gap-1 p-2 border-t"
        style={{ borderColor: 'hsl(var(--border-subtle))' }}
      >
        <button
          id="sidebar-notifications"
          className="flex items-center gap-3 rounded-xl px-2 py-2.5 transition-all"
          style={{ color: 'hsl(var(--text-muted))' }}
        >
          <Bell size={18} className="flex-shrink-0" />
          {sidebarOpen && <span className="text-sm font-medium">Notifications</span>}
        </button>
        <button
          id="sidebar-profile"
          className="flex items-center gap-3 rounded-xl px-2 py-2.5 transition-all"
          style={{ color: 'hsl(var(--text-muted))' }}
        >
          <div
            className="flex items-center justify-center rounded-full flex-shrink-0 text-xs font-bold"
            style={{
              width: 28, height: 28,
              background: 'hsl(var(--brand-accent))',
              color: 'hsl(220, 22%, 8%)',
            }}
          >
            AK
          </div>
          {sidebarOpen && (
            <div className="flex flex-col items-start">
              <span className="text-sm font-medium" style={{ color: 'hsl(var(--text-primary))' }}>
                Arjun K.
              </span>
              <span className="text-xs" style={{ color: 'hsl(var(--text-muted))' }}>
                Pro Plan
              </span>
            </div>
          )}
        </button>
      </div>

      {/* Collapse Toggle */}
      <button
        id="sidebar-collapse-toggle"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="flex items-center justify-center h-8 border-t transition-all"
        style={{
          borderColor: 'hsl(var(--border-subtle))',
          color: 'hsl(var(--text-muted))',
        }}
      >
        {sidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
      </button>
    </aside>
  );
}
