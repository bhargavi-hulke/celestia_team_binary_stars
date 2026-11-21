import React, { useState } from 'react';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Layers, 
  MapPin, 
  Compass, 
  Search, 
  ShieldAlert,
  Grid3X3,
  Tag,
  Crosshair
} from 'lucide-react';
import { useApp } from '../stores/appStore';
import { FloatingPanel } from './FloatingPanel';
import { lunarRegions } from '../data/regions';

export const FloatingControls: React.FC = () => {
  const { 
    state, 
    zoomCamera, 
    resetCamera, 
    toggleMarkers, 
    toggleLabels,
    toggleWireframe,
    flyToRegion,
    togglePanel,
    setPanelOpen,
  } = useApp();

  const { 
    showMarkers, 
    showLabels, 
    wireframe, 
    panels, 
    selectedRegion, 
    cursorCoordinates, 
    terrainGrid, 
    showTerrain 
  } = state;

  const [searchTerm, setSearchTerm] = useState('');

  const filteredRegions = lunarRegions.filter((r) =>
    r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      {/* 
        LEFT EDGE ICON RAIL (Section 05):
        Small floating glass capsule on the left edge.
      */}
      <aside
        className="fixed top-1/2 -translate-y-1/2 left-6 z-30 select-none flex flex-col items-center gap-1.5 p-1.5 bg-slate-950/60 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.7)] ring-1 ring-white/5"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Zoom In */}
        <button
          onClick={() => zoomCamera(-1.2)}
          className="p-2.5 rounded-xl text-slate-300 hover:text-cyan-300 hover:bg-white/[0.08] transition-all cursor-pointer group relative"
          title="Zoom In (Camera Glide)"
        >
          <ZoomIn className="w-4 h-4" />
          <span className="absolute left-full ml-3 px-2 py-0.5 rounded bg-slate-950 border border-white/10 text-[10px] font-mono text-slate-200 whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
            Zoom In
          </span>
        </button>

        {/* Zoom Out */}
        <button
          onClick={() => zoomCamera(1.2)}
          className="p-2.5 rounded-xl text-slate-300 hover:text-cyan-300 hover:bg-white/[0.08] transition-all cursor-pointer group relative"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
          <span className="absolute left-full ml-3 px-2 py-0.5 rounded bg-slate-950 border border-white/10 text-[10px] font-mono text-slate-200 whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
            Zoom Out
          </span>
        </button>

        {/* Reset Camera Orbit */}
        <button
          onClick={resetCamera}
          className="p-2.5 rounded-xl text-slate-300 hover:text-cyan-300 hover:bg-white/[0.08] transition-all cursor-pointer group relative"
          title="Reset Camera Orientation"
        >
          <RotateCcw className="w-4 h-4" />
          <span className="absolute left-full ml-3 px-2 py-0.5 rounded bg-slate-950 border border-white/10 text-[10px] font-mono text-slate-200 whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
            Reset Camera
          </span>
        </button>

        <div className="w-6 h-px bg-white/10 my-0.5" />

        {/* Toggle POI Markers */}
        <button
          onClick={toggleMarkers}
          className={`p-2.5 rounded-xl transition-all cursor-pointer group relative ${
            showMarkers
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
              : 'text-slate-400 hover:text-white hover:bg-white/[0.08]'
          }`}
          title="Toggle Lunar POI Markers"
        >
          <MapPin className="w-4 h-4" />
          <span className="absolute left-full ml-3 px-2 py-0.5 rounded bg-slate-950 border border-white/10 text-[10px] font-mono text-slate-200 whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
            POI Markers: {showMarkers ? 'ON' : 'OFF'}
          </span>
        </button>

        {/* Toggle Labels */}
        <button
          onClick={toggleLabels}
          className={`p-2.5 rounded-xl transition-all cursor-pointer group relative ${
            showLabels
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
              : 'text-slate-400 hover:text-white hover:bg-white/[0.08]'
          }`}
          title="Toggle Feature Names & Labels"
        >
          <Tag className="w-4 h-4" />
          <span className="absolute left-full ml-3 px-2 py-0.5 rounded bg-slate-950 border border-white/10 text-[10px] font-mono text-slate-200 whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
            Labels: {showLabels ? 'ON' : 'OFF'}
          </span>
        </button>

        {/* Toggle Wireframe */}
        <button
          onClick={toggleWireframe}
          className={`p-2.5 rounded-xl transition-all cursor-pointer group relative ${
            wireframe
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50'
              : 'text-slate-400 hover:text-white hover:bg-white/[0.08]'
          }`}
          title="Toggle DEM Tesselation Wireframe"
        >
          <Grid3X3 className="w-4 h-4" />
          <span className="absolute left-full ml-3 px-2 py-0.5 rounded bg-slate-950 border border-white/10 text-[10px] font-mono text-slate-200 whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
            Wireframe: {wireframe ? 'ON' : 'OFF'}
          </span>
        </button>

        <div className="w-6 h-px bg-white/10 my-0.5" />

        {/* Toggle Info Context Drawer */}
        <button
          onClick={() => togglePanel('info')}
          className={`p-2.5 rounded-xl transition-all cursor-pointer group relative ${
            panels.info
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50'
              : 'text-slate-400 hover:text-white hover:bg-white/[0.08]'
          }`}
          title="Toggle Context Information Drawer"
        >
          <Compass className="w-4 h-4" />
          <span className="absolute left-full ml-3 px-2 py-0.5 rounded bg-slate-950 border border-white/10 text-[10px] font-mono text-slate-200 whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
            Context Drawer
          </span>
        </button>
      </aside>

      {/* 
        BOTTOM LEFT TELEMETRY & SCALE BAR (Section 05):
        Scale / coordinates / active data status readout
      */}
      <div 
        className="fixed bottom-8 left-6 z-30 select-none p-3 bg-slate-950/60 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.7)] ring-1 ring-white/5 font-mono text-xs max-w-xs space-y-1.5"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between text-[10px] text-slate-400">
          <span className="flex items-center gap-1.5">
            <Crosshair className="w-3 h-3 text-cyan-400" />
            <span>COORDINATE DATUM:</span>
          </span>
          <span className="text-cyan-300 font-bold">LOLA SLDEM2015</span>
        </div>

        <div className="text-[11px] font-bold text-white flex items-center justify-between">
          <span>
            {Math.abs(selectedRegion.centerLat).toFixed(2)}°{selectedRegion.centerLat < 0 ? 'S' : 'N'}, {Math.abs(selectedRegion.centerLon).toFixed(2)}°{selectedRegion.centerLon < 0 ? 'W' : 'E'}
          </span>
          <span className="text-[10px] font-normal text-slate-400">
            {selectedRegion.elevationApprox ? `${selectedRegion.elevationApprox} m` : '-2,840 m'}
          </span>
        </div>

        {/* Dynamic Scale Indicator Bar */}
        <div className="pt-1 border-t border-white/5 flex items-center justify-between text-[9px] text-slate-500">
          <div className="flex items-center gap-1">
            <span className="w-12 h-0.5 bg-cyan-400/80 inline-block" />
            <span>{showTerrain ? `${terrainGrid.cellSize * 4}m` : '100 km'}</span>
          </div>
          <span>1,737.4 km Moon Radius</span>
        </div>
      </div>

      {/* Floating Location Search & Catalog Command Window */}
      <FloatingPanel
        id="search"
        title="USGS / IAU Lunar Gazetteer Catalog"
        icon={<Search className="w-4 h-4 text-cyan-400" />}
        isOpen={panels.search}
        onClose={() => setPanelOpen('search', false)}
        initialX={window.innerWidth / 2 - 180}
        initialY={80}
        width={380}
        badge="Gazetteer"
      >
        <div className="space-y-3 font-mono text-xs">
          <div className="relative">
            <input
              type="text"
              placeholder="Search crater, landing site, mare..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900/90 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-400 transition-colors"
              autoFocus
            />
          </div>

          <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
            {filteredRegions.map((region) => (
              <div
                key={region.id}
                onClick={() => {
                  flyToRegion(region);
                  setPanelOpen('search', false);
                }}
                className="p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 hover:border-cyan-500/50 cursor-pointer transition-all group flex items-start justify-between"
              >
                <div>
                  <div className="flex items-center gap-1.5 font-semibold text-slate-200 group-hover:text-cyan-300 text-xs">
                    <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{region.name}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {Math.abs(region.centerLat)}°{region.centerLat < 0 ? 'S' : 'N'}, {Math.abs(region.centerLon)}°{region.centerLon < 0 ? 'W' : 'E'}
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-900 border border-white/10 text-slate-400 group-hover:text-cyan-300 uppercase block">
                    {region.category}
                  </span>
                  {region.demAvailable && (
                    <span className="text-[9px] text-emerald-400 mt-0.5 block font-bold">
                      DEM Ready
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </FloatingPanel>
    </>
  );
};
