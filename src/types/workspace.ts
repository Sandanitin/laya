/* eslint-disable @typescript-eslint/no-explicit-any */
// ─── Workspace & Board Domain Types ──────────────────────────────────────────

export interface Workspace {
  id: string;
  orgId: string;
  name: string;
  description: string;
  thumbnailKey: string;
  settings: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  workspaceId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface BoardElement {
  id: string;
  boardId: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  zIndex: number;
  data: Record<string, any>;
  componentDefId: string | null;
  createdAt: string;
}

export interface Board {
  id: string;
  workspaceId: string;
  name: string;
  paperSize: 'A0' | 'A1' | 'A2' | 'A3' | 'A4' | 'custom';
  orientation: 'portrait' | 'landscape';
  widthMm: number;
  heightMm: number;
  background: Record<string, any>;
  settings: Record<string, any>;
  sortOrder: number;
  elements: BoardElement[];
  createdAt: string;
}
