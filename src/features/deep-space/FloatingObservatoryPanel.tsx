import React, { useState, useMemo } from 'react';
import { useApp } from '../../stores/appStore';
import { getDemoNeutrinoEvents, NeutrinoEvent } from '../../data/icecube';
import { FloatingPanel } from '../../components/FloatingPanel';
import { 
  Sparkles, 
  Filter, 
  Zap, 
  Crosshair, 
  ExternalLink, 
  Info 
} from 'lucide-react';

export const FloatingObservatoryPanel: React.FC = () => {
  const { state, setPanelOpen } = useApp();
  const { panels } = state;

  const [selectedEvent, setSelectedEvent] = useState<NeutrinoEvent | null>(null);
  const [selectedSeason, setSelectedSeason] = useState<string>('ALL');
  const [minEnergyLog, setMinEnergyLog] = useState<number>(2);

  const allEvents = useMemo(() => getDemoNeutrinoEvents(), []);

  const filteredEvents = useMemo(() => {
    return allEvents.filter((ev) => {
      if (selectedSeason !== 'ALL' && ev.season !== selectedSeason) return false;
      const logE = Math.log10(ev.energy);
      if (logE < minEnergyLog) return false;
      return true;
    });
  }, [allEvents, selectedSeason, minEnergyLog]);

  const seasons = useMemo(() => {
    const set = new Set(allEvents.map((e) => e.season));
    return ['ALL', ...Array.from(set)];
  }, [allEvents]);

  const getEnergyColor = (energy: number) => {
    const logE = Math.log10(energy);
    if (logE >= 5.5) return '#f43f5e';
    if (logE >= 4.0) return '#f59e0b';
    if (logE >= 3.0) return '#10b981';
    return '#38bdf8';
  };

  return (
    <FloatingPanel
      id="observatory"
      title="Deep Space Observatory"
      icon={<Sparkles className="w-4 h-4 text-purple-300" />}
      isOpen={panels.observatory}
      onClose={() => setPanelOpen('observatory', false)}
      initialX={window.innerWidth > 1024 ? 60 : 15}
      initialY={90}
      width={460}
      badge="IceCube DR2"
      badgeColor="bg-purple-950/80 text-purple-300 border-purple-800"
    >
      <div className="space-y-3">
        {/* Filter bar */}
        <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-white/[0.03] border border-white/5 text-[11px]">
          <div className="flex items-center gap-1.5">
            <Filter className="w-3 h-3 text-cyan-400" />
            <span className="text-slate-400">Season:</span>
            <select
              value={selectedSeason}
              onChange={(e) => setSelectedSeason(e.target.value)}
              className="bg-slate-900 border border-white/10 rounded px-1.5 py-0.5 text-slate-200 outline-none"
            >
              {seasons.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <Zap className="w-3 h-3 text-amber-400" />
            <span className="text-slate-400">Min:</span>
            <input
              type="range"
              min={2}
              max={6}
              step={0.5}
              value={minEnergyLog}
              onChange={(e) => setMinEnergyLog(parseFloat(e.target.value))}
              className="w-16 accent-cyan-400 cursor-pointer"
            />
            <span className="text-[10px] text-cyan-300 w-12">
              {minEnergyLog >= 6 ? '≥1 PeV' : minEnergyLog >= 3 ? `≥${Math.round(10 ** (minEnergyLog - 3))} TeV` : '≥100 GeV'}
            </span>
          </div>

          <div className="text-[10px] text-slate-400 font-mono">
            <span className="text-cyan-300 font-bold">{filteredEvents.length}</span>/200
          </div>
        </div>

        {/* 2D Celestial Equatorial Projection SVG */}
        <div className="relative w-full aspect-[2/1] bg-slate-950 border border-white/10 rounded-xl overflow-hidden shadow-inner">
          <svg className="w-full h-full select-none" viewBox="0 0 360 180">
            <defs>
              <pattern id="celestialGrid2" width="60" height="30" patternUnits="userSpaceOnUse">
                <path d="M 60 0 L 0 0 0 30" fill="none" stroke="#1e293b" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="360" height="180" fill="#030712" />
            <rect width="360" height="180" fill="url(#celestialGrid2)" />

            {/* Equator */}
            <line x1="0" y1="90" x2="360" y2="90" stroke="#334155" strokeWidth="0.8" strokeDasharray="3 3" />
            <text x="6" y="86" fill="#64748b" fontSize="6" fontFamily="monospace">Dec 0°</text>

            {/* Plot Reconstructed Candidate Events */}
            {filteredEvents.map((ev) => {
              const cx = ev.ra;
              const cy = 90 - ev.dec;
              const isSelected = selectedEvent?.id === ev.id;
              const color = getEnergyColor(ev.energy);

              return (
                <g key={ev.id} className="cursor-pointer" onClick={() => setSelectedEvent(ev)}>
                  {isSelected && (
                    <circle
                      cx={cx}
                      cy={cy}
                      r={Math.max(2, ev.angularError * 3)}
                      fill={color}
                      fillOpacity={0.25}
                      stroke={color}
                      strokeWidth={0.8}
                      strokeDasharray="2 2"
                    />
                  )}
                  <circle
                    cx={cx}
                    cy={cy}
                    r={isSelected ? 3.5 : 1.8}
                    fill={color}
                    stroke={isSelected ? '#ffffff' : 'none'}
                    strokeWidth={0.8}
                  />
                </g>
              );
            })}
          </svg>
        </div>

        {/* Selected Event Card */}
        {selectedEvent && (
          <div className="bg-white/[0.03] border border-cyan-500/30 rounded-xl p-2.5 text-xs">
            <div className="flex items-center justify-between border-b border-white/10 pb-1.5 mb-1.5">
              <span className="font-bold text-white flex items-center gap-1">
                <Crosshair className="w-3.5 h-3.5 text-cyan-400" />
                {selectedEvent.id}
              </span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-900 text-cyan-300 border border-white/10">
                {selectedEvent.season}
              </span>
            </div>
            <div className="grid grid-cols-4 gap-1.5 text-[10px]">
              <div>
                <span className="text-slate-500 block">RA</span>
                <span className="text-cyan-300 font-bold">{selectedEvent.ra.toFixed(1)}°</span>
              </div>
              <div>
                <span className="text-slate-500 block">DEC</span>
                <span className="text-cyan-300 font-bold">{selectedEvent.dec.toFixed(1)}°</span>
              </div>
              <div>
                <span className="text-slate-500 block">ENERGY</span>
                <span className="text-amber-300 font-bold">
                  {selectedEvent.energy >= 1e6 ? `${(selectedEvent.energy / 1e6).toFixed(1)} PeV` : `${(selectedEvent.energy / 1e3).toFixed(0)} TeV`}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">ERROR</span>
                <span className="text-emerald-300 font-bold">±{selectedEvent.angularError.toFixed(2)}°</span>
              </div>
            </div>
          </div>
        )}

        <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[10px] text-slate-500">
          <span>DOI 10.7910/DVN/MMIIZA</span>
          <a
            href="https://icecube.wisc.edu/"
            target="_blank"
            rel="noreferrer"
            className="text-cyan-400 hover:underline flex items-center gap-1"
          >
            IceCube Observatory <ExternalLink className="w-2.5 h-2.5" />
          </a>
        </div>
      </div>
    </FloatingPanel>
  );
};
