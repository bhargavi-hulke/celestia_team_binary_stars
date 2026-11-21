import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { useApp } from '../../stores/appStore';
import { TerrainMesh, getTerrainElevationBounds, getTerrainWorldPos } from '../terrain/TerrainMesh';
import { RoverModel } from './RoverModel';
import { 
  Eye, 
  Crosshair, 
  Flag, 
  Layers, 
  ShieldAlert, 
  Camera, 
  Compass,
  ArrowUpRight
} from 'lucide-react';

interface CameraControllerProps {
  cameraPreset: 'perspective' | 'top' | 'rover';
  roverWorldPosRef: React.MutableRefObject<[number, number, number]>;
  roverHeadingRef: React.MutableRefObject<number>;
}

const MissionCameraController: React.FC<CameraControllerProps> = ({
  cameraPreset,
  roverWorldPosRef,
  roverHeadingRef,
}) => {
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);

  // Transition camera when user switches preset
  useEffect(() => {
    if (!controlsRef.current) return;

    if (cameraPreset === 'top') {
      camera.position.set(0, 26, 0.01);
      controlsRef.current.target.set(0, 0, 0);
    } else if (cameraPreset === 'rover') {
      const [rx, ry, rz] = roverWorldPosRef.current;
      const h = roverHeadingRef.current;
      camera.position.set(
        rx - Math.sin(h) * 3.8,
        ry + 2.0,
        rz - Math.cos(h) * 3.8
      );
      controlsRef.current.target.set(rx, ry + 0.45, rz);
    } else {
      camera.position.set(0, 16, 20);
      controlsRef.current.target.set(0, 0, 0);
    }
    controlsRef.current.update();
  }, [cameraPreset, camera, roverWorldPosRef, roverHeadingRef]);

  // Frame-by-frame chase camera tracking in 'rover' preset
  useFrame(() => {
    if (cameraPreset === 'rover' && controlsRef.current) {
      const [rx, ry, rz] = roverWorldPosRef.current;
      const h = roverHeadingRef.current;
      const targetCamX = rx - Math.sin(h) * 3.8;
      const targetCamZ = rz - Math.cos(h) * 3.8;
      const targetCamY = ry + 2.0;

      camera.position.lerp(new THREE.Vector3(targetCamX, targetCamY, targetCamZ), 0.08);
      controlsRef.current.target.lerp(new THREE.Vector3(rx, ry + 0.45, rz), 0.12);
      controlsRef.current.update();
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.06}
      maxPolarAngle={Math.PI / 2 - 0.04}
      minDistance={2.5}
      maxDistance={45}
    />
  );
};

interface RoverActorProps {
  roverWorldPosRef: React.MutableRefObject<[number, number, number]>;
  roverHeadingRef: React.MutableRefObject<number>;
}

