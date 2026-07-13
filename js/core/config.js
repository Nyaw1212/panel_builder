//----------------------------------
// Canvas Settings
//----------------------------------

const SETTINGS = {

    //----------------------------------
    // Initial Grid
    //----------------------------------

    rows: 12,

    columns: 16,

    //----------------------------------
    // Canvas
    //----------------------------------

    cellSize: 140,

    gap: 2,

    //----------------------------------
    // Auto Expand
    //----------------------------------

    autoExpand: true,

    expandBy: 4,

    margin: 2

};

//----------------------------------
// Grid Size
//----------------------------------

function getGridSize() {

    return SETTINGS.rows * SETTINGS.columns;

}

//----------------------------------
// Expand Grid
//----------------------------------

function expandGrid(requiredRow, requiredColumn) {

    if (!SETTINGS.autoExpand) return;

    while (requiredRow >= SETTINGS.rows - SETTINGS.margin) {

        SETTINGS.rows += SETTINGS.expandBy;

    }

    while (requiredColumn >= SETTINGS.columns - SETTINGS.margin) {

        SETTINGS.columns += SETTINGS.expandBy;

    }

}

//----------------------------------
// Expose
//----------------------------------

window.SETTINGS = SETTINGS;

window.getGridSize = getGridSize;

window.expandGrid = expandGrid;