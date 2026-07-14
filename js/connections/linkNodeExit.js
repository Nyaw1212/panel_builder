//----------------------------------
// Link Node Exit
//----------------------------------

//----------------------------------
// Exit Distance
//----------------------------------

const NODE_EXIT_DISTANCE = SETTINGS.cellSize;

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
    // Long Exit Segment
    //----------------------------------

    switch (node.dataset.side) {

        case "left":

            point.x -= NODE_EXIT_DISTANCE;
            break;

        case "right":

            point.x += NODE_EXIT_DISTANCE;
            break;

        case "top":

            point.y -= NODE_EXIT_DISTANCE;
            break;

        case "bottom":

            point.y += NODE_EXIT_DISTANCE;
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

    const cell = pixelToGrid(

        exit

    );

    return findNearestFreeCell(

        cell

    );

}

//----------------------------------
// Get Exit Direction
//----------------------------------

function getNodeExitDirection(

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

    switch (node.dataset.side) {

        case "left":

            return {

                x: -1,
                y: 0

            };

        case "right":

            return {

                x: 1,
                y: 0

            };

        case "top":

            return {

                x: 0,
                y: -1

            };

        case "bottom":

            return {

                x: 0,
                y: 1

            };

    }

    return null;

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

    const dir = getNodeExitDirection(

        panelId,
        connectionId

    );

    console.group("Node Exit");

    console.log("Exit Pixel", exit);
    console.log("Grid Cell", cell);
    console.log("Direction", dir);

    console.groupEnd();

}

//----------------------------------
// Expose
//----------------------------------

window.getNodeExitPoint = getNodeExitPoint;
window.getNodeGridCell = getNodeGridCell;
window.getNodeExitDirection = getNodeExitDirection;
window.debugNodeExit = debugNodeExit;