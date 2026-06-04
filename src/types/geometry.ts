// ─── Core Geometry Types ────────────────────────────────────────────────────

export type GeometryType =
  | 'room'
  | 'wall'
  | 'opening'
  | 'window'
  | 'door'
  | 'furniture'
  | 'annotation'
  | 'symbol';

export type VectorType = 'STRUCTURE' | 'OPENING' | 'FURNITURE' | 'ANNOTATION';

export interface BBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export interface Point2D {
  x: number;
  y: number;
}

export interface GeometryData {
  type: 'polygon' | 'polyline' | 'point' | 'arc';
  /** Flat array of [x, y] pairs */
  coordinates: [number, number][];
  bbox: BBox;
}

export interface GeometryStyle {
  fillColor: string | null;
  fillOpacity: number;
  strokeColor: string;
  strokeWidth: number;
  strokeDashArray: number[];
  patternId: string | null;
}

export interface GeometryMetadata {
  name: string;
  areaSqM: number | null;
  areaSqFt: number | null;
  perimeter: number | null;
  tags: string[];
  properties: Record<string, string | number | boolean>;
}

export interface GeometryRelationships {
  parentId: string | null;
  childIds: string[];
  linkedBoardElementIds: string[];
}

export interface GeometryTransform {
  x: number;
  y: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
}

export interface GeometryObject {
  id: string;
  type: GeometryType;
  layerId: string;
  geometry: GeometryData;
  style: GeometryStyle;
  metadata: GeometryMetadata;
  relationships: GeometryRelationships;
  transform: GeometryTransform;
  version: number;
  createdAt: string;
  updatedAt: string;
}

// ─── Layer Types ─────────────────────────────────────────────────────────────

export type LayerType = 'group' | 'geometry' | 'annotation' | 'symbol';

export interface Layer {
  id: string;
  workspaceId: string;
  parentId: string | null;
  name: string;
  type: LayerType;
  visible: boolean;
  locked: boolean;
  isolated: boolean;
  colorOverride: string | null;
  opacity: number;
  sortOrder: number;
  children: string[]; // child layer IDs
}

// ─── CAD Floor Plan (raw JSON format) ────────────────────────────────────────

export interface RawRoom {
  id: string;
  name: string;
  areaSqFt: number;
  points: [number, number][];
}

export interface RawVector {
  id: string;
  type: VectorType;
  points: [number, number][];
}

export interface FloorPlan {
  meta: {
    projectName: string;
    units: string;
    scale: number;
  };
  rooms: RawRoom[];
  vectors: RawVector[];
}

// ─── Spatial Index Item ──────────────────────────────────────────────────────

export interface SpatialItem extends BBox {
  id: string;
}

// ─── Query Rule (rule-based selection) ───────────────────────────────────────

export interface QueryRule {
  field: string;
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'in';
  value: string | number | boolean | string[];
}

export interface QueryExpression {
  logic: 'AND' | 'OR';
  rules: QueryRule[];
}
