import type { GeometryObject } from '@/types/geometry';
import { convertRawFloorPlanToGeometryObjects } from '@/lib/floorplan-parser';
import floorPlanRaw from '@/data/mockFloorPlan.json';

// In-memory geometry store cache simulating a remote PostgreSQL/PostGIS database
const REMOTE_GEOMETRY_DB: Map<string, GeometryObject[]> = new Map();

export const geometryService = {
  /**
   * Fetches all geometry objects for a given workspace.
   * Lazily populates from raw mock CAD floor plan on first request.
   */
  async getGeometry(workspaceId: string): Promise<GeometryObject[]> {
    await new Promise((resolve) => setTimeout(resolve, 500)); // simulate server latency

    if (!REMOTE_GEOMETRY_DB.has(workspaceId)) {
      const initialObjects = convertRawFloorPlanToGeometryObjects(floorPlanRaw);
      REMOTE_GEOMETRY_DB.set(workspaceId, initialObjects);
    }

    return [...(REMOTE_GEOMETRY_DB.get(workspaceId) || [])];
  },

  /**
   * Performs a batch save of geometry objects to the simulated backend database.
   */
  async saveGeometry(workspaceId: string, objects: GeometryObject[]): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 600));
    REMOTE_GEOMETRY_DB.set(workspaceId, objects);
  }
};
