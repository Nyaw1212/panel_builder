//----------------------------------
// Canvas Settings
//----------------------------------

const SETTINGS = {

    rows: 5,

    columns: 10,

    cellSize: 140,

    gap: 12

};

//----------------------------------
// Grid
//----------------------------------

const GRID_SIZE =

    SETTINGS.rows * SETTINGS.columns;

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

window.GRID_SIZE = GRID_SIZE;

window.DEFAULT_CONNECTIONS = DEFAULT_CONNECTIONS;