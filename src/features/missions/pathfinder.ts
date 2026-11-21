import type { TerrainGrid } from '../../data/types';

export interface PathResult {
  success: boolean;
  route: [number, number][];
  distance: number;          // total meters
  directDistance: number;    // straight-line Euclidean distance (m)
  elevationGain: number;     // total uphill meters climbed
  elevationLoss: number;     // total downhill meters
  maxSlope: number;          // steepest slope encountered (degrees)
  avgSlope: number;          // average slope across route (degrees)
  estimatedEnergy: number;   // watt-hours (Wh, simulation estimate)
  hazardCount: number;       // number of caution/steep cells (> threshold)
  assumptions: string[];     // human-readable engineering assumptions
  explanation: string;       // "Why this route?" narrative
  failureReason?: string;
  recoveryAdvice?: string;
}

export interface PathfinderConfig {
  slopeWeight: number;          // multiplier for slope cost (default 2.2)
  maxTraversableSlope: number;  // degrees limit, above this = impassable (default 30)
  baseEnergyPerMeter: number;   // default 0.50 Wh/m
  hazardSlopeThreshold: number; // default 20 degrees
  roverProfile: string;         // 'Pragyan Class' (lightweight solar 26kg) | 'Heavy Science Platform'
}

const DEFAULT_CONFIG: PathfinderConfig = {
  slopeWeight: 2.2,
  maxTraversableSlope: 30,
  baseEnergyPerMeter: 0.50,
  hazardSlopeThreshold: 20,
  roverProfile: 'Pragyan-Class Light Exploration Rover (26 kg, 50W Solar)',
};

interface Node {
  r: number;
  c: number;
  priority: number;
}

class PriorityQueue {
  private heap: Node[] = [];

  push(r: number, c: number, priority: number) {
    this.heap.push({ r, c, priority });
    this.bubbleUp(this.heap.length - 1);
  }

  pop(): Node | undefined {
    if (this.heap.length === 0) return undefined;
    const top = this.heap[0];
    const bottom = this.heap.pop()!;
    if (this.heap.length > 0) {
      this.heap[0] = bottom;
      this.bubbleDown(0);
    }
    return top;
  }

  isEmpty(): boolean {
    return this.heap.length === 0;
  }

  private bubbleUp(idx: number) {
    while (idx > 0) {
      const parentIdx = (idx - 1) >> 1;
      if (this.heap[idx].priority < this.heap[parentIdx].priority) {
        const tmp = this.heap[idx];
        this.heap[idx] = this.heap[parentIdx];
        this.heap[parentIdx] = tmp;
        idx = parentIdx;
      } else {
        break;
      }
    }
  }

  private bubbleDown(idx: number) {
    const length = this.heap.length;
    while (true) {
      let left = (idx << 1) + 1;
      let right = left + 1;
      let smallest = idx;

      if (left < length && this.heap[left].priority < this.heap[smallest].priority) {
        smallest = left;
      }
      if (right < length && this.heap[right].priority < this.heap[smallest].priority) {
        smallest = right;
      }
      if (smallest !== idx) {
        const tmp = this.heap[idx];
        this.heap[idx] = this.heap[smallest];
        this.heap[smallest] = tmp;
        idx = smallest;
      } else {
        break;
      }
    }
  }
}

// 8 neighbor directions: [dr, dc, distance_factor]
const NEIGHBORS = [
  [-1,  0, 1.0],        // N
  [ 1,  0, 1.0],        // S
  [ 0, -1, 1.0],        // W
  [ 0,  1, 1.0],        // E
  [-1, -1, Math.SQRT2], // NW
  [-1,  1, Math.SQRT2], // NE
  [ 1, -1, Math.SQRT2], // SW
  [ 1,  1, Math.SQRT2], // SE
];

