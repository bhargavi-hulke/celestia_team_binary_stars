import React from 'react';
import { 
  MapPin, 
  Layers, 
  Mountain, 
  Navigation, 
  ShieldCheck, 
  Compass, 
  Activity,
  Crosshair,
  ExternalLink,
  Info,
  Thermometer,
  ShieldAlert
} from 'lucide-react';
import { useApp } from '../stores/appStore';
import { FloatingPanel } from './FloatingPanel';

export const FloatingInfoPanel: React.FC = () => {
  const { 
    state, 
    setPanelOpen, 
    loadScenario,
    setView 
  } = useApp();

  const { 
    panels, 
    selectedRegion, 
    selectedCell, 
    hoveredCell, 
    terrainGrid, 
    inspectedCoords 
  } = state;

  const activeCoord = hoveredCell || selectedCell;
  const inspectedCell = activeCoord
    ? terrainGrid.cells[activeCoord[0]][activeCoord[1]]
    : null;

  return (
    <FloatingPanel
      id="info"
      title={selectedRegion.name}
      icon={<MapPin className="w-4 h-4 text-cyan-400" />}
      isOpen={panels.info}
      onClose={() => setPanelOpen('info', false)}
      initialX={window.innerWidth > 1024 ? window.innerWidth - 380 : 20}
      initialY={80}
      width={360}
      badge={selectedRegion.category}
      badgeColor={
        selectedRegion.demAvailable
          ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
          : 'bg-slate-900 text-slate-400 border-white/10'
      }
    >
      <div className="space-y-3.5 font-mono text-xs">
        {/* Region Nomenclature & Description */}
        <p className="text-xs text-slate-300 leading-relaxed font-sans">
          {selectedRegion.description}
        </p>

        {/* Geographic Coordinates & Altimetry */}
        <div className="grid grid-cols-2 gap-2 bg-white/[0.03] p-2.5 rounded-xl border border-white/5 text-xs">
          <div>
            <div className="text-[10px] text-slate-500 uppercase">LATITUDE</div>
            <div className="text-cyan-300 font-bold mt-0.5">
              {Math.abs(selectedRegion.centerLat).toFixed(2)}° {selectedRegion.centerLat < 0 ? 'S' : 'N'}
            </div>
          </div>

          <div>
            <div className="text-[10px] text-slate-500 uppercase">LONGITUDE</div>
            <div className="text-cyan-300 font-bold mt-0.5">
              {Math.abs(selectedRegion.centerLon).toFixed(2)}° {selectedRegion.centerLon < 0 ? 'W' : 'E'}
            </div>
          </div>

          <div>
            <div className="text-[10px] text-slate-500 uppercase">ELEVATION DATUM</div>
            <div className="text-slate-200 font-bold mt-0.5">
              {selectedRegion.elevationApprox ? `${selectedRegion.elevationApprox} m` : '-2,840 m'}
            </div>
          </div>

          <div>
            <div className="text-[10px] text-slate-500 uppercase">TERRAIN RESOLUTION</div>
            <div className="text-emerald-400 font-bold mt-0.5">
              {selectedRegion.demAvailable ? `${terrainGrid.cellSize} m/cell` : '100 m WAC'}
            </div>
          </div>
        </div>

        {/* Active Surface Cell Telemetry Probe (when clicking or hovering on 3D terrain) */}
        {inspectedCell && activeCoord && (
          <div className="bg-cyan-950/20 border border-cyan-500/30 p-2.5 rounded-xl space-y-2">
            <div className="flex items-center justify-between border-b border-cyan-900/40 pb-1.5">
              <span className="text-[10px] text-cyan-300 font-bold uppercase flex items-center gap-1">
                <Crosshair className="w-3 h-3 text-cyan-400" />
                Active DEM Surface Probe
              </span>
              <span className="text-[10px] text-cyan-200 font-bold">
                [{activeCoord[0]}, {activeCoord[1]}]
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="text-slate-400">Elevation: </span>
                <span className="text-white font-bold">{inspectedCell.elevation.toFixed(1)}m</span>
              </div>
              <div>
                <span className="text-slate-400">Slope Grade: </span>
                <span className={`font-bold ${inspectedCell.slope > 25 ? 'text-red-400' : inspectedCell.slope > 15 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {inspectedCell.slope.toFixed(1)}°
                </span>
              </div>
              <div>
                <span className="text-slate-400">Roughness: </span>
                <span className="text-slate-200 font-bold">{inspectedCell.roughness}</span>
              </div>
              <div>
                <span className="text-slate-400">Illumination: </span>
                <span className="text-amber-300 font-bold">{inspectedCell.illumination ? `${Math.round(inspectedCell.illumination * 100)}%` : '85%'}</span>
              </div>
            </div>
          </div>
        )}

        {/* In-Situ Scientific Readings if available */}
        {selectedRegion.scientificReadings && (
          <div className="bg-white/[0.03] p-2.5 rounded-xl border border-white/5 space-y-1.5">
            <div className="text-[10px] text-slate-400 uppercase font-semibold flex items-center gap-1">
              <Activity className="w-3 h-3 text-cyan-400" />
              <span>In-Situ Scientific Observations</span>
            </div>
            {selectedRegion.scientificReadings.temperatureKelvin && (
              <div className="text-[11px] text-slate-300 flex items-center justify-between">
                <span className="text-slate-500">Surface Temp (ChaSTE/Diviner):</span>
                <span className="text-amber-300 font-bold">
                  {selectedRegion.scientificReadings.temperatureKelvin.surface} K
                </span>
              </div>
            )}
            <div className="text-[10px] text-slate-500">
              Sensor: {selectedRegion.scientificReadings.primaryInstrument}
            </div>
          </div>
        )}

        {/* Geological Feature Tags */}
        {selectedRegion.features && selectedRegion.features.length > 0 && (
          <div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-1 flex items-center gap-1">
              <Layers className="w-3 h-3 text-cyan-400" />
              <span>Geological Context</span>
            </div>
            <ul className="space-y-1 text-[11px] text-slate-400 font-sans">
              {selectedRegion.features.map((feat, idx) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-cyan-400 mt-1.5 shrink-0" />
                  <span>{feat}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Launch / Deploy Action */}
        <div className="pt-2 border-t border-white/10">
          {selectedRegion.demAvailable ? (
            <button
              onClick={() => {
                loadScenario(selectedRegion);
              }}
              className="w-full bg-gradient-to-r from-cyan-600/30 to-blue-600/30 hover:from-cyan-600/40 hover:to-blue-600/40 border border-cyan-500/50 hover:border-cyan-400 text-cyan-200 font-medium py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-950/40 transition-all cursor-pointer"
            >
              <Navigation className="w-3.5 h-3.5 text-cyan-400" />
              <span>Launch Mission at this Location</span>
            </button>
          ) : (
            <div className="p-2 rounded-xl bg-white/[0.02] border border-white/5 text-[10px] text-slate-500 text-center">
              Regional high-res DEM pending integration for this landmark.
            </div>
          )}
        </div>
      </div>
    </FloatingPanel>
  );
};
