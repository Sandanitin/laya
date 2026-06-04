import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

export interface ProjectItem {
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

interface DashboardState {
  dashboard: DashboardView;
  projects: ProjectItem[];
  currentProjectId: string | null;

  setDashboardSection: (section: DashboardView['section']) => void;
  setSidebarOpen: (open: boolean) => void;
  setSearchQuery: (q: string) => void;
  setProjectSort: (sort: DashboardView['projectSort']) => void;
  openProject: (id: string | null) => void;
  createProject: () => void;
  deleteProject: (id: string) => void;
}

const INITIAL_PROJECTS: ProjectItem[] = [
  { id: 'proj-1', name: 'Residence Villa A', thumbnail: '', updatedAt: Date.now() - 3600_000, createdAt: Date.now() - 86400_000 * 7 },
  { id: 'proj-2', name: 'Office Complex B', thumbnail: '', updatedAt: Date.now() - 7200_000, createdAt: Date.now() - 86400_000 * 14 },
  { id: 'proj-3', name: 'Museum Expansion', thumbnail: '', updatedAt: Date.now() - 3600_000 * 3, createdAt: Date.now() - 86400_000 * 30 },
  { id: 'proj-4', name: 'Urban Apartment', thumbnail: '', updatedAt: Date.now() - 3600_000 * 12, createdAt: Date.now() - 86400_000 * 45 },
  { id: 'proj-5', name: 'Retail Pavilion', thumbnail: '', updatedAt: Date.now() - 86400_000, createdAt: Date.now() - 86400_000 * 60 },
];

export const useDashboardStore = create<DashboardState>()(
  immer((set) => ({
    dashboard: {
      section: 'home',
      sidebarOpen: true,
      searchQuery: '',
      projectSort: 'date',
      projectFilter: '',
    },
    projects: INITIAL_PROJECTS,
    currentProjectId: null,

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
      const newProj: ProjectItem = {
        id: `proj-${Date.now()}`,
        name: 'New Project',
        thumbnail: '',
        updatedAt: Date.now(),
        createdAt: Date.now(),
      };
      set((s) => {
        s.projects.unshift(newProj);
        s.currentProjectId = newProj.id;
      });
    },

    deleteProject: (id) =>
      set((s) => {
        s.projects = s.projects.filter((p) => p.id !== id);
        if (s.currentProjectId === id) s.currentProjectId = null;
      }),
  }))
);
