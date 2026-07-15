//----------------------------------
// Link Pathfinder (A*)
//----------------------------------

//----------------------------------
// Directions
//----------------------------------

const PATH_DIRECTIONS = [
  { x: 0, y: -1, dir: "up" },

  { x: 1, y: 0, dir: "right" },

  { x: 0, y: 1, dir: "down" },

  { x: -1, y: 0, dir: "left" },
];

//----------------------------------
// Costs
//----------------------------------

const MOVE_COST = 10;

const TURN_COST = 25;

//----------------------------------
// Priority Queue
//----------------------------------

class PriorityQueue {
  constructor() {
    this.items = [];
  }

  //----------------------------------
  // Push
  //----------------------------------

  push(node) {
    this.items.push(node);

    this.items.sort((a, b) => a.f - b.f);
  }

  //----------------------------------
  // Pop Lowest Cost
  //----------------------------------

  pop() {
    return this.items.shift();
  }

  //----------------------------------
  // Empty
  //----------------------------------

  isEmpty() {
    return this.items.length === 0;
  }
}

//----------------------------------
// Manhattan Distance
//----------------------------------

function heuristic(a, b) {
  return (Math.abs(a.x - b.x) + Math.abs(a.y - b.y)) * MOVE_COST;
}

//----------------------------------
// Find Path (A*)
//----------------------------------

function findPath(start, end) {
  const grid = getObstacleGrid();

  if (!grid || !grid.length) {
    return [];
  }

  const rows = grid.length;
  const cols = grid[0].length;

  //----------------------------------
  // Open Set
  //----------------------------------

  const open = new PriorityQueue();

  //----------------------------------
  // Best Cost Per Cell
  //----------------------------------

  const bestCost = new Map();

  //----------------------------------
  // Closed Set
  //----------------------------------

  const closed = new Set();

  //----------------------------------
  // Start Node
  //----------------------------------

  open.push({
    x: start.x,

    y: start.y,

    g: 0,

    h: heuristic(start, end),

    f: heuristic(start, end),

    parent: null,

    dir: null,
  });

  //----------------------------------
  // Search
  //----------------------------------

  while (!open.isEmpty()) {
    const current = open.pop();

    const key = `${current.x},${current.y}`;

    //----------------------------------
    // Skip Worse Paths
    //----------------------------------

    const previous = bestCost.get(key);

    if (previous !== undefined && current.g > previous) {
      continue;
    }

    bestCost.set(
      key,

      current.g,
    );

    //----------------------------------
    // Skip Visited
    //----------------------------------

    if (closed.has(key)) {
      continue;
    }

    closed.add(key);

    //----------------------------------
    // Goal
    //----------------------------------

    if (current.x === end.x && current.y === end.y) {
      const path = [];

      let node = current;

      while (node) {
        path.unshift({
          x: node.x,

          y: node.y,
        });

        node = node.parent;
      }

      return path;
    }

    //----------------------------------
    // Explore Neighbors
    //----------------------------------

    for (const move of PATH_DIRECTIONS) {
      const nx = current.x + move.x;
      const ny = current.y + move.y;

      //----------------------------------
      // Bounds
      //----------------------------------

      if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) {
        continue;
      }

      //----------------------------------
      // Obstacle
      //----------------------------------

      if (grid[ny][nx] === GRID_BLOCKED) {
        continue;
      }

      //----------------------------------
      // Terrain Cost
      //----------------------------------

      const terrainCost = getCellCost(nx, ny);

      //----------------------------------
      // Base Movement
      //----------------------------------

      let moveCost = MOVE_COST;

      //----------------------------------
      // Turn Penalty
      //----------------------------------

      if (current.dir && current.dir !== move.dir) {
        moveCost += TURN_COST;
      }

      //----------------------------------
      // Total Cost
      //----------------------------------

      const g = current.g + moveCost + terrainCost;

      //----------------------------------
      // Heuristic
      //----------------------------------

      const h = heuristic(
        {
          x: nx,

          y: ny,
        },

        end,
      );

      //----------------------------------
      // Push
      //----------------------------------

      open.push({
        x: nx,

        y: ny,

        g,

        h,

        f: g + h,

        parent: current,

        dir: move.dir,
      });
    }
  }

  //----------------------------------
  // No Route
  //----------------------------------

  return [];
}

//----------------------------------
// Expose
//----------------------------------

window.findPath = findPath;
