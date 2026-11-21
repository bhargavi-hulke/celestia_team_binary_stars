import React, { useMemo, useRef, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stars, Html } from '@react-three/drei';
import * as THREE from 'three';
import { useApp } from '../../stores/appStore';
import { lunarRegions } from '../../data/regions';
import type { LunarRegion } from '../../data/types';
import { createProceduralLunarTexture, createProceduralLunarBumpMap } from './lunarTexture';

const MOON_RADIUS = 2.5;

// Convert Lat/Lon to 3D Cartesian coordinates on sphere
export function latLonToVector3(lat: number, lon: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);

  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);

  return new THREE.Vector3(x, y, z);
}

// Interactive 3D Marker on Lunar Surface
const RegionMarker: React.FC<{
  region: LunarRegion;
  isSelected: boolean;
  showLabels: boolean;
  onSelect: (region: LunarRegion) => void;
}> = ({ region, isSelected, showLabels, onSelect }) => {
  const [hovered, setHovered] = useState(false);
  const markerPos = useMemo(
    () => latLonToVector3(region.centerLat, region.centerLon, MOON_RADIUS * 1.012),
    [region.centerLat, region.centerLon]
  );

  const ringRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (ringRef.current) {
      ringRef.current.rotation.z += delta * 1.2;
    }
  });

  return (
    <group position={markerPos}>
      {/* 3D Core Pin Sphere */}
      <mesh
        onClick={(e) => {
          e.stopPropagation();
          onSelect(region);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={() => setHovered(false)}
      >
        <sphereGeometry args={[0.045, 16, 16]} />
        <meshStandardMaterial
          color={isSelected ? '#00f2fe' : hovered ? '#38bdf8' : region.demAvailable ? '#22d3ee' : '#94a3b8'}
          emissive={isSelected ? '#00f2fe' : hovered ? '#38bdf8' : region.demAvailable ? '#0891b2' : '#475569'}
          emissiveIntensity={isSelected ? 1.8 : 0.8}
        />
      </mesh>

      {/* Orbiting Pulsing Reticle */}
      <mesh ref={ringRef}>
        <ringGeometry args={[0.065, 0.08, 24]} />
        <meshBasicMaterial
          color={isSelected ? '#38bdf8' : '#67e8f9'}
          side={THREE.DoubleSide}
          transparent
          opacity={isSelected ? 0.95 : 0.45}
        />
      </mesh>

      {/* Floating Name Badge */}
      {showLabels && (
        <Html
          position={[0, 0.12, 0]}
          center
          distanceFactor={6.5}
          style={{ pointerEvents: 'auto' }}
        >
          <div
            onClick={(e) => {
              e.stopPropagation();
              onSelect(region);
            }}
            className={`cursor-pointer whitespace-nowrap transition-all duration-200 select-none ${
              isSelected
                ? 'scale-105 z-20 opacity-100'
                : hovered
                ? 'scale-100 z-10 opacity-100'
                : 'opacity-80 hover:opacity-100'
            }`}
          >
            <div
              className={`px-2.5 py-1 rounded-full text-[10px] font-mono flex items-center gap-1.5 shadow-xl backdrop-blur-xl border transition-all ${
                isSelected
                  ? 'bg-cyan-950/85 text-cyan-200 border-cyan-400 shadow-cyan-950/60 ring-1 ring-cyan-400/40'
                  : hovered
                  ? 'bg-slate-900/90 text-sky-200 border-sky-400/80 shadow-lg'
                  : 'bg-slate-950/60 text-slate-300 border-white/10 hover:border-white/30'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isSelected ? 'bg-cyan-400 animate-ping' : region.demAvailable ? 'bg-cyan-400' : 'bg-slate-400'
                }`}
              />
              <span className="font-semibold tracking-wide">{region.name}</span>
            </div>
          </div>
        </Html>
      )}
    </group>
  );
};

// 3D Moon Surface Mesh
const MoonSphere: React.FC = () => {
  const { state } = useApp();
  const { visualStyle } = state;
  const meshRef = useRef<THREE.Mesh>(null);

  const texture = useMemo(() => createProceduralLunarTexture(visualStyle), [visualStyle]);
  const bumpMap = useMemo(() => createProceduralLunarBumpMap(), []);

  // Subtle continuous axial rotation
  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.008;
    }
  });

  return (
    <mesh ref={meshRef} receiveShadow castShadow>
      <sphereGeometry args={[MOON_RADIUS, 64, 64]} />
      <meshStandardMaterial
        map={texture}
        bumpMap={bumpMap}
        bumpScale={visualStyle === 'sculpted' ? 0.065 : 0.038}
        roughness={visualStyle === 'sculpted' ? 0.65 : 0.92}
        metalness={0.04}
      />
    </mesh>
  );
};

