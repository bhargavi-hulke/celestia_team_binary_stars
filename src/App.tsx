import React from 'react';
import { AppProvider, useApp } from './stores/appStore';
import { MoonGlobe } from './features/explorer/MoonGlobe';
import { RoverMissionScene } from './features/missions/RoverMissionScene';
import { FloatingNavDock } from './components/FloatingNavDock';
import { FloatingControls } from './components/FloatingControls';
import { FloatingInfoPanel } from './components/FloatingInfoPanel';
import { FloatingMissionPanel } from './components/FloatingMissionPanel';
import { FloatingSciencePanel } from './features/science/FloatingSciencePanel';
import { DeepSpaceBubble } from './features/deep-space/DeepSpaceBubble';

const CelestiaViewport: React.FC = () => {
  const { state } = useApp();
  const { showTerrain, currentView } = state;

  return (
    <div className="relative w-screen h-screen bg-[#020617] text-slate-100 overflow-hidden font-sans select-none">
      {/* 
        MAIN STAGE (Section 05): Full 3D Moon / Terrain.
        Zero permanent panels or sidebars over the surface.
      */}
      <div className="absolute inset-0 w-full h-full z-0">
        {showTerrain || currentView === 'missions' ? (
          <RoverMissionScene />
        ) : (
          <MoonGlobe />
        )}
      </div>

      {/* TOP BAR: Celestia Mark + Navigation Capsule + Mode Pill */}
      <FloatingNavDock />

      {/* LEFT EDGE: Minimal Icon Rail + BOTTOM-LEFT: Coordinates & Scale Readout */}
      <FloatingControls />

      {/* RIGHT EDGE: Context Detail Drawer */}
      <FloatingInfoPanel />

      {/* MISSION SIMULATOR: Draggable Workflow Panel */}
      <FloatingMissionPanel />

      {/* SCIENCE LAB: Layer Browser & In-Situ Readings Panel */}
      <FloatingSciencePanel />

      {/* BOTTOM-RIGHT: Persistent Cosmic Signal Bubble & IceCube Observatory */}
      <DeepSpaceBubble />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <CelestiaViewport />
    </AppProvider>
  );
}
