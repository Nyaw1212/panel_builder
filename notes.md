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

# Panel Builder Architecture
## Current Architecture (v0.10)

---

# Project Goal

Build a production-quality electrical panel builder capable of:

- Equipment placement
- Intelligent orthogonal routing
- Connection assembly management
- Equipment assembly management
- Automatic BOM generation
- Project save/load
- Future NEC validation and production documentation

The application is designed around a modular architecture where **Equipment** and **Connections** each own their respective materials and behaviors.

---

# Overall Architecture

```text
Project
│
├── Equipment
│     ├── Placement
│     ├── Connection Nodes
│     ├── Internal Components
│     ├── Presets
│     └── Equipment BOM
│
├── Connections
│     ├── Routing
│     ├── Pipe
│     ├── Wire
│     ├── Route Hardware
│     └── Connection BOM
│
└── Project BOM
```

---

# Data Ownership

## Equipment owns

Equipment is responsible for everything physically mounted inside or directly attached to the enclosure.

Examples:

- Main Breaker
- Fuse
- Fuse Holder
- SPD
- Terminal Blocks
- Accessories
- Equipment Presets

These should **NOT** belong to the connection.

---

## Connection owns

Connections represent the physical route between two equipment nodes.

Examples:

- Conduit
- Wire
- EMT Connectors
- Couplings
- LB
- LL
- LR
- Hubs
- Locknuts
- Bushings
- Weatherheads
- Underground fittings

---

# Connection Assembly Modal

## Goal

Provide a single modal for building a complete connection assembly.

Supports:

- Route Hardware
- Conduit
- Wire

Each selected material stores its own quantity.

---

# JS Modules

## modalAssembly.js

Displays the selected connection assembly.

### Responsibilities

- Render assembly cards
- Display image
- Display Catalog Number
- Display Quantity
- Remove selected material
- Done / Apply button

---

## modalFilters.js

Controls the left-side filter panel.

### Responsibilities

- Build filter chips
- Update active filters

### Filters

- NodeType
- Size
- Type
- System

---

## modalLibrary.js

Displays the available material library.

### Responsibilities

- Display image
- Catalog Number
- Description
- Size / Type
- Favorite badge
- Click to select material

---

## modalSearch.js

Provides live search.

### Search Fields

- Catalog Number
- Description
- Type
- Size
- NodeType
- Vendor
- Code
- Color

Supports multiple keywords.

---

## modalLayout.js

Creates and manages floating modal windows.

### Responsibilities

- Open / Close modal
- Position windows
- Equipment Mode
- Material Mode
- Picker Mode

---

# Material Classification

## Equipment

```text
Placeable = true
```

Displayed in the Equipment Library.

Examples:

- Disconnect
- MSP
- Combiner
- Battery
- Inverter

---

## Assembly Material

```text
Placeable = false
```

Displayed in the Material Library.

Examples:

- Fittings
- Pipe
- Wire
- Connectors
- Couplings
- Hubs

---

# NodeType

Determines material behavior.

Examples:

```text
PIPE
WIRE
CONNECTOR
COUPLING
LB
LL
LR
LOCKNUT
HUB
T
```

`NodeType` determines behavior only.

Ownership is determined by `Placeable`.

---

# Quantity Rules

Default

```text
Qty = 1
```

PIPE

```text
Prompt user for quantity.
```

WIRE

```text
Prompt user for quantity.
```

Everything else

```text
Qty = 1
```

---

# Current Storage

Connection stores:

```javascript
currentConnection.hardware[]
```

Each object:

```javascript
{
    CatalogNumber,
    Description,
    Type,
    NodeType,
    qty
}
```

Quantity belongs to the selected material instance, not the master catalog.

---

# BOM Generation

## Connection BOM

```
generateBOM()

↓

getConnectionBOM()

↓

mergeMaterial()
```

Materials merge by:

```text
CatalogNumber
```

Quantities accumulate automatically.

---

## Equipment BOM (Planned)

```
Equipment

↓

Internal Hardware

↓

Equipment BOM
```

Example

```
Disconnect

Main Breaker
Fuse Holder
Fuse

Inverter

SPD
```

Equipment BOM will merge into the final Project BOM.

---

# Connection Modal Flow

```
Select Connection

↓

Open Material Modal

↓

Apply Filters

↓

Search

↓

Select Material

↓

PIPE / WIRE ?

↓

Prompt Quantity

↓

Store Material

↓

Refresh Assembly

↓

Generate BOM
```

---

# Routing Architecture (v0.10)

## Goal

Create production-quality orthogonal routing that:

- Connects directly to panel nodes
- Automatically avoids equipment
- Produces clean 90° conduit paths
- Minimizes unnecessary bends
- Supports future manual editing

---

# Routing Pipeline

```
Connection

↓

Connector Center

↓

Node Exit Point

↓

Nearest Free Grid Cell

↓

Obstacle Grid

↓

A* Pathfinder

↓

Grid Path

↓

Route Optimization

↓

Pixel Conversion

↓

SVG Renderer
```

