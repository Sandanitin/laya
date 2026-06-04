import type { Workspace } from '@/types/workspace';

// Mock database for workspaces in development mode
const MOCK_WORKSPACES: Workspace[] = [
  {
    id: 'ws-default',
    orgId: 'org-laya',
    name: 'Default Workspace',
    description: 'LAYA main architectural workspace',
    thumbnailKey: '',
    settings: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

export const workspaceService = {
  /** Fetch all workspaces for the organization */
  async getWorkspaces(): Promise<Workspace[]> {
    await new Promise((resolve) => setTimeout(resolve, 300)); // simulate latency
    return [...MOCK_WORKSPACES];
  },

  /** Fetch a single workspace by ID */
  async getWorkspace(id: string): Promise<Workspace | null> {
    await new Promise((resolve) => setTimeout(resolve, 200));
    return MOCK_WORKSPACES.find((w) => w.id === id) || null;
  },

  /** Create a new workspace */
  async createWorkspace(name: string, description = ''): Promise<Workspace> {
    await new Promise((resolve) => setTimeout(resolve, 400));
    const newWs: Workspace = {
      id: `ws-${Date.now()}`,
      orgId: 'org-laya',
      name,
      description,
      thumbnailKey: '',
      settings: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    MOCK_WORKSPACES.push(newWs);
    return newWs;
  }
};
