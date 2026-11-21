import { getDemoTerrainGrid } from '../src/data/terrain';
import { findPath } from '../src/features/missions/pathfinder';

console.log('--- Testing CHANDRAVERSE A* Pathfinder ---');

const grid = getDemoTerrainGrid();
console.log(`Grid loaded: ${grid.width}x${grid.height}, Cell size: ${grid.cellSize}m`);

// Test 1: Standard path finding
const start: [number, number] = [14, 14];
const goal: [number, number] = [48, 48];
const result = findPath(grid, start, goal);

if (result) {
  console.log('✓ Test 1 Passed: Path found successfully');
  console.log(`  Route steps: ${result.route.length}`);
  console.log(`  Distance: ${result.distance}m (direct: ${result.directDistance}m)`);
  console.log(`  Estimated Energy: ${result.estimatedEnergy} Wh`);
  console.log(`  Hazards avoided: ${result.hazardCount}`);
  console.log(`  Why this route: "${result.explanation}"`);
} else {
  console.error('✗ Test 1 Failed: No path found');
  process.exit(1);
}

// Test 2: Unreachable / Blocked goal test
// Force cell [0, 0] to be completely surrounded by blocked cells
const blockedGrid = JSON.parse(JSON.stringify(grid));
blockedGrid.cells[0][1].blocked = true;
blockedGrid.cells[1][0].blocked = true;
blockedGrid.cells[1][1].blocked = true;

const noPathResult = findPath(blockedGrid, [0, 0], [10, 10]);
if (noPathResult === null) {
  console.log('✓ Test 2 Passed: Correctly reported null for completely blocked path');
} else {
  console.error('✗ Test 2 Failed: Fabricated a path when path was blocked');
  process.exit(1);
}

// Test 3: Deterministic reproducibility
const resultAgain = findPath(grid, start, goal);
if (resultAgain && resultAgain.distance === result.distance && resultAgain.route.length === result.route.length) {
  console.log('✓ Test 3 Passed: Deterministic output verified');
} else {
  console.error('✗ Test 3 Failed: Non-deterministic output');
  process.exit(1);
}

console.log('\nAll Pathfinder Acceptance Tests PASSED! ✨');
