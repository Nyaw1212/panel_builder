//----------------------------------
// Link Obstacle Grid
//----------------------------------

const GRID_EMPTY = 0;
const GRID_BLOCKED = 1;

//----------------------------------
// Build Grid
//----------------------------------

function buildObstacleGrid() {

    //----------------------------------
    // Grid Size
    //----------------------------------

    const rows = SETTINGS.rows;
    const cols = SETTINGS.columns;

    //----------------------------------
    // Create Empty Grid
    //----------------------------------

    const grid = [];

    for (let y = 0; y < rows; y++) {

        grid[y] = [];

        for (let x = 0; x < cols; x++) {

            grid[y][x] = GRID_EMPTY;

        }

    }

    //----------------------------------
    // Mark Equipment
    //----------------------------------

    getLayout().forEach(item => {

        if (!item) return;

        //----------------------------------
        // Cell Position
        //----------------------------------

        const startCol =

            item.startCell %

            SETTINGS.columns;

        const startRow =

            Math.floor(

                item.startCell /

                SETTINGS.columns

            );

        //----------------------------------
        // Occupied Cells
        //----------------------------------

        for (

            let y = 0;

            y < item.height;

            y++

        ) {

            for (

                let x = 0;

                x < item.width;

                x++

            ) {

                const gx = startCol + x;
                const gy = startRow + y;

                if (

                    gx < 0 ||

                    gy < 0 ||

                    gx >= cols ||

                    gy >= rows

                ) {

                    continue;

                }

                grid[gy][gx] = GRID_BLOCKED;

            }

        }

    });

    return grid;

}

//----------------------------------
// Cache
//----------------------------------

let obstacleGrid = [];

//----------------------------------
// Refresh
//----------------------------------

function refreshObstacleGrid() {

    obstacleGrid =

        buildObstacleGrid();

}

//----------------------------------
// Getter
//----------------------------------

function getObstacleGrid() {

    return obstacleGrid;

}

//----------------------------------
// Cell Blocked
//----------------------------------

function isBlocked(x, y) {

    if (

        y < 0 ||

        x < 0 ||

        y >= obstacleGrid.length ||

        x >= obstacleGrid[0].length

    ) {

        return true;

    }

    return (

        obstacleGrid[y][x] ===

        GRID_BLOCKED

    );

}

//----------------------------------
// Pixel -> Grid
//----------------------------------

function pixelToGrid(point) {

    return {

        x: Math.floor(

            point.x /

            SETTINGS.cellSize

        ),

        y: Math.floor(

            point.y /

            SETTINGS.cellSize

        )

    };

}

//----------------------------------
// Grid -> Pixel
//----------------------------------

function gridToPixel(cell) {

    return {

        x:

            cell.x *

            SETTINGS.cellSize +

            SETTINGS.cellSize / 2,

        y:

            cell.y *

            SETTINGS.cellSize +

            SETTINGS.cellSize / 2

    };

}

//----------------------------------
// Debug
//----------------------------------

function printObstacleGrid() {

    console.table(

        obstacleGrid

    );

}
//----------------------------------
// Debug Grid
//----------------------------------

function debugObstacleGrid() {

    console.group("Obstacle Grid");

    console.table(obstacleGrid);

    console.groupEnd();

}

//----------------------------------
// Debug Cell
//----------------------------------

function debugGridCell(point) {

    const cell = pixelToGrid(point);

    console.log(

        "Pixel",

        point,

        "->",

        cell,

        "Blocked:",

        isBlocked(cell.x, cell.y)

    );

}
//----------------------------------
// Expose
//----------------------------------

window.buildObstacleGrid = buildObstacleGrid;
window.refreshObstacleGrid = refreshObstacleGrid;
window.getObstacleGrid = getObstacleGrid;

window.pixelToGrid = pixelToGrid;
window.gridToPixel = gridToPixel;

window.isBlocked = isBlocked;
window.printObstacleGrid = printObstacleGrid;
window.debugObstacleGrid = debugObstacleGrid;
window.debugGridCell = debugGridCell;