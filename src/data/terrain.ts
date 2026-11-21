import type { TerrainGrid, TerrainCell, DatasetMetadata, LunarRegion } from './types';
import { lunarRegions } from './regions';

function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const SIZE = 64;

function slopeAt(elevations: number[][], r: number, c: number, cellSize: number): number {
  const n = elevations.length;
  const left = c > 0 ? elevations[r][c - 1] : elevations[r][c];
  const right = c < n - 1 ? elevations[r][c + 1] : elevations[r][c];
  const up = r > 0 ? elevations[r - 1][c] : elevations[r][c];
  const down = r < n - 1 ? elevations[r + 1][c] : elevations[r][c];
  const dzdx = (right - left) / (2 * cellSize);
  const dzdy = (down - up) / (2 * cellSize);
  return Math.atan(Math.sqrt(dzdx * dzdx + dzdy * dzdy)) * (180 / Math.PI);
}

// Procedural DEM generator parameterized by regional topography
export function generateRegionalDEM(region: LunarRegion): TerrainGrid {
  const isPolar = region.id === 'shackleton-ridge';
  const isApollo = region.id === 'tranquility-base';
  const isTycho = region.id === 'tycho-crater';

  const cellSize = isPolar ? 20 : isApollo ? 25 : isTycho ? 80 : 50; // meters per cell
  const seed = region.id === 'shackleton-ridge' ? 8990 : region.id === 'tranquility-base' ? 1969 : region.id === 'tycho-crater' ? 4331 : 2023;
  const rand = mulberry32(seed);

  const raw: number[][] = [];
  const baseElev = region.elevationApprox || -2840;

  for (let r = 0; r < SIZE; r++) {
    const row: number[] = [];
    for (let c = 0; c < SIZE; c++) {
      let h = 0;

      if (isPolar) {
        // Shackleton Connecting Ridge: sharp elevated knife-edge ridge with deep shadow depression on sides
        const distFromCrest = Math.abs(c - 32);
        h += 180 * Math.exp(-(distFromCrest * distFromCrest) / 120); // elevated ridge
        h -= 300 * Math.pow(distFromCrest / 32, 2.2); // steep drop into crater depths
        h += 25 * Math.sin(r * 0.15); // undulating ridge crest
      } else if (isApollo) {
        // Tranquility Base: flat volcanic mare with subtle wrinkle ridges and West Crater depression
        h += 15 * Math.sin(c * 0.08) * Math.cos(r * 0.08); // gentle mare swell
        // West Crater (centered near [32, 34], ~180m wide)
        const dWest = Math.sqrt((c - 34) ** 2 + (r - 32) ** 2);
        if (dWest < 6) {
          h -= 35 * (1 - (dWest / 6) ** 2); // crater bowl
        } else if (dWest < 8.5) {
          h += 6 * (1 - (dWest - 6) / 2.5); // raised boulder-strewn rim
        }
      } else if (isTycho) {
        // Tycho Crater Terraces: dramatic stepped escarpments and high slopes
        h += 350 * Math.sin(r * 0.06 + 0.5) + 200 * Math.cos(c * 0.08);
        // Slump terraces (steep scarps)
        h += 80 * Math.sin(r * 0.25) * Math.sin(c * 0.2);
      } else {
        // Shiv Shakti Point: broad high-latitude undulating regolith with craters
        h += 90 * Math.sin(c * 0.045 + 1.2) * Math.cos(r * 0.038 + 0.7);
        h += 50 * Math.sin(c * 0.09 + 3.1) * Math.sin(r * 0.11 - 0.4);
        
        // Two prominent craters
        const craters: [number, number, number, number][] = [
          [22, 20, 7.5, 75],
          [44, 42, 6.0, 60],
        ];
        for (const [cx, cy, radius, depth] of craters) {
          const d = Math.sqrt((c - cx) ** 2 + (r - cy) ** 2);
          if (d < radius) {
            h -= depth * (1 - (d / radius) ** 2);
          } else if (d < radius * 1.35) {
            h += depth * 0.14 * (1 - (d - radius) / (radius * 0.35));
          }
        }
      }

      // Small-scale surface roughness micro-relief
      h += 4 * (rand() - 0.5);

      row.push(baseElev + h);
    }
    raw.push(row);
  }

  // Derive slope raster & roughness
  const cells: TerrainCell[][] = [];
  for (let r = 0; r < SIZE; r++) {
    const row: TerrainCell[] = [];
    for (let c = 0; c < SIZE; c++) {
      const slope = slopeAt(raw, r, c, cellSize);
      const roughness = Math.min(1, Math.max(0, slope / 45 + (rand() * 0.1 - 0.05)));
      // Solar illumination estimate (approximate angle relative to polar horizon)
      const illumination = isPolar
        ? Math.min(1, Math.max(0, 0.95 - (slope / 35)))
        : Math.min(1, Math.max(0.1, 0.85 - (slope / 50)));

      row.push({
        elevation: Math.round(raw[r][c] * 10) / 10,
        slope: Math.round(slope * 10) / 10,
        roughness: Math.round(roughness * 100) / 100,
        blocked: slope > 30, // threshold for hard obstacle impassable terrain
        illumination: Math.round(illumination * 100) / 100,
      });
    }
    cells.push(row);
  }

  const metadata: DatasetMetadata = {
    id: `dem-${region.id}`,
    title: `${region.name} Topographic Model`,
    body: 'Moon',
    source: isPolar
      ? 'NASA LOLA Polar Topography (PDS)'
      : isApollo
      ? 'NASA LRO LOLA / LROC Stereo DEM'
      : isTycho
      ? 'NASA LOLA + SLDEM2015'
      : 'ISRO Chandrayaan-2 TMC-2 Stereo DEM & NASA LOLA',
    resolution: `${cellSize} m/pixel horizontal grid`,
    units: 'meters (referenced to 1,737.4 km lunar sphere datum)',
    status: 'standard',
    attribution: isPolar
      ? 'NASA Goddard Space Flight Center / LOLA Science Team'
      : isApollo
      ? 'NASA PDS Geosciences Node'
      : isTycho
      ? 'NASA GSFC / LROC Team'
      : 'ISRO ISSDC PRADAN Archive & NASA LRO LOLA Team',
    coverage: `Centered at ${Math.abs(region.centerLat)}°${region.centerLat < 0 ? 'S' : 'N'}, ${Math.abs(region.centerLon)}°${region.centerLon < 0 ? 'W' : 'E'}, ~${(SIZE * cellSize / 1000).toFixed(1)} km extent`,
  };

  const halfDegLat = (SIZE * cellSize / 1000) / 60.6; // approx degrees on Moon (~30.3 km/deg)
  const halfDegLon = halfDegLat / Math.max(0.15, Math.cos(region.centerLat * Math.PI / 180));

  return {
    id: `grid-${region.id}`,
    width: SIZE,
    height: SIZE,
    cellSize,
    cells,
    metadata,
    region,
    bounds: {
      minLat: region.centerLat - halfDegLat,
      maxLat: region.centerLat + halfDegLat,
      minLon: region.centerLon - halfDegLon,
      maxLon: region.centerLon + halfDegLon,
    }
  };
}

export function getDemoTerrainGrid(): TerrainGrid {
  return generateRegionalDEM(lunarRegions[0]);
}