// Cinematic Camera Manager: Smooth Glide, Zoom & Reset
const CameraController: React.FC = () => {
  const { state } = useApp();
  const { cameraResetTrigger, cameraFlyToTarget, cameraZoomDelta } = state;
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);

  const isFlyingRef = useRef(false);
  const targetCamPos = useRef<THREE.Vector3 | null>(null);
  const targetLookAt = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));

  // Reset Camera
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.reset();
      camera.position.set(0, 1.2, 5.8);
      camera.lookAt(0, 0, 0);
      controlsRef.current.target.set(0, 0, 0);
      targetCamPos.current = null;
      isFlyingRef.current = false;
    }
  }, [cameraResetTrigger, camera]);

  // Zoom In / Out
  useEffect(() => {
    if (cameraZoomDelta !== 0 && controlsRef.current) {
      const dir = camera.position.clone().sub(controlsRef.current.target).normalize();
      const currentDist = camera.position.distanceTo(controlsRef.current.target);
      const newDist = Math.max(3.1, Math.min(14, currentDist + cameraZoomDelta));
      camera.position.copy(controlsRef.current.target).add(dir.multiplyScalar(newDist));
      controlsRef.current.update();
    }
  }, [cameraZoomDelta, camera]);

  // Smooth Fly-To Landmark
  useEffect(() => {
    if (cameraFlyToTarget) {
      const surfacePt = latLonToVector3(cameraFlyToTarget.lat, cameraFlyToTarget.lon, MOON_RADIUS);
      const normal = surfacePt.clone().normalize();
      const camPos = normal.clone().multiplyScalar(4.5);
      targetCamPos.current = camPos;
      targetLookAt.current = surfacePt.clone().multiplyScalar(0.4);
      isFlyingRef.current = true;
    }
  }, [cameraFlyToTarget]);

  useFrame((_, delta) => {
    if (isFlyingRef.current && targetCamPos.current && controlsRef.current) {
      camera.position.lerp(targetCamPos.current, delta * 3.2);
      controlsRef.current.target.lerp(targetLookAt.current, delta * 3.2);
      controlsRef.current.update();

      if (camera.position.distanceTo(targetCamPos.current) < 0.08) {
        isFlyingRef.current = false;
      }
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enablePan={true}
      enableZoom={true}
      minDistance={3.1}
      maxDistance={14}
      rotateSpeed={0.55}
      zoomSpeed={0.8}
      dampingFactor={0.06}
      enableDamping
    />
  );
};

export const MoonGlobe: React.FC = () => {
  const { state, flyToRegion } = useApp();
  const { selectedRegion, showMarkers, showLabels, visualStyle } = state;

  return (
    <div className="relative w-full h-full bg-[#020617] overflow-hidden select-none">
      <Canvas
        camera={{ position: [0, 1.2, 5.8], fov: 45 }}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      >
        <color attach="background" args={['#020617']} />
        
        <ambientLight intensity={visualStyle === 'sculpted' ? 0.35 : 0.22} />
        
        {/* Directional Sun simulating low-angle lunar terminator shadows */}
        <directionalLight
          position={[7, 3, 5]}
          intensity={visualStyle === 'sculpted' ? 2.8 : 2.3}
          castShadow
          shadow-mapSize={[1024, 1024]}
        />
        <directionalLight position={[-4, -1, -3]} intensity={0.12} color="#93c5fd" />

        {/* Cosmic Starfield */}
        <Stars radius={130} depth={50} count={3500} factor={4} saturation={0.25} fade speed={0.4} />

        {/* 3D Moon Body */}
        <MoonSphere />

        {/* Surface POI Markers */}
        {showMarkers &&
          lunarRegions.map((region) => (
            <RegionMarker
              key={region.id}
              region={region}
              isSelected={selectedRegion.id === region.id}
              showLabels={showLabels}
              onSelect={flyToRegion}
            />
          ))}

        <CameraController />
      </Canvas>

      <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_120px_rgba(0,0,0,0.85)]" />
    </div>
  );
};
