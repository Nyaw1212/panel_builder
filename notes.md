# Connection Assembly Modal
Current Architecture (v0.9)

---

## Goal

Provide a single modal for building a complete connection assembly including:

- Fittings
- Conduit
- Wire

Each item can be selected from the material library and stored with its own quantity.

---

## JS Modules

### modalAssembly.js

Displays the current connection assembly.

Responsibilities:

- Render selected assembly cards
- Display image
- Display Catalog Number
- Display Quantity (when applicable)
- Remove selected material
- Done / Apply Assembly button

---

### modalFilters.js

Controls the left-side filter panel.

Responsibilities:

- Build filter chips
- Update active filters
- Filter by:
    - NodeType
    - Size
    - Type
    - System

---

### modalLibrary.js

Displays the available material library.

Responsibilities:

- Display material image
- Catalog Number
- Description
- Size / Type
- Favorite badge
- Click to select material

---

### modalSearch.js

Live search.

Search Fields:

- Catalog Number
- Description
- Type
- Size
- NodeType
- Color
- Vendor
- Code

Supports multiple keywords.

---

### modalLayout.js

Creates and manages the floating modal windows.

Responsibilities:

- Open / Close modal
- Position windows
- Build modal layout
- Handle picker mode
- Handle equipment mode
- Handle material mode

---

## Data Model

### Equipment

```
Placeable = true
```

Displayed on the canvas.

Examples:

- Disconnect
- Inverter
- MSP
- Battery

---

### Assembly Materials

```
Placeable = false
```

Displayed inside the Assembly Library.

Examples:

- Fittings
- Conduit
- Wire
- Adapters
- Locknuts
- Hubs

---

## Material Classification

Uses:

```
NodeType
```

Examples:

```
CONNECTOR
COUPLING
HUB
LB
LL
LR
T
LOCKNUT
PIPE
WIRE
```

NodeType determines material behavior.

---

## Quantity Rules

Default

```
Qty = 1
```

PIPE

```
Prompt user for quantity.
```

WIRE

```
Prompt user for quantity.
```

All other materials

```
Qty remains 1.
```

---

## Current Storage

Current architecture uses:

```
currentConnection.hardware[]
```

Each hardware object stores:

```
{
    CatalogNumber,
    Description,
    Type,
    NodeType,
    Qty
}
```

---

## BOM

generateBOM()

↓

getFittingBOM()

↓

mergeMaterial()

Materials are merged by:

```
CatalogNumber
```

Quantities are accumulated automatically.

---

## Modal Flow

Open Connection

↓

Open Material Modal

↓

Build Material Library

↓

Apply Filters

↓

Search

↓

Select Material

↓

If PIPE/WIRE

↓

Prompt Qty

↓

Add to Connection

↓

Update Assembly

↓

Generate BOM

---

## Design Decisions

### Removed

Old architecture based on:

```
type === "FITTING"
```

---

Now uses:

```
Placeable
```

to determine whether an item belongs to:

- Equipment Library
- Assembly Library

---

### NodeType

Used only for behavior.

Examples:

```
PIPE
```

→ Ask Quantity

```
WIRE
```

→ Ask Quantity

Everything else

```
Qty = 1
```

---

## Current Status

✅ Equipment Picker

✅ Material Picker

✅ Search

✅ Filter Chips

✅ Favorites

✅ Assembly Cards

✅ Quantity Support

✅ Pipe Support

✅ Wire Support

✅ BOM Quantity Aggregation

⬜ Auto Fittings

⬜ Assembly Templates

⬜ BOM PDF

⬜ BOM CSV Export

⬜ Dark Theme

---

## Lessons Learned

- Keep each JS file responsible for one feature.
- Separate UI logic from business logic.
- Use `Placeable` to determine where an item belongs.
- Use `NodeType` to determine how an item behaves.
- Store quantity on the selected material instance, not in the catalog definition.
- Aggregate BOM quantities during generation rather than duplicating items.
- Avoid hardcoding material categories (like `Type === "FITTING"`); prefer data-driven rules from the MML.
- Build new features on a generic architecture so future material types require little or no code changes.

I'd update it to reflect where the project actually is now. The biggest thing missing is the new routing architecture, because we've moved far beyond simple orthogonal lines.

Connection & Routing Architecture (v0.10)
Goal

Create production-quality orthogonal routing that:

Connects directly to panel connection nodes
Automatically avoids equipment
Produces clean 90° conduit paths
Minimizes unnecessary bends
Supports future manual route editing
Routing Pipeline
Connection Center
        │
        ▼