export function findPath(
  grid: TerrainGrid,
  start: [number, number],
  goal: [number, number],
  userConfig?: Partial<PathfinderConfig>
): PathResult {
  const config = { ...DEFAULT_CONFIG, ...userConfig };
  const { width, height, cellSize, cells } = grid;

  const [startR, startC] = start;
  const [goalR, goalC] = goal;

  // Failure Check 1: Boundary validity
  if (
    startR < 0 || startR >= height || startC < 0 || startC >= width ||
    goalR < 0 || goalR >= height || goalC < 0 || goalC >= width
  ) {
    return {
      success: false,
      route: [],
      distance: 0,
      directDistance: 0,
      elevationGain: 0,
      elevationLoss: 0,
      maxSlope: 0,
      avgSlope: 0,
      estimatedEnergy: 0,
      hazardCount: 0,
      assumptions: [],
      explanation: 'Coordinates outside active DEM coverage extent.',
      failureReason: 'Selected waypoint coordinates lie outside the supported elevation grid boundary.',
      recoveryAdvice: 'Choose start and target coordinates within the visible terrain grid boundaries.'
    };
  }

  // Failure Check 2: Start and Goal too close
  const cellDist = Math.hypot(goalR - startR, goalC - startC);
  if (cellDist < 1.5) {
    return {
      success: false,
      route: [],
      distance: 0,
      directDistance: Math.round(cellDist * cellSize * 10) / 10,
      elevationGain: 0,
      elevationLoss: 0,
      maxSlope: 0,
      avgSlope: 0,
      estimatedEnergy: 0,
      hazardCount: 0,
      assumptions: [],
      explanation: 'Start and destination waypoints are too close together.',
      failureReason: `Waypoint separation (${(cellDist * cellSize).toFixed(1)}m) is below minimum mission threshold (75m).`,
      recoveryAdvice: 'Pick a destination target further across the terrain to establish a meaningful traverse corridor.'
    };
  }

  // Failure Check 3: Start or Goal cell impassable
  if (cells[startR][startC].blocked || cells[startR][startC].slope > config.maxTraversableSlope) {
    return {
      success: false,
      route: [],
      distance: 0,
      directDistance: Math.round(cellDist * cellSize * 10) / 10,
      elevationGain: 0,
      elevationLoss: 0,
      maxSlope: cells[startR][startC].slope,
      avgSlope: cells[startR][startC].slope,
      estimatedEnergy: 0,
      hazardCount: 1,
      assumptions: [],
      explanation: 'Deployment point is located in an impassable hazard zone.',
      failureReason: `Rover deployment site [${startR}, ${startC}] has a slope of ${cells[startR][startC].slope.toFixed(1)}°, exceeding the rover limit (${config.maxTraversableSlope}°).`,
      recoveryAdvice: 'Deploy rover onto benign, flatter regolith (< 20° slope).'
    };
  }

  if (cells[goalR][goalC].blocked || cells[goalR][goalC].slope > config.maxTraversableSlope) {
    return {
      success: false,
      route: [],
      distance: 0,
      directDistance: Math.round(cellDist * cellSize * 10) / 10,
      elevationGain: 0,
      elevationLoss: 0,
      maxSlope: cells[goalR][goalC].slope,
      avgSlope: cells[goalR][goalC].slope,
      estimatedEnergy: 0,
      hazardCount: 1,
      assumptions: [],
      explanation: 'Target destination is on an inaccessible, steep escarpment or crater wall.',
      failureReason: `Destination site [${goalR}, ${goalC}] has a slope of ${cells[goalR][goalC].slope.toFixed(1)}°, which cannot be safely approached.`,
      recoveryAdvice: 'Reposition the destination beacon onto an accessible plateau or terrace.'
    };
  }

  // A* Search
  const gScore = Array.from({ length: height }, () => new Float64Array(width).fill(Infinity));
  const cameFromR = Array.from({ length: height }, () => new Int16Array(width).fill(-1));
  const cameFromC = Array.from({ length: height }, () => new Int16Array(width).fill(-1));
  const closed = Array.from({ length: height }, () => new Uint8Array(width));

  const heuristic = (r: number, c: number) => {
    const dr = (r - goalR) * cellSize;
    const dc = (c - goalC) * cellSize;
    return Math.sqrt(dr * dr + dc * dc);
  };

  const pq = new PriorityQueue();
  gScore[startR][startC] = 0;
  pq.push(startR, startC, heuristic(startR, startC));

  let reached = false;

  while (!pq.isEmpty()) {
    const current = pq.pop()!;
    const { r, c } = current;

    if (r === goalR && c === goalC) {
      reached = true;
      break;
    }

    if (closed[r][c]) continue;
    closed[r][c] = 1;

    const currentCell = cells[r][c];

    for (const [dr, dc, distFactor] of NEIGHBORS) {
      const nr = r + dr;
      const nc = c + dc;

      if (nr < 0 || nr >= height || nc < 0 || nc >= width) continue;
      if (closed[nr][nc]) continue;

      const neighborCell = cells[nr][nc];

      // Hard impassable threshold
      if (neighborCell.blocked || neighborCell.slope > config.maxTraversableSlope) {
        continue;
      }

      const stepDist = cellSize * distFactor;
      
      // Slope penalty: non-linear cost escalation
      const normalizedSlope = neighborCell.slope / config.maxTraversableSlope;
      const slopePenalty = Math.pow(normalizedSlope, 1.8) * config.slopeWeight;
      
      // Surface roughness penalty
      const roughnessPenalty = neighborCell.roughness * 0.8;

      // Vertical elevation change penalty (uphill drag)
      const dElev = neighborCell.elevation - currentCell.elevation;
      const uphillPenalty = dElev > 0 ? (dElev / stepDist) * 1.6 : 0;

      const stepCost = stepDist * (1 + slopePenalty + roughnessPenalty + uphillPenalty);
      const tentativeG = gScore[r][c] + stepCost;

      if (tentativeG < gScore[nr][nc]) {
        cameFromR[nr][nc] = r;
        cameFromC[nr][nc] = c;
        gScore[nr][nc] = tentativeG;
        const fScore = tentativeG + heuristic(nr, nc);
        pq.push(nr, nc, fScore);
      }
    }
  }

  // Failure Check 4: No route exists (completely blocked by crater rims or mountains)
  if (!reached) {
    return {
      success: false,
      route: [],
      distance: 0,
      directDistance: Math.round(cellDist * cellSize * 10) / 10,
      elevationGain: 0,
      elevationLoss: 0,
      maxSlope: 0,
      avgSlope: 0,
      estimatedEnergy: 0,
      hazardCount: 0,
      assumptions: [],
      explanation: 'No traversable path exists within current slope and roughness constraints.',
      failureReason: 'Continuous chain of steep slopes (>30°) or crater obstacles blocks all corridor routes between start and target.',
      recoveryAdvice: 'Increase maximum slope threshold in cost parameters or choose an alternate destination.'
    };
  }

  // Reconstruct path
  const route: [number, number][] = [];
  let currR = goalR;
  let currC = goalC;

  while (currR !== -1 && currC !== -1) {
    route.push([currR, currC]);
    if (currR === startR && currC === startC) break;
    const prevR = cameFromR[currR][currC];
    const prevC = cameFromC[currR][currC];
    currR = prevR;
    currC = prevC;
  }

  route.reverse();

  // Compute metrics
  let totalDistance = 0;
  let estimatedEnergy = 0;
  let hazardCount = 0;
  let maxSlope = 0;
  let slopeSum = 0;
  let elevationGain = 0;
  let elevationLoss = 0;

  for (let i = 0; i < route.length; i++) {
    const [r, c] = route[i];
    const cell = cells[r][c];

    if (cell.slope > maxSlope) maxSlope = cell.slope;
    slopeSum += cell.slope;
    if (cell.slope >= config.hazardSlopeThreshold) {
      hazardCount++;
    }

    if (i > 0) {
      const [prevR, prevC] = route[i - 1];
      const prevCell = cells[prevR][prevC];

      const dr = Math.abs(r - prevR);
      const dc = Math.abs(c - prevC);
      const dist = (dr === 1 && dc === 1 ? Math.SQRT2 : 1.0) * cellSize;
      totalDistance += dist;

      const dElev = cell.elevation - prevCell.elevation;
      if (dElev > 0) {
        elevationGain += dElev;
      } else {
        elevationLoss += Math.abs(dElev);
      }

      // Energy consumption model: baseline + uphill gradient drag - slight downhill recuperation
      const inclineFactor = dElev > 0 ? (dElev / dist) * 2.2 : -0.15 * Math.min(1, Math.abs(dElev / dist));
      const stepEnergy = config.baseEnergyPerMeter * dist * (1 + inclineFactor);
      estimatedEnergy += Math.max(0.05 * dist, stepEnergy);
    }
  }

  const directDistance = Math.hypot((goalR - startR) * cellSize, (goalC - startC) * cellSize);
  const avgSlope = route.length > 0 ? slopeSum / route.length : 0;
  const detourPercent = directDistance > 0 ? ((totalDistance - directDistance) / directDistance) * 100 : 0;

  let explanation = '';
  if (detourPercent > 5) {
    explanation = `The planned route is ${detourPercent.toFixed(1)}% longer than the direct line (${Math.round(totalDistance)}m vs ${Math.round(directDistance)}m). It detours around ${hazardCount} elevated slope cells (> ${config.hazardSlopeThreshold}°) and crater walls to ensure vehicle stability and minimize battery draw.`;
  } else {
    explanation = `The planned route adheres closely to the direct trajectory (${Math.round(totalDistance)}m) over benign regolith with an average slope of ${avgSlope.toFixed(1)}°.`;
  }

  const assumptions = [
    `Rover Configuration: ${config.roverProfile}`,
    `Search Mesh: 8-neighbor deterministic A* over ${width}×${height} DEM (${cellSize}m grid spacing)`,
    `Slope Weight Penalty: ${config.slopeWeight.toFixed(1)}x`,
    `Slope Traversability Ceiling: ${config.maxTraversableSlope}° (cells above this are impassable)`,
    `Energy Formula: ${config.baseEnergyPerMeter.toFixed(2)} Wh/meter baseline on flat regolith + 220% uphill slope grade penalty`,
    `Notice: Educational & conceptual mission model. Not flight-certified trajectory calculation.`
  ];

  return {
    success: true,
    route,
    distance: Math.round(totalDistance * 10) / 10,
    directDistance: Math.round(directDistance * 10) / 10,
    elevationGain: Math.round(elevationGain * 10) / 10,
    elevationLoss: Math.round(elevationLoss * 10) / 10,
    maxSlope: Math.round(maxSlope * 10) / 10,
    avgSlope: Math.round(avgSlope * 10) / 10,
    estimatedEnergy: Math.round(estimatedEnergy * 10) / 10,
    hazardCount,
    assumptions,
    explanation,
  };
}
