export interface DatasetMetadata {
  id: string;
  title: string;
  body: 'Moon' | 'Sky';
  source: string;
  instrument?: string;
  productId?: string;
  acquiredAt?: string;
  resolution?: string;
  units?: string;
  status: 'measured' | 'derived' | 'standard' | 'synthetic';
  attribution: string;
  licenseUrl?: string;
  coverage?: string;
}

export interface TerrainCell {
  elevation: number; // meters relative to lunar geoid (1737.4 km radius)
  slope: number;     // degrees (0° - 90°)
  roughness: number; // surface roughness index (0 - 1)
  blocked: boolean;  // hard obstacle / impassable slope > max limit
  illumination?: number; // average solar visibility (0 - 1)
}

export interface TerrainGrid {
  id: string;
  width: number;
  height: number;
  cellSize: number; // meters per cell
  cells: TerrainCell[][];
  metadata: DatasetMetadata;
  region: LunarRegion;
  bounds: {
    minLat: number;
    maxLat: number;
    minLon: number;
    maxLon: number;
  };
}

export interface LunarRegion {
  id: string;
  name: string;
  category: 'landing-site' | 'polar-ridge' | 'impact-crater' | 'mare' | 'geological';
  description: string;
  centerLat: number;
  centerLon: number;
  radiusKm: number;
  elevationApprox?: number; // meters relative to mean lunar radius
  diameterKm?: number;
  features?: string[];
  demAvailable: boolean;
  scenarioPreset?: {
    title: string;
    description: string;
    startCell: [number, number];
    goalCell: [number, number];
  };
  scientificReadings?: {
    composition?: { element: string; percentage: number }[];
    temperatureKelvin?: { surface: number; depth10cm: number };
    albedo?: number;
    primaryInstrument?: string;
  };
}

export interface Mission {
  id: string;
  regionId: string;
  startCell: [number, number];
  goalCell: [number, number];
  status: 'idle' | 'planning' | 'planned' | 'running' | 'paused' | 'completed' | 'failed' | 'no-route';
  route?: [number, number][];
  distance?: number;
  directDistance?: number;
  elevationGain?: number;
  elevationLoss?: number;
  maxSlope?: number;
  avgSlope?: number;
  estimatedEnergy?: number;
  hazardCount?: number;
  assumptions: string[];
  failureReason?: string;
  recoveryAdvice?: string;
}

export type AppView = 'explore' | 'missions' | 'science';

export type VisualStyle = 'realistic' | 'sculpted';

export type ActiveLayer = 'imagery' | 'elevation' | 'slope' | 'hillshade';

export interface AppState {
  currentView: AppView;
  visualStyle: VisualStyle;
  activeLayer: ActiveLayer;
  selectedRegion: LunarRegion;
  terrainGrid: TerrainGrid;
  currentMission: Mission;
  showTerrain: boolean;
  showMarkers: boolean;
  showLabels: boolean;
}
