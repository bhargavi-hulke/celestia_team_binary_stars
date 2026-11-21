import React, { createContext, useContext, useReducer, useEffect } from 'react';
import type { 
  AppView, 
  LunarRegion, 
  TerrainGrid, 
  Mission,
  VisualStyle,
  ActiveLayer
} from '../data/types';
import { lunarRegions } from '../data/regions';
import { generateRegionalDEM } from '../data/terrain';
import { findPath, type PathResult } from '../features/missions/pathfinder';

export interface AppStoreState {
  currentView: AppView;
  visualStyle: VisualStyle;
  activeLayer: ActiveLayer;
  selectedRegion: LunarRegion;
  terrainGrid: TerrainGrid;
  currentMission: Mission;
  pathResult: PathResult | null;
  showTerrain: boolean;
  showMarkers: boolean;
  showLabels: boolean;
  wireframe: boolean;
  
  // Selection / Hover
  selectedCell: [number, number] | null;
  hoveredCell: [number, number] | null;
  inspectedCoords: { lat: number; lon: number } | null;

  // Rover Simulation
  roverPosition: [number, number] | null;
  roverHeading: number;
  isSimulating: number; // 0 = stopped, 1 = running, 2 = paused
  simulationProgress: number; // 0 to 1

  // Camera & Telemetry
  cameraResetTrigger: number;
  cameraFlyToTarget: { lat: number; lon: number; timestamp: number } | null;
  cameraZoomDelta: number;
  cursorCoordinates: { lat: number; lon: number } | null;

  // Floating Panels & Drawers
  panels: {
    info: boolean;
    mission: boolean;
    science: boolean;
    observatory: boolean; // floating IceCube bubble window
    search: boolean;
    help: boolean;
  };
  panelZIndices: Record<string, number>;
  topZIndex: number;

  // A* Cost Parameters
  slopeWeight: number;
  maxTraversableSlope: number;
  missionLogs: string[];
}

type AppAction =
  | { type: 'SET_VIEW'; payload: AppView }
  | { type: 'SET_VISUAL_STYLE'; payload: VisualStyle }
  | { type: 'SET_ACTIVE_LAYER'; payload: ActiveLayer }
  | { type: 'SELECT_REGION'; payload: LunarRegion }
  | { type: 'FLY_TO_REGION'; payload: LunarRegion }
  | { type: 'SET_SHOW_TERRAIN'; payload: boolean }
  | { type: 'TOGGLE_MARKERS' }
  | { type: 'TOGGLE_WIREFRAME' }
  | { type: 'TOGGLE_LABELS' }
  | { type: 'SELECT_CELL'; payload: [number, number] | null }
  | { type: 'HOVER_CELL'; payload: [number, number] | null }
  | { type: 'SET_INSPECTED_COORDS'; payload: { lat: number; lon: number } | null }
  | { type: 'SET_CURSOR_COORDS'; payload: { lat: number; lon: number } | null }
  | { type: 'SET_START_CELL'; payload: [number, number] }
  | { type: 'SET_GOAL_CELL'; payload: [number, number] }
  | { type: 'LOAD_SCENARIO'; payload: LunarRegion }
  | { type: 'CALCULATE_ROUTE' }
  | { type: 'RESET_MISSION' }
  | { type: 'SET_SIMULATION_STATE'; payload: number } // 0: stopped/idle, 1: running, 2: paused
  | { type: 'UPDATE_SIMULATION'; payload: { progress: number; pos: [number, number]; heading: number } }
  | { type: 'MISSION_COMPLETED' }
  | { type: 'RESET_CAMERA' }
  | { type: 'ZOOM_CAMERA'; payload: number }
  | { type: 'TOGGLE_PANEL'; payload: keyof AppStoreState['panels'] }
  | { type: 'SET_PANEL_OPEN'; payload: { panel: keyof AppStoreState['panels']; open: boolean } }
  | { type: 'BRING_PANEL_TO_FRONT'; payload: string }
  | { type: 'UPDATE_PLANNER_CONFIG'; payload: { slopeWeight?: number; maxTraversableSlope?: number } }
  | { type: 'ADD_LOG'; payload: string };

const initialRegion = lunarRegions[0]; // Shiv Shakti Point
const initialGrid = generateRegionalDEM(initialRegion);