---

# Routing Modules

## linkGeometry.js

Responsible for building the complete route.

### Responsibilities

- Read connector centers
- Compute node exit points
- Request A* route
- Convert grid path to pixels
- Optimize route
- Store geometry

### Public

```javascript
updateLinkGeometry()
createRoute()
getLinkPoints()
```

---

## linkNodeExit.js

Creates connector exit points.

### Responsibilities

- Determine connector side
- Offset connector outside equipment
- Find nearest routing cell

### Public

```javascript
getNodeExitPoint()
getNodeGridCell()
```

---

## linkObstacleGrid.js

Maintains the routing grid.

### Responsibilities

- Build routing grid
- Mark occupied cells
- Create clearance zones
- Pixel ↔ Grid conversion
- Cell cost lookup

### Grid Types

```text
GRID_EMPTY
GRID_BLOCKED
GRID_CLEARANCE
```

### Public

```javascript
refreshObstacleGrid()
getObstacleGrid()
pixelToGrid()
gridToPixel()
getCellCost()
```

---

## linkGridHelper.js

Routing utility functions.

### Responsibilities

- Find nearest free routing cell
- Spiral search
- Block checking

### Public

```javascript
findNearestFreeCell()
```

---

## linkPathfinder.js

A* routing engine.

### Responsibilities

- Orthogonal routing
- Manhattan heuristic
- Turn penalties
- Cost optimization
- Obstacle avoidance

### Current Features

- A*
- Priority Queue
- Turn Cost
- Cost Cache

### Future

- Clearance weighting
- Direction-aware heuristic

---

## linkRouteUtils.js

Route optimization.

### Pipeline

```
Grid Path

↓

Compress

↓

Remove Duplicate

↓

Remove Collinear

↓

Remove Tiny Doglegs

↓

Optimized Route
```

---

## linkRenderer.js

Responsible for SVG rendering.

### Responsibilities

- Draw SVG path
- Draw link node
- Draw delete button
- Future editing handles

---

## linkTransition.js *(Planned)*

Future intelligent connector transitions.

### Goals

- Better first turn
- Cleaner panel exits
- Smarter conduit appearance

---

# Current Routing Features

- ✅ Dynamic connection nodes
- ✅ Node exit points
- ✅ Nearest free routing cell
- ✅ Obstacle grid
- ✅ Clearance zones
- ✅ A* pathfinding
- ✅ Manhattan heuristic
- ✅ Turn penalties
- ✅ Route optimization
- ✅ SVG routing
- ✅ Link node rendering

---

# Current Status

## Completed

- ✅ Equipment placement
- ✅ Dynamic connection nodes
- ✅ Intelligent orthogonal routing
- ✅ Connection Assembly Modal
- ✅ Material Library
- ✅ Search
- ✅ Filter Chips
- ✅ Favorites
- ✅ Assembly Cards
- ✅ Pipe Quantity
- ✅ Wire Quantity
- ✅ Connection BOM Generation
- ✅ Pipe BOM
- ✅ Wire BOM
- ✅ Project Save / Load

---

## In Progress

Move internal hardware ownership from **Connection** to **Equipment**.

Items:

- Main Breakers
- Fuses
- Fuse Holders

---

# Planned Features

## Equipment Inspector

Internal hardware editor.

---

## Equipment Presets

Automatically populate:

- Breakers
- Fuses
- SPD
- Accessories

---

## Auto Fittings

Automatic fitting placement during routing.

---

## Route Length

Automatically calculate conduit length from routed geometry.

---

## Wire Fill

Support multiple conductors inside one conduit.

---

## Conduit Fill

NEC conduit fill validation.

---

## Shared Trunks

Merge parallel conduit runs.

---

## Manual Route Editing

- Drag corners
- Add bends
- Lock routes

---

## Production Features

- Bend counting
- Auto conduit sizing
- Wire sizing validation
- BOM PDF
- BOM CSV Export

---

# Design Decisions

- Equipment owns everything mounted inside an enclosure.
- Connections own only the physical route between equipment.
- `Placeable` determines which library displays a material.
- `NodeType` determines material behavior.
- Store quantity on the selected material instance.
- Aggregate BOM quantities during generation.
- Keep UI logic independent from business logic.
- Keep routing independent from rendering.
- Separate routing correctness from visual polish.
- Prefer data-driven behavior from the MML instead of hardcoded categories.

---

# Lessons Learned

- Keep each JS module focused on a single responsibility.
- Separate Equipment ownership from Connection ownership to maintain a clean architecture.
- A* provides a scalable foundation for future routing enhancements.
- The obstacle grid should define routing constraints while the renderer only visualizes geometry.
- Optimize routes after pathfinding rather than attempting to generate a perfect route in one pass.
- Aggregate BOM quantities during export instead of storing duplicate materials.
- Avoid hardcoded material categories; derive behavior from `Placeable`, `NodeType`, and MML metadata.
- Design new features around generic, data-driven systems so future materials and routing behaviors require minimal code changes.