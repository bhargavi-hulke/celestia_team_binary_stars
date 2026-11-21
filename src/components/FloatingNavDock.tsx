import React, { useState, useRef } from 'react';
import { 
  Globe2, 
  Navigation, 
  Database, 
  Search, 
  Info, 
  Layers, 
  Palette, 
  Compass, 
  HelpCircle,
  Moon,
  ChevronDown
} from 'lucide-react';
import { useApp } from '../stores/appStore';
import type { AppView, VisualStyle } from '../data/types';
import { AboutModal } from './AboutModal';

export const FloatingNavDock: React.FC = () => {
  const { 
    state, 
    setView, 
    setVisualStyle, 
    togglePanel, 
    setPanelOpen,
    bringPanelToFront 
  } = useApp();

  const { currentView, visualStyle, panels, selectedRegion } = state;
  const [helpOpen, setHelpOpen] = useState(false);

  return (
    <>
      {/* 
        TOP HUD BAR (Minimal floating layout per Section 05):
        - TOP LEFT: Celestia mark + current mode pill
        - TOP CENTRE: Search / location command
        - TOP RIGHT: Settings + Visual style preset
      */}
      <header className="fixed top-0 left-0 right-0 h-14 px-6 z-40 select-none flex items-center justify-between pointer-events-none">
        {/* TOP LEFT: Brand Mark & Mode Pill */}
        <div className="flex items-center gap-2.5 pointer-events-auto">
          <div 
            onClick={() => setView('explore')}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-950/60 backdrop-blur-2xl border border-white/10 hover:border-cyan-500/40 cursor-pointer shadow-[0_8px_32px_rgba(0,0,0,0.6)] transition-all group"
          >
            <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 group-hover:animate-ping" />
            <span className="font-mono text-xs font-bold text-white tracking-widest uppercase">
              CELESTIA
            </span>
            <span className="text-[9px] font-mono bg-cyan-950/80 text-cyan-400 px-1.5 py-0.2 rounded border border-cyan-800/80">
              {currentView.toUpperCase()}
            </span>
          </div>

          {/* Region Lock Pill */}
          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-950/60 backdrop-blur-2xl border border-white/10 text-[11px] font-mono text-slate-300 shadow-lg">
            <span className="text-slate-500">TARGET:</span>
            <span className="text-cyan-300 font-semibold">{selectedRegion.name}</span>
          </div>
        </div>

        {/* TOP CENTRE: Primary 3 Experiences Navigation & Search Capsule */}
        <div className="pointer-events-auto flex items-center gap-1.5 p-1 bg-slate-950/60 backdrop-blur-2xl border border-white/10 rounded-full shadow-[0_12px_40px_rgba(0,0,0,0.7)] ring-1 ring-white/5">
          {/* 01 Planetary Explorer */}
          <button
            onClick={() => setView('explore')}
            className={`px-3.5 py-1.5 rounded-full flex items-center gap-2 font-mono text-xs transition-all cursor-pointer ${
              currentView === 'explore'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/60 font-semibold shadow-[0_0_15px_rgba(6,182,212,0.25)]'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.05] border border-transparent'
            }`}
          >
            <Globe2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Planetary Explorer</span>
          </button>

          {/* 02 Mission Simulator */}
          <button
            onClick={() => setView('missions')}
            className={`px-3.5 py-1.5 rounded-full flex items-center gap-2 font-mono text-xs transition-all cursor-pointer ${
              currentView === 'missions'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/60 font-semibold shadow-[0_0_15px_rgba(6,182,212,0.25)]'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.05] border border-transparent'
            }`}
          >
            <Navigation className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Mission Simulator</span>
          </button>

          {/* 03 Science Lab */}
          <button
            onClick={() => setView('science')}
            className={`px-3.5 py-1.5 rounded-full flex items-center gap-2 font-mono text-xs transition-all cursor-pointer ${
              currentView === 'science'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/60 font-semibold shadow-[0_0_15px_rgba(6,182,212,0.25)]'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.05] border border-transparent'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Science Lab</span>
          </button>

          <div className="w-px h-4 bg-white/10 mx-1" />

          {/* Location Command / Search Trigger */}
          <button
            onClick={() => togglePanel('search')}
            className={`px-2.5 py-1.5 rounded-full flex items-center gap-1.5 font-mono text-xs transition-all cursor-pointer ${
              panels.search
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
            }`}
            title="Search lunar craters and landing sites"
          >
            <Search className="w-3.5 h-3.5" />
            <span className="text-[11px] text-slate-400 hidden md:inline">Search (POIs)</span>
          </button>
        </div>

        {/* TOP RIGHT: Visual Style Preset & Help Modal */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Visual Style Preset: Realistic vs Sculpted / Clay (Page 2 & 5) */}
          <div className="flex items-center bg-slate-950/60 backdrop-blur-2xl border border-white/10 p-0.5 rounded-full shadow-lg">
            <button
              onClick={() => setVisualStyle('realistic')}
              className={`px-2.5 py-1 rounded-full text-[10px] font-mono transition-all cursor-pointer ${
                visualStyle === 'realistic'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Realistic surface imagery & lighting"
            >
              Realistic
            </button>
            <button
              onClick={() => setVisualStyle('sculpted')}
              className={`px-2.5 py-1 rounded-full text-[10px] font-mono transition-all cursor-pointer ${
                visualStyle === 'sculpted'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Sculpted / Clay monochrome topographic relief preset"
            >
              Sculpted
            </button>
          </div>

          {/* Help & Architecture Modal Button */}
          <button
            onClick={() => setHelpOpen(true)}
            className="p-2 rounded-full bg-slate-950/60 backdrop-blur-2xl border border-white/10 hover:border-cyan-500/40 text-slate-400 hover:text-white shadow-lg transition-colors cursor-pointer"
            title="Celestia Technical & Science Architecture"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </header>

      {helpOpen && <AboutModal onClose={() => setHelpOpen(false)} />}
    </>
  );
};