const initialMission: Mission = {
  id: 'mission-celestia-01',
  regionId: initialRegion.id,
  startCell: initialRegion.scenarioPreset?.startCell || [14, 14],
  goalCell: initialRegion.scenarioPreset?.goalCell || [48, 48],
  status: 'idle',
  assumptions: [
    'Deterministic A* path search over DEM grid',
    'Slope penalty multiplier: 2.2x uphill drag',
    'Max traversable rover slope threshold: 30°',
    'Base drive energy: 0.50 Wh/meter on flat regolith',
    'Educational & simulation estimate only'
  ],
};

const initialState: AppStoreState = {
  currentView: 'explore',
  visualStyle: 'realistic',
  activeLayer: 'imagery',
  selectedRegion: initialRegion,
  terrainGrid: initialGrid,
  currentMission: initialMission,
  pathResult: null,
  showTerrain: false,
  showMarkers: true,
  showLabels: true,
  wireframe: false,

  selectedCell: null,
  hoveredCell: null,
  inspectedCoords: { lat: initialRegion.centerLat, lon: initialRegion.centerLon },

  roverPosition: initialMission.startCell,
  roverHeading: 0,
  isSimulating: 0,
  simulationProgress: 0,

  cameraResetTrigger: 0,
  cameraFlyToTarget: null,
  cameraZoomDelta: 0,
  cursorCoordinates: { lat: initialRegion.centerLat, lon: initialRegion.centerLon },

  panels: {
    info: true,
    mission: false,
    science: false,
    observatory: false,
    search: false,
    help: false,
  },
  panelZIndices: {
    nav: 40,
    info: 30,
    mission: 31,
    science: 32,
    observatory: 35,
    search: 45,
    help: 46,
  },
  topZIndex: 50,

  slopeWeight: 2.2,
  maxTraversableSlope: 30,
  missionLogs: [
    'Celestia Planetary Core initialized with SLDEM2015 & LOLA geodetic datum.',
    'Surface locked on Shiv Shakti Point (69.37°S, 32.32°E).',
    'High-resolution Chandrayaan-2 TMC-2 topographic tiles ready.'
  ],
};

