import React, { useState } from 'react';
import { 
  Database, 
  ExternalLink, 
  ShieldCheck, 
  AlertCircle, 
  FileText, 
  Layers, 
  Compass, 
  Satellite, 
  Radio
} from 'lucide-react';

interface DatasetItem {
  id: string;
  name: string;
  agency: string;
  mission: string;
  instrument: string;
  resolution: string;
  type: 'Topography / DEM' | 'High-Res Optical' | 'Laser Altimetry' | 'Global Mosaic';
  description: string;
  license: string;
  url: string;
  status: 'Measured' | 'Derived' | 'Standard Product';
  roleInChandraverse: string;
}

const DATASETS: DatasetItem[] = [
  {
    id: 'ch2-tmc2',
    name: 'Chandrayaan-2 TMC-2 Digital Elevation Model',
    agency: 'ISRO (Indian Space Research Organisation)',
    mission: 'Chandrayaan-2 Orbiter',
    instrument: 'Terrain Mapping Camera-2 (TMC-2)',
    resolution: '~5 m/pixel (high-res stereo strips)',
    type: 'Topography / DEM',
    description:
      'High-resolution stereoscopic imaging producing digital elevation models of targeted lunar regions, including landing zones near the South Pole.',
    license: 'Non-profit scientific research use via ISSDC / PRADAN. Not permitted for commercial redistribution without ISRO approval.',
    url: 'https://pradan.issdc.gov.in/ch2/',
    status: 'Measured',
    roleInChandraverse: 'Source architecture benchmark for lunar region DEM grids and slope hazard maps.'
  },
  {
    id: 'ch2-ohrc',
    name: 'Chandrayaan-2 OHRC High-Resolution Imagery',
    agency: 'ISRO',
    mission: 'Chandrayaan-2 Orbiter',
    instrument: 'Optical High Resolution Camera (OHRC)',
    resolution: '0.25 – 0.32 m/pixel (sub-meter optical context)',
    type: 'High-Res Optical',
    description:
      'World-leading sub-meter spatial resolution optical imagery captured from 100 km orbit for landing site hazard detection and surface characterization.',
    license: 'ISRO PRADAN scientific dissemination terms.',
    url: 'https://www.isro.gov.in/ISRO_EN/CHANDRAAYAN.html',
    status: 'Measured',
    roleInChandraverse: 'Visual ground-truth verification for boulder and crater distribution.'
  },
  {
    id: 'lro-lola',
    name: 'NASA LRO LOLA Topography Products',
    agency: 'NASA / GSFC',
    mission: 'Lunar Reconnaissance Orbiter (LRO)',
    instrument: 'Lunar Orbiter Laser Altimeter (LOLA)',
    resolution: 'Global gridded topography (up to 30 m/pixel at lunar poles)',
    type: 'Laser Altimetry',
    description:
      'Multi-beam laser altimeter pulses measuring precise range to lunar surface, generating geodetic elevation reference frames.',
    license: 'NASA Open Data Policy (Public Domain / PDS Geosciences).',
    url: 'https://pds-geosciences.wustl.edu/',
    status: 'Measured',
    roleInChandraverse: 'Geodetic coordinate baseline for lunar terrain reference.'
  },
  {
    id: 'nasa-moon-trek',
    name: 'NASA Moon Trek WMTS Global Tilesets',
    agency: 'NASA JPL Solar System Treks',
    mission: 'LRO LROC WAC / Clementine / Multi-mission',
    instrument: 'Various (Optical mosaic composite)',
    resolution: '100 m/pixel global basemap',
    type: 'Global Mosaic',
    description:
      'Open web map tile service providing multi-scale orthorectified global lunar surface basemaps.',
    license: 'NASA Open APIs Terms of Service.',
    url: 'https://api.nasa.gov/',
    status: 'Derived',
    roleInChandraverse: 'Base texture mapping reference for the 3D Moon planetary atlas.'
  }
];

