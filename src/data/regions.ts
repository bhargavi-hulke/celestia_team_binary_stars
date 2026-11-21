import type { LunarRegion } from './types';

export const lunarRegions: LunarRegion[] = [
  {
    id: 'shiv-shakti',
    name: 'Shiv Shakti Point',
    category: 'landing-site',
    description:
      "Chandrayaan-3 landing site near the lunar south pole (~69.37°S, 32.32°E). " +
      "India's historic soft landing on 23 August 2023, deploying the Vikram lander and Pragyan rover onto high-latitude regolith.",
    centerLat: -69.37,
    centerLon: 32.32,
    radiusKm: 2.5,
    elevationApprox: -2840,
    features: ['High-latitude polar plateau', 'Permanently Shadowed Region (PSR) proximity', 'Water-ice volatile deposits', 'Pragyan APXS & LIBS in-situ analysis'],
    demAvailable: true,
    scenarioPreset: {
      title: 'Polar Regolith Science Traverse',
      description: 'Navigate Pragyan from Vikram lander deployment point across gentle undulating plains towards a nearby crater rim for spectral sampling.',
      startCell: [14, 14],
      goalCell: [48, 48],
    },
    scientificReadings: {
      primaryInstrument: 'ISRO Chandrayaan-3 APXS & ChaSTE',
      composition: [
        { element: 'Silicon (Si)', percentage: 42.1 },
        { element: 'Aluminium (Al)', percentage: 24.8 },
        { element: 'Calcium (Ca)', percentage: 14.5 },
        { element: 'Iron (Fe)', percentage: 8.6 },
        { element: 'Magnesium (Mg)', percentage: 6.2 },
        { element: 'Titanium (Ti)', percentage: 1.2 },
      ],
      temperatureKelvin: { surface: 310, depth10cm: 220 },
      albedo: 0.12,
    }
  },
  {
    id: 'shackleton-ridge',
    name: 'Shackleton Rim & Connecting Ridge',
    category: 'polar-ridge',
    description:
      'Peak of Eternal Light on the rim of Shackleton Crater (89.9°S, 0.0°E). Prime candidate site for NASA Artemis III crewed surface missions.',
    centerLat: -89.90,
    centerLon: 0.00,
    radiusKm: 3.2,
    elevationApprox: -1200,
    features: ['Peak of Eternal Light (90%+ solar illumination)', 'Adjacent deep cryogenic cold trap (40 Kelvin in interior)', 'Extreme communication line-of-sight to Earth'],
    demAvailable: true,
    scenarioPreset: {
      title: 'Illumination Corridor Navigation',
      description: 'Route along the elevated crest between Shackleton and de Gerlache, avoiding steep drop-offs into permanently shadowed depressions.',
      startCell: [10, 32],
      goalCell: [54, 32],
    },
    scientificReadings: {
      primaryInstrument: 'NASA LRO LOLA & Diviner Radiometer',
      temperatureKelvin: { surface: 190, depth10cm: 110 },
      albedo: 0.14,
    }
  },
  {
    id: 'tranquility-base',
    name: 'Tranquility Base (Apollo 11)',
    category: 'landing-site',
    description:
      'First human lunar landing site in southern Mare Tranquillitatis (0.6875°N, 23.4333°E, July 1969). Basaltic volcanic plain dominated by ilmenite and pyroxene.',
    centerLat: 0.6875,
    centerLon: 23.4333,
    radiusKm: 2.0,
    elevationApprox: -1450,
    features: ['High-titanium flood basalts', 'West Crater block field', 'Apollo 11 Descent Stage & PSEP seismic sensor', 'Laser Ranging Retroreflector (LRRR)'],
    demAvailable: true,
    scenarioPreset: {
      title: 'West Crater Hazard Avoidance',
      description: 'Safely navigate around the boulder-strewn rim of West Crater to reach secondary sample collection coordinates on the mare plain.',
      startCell: [16, 20],
      goalCell: [45, 42],
    },
    scientificReadings: {
      primaryInstrument: 'Apollo 11 Lunar Sample Analysis (PDS Geosciences)',
      composition: [
        { element: 'Silicon (Si)', percentage: 39.5 },
        { element: 'Titanium (Ti)', percentage: 11.2 },
        { element: 'Iron (Fe)', percentage: 15.8 },
        { element: 'Aluminium (Al)', percentage: 12.4 },
        { element: 'Calcium (Ca)', percentage: 10.1 },
        { element: 'Magnesium (Mg)', percentage: 7.3 },
      ],
      temperatureKelvin: { surface: 385, depth10cm: 255 },
      albedo: 0.09,
    }
  },
  {
    id: 'tycho-crater',
    name: 'Tycho Crater Rim & Terraces',
    category: 'impact-crater',
    description:
      '85 km diameter Copernican impact crater (43.31°S, 11.36°W) featuring massive terraced walls, an impact-melt ponded floor, and a 1.6 km high central peak.',
    centerLat: -43.31,
    centerLon: -11.36,
    radiusKm: 12.0,
    diameterKm: 85,
    elevationApprox: -4800,
    features: ['1,500 km ray system across the Moon', 'Central mountain peak', 'Steep stepped terrace escarpments (>35°)', 'Surveyor 7 landing site on north rim'],
    demAvailable: true,
    scenarioPreset: {
      title: 'Terrace Wall Escarpment Pass',
      description: 'Find a traversable low-slope canyon pass through the inner crater wall terraces to reach the smooth impact-melt floor without tipping the rover.',
      startCell: [8, 12],
      goalCell: [50, 52],
    },
    scientificReadings: {
      primaryInstrument: 'NASA LRO LROC & Clementine UVVIS',
      temperatureKelvin: { surface: 360, depth10cm: 240 },
      albedo: 0.18,
    }
  },
  {
    id: 'copernicus-crater',
    name: 'Copernicus Crater',
    category: 'impact-crater',
    description:
      'Spectacular 93 km complex crater in eastern Oceanus Procellarum (9.62°N, 20.08°W). Benchmark of lunar impact stratigraphy with segmented central peaks.',
    centerLat: 9.62,
    centerLon: -20.08,
    radiusKm: 15.0,
    diameterKm: 93,
    elevationApprox: -3760,
    features: ['Tripartite central peaks', 'Complex scalloped wall terraces', 'High-albedo impact ejecta blanket'],
    demAvailable: false
  },
  {
    id: 'aristarchus-plateau',
    name: 'Aristarchus Plateau & Vallis Schröteri',
    category: 'geological',
    description:
      'Elevated volcanic crustal plateau (23.7°N, 47.4°W) exhibiting the highest optical albedo on the near side. Contains Vallis Schröteri, the largest sinuous volcanic rille.',
    centerLat: 23.70,
    centerLon: -47.40,
    radiusKm: 25.0,
    diameterKm: 70,
    elevationApprox: -2000,
    features: ['Extreme high-albedo anorthosite reflection', 'Vallis Schröteri sinuous rille', 'Thick dark volcanic pyroclastic mantle'],
    demAvailable: false
  },
  {
    id: 'spa-basin',
    name: 'South Pole–Aitken Basin (SPA)',
    category: 'mare',
    description:
      'The largest, deepest, and oldest recognizable impact structure on the Moon (~2,500 km across) on the lunar far side (-53.0°S, 169.0°E), reaching 8.2 km below datum.',
    centerLat: -53.00,
    centerLon: 169.00,
    radiusKm: 50.0,
    diameterKm: 2500,
    elevationApprox: -8200,
    features: ['Far-side giant impact basin', 'Deepest lunar depression (-8.2 km)', 'Exposed lower-crust and mantle minerals'],
    demAvailable: false
  },
  {
    id: 'mare-serenitatis',
    name: 'Mare Serenitatis (Apollo 17)',
    category: 'mare',
    description:
      'Massive circular mascon mare basin filled with multi-stage flood basalts (28.0°N, 17.5°E). Bordered by the Taurus-Littrow valley explored by Apollo 17 astronauts.',
    centerLat: 28.00,
    centerLon: 17.50,
    radiusKm: 40.0,
    diameterKm: 674,
    elevationApprox: -2100,
    features: ['Positive gravity anomaly (mascon)', 'Orange volcanic pyroclastic glass beads', 'Dorsa wrinkle ridges'],
    demAvailable: false
  },
  {
    id: 'mons-rumker',
    name: 'Mons Rümker (Chang\'e 5)',
    category: 'geological',
    description:
      'Vast volcanic mound complex in northern Oceanus Procellarum (40.8°N, 58.1°W). Site of China\'s Chang\'e 5 robotic lunar sample return (youngest basalts, ~2.0 Ga).',
    centerLat: 40.80,
    centerLon: -58.10,
    radiusKm: 20.0,
    diameterKm: 70,
    elevationApprox: -2300,
    features: ['Concentration of 30+ lunar volcanic domes', 'Youngest dated mare basalt units', 'Sample return site'],
    demAvailable: false
  }
];