const RoverActor: React.FC<RoverActorProps> = ({
  roverWorldPosRef,
  roverHeadingRef,
}) => {
  const { state, dispatch } = useApp();
  const { terrainGrid, currentMission, pathResult, isSimulating, simulationProgress, roverPosition } = state;
  const roverRef = useRef<THREE.Group>(null);
  const progressRef = useRef(simulationProgress);
  const lastSyncRef = useRef(0);

  const minElev = useMemo(() => getTerrainElevationBounds(terrainGrid).minElev, [terrainGrid]);

  // Sync progress ref when paused or idle
  useEffect(() => {
    if (isSimulating !== 1) {
      progressRef.current = simulationProgress;
    }
  }, [isSimulating, simulationProgress]);

  // Static placement on terrain when not running
  useEffect(() => {
    if (isSimulating === 1) return;
    if (!roverPosition) return;

    const [r, c] = roverPosition;
    const [wx, wy, wz] = getTerrainWorldPos(r, c, terrainGrid, minElev);
    const roverPos: [number, number, number] = [wx, wy + 0.08, wz];
    roverWorldPosRef.current = roverPos;

    if (roverRef.current) {
      roverRef.current.position.set(roverPos[0], roverPos[1], roverPos[2]);
      roverRef.current.rotation.set(0, roverHeadingRef.current, 0);
    }
  }, [roverPosition, terrainGrid, minElev, isSimulating, roverWorldPosRef, roverHeadingRef]);

  // Physical rover traversal animation along route
  useFrame((_, delta) => {
    if (isSimulating !== 1) return;
    if (!pathResult || !pathResult.success || pathResult.route.length < 2) return;

    const route = pathResult.route;
    const totalSegments = route.length - 1;
    const speed = 1 / Math.max(3.5, totalSegments * 0.35);
    progressRef.current = Math.min(1, progressRef.current + delta * speed);

    const exactIndex = progressRef.current * totalSegments;
    const currIdx = Math.min(Math.floor(exactIndex), totalSegments - 1);
    const nextIdx = Math.min(currIdx + 1, totalSegments);
    const subT = exactIndex - currIdx;

    const p1 = route[currIdx];
    const p2 = route[nextIdx];
    const currR = p1[0] + (p2[0] - p1[0]) * subT;
    const currC = p1[1] + (p2[1] - p1[1]) * subT;

    const [worldX, worldY, worldZ] = getTerrainWorldPos(currR, currC, terrainGrid, minElev);
    const roverY = worldY + 0.08; // Exact wheel contact height clearance

    // Tangent lookahead along route for heading and slope pitch
    const lookAheadT = Math.min(1, progressRef.current + 0.025);
    const lookExact = lookAheadT * totalSegments;
    const lookCurr = Math.min(Math.floor(lookExact), totalSegments - 1);
    const lookNext = Math.min(lookCurr + 1, totalSegments);
    const lookSub = lookExact - lookCurr;
    const aheadR = route[lookCurr][0] + (route[lookNext][0] - route[lookCurr][0]) * lookSub;
    const aheadC = route[lookCurr][1] + (route[lookNext][1] - route[lookCurr][1]) * lookSub;
    const [aheadX, aheadY, aheadZ] = getTerrainWorldPos(aheadR, aheadC, terrainGrid, minElev);

    const dx = aheadX - worldX;
    const dz = aheadZ - worldZ;
    const dy = aheadY - worldY;
    const distH = Math.sqrt(dx * dx + dz * dz) || 0.001;
    const targetHeading = Math.atan2(dx, dz);
    const pitch = -Math.atan2(dy, distH);

    const pos: [number, number, number] = [worldX, roverY, worldZ];
    roverWorldPosRef.current = pos;
    roverHeadingRef.current = targetHeading;

    if (roverRef.current) {
      roverRef.current.position.set(worldX, roverY, worldZ);
      roverRef.current.rotation.set(pitch, targetHeading, 0);
    }

    // Throttled store sync for UI timeline and HUD coordinates (10 updates/sec)
    const now = performance.now();
    if (now - lastSyncRef.current > 100 || progressRef.current >= 1) {
      lastSyncRef.current = now;
      dispatch({
        type: 'UPDATE_SIMULATION',
        payload: {
          progress: progressRef.current,
          pos: [currR, currC],
          heading: targetHeading,
        }
      });
    }

    if (progressRef.current >= 1) {
      dispatch({ type: 'MISSION_COMPLETED' });
    }
  });

  return (
    <RoverModel
      ref={roverRef}
      position={roverWorldPosRef.current}
      heading={roverHeadingRef.current}
      isMoving={isSimulating === 1}
    />
  );
};

