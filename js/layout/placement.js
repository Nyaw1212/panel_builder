//----------------------------------
// History Helper
//----------------------------------

function capturePlacementHistory(
    label
) {

    if (
        !window.HistoryManagerV2 ||
        typeof window
            .HistoryManagerV2
            .capture !==
            "function"
    ) {
        return false;
    }

    return window
        .HistoryManagerV2
        .capture(
            label
        );

}

//----------------------------------
// Create Placed Item
//----------------------------------

function createPlacedItem(
    item,
    startCell,
    preset = ""
) {

    console.log("Creating Item");
    console.log(
        "Catalog:",
        item.CatalogNumber
    );
    console.log(
        "Preset:",
        preset
    );

    const placedItem = {

        //----------------------------------
        // Identity
        //----------------------------------

        id:
            crypto.randomUUID(),

        //----------------------------------
        // Equipment
        //----------------------------------

        data:
            item,

        preset:
            "",

        materials:
            [],

        rotation:
            0,

        //----------------------------------
        // Layout
        //----------------------------------

        startCell,

        width:
            item.GridWidth,

        height:
            item.GridHeight,

        occupied:
            [],

        //----------------------------------
        // Connections
        //----------------------------------

        connections:
            createDefaultConnections()

    };

    //----------------------------------
    // Apply Preset
    //----------------------------------

    replacePreset(
        placedItem,
        preset
    );

    //----------------------------------
    // Occupied Cells
    //----------------------------------

    updateOccupiedCells(
        placedItem
    );

    //----------------------------------
    // Default Ports
    //----------------------------------

    CONNECTION_SIDES.forEach(
        side => {

            const count =
                Number(
                    placedItem
                        .data[side]
                ) || 0;

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
// Update Occupied Cells
//----------------------------------

function updateOccupiedCells(
    item
) {

    item.occupied = [];

    for (
        let r = 0;
        r < item.height;
        r++
    ) {

        for (
            let c = 0;
            c < item.width;
            c++
        ) {

            item.occupied.push(

                item.startCell +

                r *
                SETTINGS.columns +

                c

            );

        }

    }

}

//----------------------------------
// Can Place
//----------------------------------

function canPlace(
    item,
    startCell,
    ignoreItem = null
) {

    const layout =
        getLayout();

    for (
        let r = 0;
        r < item.GridHeight;
        r++
    ) {

        for (
            let c = 0;
            c < item.GridWidth;
            c++
        ) {

            const row =
                Math.floor(
                    startCell /
                    SETTINGS.columns
                ) + r;

            const col =
                (
                    startCell %
                    SETTINGS.columns
                ) + c;

            if (
                row >=
                    SETTINGS.rows ||
                col >=
                    SETTINGS.columns
            ) {

                return false;

            }

            const index =
                row *
                    SETTINGS.columns +
                col;

            const existing =
                layout[index];

            if (
                existing &&
                existing !==
                    ignoreItem
            ) {

                return false;

            }

        }

    }

    return true;

}

//----------------------------------
// Place Item
//----------------------------------

function placeItem(
    item,
    startCell,
    preset = "",
    options = {}
) {

    if (
        !canPlace(
            item,
            startCell
        )
    ) {

        alert(
            "Cannot place equipment here."
        );

        return null;

    }

    const placedItem =
        createPlacedItem(
            item,
            startCell,
            preset
        );

    const layout =
        getLayout();

    placedItem
        .occupied
        .forEach(
            index => {

                layout[index] =
                    placedItem;

            }
        );

    //----------------------------------
    // Capture Placement
    //----------------------------------

    if (
        options.captureHistory !==
        false
    ) {

        capturePlacementHistory(
            preset
                ? "Preset placed"
                : "Equipment placed"
        );

    }

    return placedItem;

}

//----------------------------------
// Move Item
//----------------------------------

function moveItem(
    item,
    newStartCell,
    options = {}
) {

    const layout =
        getLayout();

    const oldStartCell =
        item.startCell;

    //----------------------------------
    // No Position Change
    //----------------------------------

    if (
        oldStartCell ===
        newStartCell
    ) {

        return true;

    }

    //----------------------------------
    // Clear Current Cells
    //----------------------------------

    item.occupied.forEach(
        index => {

            layout[index] =
                null;

        }
    );

    //----------------------------------
    // Check New Position
    //----------------------------------

    if (
        !canPlace(
            item.data,
            newStartCell,
            item
        )
    ) {

        item.occupied.forEach(
            index => {

                layout[index] =
                    item;

            }
        );

        return false;

    }

    //----------------------------------
    // Update
    //----------------------------------

    item.startCell =
        newStartCell;

    updateOccupiedCells(
        item
    );

    //----------------------------------
    // Fill Layout
    //----------------------------------

    item.occupied.forEach(
        index => {

            layout[index] =
                item;

        }
    );

    //----------------------------------
    // Optional Direct Capture
    //----------------------------------

    /*
     * Drag operations should normally use:
     *
     * HistoryManagerV2.beginTransaction()
     * HistoryManagerV2.endTransaction()
     *
     * Therefore move history is OFF by default
     * to avoid creating one snapshot per mousemove.
     *
     * For a one-step move, call:
     *
     * moveItem(item, newCell, {
     *     captureHistory: true
     * });
     */

    if (
        options.captureHistory ===
        true
    ) {

        capturePlacementHistory(
            options.historyLabel ||
            "Equipment moved"
        );

    }

    return true;

}

//----------------------------------
// Remove Item
//----------------------------------

function removeItem(
    index,
    options = {}
) {

    const layout =
        getLayout();

    const item =
        layout[index];

    if (!item) {

        return null;

    }

    //----------------------------------
    // Remove Links
    //----------------------------------

    CONNECTION_SIDES.forEach(
        side => {

            const sideConnections =
                item.connections?.[side] ||
                [];

            sideConnections.forEach(
                connection => {

                    const links =
                        connection.links ||
                        [];

                    links
                        .slice()
                        .forEach(
                            link => {

                                removeLink(
                                    link.id
                                );

                            }
                        );

                }
            );

        }
    );

    //----------------------------------
    // Clear Cells
    //----------------------------------

    item.occupied.forEach(
        cell => {

            layout[cell] =
                null;

        }
    );

    //----------------------------------
    // Capture Removal
    //----------------------------------

    if (
        options.captureHistory !==
        false
    ) {

        capturePlacementHistory(
            options.historyLabel ||
            "Equipment removed"
        );

    }

    return item;

}

//----------------------------------
// Expose
//----------------------------------

window.capturePlacementHistory =
    capturePlacementHistory;

window.createPlacedItem =
    createPlacedItem;

window.updateOccupiedCells =
    updateOccupiedCells;

window.canPlace =
    canPlace;

window.placeItem =
    placeItem;

window.moveItem =
    moveItem;

window.removeItem =
    removeItem;