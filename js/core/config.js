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
// Default Port Layout
//----------------------------------

const DEFAULT_CONNECTIONS = {

    top: 2,

    right: 2,

    bottom: 2,

    left: 2

};

//----------------------------------
// Expose
//----------------------------------

window.SETTINGS = SETTINGS;

window.getGridSize = getGridSize;

window.expandGrid = expandGrid;

window.DEFAULT_CONNECTIONS = DEFAULT_CONNECTIONS;