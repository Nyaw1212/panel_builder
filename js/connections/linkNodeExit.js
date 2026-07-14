//----------------------------------
// Link Node Exit
//----------------------------------

//----------------------------------
// Get Node Exit Point
//----------------------------------

function getNodeExitPoint(

    panelId,
    connectionId

) {

    const node = getRegisteredConnectionNode(

        panelId,
        connectionId

    );

    if (!node) {

        return null;

    }

    const point = getConnectionCenter(

        panelId,
        connectionId

    );

    if (!point) {

        return null;

    }

    //----------------------------------
    // Exit Offset
    //----------------------------------

    const OFFSET = 24;

    switch (node.dataset.side) {

        case "left":

            point.x -= OFFSET;
            break;

        case "right":

            point.x += OFFSET;
            break;

        case "top":

            point.y -= OFFSET;
            break;

        case "bottom":

            point.y += OFFSET;
            break;

    }

    return point;

}

//----------------------------------
// Get Node Grid Cell
//----------------------------------

function getNodeGridCell(

    panelId,
    connectionId

) {

    const exit = getNodeExitPoint(

        panelId,
        connectionId

    );

    if (!exit) {

        return null;

    }

    const cell = pixelToGrid(exit);

    return findNearestFreeCell(cell);

}

//----------------------------------
// Debug
//----------------------------------

function debugNodeExit(

    panelId,
    connectionId

) {

    const exit = getNodeExitPoint(

        panelId,
        connectionId

    );

    const cell = getNodeGridCell(

        panelId,
        connectionId

    );

    console.group("Node Exit");

    console.log("Exit Pixel", exit);
    console.log("Grid Cell", cell);

    console.groupEnd();

}

//----------------------------------
// Expose
//----------------------------------

window.getNodeExitPoint = getNodeExitPoint;
window.getNodeGridCell = getNodeGridCell;
window.debugNodeExit = debugNodeExit;