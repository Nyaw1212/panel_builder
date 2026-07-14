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