export const RoverMissionScene: React.FC = () => {
  const { 
    state, 
    selectCell, 
    setStartCell, 
    setGoalCell, 
    setPanelOpen,
  } = useApp();

  const { 
    terrainGrid, 
    roverPosition, 
    roverHeading, 
    activeLayer, 
  } = state;

  const [selectionMode, setSelectionMode] = useState<'inspect' | 'start' | 'goal'>('inspect');
  const [cameraPreset, setCameraPreset] = useState<'perspective' | 'top' | 'rover'>('perspective');

  const minElev = useMemo(() => getTerrainElevationBounds(terrainGrid).minElev, [terrainGrid]);

  // Initial rover position on terrain surface
  const initialRoverWorldPos = useMemo(() => {
    if (!roverPosition) return [0, 0, 0] as [number, number, number];
    const [wx, wy, wz] = getTerrainWorldPos(roverPosition[0], roverPosition[1], terrainGrid, minElev);
    return [wx, wy + 0.08, wz] as [number, number, number];
  }, [roverPosition, terrainGrid, minElev]);

  const roverWorldPosRef = useRef<[number, number, number]>(initialRoverWorldPos);
  const roverHeadingRef = useRef<number>(roverHeading || 0);

  const handleCellClick = (r: number, c: number) => {
    selectCell([r, c]);
    setPanelOpen('info', true);

    if (selectionMode === 'start') {
      setStartCell([r, c]);
      setSelectionMode('inspect');
    } else if (selectionMode === 'goal') {
      setGoalCell([r, c]);
      setSelectionMode('inspect');
    }
  };

  return (
    <div className="relative w-full h-full bg-[#020617] overflow-hidden select-none">
      {/* Edge-to-Edge 3D Viewport */}
      <Canvas
        shadows
        camera={{ position: [0, 16, 20], fov: 45 }}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
      >
        <color attach="background" args={['#020617']} />
        
        {/* Directional Sun simulating low-angle lunar solar illumination */}
        <directionalLight
          position={[15, 20, 10]}
          intensity={2.4}
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-camera-left={-15}
          shadow-camera-right={15}
          shadow-camera-top={15}
          shadow-camera-bottom={-15}
        />
        <ambientLight intensity={0.2} />
        <hemisphereLight args={['#0369a1', '#0f172a', 0.25]} />

        {/* Deep space starfield */}
        <Stars radius={100} depth={40} count={2500} factor={4} fade speed={0.4} />

        {/* 3D Terrain Heightfield */}
        <TerrainMesh
          onCellClick={handleCellClick}
          selectionMode={selectionMode}
        />

        {/* 3D Pragyan Rover Actor */}
        {roverPosition && (
          <RoverActor
            roverWorldPosRef={roverWorldPosRef}
            roverHeadingRef={roverHeadingRef}
          />
        )}

        <MissionCameraController
          cameraPreset={cameraPreset}
          roverWorldPosRef={roverWorldPosRef}
          roverHeadingRef={roverHeadingRef}
        />
      </Canvas>

      {/* Floating HUD: Surface Pointer Mode Capsule (Top-Left) */}
      <div
        className="fixed top-20 left-6 z-30 select-none flex items-center gap-1.5 p-1.5 bg-slate-950/65 backdrop-blur-2xl border border-white/10 rounded-full shadow-[0_12px_40px_rgba(0,0,0,0.7)] ring-1 ring-white/5"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-1 px-2 text-[10px] font-mono text-slate-400">
          <Compass className="w-3.5 h-3.5 text-cyan-400" />
          <span>CURSOR:</span>
        </div>

        <button
          onClick={() => setSelectionMode('inspect')}
          className={`px-3 py-1 rounded-full text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer ${
            selectionMode === 'inspect'
              ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-400/80 font-semibold shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
          }`}
        >
          <Eye className="w-3 h-3" />
          <span>Probe Cell</span>
        </button>

        <button
          onClick={() => setSelectionMode('start')}
          className={`px-3 py-1 rounded-full text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer ${
            selectionMode === 'start'
              ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-400/80 font-semibold shadow-sm ring-1 ring-emerald-400/40'
              : 'text-slate-400 hover:text-emerald-300 hover:bg-white/[0.05]'
          }`}
        >
          <Crosshair className="w-3 h-3 text-emerald-400" />
          <span>Deploy Rover</span>
        </button>

        <button
          onClick={() => setSelectionMode('goal')}
          className={`px-3 py-1 rounded-full text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer ${
            selectionMode === 'goal'
              ? 'bg-rose-500/25 text-rose-300 border border-rose-400/80 font-semibold shadow-sm ring-1 ring-rose-400/40'
              : 'text-slate-400 hover:text-rose-300 hover:bg-white/[0.05]'
          }`}
        >
          <Flag className="w-3 h-3 text-rose-400" />
          <span>Set Target</span>
        </button>
      </div>

      {/* Floating HUD: Camera View Angle Presets (Bottom Center) */}
      <div
        className="fixed bottom-8 left-1/2 -translate-x-1/2 z-30 select-none flex items-center gap-1 p-1 bg-slate-950/65 backdrop-blur-2xl border border-white/10 rounded-full shadow-[0_12px_40px_rgba(0,0,0,0.7)] ring-1 ring-white/5 font-mono text-xs"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => setCameraPreset('perspective')}
          className={`px-3 py-1.5 rounded-full transition-all cursor-pointer ${
            cameraPreset === 'perspective'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/60 font-semibold shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.05]'
          }`}
        >
          Orbital 3D
        </button>
        <button
          onClick={() => setCameraPreset('top')}
          className={`px-3 py-1.5 rounded-full transition-all cursor-pointer ${
            cameraPreset === 'top'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/60 font-semibold shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.05]'
          }`}
        >
          Top-Down Nadir
        </button>
        <button
          onClick={() => setCameraPreset('rover')}
          className={`px-3 py-1.5 rounded-full transition-all cursor-pointer ${
            cameraPreset === 'rover'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/60 font-semibold shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.05]'
          }`}
        >
          Rover Chase
        </button>
      </div>

      {/* Floating Slope Color Legend (Bottom Right) */}
      {activeLayer === 'slope' && (
        <div
          className="fixed bottom-8 right-6 z-20 select-none p-2.5 bg-slate-950/65 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.7)] ring-1 ring-white/5 font-mono text-xs w-48"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
            <span>Slope Hazard Bands</span>
            <span className="text-slate-500">Degree</span>
          </div>
          <div className="space-y-1 text-[10px]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#334155] border border-slate-600" />
                <span className="text-slate-300">Safe Regolith</span>
              </div>
              <span className="text-slate-400">&lt; 8°</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#0284c7]" />
                <span className="text-sky-300">Gentle</span>
              </div>
              <span className="text-slate-400">8°–15°</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#d97706]" />
                <span className="text-amber-300">Caution</span>
              </div>
              <span className="text-slate-400">15°–25°</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#dc2626]" />
                <span className="text-red-300">Hazard / Impassable</span>
              </div>
              <span className="text-slate-400">&gt; 25°</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
