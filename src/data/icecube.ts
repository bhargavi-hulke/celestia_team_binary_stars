import type { DatasetMetadata } from './types';

/* ── Types ────────────────────────────────────────────────────────── */
export interface NeutrinoEvent {
  id: string;
  /** Right Ascension in degrees (0–360). */
  ra: number;
  /** Declination in degrees (−90 to +90). */
  dec: number;
  /** Reconstructed energy in GeV. */
  energy: number;
  /** Angular error (median) in degrees. */
  angularError: number;
  /** Modified Julian Date of the event. */
  mjd: number;
  /** IceCube season label, e.g. "IC86-2015". */
  season: string;
}

/* ── Seeded PRNG (Mulberry32) ─────────────────────────────────────── */
function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ── Constants ────────────────────────────────────────────────────── */
const EVENT_COUNT = 200;

/** MJD ranges roughly per IceCube season (simplified). */
const SEASONS: { label: string; mjdStart: number; mjdEnd: number }[] = [
  { label: 'IC40',      mjdStart: 54562, mjdEnd: 54971 },   // 2008–2009
  { label: 'IC59',      mjdStart: 54971, mjdEnd: 55347 },   // 2009–2010
  { label: 'IC79',      mjdStart: 55347, mjdEnd: 55694 },   // 2010–2011
  { label: 'IC86-2011', mjdStart: 55694, mjdEnd: 56062 },   // 2011–2012
  { label: 'IC86-2012', mjdStart: 56062, mjdEnd: 56427 },   // 2012–2013
  { label: 'IC86-2013', mjdStart: 56427, mjdEnd: 56783 },   // 2013–2014
  { label: 'IC86-2014', mjdStart: 56783, mjdEnd: 57160 },   // 2014–2015
  { label: 'IC86-2015', mjdStart: 57160, mjdEnd: 57531 },   // 2015–2016
  { label: 'IC86-2016', mjdStart: 57531, mjdEnd: 57896 },   // 2016–2017
  { label: 'IC86-2017', mjdStart: 57896, mjdEnd: 58270 },   // 2017–2018
  { label: 'IC86-2018', mjdStart: 58270, mjdEnd: 58635 },   // 2018–2019
  { label: 'IC86-2019', mjdStart: 58635, mjdEnd: 59000 },   // 2019–2020
  { label: 'IC86-2020', mjdStart: 59000, mjdEnd: 59365 },   // 2020–2021
  { label: 'IC86-2021', mjdStart: 59365, mjdEnd: 59730 },   // 2021–2022
];

/* ── Generator ────────────────────────────────────────────────────── */
export function getDemoNeutrinoEvents(): NeutrinoEvent[] {
  const rand = mulberry32(1337);
  const events: NeutrinoEvent[] = [];

  for (let i = 0; i < EVENT_COUNT; i++) {
    // RA: uniform 0–360
    const ra = round(rand() * 360, 4);

    // Dec: peaked near the horizon (±5°) to mimic IceCube track bias
    let dec: number;
    if (rand() < 0.55) {
      // cluster near ±5° of the horizon
      dec = (rand() - 0.5) * 10; // −5 to +5
    } else {
      // remaining events spread over full sky
      // use arcsin transform for uniform solid angle
      dec = Math.asin(2 * rand() - 1) * (180 / Math.PI);
    }
    dec = round(dec, 4);

    // Energy: log-uniform 100 GeV – 10 PeV (1e2 – 1e7 GeV)
    const logEmin = 2;
    const logEmax = 7;
    const energy = round(10 ** (logEmin + rand() * (logEmax - logEmin)), 1);

    // Angular error: 0.2° – 2° (roughly log-uniform)
    const angularError = round(10 ** (Math.log10(0.2) + rand() * (Math.log10(2) - Math.log10(0.2))), 2);

    // Pick a random season and a random MJD within it
    const season = SEASONS[Math.floor(rand() * SEASONS.length)];
    const mjd = round(season.mjdStart + rand() * (season.mjdEnd - season.mjdStart), 2);

    events.push({
      id: `synth-${String(i + 1).padStart(4, '0')}`,
      ra,
      dec,
      energy,
      angularError,
      mjd,
      season: season.label,
    });
  }

  return events;
}

function round(v: number, decimals: number): number {
  const f = 10 ** decimals;
  return Math.round(v * f) / f;
}

/* ── Metadata ─────────────────────────────────────────────────────── */
export const neutrinoDatasetMetadata: DatasetMetadata = {
  id: 'icecube-synth-demo',
  title: 'Synthetic IceCube-Style Neutrino Events',
  body: 'Sky',
  source: 'Procedural generation',
  instrument: 'IceCube Neutrino Observatory (simulated)',
  units: 'GeV (energy), degrees (coordinates)',
  status: 'synthetic',
  attribution:
    'Synthetic demonstration data inspired by IceCube IceTracks-DR2. ' +
    'NOT real IceCube data. Real data: DOI 10.7910/DVN/MMIIZA',
};
