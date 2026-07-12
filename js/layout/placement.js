//----------------------------------
// Create Placed Item
//----------------------------------

function createPlacedItem(
    item,
    startCell,
    preset = ""
) {

    console.log("Creating Item");
    console.log("Catalog:", item.CatalogNumber);
    console.log("Preset:", preset);

    const placedItem = {

        //----------------------------------
        // Identity
        //----------------------------------

        id: crypto.randomUUID(),

        //----------------------------------
        // Equipment
        //----------------------------------

        data: item,

        preset: "",

        materials: [],

        rotation: 0,

        //----------------------------------
        // Layout
        //----------------------------------

        startCell,

        width: item.GridWidth,

        height: item.GridHeight,

        occupied: [],

        //----------------------------------
        // Connections
        //----------------------------------

        connections: createDefaultConnections()

    };

    //----------------------------------
    // Apply Preset
    //----------------------------------

    console.log("Before replacePreset", placedItem);

    replacePreset(
        placedItem,
        preset
    );

    console.log("After replacePreset", placedItem);

    //----------------------------------
    // Occupied Cells
    //----------------------------------

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

function canPlace(
    item,
    startCell
) {

    console.group("canPlace");

    console.log("Catalog:", item.CatalogNumber);
    console.log("Start Cell:", startCell);
    console.log("Width:", item.GridWidth);
    console.log("Height:", item.GridHeight);

    const layout = getLayout();

    for (let r = 0; r < item.GridHeight; r++) {

        for (let c = 0; c < item.GridWidth; c++) {

            const row =
                Math.floor(startCell / SETTINGS.columns) + r;

            const col =
                (startCell % SETTINGS.columns) + c;

            const index =
                row * SETTINGS.columns + col;

            console.log({
                r,
                c,
                row,
                col,
                index,
                occupied: Boolean(layout[index])
            });

            if (row >= SETTINGS.rows) {

                console.warn("FAILED: Outside Rows");

                console.groupEnd();

                return false;

            }

            if (col >= SETTINGS.columns) {

                console.warn("FAILED: Outside Columns");

                console.groupEnd();

                return false;

            }

            if (layout[index]) {

                console.warn("FAILED: Cell Occupied");

                console.log(layout[index]);

                console.groupEnd();

                return false;

            }

        }

    }

    console.log("PASSED");

    console.groupEnd();

    return true;

}

//----------------------------------
// Place Item
//----------------------------------

function placeItem(
    item,
    startCell,
    preset = ""
) {

    console.group("placeItem");

    console.log("Cell:", startCell);
    console.log("Preset:", preset);

    if (!canPlace(item, startCell)) {

        console.warn("Cannot place equipment.");

        console.groupEnd();

        alert("Cannot place equipment here.");

        return null;

    }

    const placedItem = createPlacedItem(

        item,

        startCell,

        preset

    );

    const layout = getLayout();

    placedItem.occupied.forEach(index => {

        layout[index] = placedItem;

    });

    console.log("Placed Item");

    console.log(placedItem);

    console.groupEnd();

    return placedItem;

}

//----------------------------------
// Remove Item
//----------------------------------

function removeItem(index) {

    const layout = getLayout();

    const item = layout[index];

    if (!item) {

        return;

    }

    //----------------------------------
    // Remove Links
    //----------------------------------

    CONNECTION_SIDES.forEach(side => {

        item.connections[side].forEach(connection => {

            connection.links

                .slice()

                .forEach(link => {

                    removeLink(link.id);

                });

        });

    });

    //----------------------------------
    // Clear Cells
    //----------------------------------

    item.occupied.forEach(cell => {

        layout[cell] = null;

    });

}

//----------------------------------
// Expose
//----------------------------------

window.createPlacedItem = createPlacedItem;
window.canPlace = canPlace;
window.placeItem = placeItem;
window.removeItem = removeItem;