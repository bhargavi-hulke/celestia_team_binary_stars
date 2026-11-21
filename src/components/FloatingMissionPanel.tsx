import React, { useState } from 'react';
import { 
  Play, 
  Pause,
  RotateCcw, 
  Zap, 
  Crosshair, 
  Flag, 
  ShieldAlert, 
  Sliders, 
  ChevronDown, 
  ChevronUp, 
  Info,
  CheckCircle2,
  AlertTriangle,
  Route,
  Compass,
  Layers,
  MapPin
} from 'lucide-react';
import { useApp } from '../stores/appStore';
import { FloatingPanel } from './FloatingPanel';
import { lunarRegions } from '../data/regions';

export const FloatingMissionPanel: React.FC = () => {
  const { 
    state, 
    setPanelOpen, 
    calculateRoute, 
    setSimulationState,
    resetMission,
    loadScenario,
    updatePlannerConfig 
  } = useApp();

  const { 
    panels, 
    currentMission, 
    pathResult, 
    isSimulating, 
    simulationProgress,
    slopeWeight, 
    maxTraversableSlope,
    selectedRegion,
    terrainGrid
  } = state;

  const [paramsExpanded, setParamsExpanded] = useState(false);
  const [scenariosExpanded, setScenariosExpanded] = useState(false);

  // Filter regions with active DEMs
  const supportedRegions = lunarRegions.filter((r) => r.demAvailable);

  return (
    <FloatingPanel
      id="mission"
      title="Rover Mission Simulator"
      icon={<Route className="w-4 h-4 text-cyan-400" />}
      isOpen={panels.mission}
      onClose={() => setPanelOpen('mission', false)}
      initialX={window.innerWidth > 1024 ? window.innerWidth - 410 : 20}
      initialY={80}
      width={390}
      badge={currentMission.status}
      badgeColor={
        currentMission.status === 'completed'
          ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700'
          : currentMission.status === 'running'
          ? 'bg-cyan-950/80 text-cyan-300 border-cyan-700 animate-pulse'
          : currentMission.status === 'no-route'
          ? 'bg-rose-950/80 text-rose-300 border-rose-700'
          : 'bg-slate-900 text-slate-400 border-white/10'
      }
    >
      <div className="space-y-3.5 font-mono text-xs">
        {/* Step 1: Scenario / Region Selector */}
        <div>
          <div className="flex items-center justify-between text-[10px] text-slate-400 uppercase tracking-wider mb-1.5">
            <span className="flex items-center gap-1">
              <Compass className="w-3 h-3 text-cyan-400" />
              <span>Mission Terrain Scenario</span>
            </span>
            <span className="text-cyan-300 font-bold">{selectedRegion.name}</span>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            {supportedRegions.map((reg) => (
              <button
                key={reg.id}
                onClick={() => loadScenario(reg)}
                className={`p-2 rounded-xl text-left transition-all cursor-pointer ${
                  selectedRegion.id === reg.id
                    ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/60 font-semibold shadow-sm'
                    : 'bg-white/[0.03] text-slate-400 border border-white/5 hover:bg-white/[0.06] hover:text-slate-200'
                }`}
              >
                <div className="text-[9px] text-slate-500 uppercase">{reg.category}</div>
                <div className="text-[11px] truncate mt-0.5">{reg.name}</div>
              </button>
            ))}
          </div>

          {selectedRegion.scenarioPreset && (
            <p className="text-[10px] text-slate-400 mt-1.5 leading-relaxed bg-white/[0.02] p-2 rounded-lg border border-white/5">
              <strong className="text-slate-300">Objective:</strong> {selectedRegion.scenarioPreset.description}
            </p>
          )}
        </div>

        {/* Step 2: Coordinates Pill (Start & Goal) */}
        <div className="flex items-center justify-between bg-white/[0.03] p-2 rounded-xl border border-white/5 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-slate-400 text-[10px]">START:</span>
            <span className="text-white font-bold">[{currentMission.startCell.join(', ')}]</span>
          </div>

          <span className="text-slate-600">→</span>

          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-400" />
            <span className="text-slate-400 text-[10px]">GOAL:</span>
            <span className="text-white font-bold">[{currentMission.goalCell.join(', ')}]</span>
          </div>
        </div>

        {/* Step 3 & 4: Route Metrics & Failure Handling */}
        {pathResult && (
          <div>
            {!pathResult.success ? (
              /* Failure State Alert with Recovery Advice */
              <div className="bg-rose-950/25 border border-rose-500/40 p-3 rounded-xl text-xs space-y-1.5 text-rose-200">
                <div className="flex items-center gap-1.5 font-bold text-rose-300 uppercase tracking-wider text-[11px]">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>Route Search Failed</span>
                </div>
                <p className="text-[11px] leading-relaxed text-rose-200/90">
                  {pathResult.failureReason}
                </p>
                {pathResult.recoveryAdvice && (
                  <div className="text-[10px] text-rose-300/80 pt-1 border-t border-rose-900/50">
                    <strong>Recommended Action:</strong> {pathResult.recoveryAdvice}
                  </div>
                )}
              </div>
            ) : (
              /* Success Metrics Display */
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-white/[0.03] p-2.5 rounded-xl border border-white/5">
                    <div className="text-[10px] text-slate-500 uppercase">ROUTE DISTANCE</div>
                    <div className="text-cyan-300 font-bold text-sm mt-0.5">
                      {pathResult.distance.toLocaleString()} <span className="text-[10px] font-normal text-slate-400">m</span>
                    </div>
                    {pathResult.directDistance && (
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        Direct: {pathResult.directDistance.toFixed(0)}m
                      </div>
                    )}
                  </div>

                  <div className="bg-white/[0.03] p-2.5 rounded-xl border border-white/5">
                    <div className="text-[10px] text-slate-500 uppercase">EST. BATTERY ENERGY</div>
                    <div className="text-amber-300 font-bold text-sm mt-0.5 flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                      <span>{pathResult.estimatedEnergy.toFixed(1)} Wh</span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      0.5 Wh/m baseline
                    </div>
                  </div>

                  <div className="bg-white/[0.03] p-2.5 rounded-xl border border-white/5">
                    <div className="text-[10px] text-slate-500 uppercase">ELEVATION GAIN/LOSS</div>
                    <div className="text-slate-200 font-bold text-sm mt-0.5">
                      +{pathResult.elevationGain}m / -{pathResult.elevationLoss}m
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      Net vertical grade
                    </div>
                  </div>

                  <div className="bg-white/[0.03] p-2.5 rounded-xl border border-white/5">
                    <div className="text-[10px] text-slate-500 uppercase">MAX / AVG SLOPE</div>
                    <div className="text-slate-200 font-bold text-sm mt-0.5">
                      {pathResult.maxSlope}° / {pathResult.avgSlope}°
                    </div>
                    <div className="text-[10px] text-emerald-400 mt-0.5">
                      Avoided {pathResult.hazardCount} hazard cells
                    </div>
                  </div>
                </div>

                {/* Algorithmic Narrative */}
                {pathResult.explanation && (
                  <div className="bg-white/[0.02] border border-cyan-500/20 p-2.5 rounded-xl text-[11px] leading-relaxed text-slate-300 flex items-start gap-2">
                    <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-cyan-300 font-semibold mr-1">ANALYSIS:</span>
                      <span>{pathResult.explanation}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Step 5 & 6: Action Controls (Plan Route / Play Traverse / Reset) */}
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={calculateRoute}
            className="flex-1 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-medium py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-cyan-950/50 cursor-pointer transition-all active:scale-95"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Generate Route</span>
          </button>

          {pathResult && pathResult.success && pathResult.route.length > 0 && (
            <button
              onClick={() => {
                if (isSimulating === 1) {
                  setSimulationState(2); // Pause
                } else {
                  setSimulationState(1); // Play
                }
              }}
              className={`py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                isSimulating === 1
                  ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-lg'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/40'
              }`}
            >
              {isSimulating === 1 ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isSimulating === 1 ? 'Pause' : isSimulating === 2 ? 'Resume' : 'Animate Rover'}</span>
            </button>
          )}

          <button
            onClick={resetMission}
            className="p-2 rounded-xl text-slate-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/5 transition-colors cursor-pointer"
            title="Reset mission status and clear route"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Timeline Scrubber when simulating or paused */}
        {pathResult && pathResult.success && (
          <div className="bg-white/[0.02] p-2 rounded-xl border border-white/5 space-y-1">
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>Traverse Timeline:</span>
              <span className="text-cyan-300 font-bold">{Math.round(simulationProgress * 100)}%</span>
            </div>
            <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden border border-white/5">
              <div 
                className="bg-gradient-to-r from-cyan-500 to-emerald-400 h-full transition-all" 
                style={{ width: `${simulationProgress * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Configurable Cost Parameters Accordion */}
        <div className="pt-2 border-t border-white/10">
          <button
            onClick={() => setParamsExpanded(!paramsExpanded)}
            className="w-full flex items-center justify-between text-[11px] text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-1.5">
              <Sliders className="w-3 h-3 text-cyan-400" />
              <span>A* Rover Parameters</span>
            </div>
            {paramsExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          {paramsExpanded && (
            <div className="mt-2.5 space-y-3 pt-2 text-[11px]">
              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>Slope Penalty Multiplier:</span>
                  <span className="text-cyan-300 font-bold">{slopeWeight.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="5.0"
                  step="0.1"
                  value={slopeWeight}
                  onChange={(e) => updatePlannerConfig({ slopeWeight: parseFloat(e.target.value) })}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>Max Rover Slope Threshold:</span>
                  <span className="text-amber-300 font-bold">{maxTraversableSlope}°</span>
                </div>
                <input
                  type="range"
                  min="15"
                  max="35"
                  step="1"
                  value={maxTraversableSlope}
                  onChange={(e) => updatePlannerConfig({ maxTraversableSlope: parseInt(e.target.value) })}
                  className="w-full accent-amber-400 cursor-pointer"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </FloatingPanel>
  );
};
