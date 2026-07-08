//----------------------------------
// Layout Engine
//----------------------------------

function createPlacedItem(item, startCell) {

    const placedItem = {

        id: crypto.randomUUID(),

        data: item,

        startCell: startCell,

        width: item.GridWidth,

        height: item.GridHeight,

        occupied: [],

        connections: createDefaultConnections()

    };

    for (let r = 0; r < item.GridHeight; r++) {

        for (let c = 0; c < item.GridWidth; c++) {

            const index =
                startCell +
                (r * SETTINGS.columns) +
                c;

            placedItem.occupied.push(index);

        }

    }

//----------------------------------
// Default Ports
//----------------------------------

Object.entries(DEFAULT_CONNECTIONS).forEach(
    ([side, count]) => {

        setConnectionCount(
            placedItem,
            side,
            count
        );

    }
);

    return placedItem;

}

//----------------------------------
// Can Place
//----------------------------------

function canPlace(item, startCell) {

    for (let r = 0; r < item.GridHeight; r++) {

        for (let c = 0; c < item.GridWidth; c++) {

            const row = Math.floor(startCell / SETTINGS.columns) + r;
            const col = (startCell % SETTINGS.columns) + c;

            if (row >= SETTINGS.rows) return false;
            if (col >= SETTINGS.columns) return false;

            const index = row * SETTINGS.columns + col;

            if (layout[index]) {

                return false;

            }

        }

    }

    return true;

}

//----------------------------------
// Place Item
//----------------------------------

function placeItem(item, startCell) {

    if (!canPlace(item, startCell)) {

        alert("Cannot place equipment here.");

        return null;

    }

    const placedItem = createPlacedItem(item, startCell);

    // Store the same object reference in every occupied cell
    placedItem.occupied.forEach(index => {

        layout[index] = placedItem;

    });

    return placedItem;

}

//----------------------------------
// Remove Item
//----------------------------------

function removeItem(index) {

    const item = layout[index];

    if (!item) return;

    item.occupied.forEach(cell => {

        layout[cell] = null;

    });

}

//----------------------------------
// Get Item
//----------------------------------

function getItem(index) {

    return layout[index];

}
//----------------------------------
// Get Item By ID
//----------------------------------

function getItemById(id) {

    for (const item of layout) {

        if (!item) continue;

        if (item.id === id) {

            return item;

        }

    }

    return null;

}