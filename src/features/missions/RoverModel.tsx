import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export interface RoverModelProps {
  position?: [number, number, number];
  heading?: number; // in radians (Y rotation)
  pitch?: number;   // in radians (X rotation, slope ascent/descent)
  roll?: number;    // in radians (Z rotation)
  isMoving?: boolean;
}

export const RoverModel = React.forwardRef<THREE.Group, RoverModelProps>(({
  position = [0, 0, 0],
  heading = 0,
  pitch = 0,
  roll = 0,
  isMoving = false,
}, ref) => {
  const localRef = useRef<THREE.Group>(null);
  const groupRef = (ref as React.RefObject<THREE.Group>) || localRef;
  const wheelRefs = useRef<THREE.Mesh[]>([]);

  // Wheel rotation when moving along terrain
  useFrame((_, delta) => {
    if (isMoving) {
      wheelRefs.current.forEach((wheel) => {
        if (wheel) wheel.rotation.x += delta * 7;
      });
    }
  });

  return (
    <group ref={groupRef} position={position} rotation={[pitch, heading, roll]}>
      {/* Rover Main Chassis (MLI Gold Thermal Foil) */}
      <mesh position={[0, 0.18, 0]} castShadow>
        <boxGeometry args={[0.5, 0.16, 0.7]} />
        <meshStandardMaterial
          color="#d4af37" // Metallic Gold
          metalness={0.8}
          roughness={0.25}
        />
      </mesh>

      {/* Top Deck Equipment Module */}
      <mesh position={[0, 0.28, 0.05]} castShadow>
        <boxGeometry args={[0.42, 0.08, 0.55]} />
        <meshStandardMaterial color="#334155" metalness={0.6} roughness={0.4} />
      </mesh>

      {/* Deployable Solar Panel (Pragyan style tilted panel) */}
      <mesh position={[0.26, 0.35, 0]} rotation={[0, 0, -Math.PI / 6]} castShadow>
        <boxGeometry args={[0.02, 0.45, 0.65]} />
        <meshStandardMaterial
          color="#1e1b4b" // Deep Navy Solar Cell
          roughness={0.15}
          metalness={0.85}
        />
      </mesh>

      {/* Sensor Mast / NavCam */}
      <group position={[0, 0.35, 0.25]}>
        <mesh position={[0, 0.15, 0]}>
          <cylinderGeometry args={[0.015, 0.02, 0.3, 8]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.8} />
        </mesh>
        {/* Stereo Camera Head */}
        <mesh position={[0, 0.3, 0]}>
          <boxGeometry args={[0.12, 0.06, 0.08]} />
          <meshStandardMaterial color="#0f172a" metalness={0.5} />
        </mesh>
        {/* Dual Lens */}
        <mesh position={[-0.035, 0.3, 0.045]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.015, 0.015, 0.02, 12]} />
          <meshStandardMaterial color="#06b6d4" emissive="#06b6d4" emissiveIntensity={0.6} />
        </mesh>
        <mesh position={[0.035, 0.3, 0.045]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.015, 0.015, 0.02, 12]} />
          <meshStandardMaterial color="#06b6d4" emissive="#06b6d4" emissiveIntensity={0.6} />
        </mesh>
      </group>

      {/* High Gain Communication Antenna Dish */}
      <mesh position={[-0.12, 0.42, -0.15]} rotation={[-Math.PI / 4, 0, 0]}>
        <coneGeometry args={[0.09, 0.04, 16, 1, true]} />
        <meshStandardMaterial color="#e2e8f0" metalness={0.9} side={THREE.DoubleSide} />
      </mesh>

      {/* 6 Wheels on Rocker-Bogie Suspension */}
      {[
        [-0.32, 0.1,  0.26],  // Front Left
        [ 0.32, 0.1,  0.26],  // Front Right
        [-0.34, 0.1,  0.00],  // Mid Left
        [ 0.34, 0.1,  0.00],  // Mid Right
        [-0.32, 0.1, -0.26],  // Rear Left
        [ 0.32, 0.1, -0.26],  // Rear Right
      ].map(([wx, wy, wz], i) => (
        <group key={i} position={[wx, wy, wz]}>
          <mesh
            ref={(el) => {
              if (el) wheelRefs.current[i] = el;
            }}
            rotation={[0, 0, Math.PI / 2]}
            castShadow
          >
            <cylinderGeometry args={[0.09, 0.09, 0.08, 16]} />
            <meshStandardMaterial color="#1e293b" roughness={0.7} metalness={0.5} />
          </mesh>
        </group>
      ))}

      {/* Subtle under-rover terrain illumination */}
      <pointLight color="#38bdf8" intensity={0.4} distance={1.2} position={[0, 0.15, 0]} />
    </group>
  );
});