Node Exit Point
        │
        ▼
Nearest Free Grid Cell
        │
        ▼
A* Pathfinder
        │
        ▼
Grid Path
        │
        ▼
Compress Path
        │
        ▼
Pixel Conversion
        │
        ▼
Route Optimization
        │
        ▼
SVG Renderer
JS Modules
linkGeometry.js

Responsible for building the complete route.

Responsibilities

Read connector centers
Compute node exit points
Request A* route
Convert grid path to pixels
Optimize route
Store geometry

Public

updateLinkGeometry()
createRoute()
getLinkPoints()
linkNodeExit.js

Creates the exit point outside equipment.

Responsibilities

Determine connector side
Offset connector outside equipment
Find nearest free grid cell

Public

getNodeExitPoint()
getNodeGridCell()
linkObstacleGrid.js

Creates the routing grid.

Responsibilities

Build routing grid
Mark occupied cells
Create clearance zones
Convert Pixel ↔ Grid
Cell cost lookup

Grid Values

GRID_EMPTY
GRID_BLOCKED
GRID_CLEARANCE

Public

refreshObstacleGrid()
getObstacleGrid()
pixelToGrid()
gridToPixel()
getCellCost()
linkGridHelper.js

Utility functions.

Responsibilities

Find nearest free routing cell
Spiral search
Block checking

Public

findNearestFreeCell()
linkPathfinder.js

A* routing engine.

Responsibilities

Generate orthogonal path
Manhattan heuristic
Turn penalty
Best-cost search
Obstacle avoidance

Features

A*
Turn Cost
Priority Queue
Best Cost Cache

Current

✓ Working

Future

□ Clearance cost weighting
□ Direction-aware heuristic
□ Path smoothing
linkRouteUtils.js

Route cleanup.

Responsibilities

Compress grid path
Remove duplicate points
Remove collinear points
Remove tiny doglegs
Optimize final route

Pipeline

Grid Path

↓

Compress

↓

Remove Duplicate

↓

Remove Collinear

↓

Remove Doglegs

↓

Optimized Route
linkRenderer.js

Draws SVG paths.

Responsibilities

Draw SVG path
Draw delete button
Draw node handles
Draw routing handles (future)
linkTransition.js (Planned)

Responsible for connector transitions.

Goal

Replace fixed connector exits with intelligent transitions.

Future Features

Path-aware exits
Early corner generation
Clean conduit appearance
Connector smoothing

Status

⬜ Planned
Current Routing Features

✅ Dynamic connector nodes

✅ Node exit points

✅ Nearest free cell search

✅ Obstacle grid

✅ Clearance zones

✅ A* pathfinding

✅ Manhattan heuristic

✅ Turn penalties

✅ Route compression

✅ Pixel optimization

✅ SVG routing

Known Limitations

Current routing still has a few cosmetic issues:

Routes are optimal at the grid level but not always visually optimal.
Long connector "stems" can appear before the first turn.
Parallel conduit bundling is not implemented.
Routes do not yet share common trunk paths.
No manual bend editing yet.

These are presentation issues rather than routing failures.

Next Milestones
Phase 1 — Cosmetic Routing

⬜ Intelligent connector transitions

⬜ Better first-turn placement

⬜ Cleaner panel entry/exit

Phase 2 — Shared Trunks

⬜ Merge parallel conduit runs

⬜ Shared backbone routing

⬜ Automatic tee generation

Phase 3 — Interactive Editing

⬜ Route handles

⬜ Drag corners

⬜ Add/remove bends

⬜ Lock routes

Phase 4 — Production Features

⬜ Auto fitting placement

⬜ Conduit fill calculation

⬜ Wire fill calculation

⬜ Bend counting

⬜ Length optimization

⬜ Auto conduit sizing

Lessons Learned
Routing is easier to maintain when separated into small, focused modules (geometry, pathfinding, obstacle grid, optimization, rendering).
A* provides a stronger foundation than BFS for future routing enhancements because it supports weighted costs and heuristics.
The obstacle grid should represent routing constraints, while the renderer should only draw the resulting geometry.
Optimize the route after pathfinding rather than trying to generate a perfect path in a single step.
Separate routing correctness from visual polish—first ensure a valid route, then refine its appearance.
Future improvements should remain data-driven so new routing behaviors can be added without rewriting the core pathfinding engine.

This reflects the current state of the routing system and gives a clear roadmap for the remaining work.