function appReducer(state: AppStoreState, action: AppAction): AppStoreState {
  switch (action.type) {
    case 'SET_VIEW': {
      const isMissions = action.payload === 'missions';
      const isScience = action.payload === 'science';
      return {
        ...state,
        currentView: action.payload,
        showTerrain: isMissions,
        panels: {
          ...state.panels,
          mission: isMissions ? true : state.panels.mission,
          science: isScience ? true : state.panels.science,
          info: !isScience ? state.panels.info : false,
        }
      };
    }

    case 'SET_VISUAL_STYLE':
      return { ...state, visualStyle: action.payload };

    case 'SET_ACTIVE_LAYER':
      return { ...state, activeLayer: action.payload };

    case 'SELECT_REGION': {
      const newGrid = action.payload.demAvailable 
        ? generateRegionalDEM(action.payload) 
        : state.terrainGrid;
      
      const newMission: Mission = {
        ...state.currentMission,
        regionId: action.payload.id,
        startCell: action.payload.scenarioPreset?.startCell || [14, 14],
        goalCell: action.payload.scenarioPreset?.goalCell || [48, 48],
        status: 'idle',
        route: undefined,
      };

      return {
        ...state,
        selectedRegion: action.payload,
        terrainGrid: newGrid,
        currentMission: newMission,
        roverPosition: newMission.startCell,
        pathResult: null,
        isSimulating: 0,
        simulationProgress: 0,
        inspectedCoords: { lat: action.payload.centerLat, lon: action.payload.centerLon },
        panels: { ...state.panels, info: true },
        missionLogs: [
          `Target location selected: ${action.payload.name} (${action.payload.demAvailable ? 'DEM Available' : 'Global Atlas Mode'})`,
          ...state.missionLogs.slice(0, 8)
        ]
      };
    }

    case 'FLY_TO_REGION': {
      const newGrid = action.payload.demAvailable 
        ? generateRegionalDEM(action.payload) 
        : state.terrainGrid;

      return {
        ...state,
        selectedRegion: action.payload,
        terrainGrid: newGrid,
        cameraFlyToTarget: {
          lat: action.payload.centerLat,
          lon: action.payload.centerLon,
          timestamp: Date.now(),
        },
        inspectedCoords: { lat: action.payload.centerLat, lon: action.payload.centerLon },
        panels: { ...state.panels, info: true },
        missionLogs: [
          `Navigating orbital trajectory towards ${action.payload.name}`,
          ...state.missionLogs.slice(0, 8)
        ]
      };
    }

    case 'LOAD_SCENARIO': {
      const grid = generateRegionalDEM(action.payload);
      const start = action.payload.scenarioPreset?.startCell || [14, 14];
      const goal = action.payload.scenarioPreset?.goalCell || [48, 48];

      const mission: Mission = {
        id: `mission-${action.payload.id}`,
        regionId: action.payload.id,
        startCell: start,
        goalCell: goal,
        status: 'idle',
        route: undefined,
        assumptions: state.currentMission.assumptions,
      };

      const path = findPath(grid, start, goal, {
        slopeWeight: state.slopeWeight,
        maxTraversableSlope: state.maxTraversableSlope,
      });

      return {
        ...state,
        selectedRegion: action.payload,
        terrainGrid: grid,
        currentMission: {
          ...mission,
          status: path.success ? 'planned' : 'no-route',
          route: path.route,
          distance: path.distance,
          directDistance: path.directDistance,
          elevationGain: path.elevationGain,
          elevationLoss: path.elevationLoss,
          maxSlope: path.maxSlope,
          avgSlope: path.avgSlope,
          estimatedEnergy: path.estimatedEnergy,
          hazardCount: path.hazardCount,
          failureReason: path.failureReason,
          recoveryAdvice: path.recoveryAdvice,
        },
        pathResult: path,
        roverPosition: start,
        isSimulating: 0,
        simulationProgress: 0,
        showTerrain: true,
        currentView: 'missions',
        panels: { ...state.panels, mission: true },
        missionLogs: [
          `Scenario loaded: ${action.payload.name} — ${action.payload.scenarioPreset?.title}`,
          path.success ? `✓ Route planned: ${path.distance}m` : `⚠ Warning: ${path.failureReason}`,
          ...state.missionLogs.slice(0, 8)
        ]
      };
    }

    case 'SET_SHOW_TERRAIN':
      return { 
        ...state, 
        showTerrain: action.payload,
        panels: {
          ...state.panels,
          mission: action.payload ? true : state.panels.mission
        }
      };

    case 'TOGGLE_MARKERS':
      return { ...state, showMarkers: !state.showMarkers };

    case 'TOGGLE_WIREFRAME':
      return { ...state, wireframe: !state.wireframe };

    case 'TOGGLE_LABELS':
      return { ...state, showLabels: !state.showLabels };

    case 'SELECT_CELL':
      return { 
        ...state, 
        selectedCell: action.payload,
        panels: { ...state.panels, info: action.payload ? true : state.panels.info }
      };

    case 'HOVER_CELL':
      return { ...state, hoveredCell: action.payload };

    case 'SET_INSPECTED_COORDS':
      return { ...state, inspectedCoords: action.payload };

    case 'SET_CURSOR_COORDS':
      return { ...state, cursorCoordinates: action.payload };

    case 'SET_START_CELL': {
      const updatedMission: Mission = {
        ...state.currentMission,
        startCell: action.payload,
        status: 'idle',
        route: undefined,
      };
      return {
        ...state,
        currentMission: updatedMission,
        roverPosition: action.payload,
        pathResult: null,
        isSimulating: 0,
        simulationProgress: 0,
        missionLogs: [
          `Rover deployment point set: [${action.payload[0]}, ${action.payload[1]}]`,
          ...state.missionLogs.slice(0, 8)
        ]
      };
    }

    case 'SET_GOAL_CELL': {
      const updatedMission: Mission = {
        ...state.currentMission,
        goalCell: action.payload,
        status: 'idle',
        route: undefined,
      };
      return {
        ...state,
        currentMission: updatedMission,
        pathResult: null,
        isSimulating: 0,
        simulationProgress: 0,
        missionLogs: [
          `Science destination set: [${action.payload[0]}, ${action.payload[1]}]`,
          ...state.missionLogs.slice(0, 8)
        ]
      };
    }

    case 'CALCULATE_ROUTE': {
      const result = findPath(
        state.terrainGrid,
        state.currentMission.startCell,
        state.currentMission.goalCell,
        {
          slopeWeight: state.slopeWeight,
          maxTraversableSlope: state.maxTraversableSlope,
        }
      );

      if (!result.success) {
        return {
          ...state,
          pathResult: result,
          currentMission: {
            ...state.currentMission,
            status: 'no-route',
            route: undefined,
            failureReason: result.failureReason,
            recoveryAdvice: result.recoveryAdvice,
          },
          missionLogs: [
            `⚠ Route failed: ${result.failureReason}`,
            ...state.missionLogs.slice(0, 8)
          ]
        };
      }

      return {
        ...state,
        pathResult: result,
        roverPosition: state.currentMission.startCell,
        isSimulating: 0,
        simulationProgress: 0,
        currentMission: {
          ...state.currentMission,
          status: 'planned',
          route: result.route,
          distance: result.distance,
          directDistance: result.directDistance,
          elevationGain: result.elevationGain,
          elevationLoss: result.elevationLoss,
          maxSlope: result.maxSlope,
          avgSlope: result.avgSlope,
          estimatedEnergy: result.estimatedEnergy,
          hazardCount: result.hazardCount,
          assumptions: result.assumptions,
          failureReason: undefined,
          recoveryAdvice: undefined,
        },
        missionLogs: [
          `✓ A* route generated: ${result.distance.toFixed(1)}m, ${result.estimatedEnergy.toFixed(1)} Wh, ${result.hazardCount} steep slope cells avoided.`,
          ...state.missionLogs.slice(0, 8)
        ]
      };
    }

    case 'RESET_MISSION': {
      return {
        ...state,
        pathResult: null,
        roverPosition: state.currentMission.startCell,
        roverHeading: 0,
        isSimulating: 0,
        simulationProgress: 0,
        currentMission: {
          ...state.currentMission,
          status: 'idle',
          route: undefined,
          distance: undefined,
          directDistance: undefined,
          estimatedEnergy: undefined,
          hazardCount: undefined,
          failureReason: undefined,
          recoveryAdvice: undefined,
        },
        missionLogs: [
          'Mission status reset to standby.',
          ...state.missionLogs.slice(0, 8)
        ]
      };
    }

    case 'SET_SIMULATION_STATE': {
      const isStarting = action.payload === 1;
      const shouldRestart = isStarting && state.simulationProgress >= 1;
      return {
        ...state,
        isSimulating: action.payload,
        simulationProgress: shouldRestart ? 0 : state.simulationProgress,
        roverPosition: shouldRestart && state.pathResult?.route[0] ? state.pathResult.route[0] : state.roverPosition,
        currentMission: {
          ...state.currentMission,
          status: action.payload === 1 
            ? 'running' 
            : action.payload === 2 
            ? 'paused' 
            : state.simulationProgress >= 1 
            ? 'completed' 
            : 'planned',
        }
      };
    }

    case 'MISSION_COMPLETED':
      return {
        ...state,
        isSimulating: 0,
        simulationProgress: 1,
        roverPosition: state.currentMission.goalCell,
        currentMission: {
          ...state.currentMission,
          status: 'completed',
        },
        missionLogs: [
          '★ Rover reached target waypoint destination. Mission completed successfully.',
          ...state.missionLogs.slice(0, 8)
        ]
      };

    case 'UPDATE_SIMULATION':
      return {
        ...state,
        simulationProgress: action.payload.progress,
        roverPosition: action.payload.pos,
        roverHeading: action.payload.heading,
      };

    case 'RESET_CAMERA':
      return {
        ...state,
        cameraResetTrigger: state.cameraResetTrigger + 1,
        cameraFlyToTarget: null,
      };

    case 'ZOOM_CAMERA':
      return { ...state, cameraZoomDelta: action.payload };

    case 'TOGGLE_PANEL': {
      const current = state.panels[action.payload];
      const newOpen = !current;
      const nextZ = state.topZIndex + 1;
      return {
        ...state,
        panels: { ...state.panels, [action.payload]: newOpen },
        panelZIndices: newOpen ? { ...state.panelZIndices, [action.payload]: nextZ } : state.panelZIndices,
        topZIndex: nextZ,
      };
    }

    case 'SET_PANEL_OPEN': {
      const nextZ = action.payload.open ? state.topZIndex + 1 : state.topZIndex;
      return {
        ...state,
        panels: { ...state.panels, [action.payload.panel]: action.payload.open },
        panelZIndices: action.payload.open ? { ...state.panelZIndices, [action.payload.panel]: nextZ } : state.panelZIndices,
        topZIndex: nextZ,
      };
    }

    case 'BRING_PANEL_TO_FRONT': {
      const nextZ = state.topZIndex + 1;
      return {
        ...state,
        panelZIndices: { ...state.panelZIndices, [action.payload]: nextZ },
        topZIndex: nextZ,
      };
    }

    case 'UPDATE_PLANNER_CONFIG':
      return {
        ...state,
        slopeWeight: action.payload.slopeWeight ?? state.slopeWeight,
        maxTraversableSlope: action.payload.maxTraversableSlope ?? state.maxTraversableSlope,
      };

    case 'ADD_LOG':
      return {
        ...state,
        missionLogs: [action.payload, ...state.missionLogs.slice(0, 15)]
      };

    default:
      return state;
  }
}