export const ScienceLab: React.FC = () => {
  const [selectedDataset, setSelectedDataset] = useState<DatasetItem>(DATASETS[0]);

  return (
    <div className="w-full h-full bg-[#030712] overflow-y-auto p-6 text-slate-200">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header Banner */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-2xl backdrop-blur-md">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Database className="w-5 h-5 text-cyan-400" />
                <h1 className="text-xl font-bold font-mono tracking-tight text-white">
                  Science Laboratory & Data Registry
                </h1>
              </div>
              <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
                Inspect authentic space-science observation instruments, elevation products, and data provenance governing the CHANDRAVERSE platform.
              </p>
            </div>

            <div className="flex items-center gap-2 bg-slate-950/80 border border-cyan-500/30 px-3 py-2 rounded-lg text-xs font-mono">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <div>
                <div className="text-[10px] text-slate-400">SCIENTIFIC PROVENANCE</div>
                <div className="text-cyan-300 font-semibold">Strict Attribution Protocol</div>
              </div>
            </div>
          </div>
        </div>

        {/* Scientific Integrity Advisory Notice */}
        <div className="bg-amber-950/20 border border-amber-600/40 rounded-xl p-4 text-xs font-mono text-amber-200/90 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-bold text-amber-300 uppercase tracking-wider text-[11px]">
              Scientific Integrity & Simulation Transparency
            </div>
            <p className="leading-relaxed">
              Optical imagery does not inherently contain height data. All elevation grids used in navigation simulators are either explicitly sourced from validated DEMs (such as TMC-2 / LOLA) or transparently labeled as <span className="text-white font-semibold">synthetic demo terrain</span>. CHANDRAVERSE does not present simulated or simplified physics as flight-certified mission software.
            </p>
          </div>
        </div>

        {/* Dataset Grid & Detail Split View */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Dataset Cards List */}
          <div className="space-y-3">
            <h2 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold px-1">
              Mission Datasets ({DATASETS.length})
            </h2>
            {DATASETS.map((ds) => (
              <div
                key={ds.id}
                onClick={() => setSelectedDataset(ds)}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  selectedDataset.id === ds.id
                    ? 'bg-slate-900 border-cyan-500/80 shadow-lg shadow-cyan-950/40'
                    : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-900/60 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700">
                    {ds.type}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">{ds.agency.split(' ')[0]}</span>
                </div>
                <h3 className="text-sm font-bold text-white mb-1">{ds.name}</h3>
                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{ds.description}</p>
              </div>
            ))}
          </div>

          {/* Detailed Inspector for Selected Dataset */}
          <div className="lg:col-span-2">
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 shadow-2xl backdrop-blur-md space-y-5">
              <div className="border-b border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[11px] font-mono text-cyan-400 uppercase tracking-wider block mb-1">
                    {selectedDataset.agency}
                  </span>
                  <h2 className="text-lg font-bold text-white tracking-tight">
                    {selectedDataset.name}
                  </h2>
                </div>
                <a
                  href={selectedDataset.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 text-xs font-mono transition-all w-fit cursor-pointer"
                >
                  <span>Official Portal</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* Specs Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 font-mono text-xs">
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <div className="text-[10px] text-slate-500">INSTRUMENT</div>
                  <div className="text-slate-200 font-medium mt-0.5">{selectedDataset.instrument}</div>
                </div>
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <div className="text-[10px] text-slate-500">SPATIAL RESOLUTION</div>
                  <div className="text-cyan-300 font-medium mt-0.5">{selectedDataset.resolution}</div>
                </div>
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <div className="text-[10px] text-slate-500">STATUS</div>
                  <div className="text-emerald-400 font-medium mt-0.5">{selectedDataset.status}</div>
                </div>
              </div>

              {/* Detailed Description */}
              <div>
                <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold mb-2">
                  Instrument Overview & Observations
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-4 rounded-lg border border-slate-800/80">
                  {selectedDataset.description}
                </p>
              </div>

              {/* Role in Chandraverse */}
              <div>
                <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold mb-2">
                  Application Within CHANDRAVERSE
                </h4>
                <div className="p-4 rounded-lg bg-slate-950/60 border border-slate-800/80 text-xs text-slate-300 flex items-start gap-2.5">
                  <Layers className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">{selectedDataset.roleInChandraverse}</p>
                </div>
              </div>

              {/* License Warning & Terms */}
              <div className="p-4 rounded-lg bg-slate-950/80 border border-slate-800 text-xs font-mono space-y-1.5">
                <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                  Distribution & Scientific Licence Terms
                </div>
                <p className="text-slate-400 leading-relaxed text-[11px]">
                  {selectedDataset.license}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
