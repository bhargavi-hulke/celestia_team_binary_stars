import React, { useMemo } from 'react';
import { ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { useApp } from '../../stores/appStore';
import { Html } from '@react-three/drei';
import type { TerrainGrid } from '../../data/types';

export const TERRAIN_WORLD_SIZE = 24; // 3D world units
export const VERTICAL_SCALE = 0.015;

/**
 * Returns minimum and maximum elevation in meters across the TerrainGrid
 */
export function getTerrainElevationBounds(grid: TerrainGrid): { minElev: number; maxElev: number } {
  let minElev = Infinity;
  let maxElev = -Infinity;
  const { width, height, cells } = grid;
  for (let r = 0; r < height; r++) {
    for (let c = 0; c < width; c++) {
      const e = cells[r][c].elevation;
      if (e < minElev) minElev = e;
      if (e > maxElev) maxElev = e;
    }
  }
  return { minElev, maxElev };
}

/**
 * Bilinearly interpolates terrain elevation at continuous (r, c)
 */
export function getInterpolatedElevation(r: number, c: number, grid: TerrainGrid): number {
  const { width, height, cells } = grid;
  const clampedR = Math.max(0, Math.min(height - 1, r));
  const clampedC = Math.max(0, Math.min(width - 1, c));

  const r0 = Math.floor(clampedR);
  const r1 = Math.min(height - 1, r0 + 1);
  const c0 = Math.floor(clampedC);
  const c1 = Math.min(width - 1, c0 + 1);

  const dr = clampedR - r0;
  const dc = clampedC - c0;

  const e00 = cells[r0][c0].elevation;
  const e01 = cells[r0][c1].elevation;
  const e10 = cells[r1][c0].elevation;
  const e11 = cells[r1][c1].elevation;

  const top = (1 - dc) * e00 + dc * e01;
  const bottom = (1 - dc) * e10 + dc * e11;
  return (1 - dr) * top + dr * bottom;
}

/**
 * Transforms grid coordinates to 3D world space (x, y, z)
 * using the shared minElev normalization and vertical scale.
 */
export function gridToWorld(
  r: number,
  c: number,
  elevation: number,
  gridSize: number = 64,
  minElev: number = 0
): [number, number, number] {
  const spacing = TERRAIN_WORLD_SIZE / (gridSize - 1);
  const x = (c - (gridSize - 1) / 2) * spacing;
  const z = (r - (gridSize - 1) / 2) * spacing;
  const y = (elevation - minElev) * VERTICAL_SCALE;
  return [x, y, z];
}

/**
 * Canonical 3D world position for any (r, c) on the terrain surface.
 * Shared by terrain geometry, waypoints, rover, and beacons.
 */
export function getTerrainWorldPos(
  r: number,
  c: number,
  grid: TerrainGrid,
  minElev?: number
): [number, number, number] {
  const mElev = minElev !== undefined ? minElev : getTerrainElevationBounds(grid).minElev;
  const elev = getInterpolatedElevation(r, c, grid);
  return gridToWorld(r, c, elev, grid.width, mElev);
}

/**
 * Inverse transformation from world (x, z) to grid coordinates (r, c).
 */
export function worldToGrid(
  x: number,
  z: number,
  gridSize: number = 64
): [number, number] {
  const spacing = TERRAIN_WORLD_SIZE / (gridSize - 1);
  const c = Math.round(x / spacing + (gridSize - 1) / 2);
  const r = Math.round(z / spacing + (gridSize - 1) / 2);
  return [
    Math.max(0, Math.min(gridSize - 1, r)),
    Math.max(0, Math.min(gridSize - 1, c))
  ];
}

interface TerrainMeshProps {
  onCellClick?: (r: number, c: number, event: ThreeEvent<MouseEvent>) => void;
  selectionMode?: 'start' | 'goal' | 'inspect';
}

export const TerrainMesh: React.FC<TerrainMeshProps> = ({ onCellClick, selectionMode = 'inspect' }) => {
  const { state, hoverCell } = useApp();
  const { terrainGrid, activeLayer, visualStyle, wireframe, currentMission, pathResult, hoveredCell } = state;
  const { width, height, cells } = terrainGrid;

  // Compute elevation bounds once for normalization
  const { minElev, maxElev } = useMemo(() => getTerrainElevationBounds(terrainGrid), [terrainGrid]);
  const rangeE = Math.max(1, maxElev - minElev);

  // Build Geometry and Colors based on activeLayer ('imagery' | 'elevation' | 'slope' | 'hillshade') and visualStyle
  const { geometry } = useMemo(() => {
    const geom = new THREE.PlaneGeometry(TERRAIN_WORLD_SIZE, TERRAIN_WORLD_SIZE, width - 1, height - 1);
    geom.rotateX(-Math.PI / 2);

    const pos = geom.attributes.position;
    const colors = new Float32Array(pos.count * 3);

    // Color ramps
    const cSafe = new THREE.Color('#334155');
    const cGentle = new THREE.Color('#0284c7');
    const cCaution = new THREE.Color('#d97706');
    const cHazard = new THREE.Color('#dc2626');
    const cBlocked = new THREE.Color('#7f1d1d');

    let idx = 0;
    for (let r = 0; r < height; r++) {
      for (let c = 0; c < width; c++) {
        const cell = cells[r][c];
        const y = (cell.elevation - minElev) * VERTICAL_SCALE;
        pos.setY(idx, y);

        let vertexColor = cSafe;

        if (visualStyle === 'sculpted' && activeLayer === 'imagery') {
          // Pure monochrome clay shader
          const normH = (cell.elevation - minElev) / rangeE;
          const grey = 0.55 + normH * 0.35;
          vertexColor = new THREE.Color(grey, grey, grey);
        } else if (activeLayer === 'slope') {
          // Slope gradient heatmap
          if (cell.blocked) {
            vertexColor = cBlocked;
          } else if (cell.slope >= 25) {
            vertexColor = cHazard;
          } else if (cell.slope >= 15) {
            vertexColor = cCaution;
          } else if (cell.slope >= 8) {
            vertexColor = cGentle;
          } else {
            vertexColor = cSafe;
          }
        } else if (activeLayer === 'elevation') {
          // Hypsometric elevation color ramp (deep blue -> cyan -> gold -> snow white)
          const normH = (cell.elevation - minElev) / rangeE;
          if (normH < 0.25) {
            vertexColor = new THREE.Color().setHSL(0.65 - normH * 0.4, 0.8, 0.3 + normH * 0.4);
          } else if (normH < 0.7) {
            vertexColor = new THREE.Color().setHSL(0.55 - normH * 0.5, 0.75, 0.45);
          } else {
            vertexColor = new THREE.Color().setHSL(0.12, 0.8, 0.5 + normH * 0.4);
          }
        } else if (activeLayer === 'hillshade') {
          // Solar shaded relief
          const illum = cell.illumination || 0.7;
          const val = 0.2 + illum * 0.75;
          vertexColor = new THREE.Color(val, val * 0.98, val * 0.95);
        } else {
          // Natural regolith albedo
          const normH = (cell.elevation - minElev) / rangeE;
          const grey = 0.28 + normH * 0.42;
          vertexColor = new THREE.Color(grey, grey * 0.98, grey * 0.94);
        }

        colors[idx * 3] = vertexColor.r;
        colors[idx * 3 + 1] = vertexColor.g;
        colors[idx * 3 + 2] = vertexColor.b;

        idx++;
      }
    }

    geom.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geom.computeVertexNormals();

    return { geometry: geom };
  }, [terrainGrid, activeLayer, visualStyle, width, height, cells, minElev, rangeE]);

  // Compute 3D Route Curve Points (sharing identical terrain coordinate mapping + small elevation clearance)
  const routePoints = useMemo(() => {
    if (!pathResult || !pathResult.success || pathResult.route.length === 0) return [];
    return pathResult.route.map(([r, c]) => {
      const [x, y, z] = getTerrainWorldPos(r, c, terrainGrid, minElev);
      return new THREE.Vector3(x, y + 0.08, z);
    });
  }, [pathResult, terrainGrid, minElev]);

  const routeLineGeometry = useMemo(() => {
    if (routePoints.length < 2) return null;
    return new THREE.BufferGeometry().setFromPoints(routePoints);
  }, [routePoints]);

  const startPos = useMemo(() => {
    const [r, c] = currentMission.startCell;
    return getTerrainWorldPos(r, c, terrainGrid, minElev);
  }, [currentMission.startCell, terrainGrid, minElev]);

  const goalPos = useMemo(() => {
    const [r, c] = currentMission.goalCell;
    return getTerrainWorldPos(r, c, terrainGrid, minElev);
  }, [currentMission.goalCell, terrainGrid, minElev]);

  const hoveredPos = useMemo(() => {
    if (!hoveredCell) return null;
    return getTerrainWorldPos(hoveredCell[0], hoveredCell[1], terrainGrid, minElev);
  }, [hoveredCell, terrainGrid, minElev]);

  const handlePointerDown = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (!e.point) return;
    const [r, c] = worldToGrid(e.point.x, e.point.z, width);
    if (onCellClick) onCellClick(r, c, e);
  };

  const handlePointerMove = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    if (!e.point) return;
    const [r, c] = worldToGrid(e.point.x, e.point.z, width);
    hoverCell([r, c]);
  };

  return (
    <group>
      {/* 3D Terrain Surface */}
      <mesh
        geometry={geometry}
        receiveShadow
        castShadow
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerOut={() => hoverCell(null)}
      >
        <meshStandardMaterial
          vertexColors
          roughness={visualStyle === 'sculpted' ? 0.65 : 0.88}
          metalness={0.06}
          wireframe={wireframe}
          flatShading={false}
        />
      </mesh>

      {/* Planned Mission Route Trajectory */}
      {routeLineGeometry && (
        <group>
          <primitive object={new THREE.Line(
            routeLineGeometry,
            new THREE.LineBasicMaterial({ color: 0x00f2fe, linewidth: 3, transparent: true, opacity: 0.9 })
          )} />
          {routePoints.filter((_, i) => i % 3 === 0).map((pt, i) => (
            <mesh key={i} position={pt}>
              <sphereGeometry args={[0.07, 8, 8]} />
              <meshBasicMaterial color="#38bdf8" />
            </mesh>
          ))}
        </group>
      )}

      {/* Start Point Marker (Lander / Deployment Beacon) */}
      <group position={[startPos[0], startPos[1], startPos[2]]}>
        <mesh position={[0, 0.45, 0]}>
          <cylinderGeometry args={[0.02, 0.02, 0.9, 8]} />
          <meshBasicMaterial color="#22c55e" />
        </mesh>
        <mesh position={[0, 0.9, 0]}>
          <sphereGeometry args={[0.16, 16, 16]} />
          <meshStandardMaterial color="#22c55e" emissive="#22c55e" emissiveIntensity={0.8} />
        </mesh>
        <Html position={[0, 1.35, 0]} center distanceFactor={14}>
          <div className="bg-slate-950/90 text-emerald-300 border border-emerald-500/80 px-2 py-0.5 rounded text-[10px] font-mono whitespace-nowrap shadow-lg flex items-center gap-1 select-none pointer-events-none">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            DEPLOY: [{currentMission.startCell.join(',')}]
          </div>
        </Html>
      </group>

      {/* Goal Point Marker (Target Objective) */}
      <group position={[goalPos[0], goalPos[1], goalPos[2]]}>
        <mesh position={[0, 0.45, 0]}>
          <cylinderGeometry args={[0.02, 0.02, 0.9, 8]} />
          <meshBasicMaterial color="#f43f5e" />
        </mesh>
        <mesh position={[0, 0.9, 0]}>
          <octahedronGeometry args={[0.22, 0]} />
          <meshStandardMaterial color="#f43f5e" emissive="#f43f5e" emissiveIntensity={0.9} />
        </mesh>
        <Html position={[0, 1.35, 0]} center distanceFactor={14}>
          <div className="bg-slate-950/90 text-rose-300 border border-rose-500/80 px-2 py-0.5 rounded text-[10px] font-mono whitespace-nowrap shadow-lg flex items-center gap-1 select-none pointer-events-none">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping" />
            TARGET: [{currentMission.goalCell.join(',')}]
          </div>
        </Html>
      </group>

      {/* Hovered Cell Indicator Box */}
      {hoveredPos && (
        <group position={[hoveredPos[0], hoveredPos[1] + 0.03, hoveredPos[2]]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[TERRAIN_WORLD_SIZE / (width - 1), TERRAIN_WORLD_SIZE / (height - 1)]} />
            <meshBasicMaterial
              color={selectionMode === 'start' ? '#22c55e' : selectionMode === 'goal' ? '#f43f5e' : '#38bdf8'}
              transparent
              opacity={0.45}
              side={THREE.DoubleSide}
            />
          </mesh>
        </group>
      )}
    </group>
  );
};