interface AppContextType {
  state: AppStoreState;
  dispatch: React.Dispatch<AppAction>;
  setView: (view: AppView) => void;
  setVisualStyle: (style: VisualStyle) => void;
  setActiveLayer: (layer: ActiveLayer) => void;
  selectRegion: (region: LunarRegion) => void;
  flyToRegion: (region: LunarRegion) => void;
  loadScenario: (region: LunarRegion) => void;
  setShowTerrain: (show: boolean) => void;
  toggleMarkers: () => void;
  toggleWireframe: () => void;
  toggleLabels: () => void;
  selectCell: (cell: [number, number] | null) => void;
  hoverCell: (cell: [number, number] | null) => void;
  setInspectedCoords: (coords: { lat: number; lon: number } | null) => void;
  setCursorCoords: (coords: { lat: number; lon: number } | null) => void;
  setStartCell: (cell: [number, number]) => void;
  setGoalCell: (cell: [number, number]) => void;
  calculateRoute: () => void;
  resetMission: () => void;
  setSimulationState: (stateVal: number) => void;
  resetCamera: () => void;
  zoomCamera: (delta: number) => void;
  togglePanel: (panel: keyof AppStoreState['panels']) => void;
  setPanelOpen: (panel: keyof AppStoreState['panels'], open: boolean) => void;
  bringPanelToFront: (panelId: string) => void;
  updatePlannerConfig: (config: { slopeWeight?: number; maxTraversableSlope?: number }) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Compute initial route
  useEffect(() => {
    dispatch({ type: 'CALCULATE_ROUTE' });
  }, []);

