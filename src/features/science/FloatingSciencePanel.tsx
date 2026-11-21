import React, { useState } from 'react';
import { useApp } from '../../stores/appStore';
import { FloatingPanel } from '../../components/FloatingPanel';
import type { ActiveLayer } from '../../data/types';
import { 
  Database, 
  Layers, 
  Activity, 
  ExternalLink, 
  Thermometer, 
  PieChart, 
  ShieldCheck, 
  MapPin,
  Eye
} from 'lucide-react';

export const FloatingSciencePanel: React.FC = () => {
  const { state, setPanelOpen, setActiveLayer, selectRegion } = useApp();
  const { panels, activeLayer, selectedRegion, inspectedCoords } = state;

  const [opacity, setOpacity] = useState(0.85);

  const layers: { id: ActiveLayer; name: string; instrument: string; resolution: string; units: string }[] = [
    {
      id: 'imagery',
      name: 'LROC WAC Global Morphology',
      instrument: 'Lunar Reconnaissance Orbiter Camera (WAC)',
      resolution: '~100 m/pixel',
      units: 'Normalised Optical Reflectance (Albedo)'
    },
    {
      id: 'elevation',
      name: 'LOLA + SLDEM2015 Topography',
      instrument: 'Lunar Orbiter Laser Altimeter / Kaguya TC',
      resolution: '59 m/pixel geodetic grid',
      units: 'Meters (Relative to 1,737.4 km lunar sphere)'
    },
    {
      id: 'slope',
      name: 'DEM-Derived Surface Slope',
      instrument: 'Finite-Difference Derivative of LOLA/TMC-2',
      resolution: '20–50 m/pixel',
      units: 'Degrees (° inclination from local horizontal)'
    },
    {
      id: 'hillshade',
      name: 'Solar Shaded Relief Model',
      instrument: 'Simulated 15° Low-Angle Solar Illumination',
      resolution: '20 m/pixel',
      units: 'Photometric Shading Gradient'
    }
  ];

  return (
    <FloatingPanel
      id="science"
      title="Science Lab & Observation Archive"
      icon={<Database className="w-4 h-4 text-cyan-400" />}
      isOpen={panels.science}
      onClose={() => setPanelOpen('science', false)}
      initialX={24}
      initialY={80}
      width={420}
      badge="Verified Data"
      badgeColor="bg-cyan-950/80 text-cyan-400 border-cyan-800"
    >
      <div className="space-y-3.5 font-mono text-xs">
        {/* Layer Selector Browser */}
        <div>
          <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span>Active Observation Layer</span>
            </span>
            <span className="text-cyan-300 font-bold">{activeLayer.toUpperCase()}</span>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            {layers.map((l) => (
              <button
                key={l.id}
                onClick={() => setActiveLayer(l.id)}
                className={`p-2 rounded-xl text-left transition-all cursor-pointer ${
                  activeLayer === l.id
                    ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/60 shadow-sm font-semibold'
                    : 'bg-white/[0.03] text-slate-400 border border-white/5 hover:bg-white/[0.06] hover:text-slate-200'
                }`}
              >
                <div className="text-[9px] text-slate-500 uppercase truncate">{l.units.split(' ')[0]}</div>
                <div className="text-[11px] truncate mt-0.5">{l.name.split(' ')[0]} {l.name.split(' ')[1]}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Selected Layer Metadata & Provenance */}
        {(() => {
          const cur = layers.find((l) => l.id === activeLayer) || layers[0];
          return (
            <div className="bg-white/[0.03] p-2.5 rounded-xl border border-white/5 text-[11px] space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">INSTRUMENT:</span>
                <span className="text-slate-200 truncate ml-2">{cur.instrument}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">SPATIAL RESOLUTION:</span>
                <span className="text-cyan-300 font-bold">{cur.resolution}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">UNITS:</span>
                <span className="text-slate-300 truncate ml-2">{cur.units}</span>
              </div>
            </div>
          );
        })()}

        {/* Real Scientific Instrument Readings at Selected Region (e.g. APXS, ChaSTE) */}
        {selectedRegion.scientificReadings ? (
          <div className="bg-white/[0.03] p-3 rounded-xl border border-cyan-500/30 space-y-2.5">
            <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
              <span className="text-[10px] text-cyan-300 uppercase tracking-wider font-bold flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-cyan-400" />
                In-Situ Instrument Readings
              </span>
              <span className="text-[9px] text-slate-400">
                {selectedRegion.name}
              </span>
            </div>

            {/* Thermal Profile (ChaSTE / Diviner) */}
            {selectedRegion.scientificReadings.temperatureKelvin && (
              <div className="flex items-center justify-between text-[11px] bg-slate-900/60 p-2 rounded-lg border border-white/5">
                <span className="text-slate-400 flex items-center gap-1">
                  <Thermometer className="w-3 h-3 text-amber-400" />
                  Thermal Gradient (Surface / 10cm depth):
                </span>
                <span className="text-amber-300 font-bold">
                  {selectedRegion.scientificReadings.temperatureKelvin.surface} K / {selectedRegion.scientificReadings.temperatureKelvin.depth10cm} K
                </span>
              </div>
            )}

            {/* In-Situ Composition (APXS / PDS) */}
            {selectedRegion.scientificReadings.composition && (
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
                  Elemental Composition (APXS X-ray Spectrometry):
                </span>
                <div className="grid grid-cols-3 gap-1 text-[10px]">
                  {selectedRegion.scientificReadings.composition.map((c, i) => (
                    <div key={i} className="bg-slate-900/80 p-1.5 rounded border border-white/5">
                      <div className="text-slate-500 truncate">{c.element.split(' ')[0]}</div>
                      <div className="text-cyan-300 font-bold mt-0.5">{c.percentage}%</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="text-[9px] text-slate-500 pt-1">
              Source: {selectedRegion.scientificReadings.primaryInstrument}
            </div>
          </div>
        ) : (
          <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 text-[10px] text-slate-400 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-slate-500 shrink-0" />
            <span>Select Shiv Shakti Point or Tranquility Base to inspect authenticated in-situ surface chemical & thermal probe products.</span>
          </div>
        )}

        {/* Provenance note */}
        <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[10px] text-slate-500">
          <span>ISRO PRADAN & NASA PDS Geosciences</span>
          <a
            href="https://pradan.issdc.gov.in/ch2/"
            target="_blank"
            rel="noreferrer"
            className="text-cyan-400 hover:underline flex items-center gap-1"
          >
            ISSDC Archive <ExternalLink className="w-2.5 h-2.5" />
          </a>
        </div>
      </div>
    </FloatingPanel>
  );
};
