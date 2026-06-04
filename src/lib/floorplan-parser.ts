/* eslint-disable @typescript-eslint/no-explicit-any */
import type { GeometryObject, BBox } from '@/types/geometry';

/**
 * Converts the raw CAD JSON schema (mockFloorPlan.json) into the normalized GeometryObject[] schema.
 */
export function convertRawFloorPlanToGeometryObjects(raw: any): GeometryObject[] {
  const objects: GeometryObject[] = [];
  const now = new Date().toISOString();

  // Convert rooms
  raw.rooms.forEach((room: any) => {
    const bbox = computeBBox(room.points);
    objects.push({
      id: room.id,
      type: 'room',
      layerId: 'STRUCTURE', // default layer
      geometry: {
        type: 'polygon',
        coordinates: room.points,
        bbox,
      },
      style: {
        fillColor: '#166534',
        fillOpacity: 0.22,
        strokeColor: '#22c55e',
        strokeWidth: 1.5,
        strokeDashArray: [],
        patternId: null,
      },
      metadata: {
        name: room.name,
        areaSqM: room.areaSqFt ? room.areaSqFt * 0.092903 : null,
        areaSqFt: room.areaSqFt || null,
        perimeter: null,
        tags: ['room'],
        properties: {},
      },
      relationships: {
        parentId: null,
        childIds: [],
        linkedBoardElementIds: [],
      },
      transform: { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1 },
      version: 1,
      createdAt: now,
      updatedAt: now,
    });
  });

  // Convert vectors
  raw.vectors.forEach((v: any) => {
    const bbox = computeBBox(v.points);
    let type: any = 'wall';
    if (v.type === 'OPENING') type = 'opening';
    if (v.type === 'FURNITURE') type = 'furniture';
    if (v.type === 'ANNOTATION') type = 'annotation';

    let strokeColor = '#64748b';
    let strokeWidth = 1.0;
    if (v.type === 'STRUCTURE') {
      strokeColor = '#e2e8f0';
      strokeWidth = 2.5;
    } else if (v.type === 'OPENING') {
      strokeColor = '#fbbf24';
      strokeWidth = 1.5;
    } else if (v.type === 'FURNITURE') {
      strokeColor = '#818cf8';
      strokeWidth = 1.0;
    }

    objects.push({
      id: v.id,
      type,
      layerId: v.type, // e.g. STRUCTURE, OPENING, FURNITURE, ANNOTATION
      geometry: {
        type: 'polyline',
        coordinates: v.points,
        bbox,
      },
      style: {
        fillColor: null,
        fillOpacity: 0,
        strokeColor,
        strokeWidth,
        strokeDashArray: [],
        patternId: null,
      },
      metadata: {
        name: v.id,
        areaSqM: null,
        areaSqFt: null,
        perimeter: null,
        tags: [v.type.toLowerCase()],
        properties: {},
      },
      relationships: {
        parentId: null,
        childIds: [],
        linkedBoardElementIds: [],
      },
      transform: { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1 },
      version: 1,
      createdAt: now,
      updatedAt: now,
    });
  });

  return objects;
}

function computeBBox(points: [number, number][]): BBox {
  if (points.length === 0) return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  points.forEach(([x, y]) => {
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  });
  return { minX, minY, maxX, maxY };
}