  const value: AppContextType = {
    state,
    dispatch,
    setView: (view) => dispatch({ type: 'SET_VIEW', payload: view }),
    setVisualStyle: (style) => dispatch({ type: 'SET_VISUAL_STYLE', payload: style }),
    setActiveLayer: (layer) => dispatch({ type: 'SET_ACTIVE_LAYER', payload: layer }),
    selectRegion: (region) => dispatch({ type: 'SELECT_REGION', payload: region }),
    flyToRegion: (region) => dispatch({ type: 'FLY_TO_REGION', payload: region }),
    loadScenario: (region) => dispatch({ type: 'LOAD_SCENARIO', payload: region }),
    setShowTerrain: (show) => dispatch({ type: 'SET_SHOW_TERRAIN', payload: show }),
    toggleMarkers: () => dispatch({ type: 'TOGGLE_MARKERS' }),
    toggleWireframe: () => dispatch({ type: 'TOGGLE_WIREFRAME' }),
    toggleLabels: () => dispatch({ type: 'TOGGLE_LABELS' }),
    selectCell: (cell) => dispatch({ type: 'SELECT_CELL', payload: cell }),
    hoverCell: (cell) => dispatch({ type: 'HOVER_CELL', payload: cell }),
    setInspectedCoords: (coords) => dispatch({ type: 'SET_INSPECTED_COORDS', payload: coords }),
    setCursorCoords: (coords) => dispatch({ type: 'SET_CURSOR_COORDS', payload: coords }),
    setStartCell: (cell) => dispatch({ type: 'SET_START_CELL', payload: cell }),
    setGoalCell: (cell) => dispatch({ type: 'SET_GOAL_CELL', payload: cell }),
    calculateRoute: () => dispatch({ type: 'CALCULATE_ROUTE' }),
    resetMission: () => dispatch({ type: 'RESET_MISSION' }),
    setSimulationState: (stateVal) => dispatch({ type: 'SET_SIMULATION_STATE', payload: stateVal }),
    resetCamera: () => dispatch({ type: 'RESET_CAMERA' }),
    zoomCamera: (delta) => dispatch({ type: 'ZOOM_CAMERA', payload: delta }),
    togglePanel: (panel) => dispatch({ type: 'TOGGLE_PANEL', payload: panel }),
    setPanelOpen: (panel, open) => dispatch({ type: 'SET_PANEL_OPEN', payload: { panel, open } }),
    bringPanelToFront: (panelId) => dispatch({ type: 'BRING_PANEL_TO_FRONT', payload: panelId }),
    updatePlannerConfig: (config) => dispatch({ type: 'UPDATE_PLANNER_CONFIG', payload: config }),
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
