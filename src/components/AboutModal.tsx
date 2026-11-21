import React from 'react';
import { X, Moon, ShieldCheck, Compass, Zap, Sparkles, ExternalLink } from 'lucide-react';

export const AboutModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm select-none">
      <div className="relative w-full max-w-2xl bg-slate-950 border border-cyan-500/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-600/20 border border-cyan-500/50 flex items-center justify-center text-cyan-400">
              <Moon className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-mono">CHANDRAVERSE Architecture</h2>
              <p className="text-xs text-slate-400">Planetary Exploration & Lightweight Mission Simulation Studio</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-300 leading-relaxed font-mono">
          {/* Core Mission */}
          <div>
            <h3 className="text-sm font-bold text-cyan-300 uppercase tracking-wider mb-2 flex items-center gap-2">
              <Compass className="w-4 h-4" /> Core Product Workflow
            </h3>
            <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-xl space-y-2">
              <p>
                <strong className="text-white">EXPLORE → INVESTIGATE → SIMULATE:</strong> Users explore the 3D Moon atlas, select a landing site (such as India's historic Chandrayaan-3 Shiv Shakti Point), inspect the underlying digital elevation model (DEM) and slope gradients, and compute explainable deterministic A* rover navigation paths.
              </p>
            </div>
          </div>

          {/* Technical Stack */}
          <div>
            <h3 className="text-sm font-bold text-cyan-300 uppercase tracking-wider mb-2 flex items-center gap-2">
              <Zap className="w-4 h-4" /> Technical Centrepiece: Deterministic A* Navigation
            </h3>
            <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-xl space-y-2">
              <ul className="list-disc pl-4 space-y-1 text-slate-400">
                <li><strong className="text-slate-200">8-Neighbor Graph Traversal:</strong> Cardinal and diagonal moves with Euclidean heuristic.</li>
                <li><strong className="text-slate-200">Non-linear Slope Penalties:</strong> Exponential travel cost escalation over steep grades, avoiding dangerous crater walls and impassable obstacles (&gt;30° slope).</li>
                <li><strong className="text-slate-200">Illustrative Energy Estimator:</strong> Transparently calculated based on base regolith friction (0.5 Wh/m) and gravitational uphill work.</li>
                <li><strong className="text-slate-200">Explainable Decisions:</strong> Provides human-readable comparisons between direct straight-line distance and the safe detour trajectory.</li>
              </ul>
            </div>
          </div>

          {/* Bonus Deep Space Observatory */}
          <div>
            <h3 className="text-sm font-bold text-purple-300 uppercase tracking-wider mb-2 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" /> Bonus Widget: Deep Space Observatory
            </h3>
            <div className="p-3.5 bg-purple-950/20 border border-purple-800/40 rounded-xl space-y-2 text-purple-200/90">
              <p>
                Integrated as a dockable floating mission-control widget. Displays synthetic candidate track-like neutrino observations on a celestial equatorial projection based on the IceCube IceTracks-DR2 14-year data release (DOI 10.7910/DVN/MMIIZA).
              </p>
            </div>
          </div>

          {/* Scientific Provenance */}
          <div>
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> Scientific Provenance & Terms
            </h3>
            <p className="text-slate-400 text-[11px]">
              Built for educational and demonstration purposes. Demo terrain grids are clearly marked as synthetic heightfields inspired by Chandrayaan-2/3 TMC-2 and NASA LOLA datasets. ISRO PRADAN data terms restrict non-profit scientific use.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between">
          <span className="text-[10px] font-mono text-slate-500">
            CHANDRAVERSE Hackathon MVP • Version 1.0
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-medium cursor-pointer transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
