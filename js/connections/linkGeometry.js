//----------------------------------
// Link Geometry
//----------------------------------

function initializeLinkGeometry(link) {

    if (!link.geometry) {

        link.geometry = {

            type: "line",

            points: []

        };

    }

    return link.geometry;

}

//----------------------------------
// Update Geometry
//----------------------------------

function updateLinkGeometry(link) {

    if (!link) return;

    const start = getConnectionExitPoint(

        link.start.panelId,
        link.start.connectionId

    );

    const end = getConnectionExitPoint(

        link.end.panelId,
        link.end.connectionId

    );

    if (!start || !end) {

        clearLinkGeometry(link);

        return;

    }

    //----------------------------------
    // Build Route
    //----------------------------------

    const route = createRoute(

    link,
    start,
    end

);

    setLinkGeometry(

        link,

        route

    );

}

//----------------------------------
// Create Route
//----------------------------------

function createRoute(link, start, end) {

    //----------------------------------
    // Pixel -> Grid
    //----------------------------------

    let startCell = pixelToGrid(start);
    let endCell = pixelToGrid(end);

    //----------------------------------
    // Move Outside Equipment
    //----------------------------------

    startCell = findNearestFreeCell(startCell);
    endCell = findNearestFreeCell(endCell);

    //----------------------------------
    // Debug
    //----------------------------------

    console.group("Pathfinding");

    console.log("Start Pixel", start);
    console.log("End Pixel", end);

    console.log("Start Cell", startCell);
    console.log("End Cell", endCell);

    if (typeof debugGridCell === "function") {

        debugGridCell(start);
        debugGridCell(end);

    }

    //----------------------------------
    // Find Path
    //----------------------------------

    const cells = findPath(

        startCell,

        endCell

    );

    console.log("Grid Path", cells);

    //----------------------------------
    // No Route
    //----------------------------------

    if (!cells.length) {

        console.warn("NO PATH FOUND");

        console.groupEnd();

        return [

            start,

            end

        ];

    }

    //----------------------------------
    // Grid -> Pixels
    //----------------------------------

    const points = [

        start

    ];

    for (const cell of cells) {

        points.push(

            gridToPixel(cell)

        );

    }

    points.push(

        end

    );

    console.log("Pixel Route", points);

    console.groupEnd();

    return points;

}


//----------------------------------
// Set Geometry
//----------------------------------

function setLinkGeometry(link, points) {

    const geometry = initializeLinkGeometry(link);

    geometry.points = Array.isArray(points)

        ? [...points]

        : [];

}

//----------------------------------
// Get Geometry
//----------------------------------

function getLinkGeometry(link) {

    return initializeLinkGeometry(link);

}

//----------------------------------
// Get Points
//----------------------------------

function getLinkPoints(link) {

    return initializeLinkGeometry(link).points;

}

//----------------------------------
// Get Connection Exit Point
//----------------------------------

function getConnectionExitPoint(
    panelId,
    connectionId
) {

    const node = getRegisteredConnectionNode(

        panelId,
        connectionId

    );

    if (!node) return null;

    const point = getConnectionCenter(

        panelId,
        connectionId

    );

    if (!point) return null;

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
// Clear Geometry
//----------------------------------

function clearLinkGeometry(link) {

    initializeLinkGeometry(link).points = [];

}

//----------------------------------
// Expose
//----------------------------------

window.createRoute = createRoute;
window.getConnectionExitPoint = getConnectionExitPoint;
window.initializeLinkGeometry = initializeLinkGeometry;
window.updateLinkGeometry = updateLinkGeometry;
window.setLinkGeometry = setLinkGeometry;
window.getLinkGeometry = getLinkGeometry;
window.getLinkPoints = getLinkPoints;
window.clearLinkGeometry = clearLinkGeometry;