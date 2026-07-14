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

    console.log(

        "Grid Path",

        cells

    );

    //----------------------------------
    // No Route
    //----------------------------------

    if (!cells.length) {

        console.warn(

            "NO PATH FOUND"

        );

        console.groupEnd();

        return [

            start,

            end

        ];

    }

    //----------------------------------
    // Compress Grid Path
    //----------------------------------

    const simplified = compressGridPath(

        cells

    );

    console.log(

        "Simplified Path",

        simplified

    );

    //----------------------------------
    // Grid -> Pixels
    //----------------------------------

    const points = [

        start

    ];

    for (const cell of simplified) {

        points.push(

            gridToPixel(cell)

        );

    }

    points.push(

        end

    );

    //----------------------------------
    // Remove Duplicate Points
    //----------------------------------

    const cleaned = [];

    for (const point of points) {

        const last = cleaned[

            cleaned.length - 1

        ];

        if (

            !last ||

            last.x !== point.x ||

            last.y !== point.y

        ) {

            cleaned.push(point);

        }

    }

    console.log(

        "Pixel Route",

        cleaned

    );

    console.groupEnd();

    return optimizePixelRoute(cleaned);

}
//----------------------------------
// Compress Grid Path
//----------------------------------

function compressGridPath(cells) {

    //----------------------------------
    // Nothing to Compress
    //----------------------------------

    if (cells.length <= 2) {

        return cells;

    }

    const result = [

        cells[0]

    ];

    let lastDX = null;
    let lastDY = null;

    //----------------------------------
    // Remove Straight-Line Points
    //----------------------------------

    for (let i = 1; i < cells.length; i++) {

        const dx =

            cells[i].x -

            cells[i - 1].x;

        const dy =

            cells[i].y -

            cells[i - 1].y;

        if (

            lastDX !== null &&

            (dx !== lastDX || dy !== lastDY)

        ) {

            result.push(

                cells[i - 1]

            );

        }

        lastDX = dx;
        lastDY = dy;

    }

    //----------------------------------
    // Keep Last Point
    //----------------------------------

    result.push(

        cells[cells.length - 1]

    );

    return result;

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
window.compressGridPath = compressGridPath;