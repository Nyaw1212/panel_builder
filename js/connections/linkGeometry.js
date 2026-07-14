//----------------------------------
// Link Geometry
//----------------------------------

//----------------------------------
// Initialize Geometry
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

    //----------------------------------
    // Connector Centers
    //----------------------------------

    const startCenter = getConnectionCenter(

        link.start.panelId,
        link.start.connectionId

    );

    const endCenter = getConnectionCenter(

        link.end.panelId,
        link.end.connectionId

    );

    //----------------------------------
    // Exit Points
    //----------------------------------

    const startExit = getNodeExitPoint(

        link.start.panelId,
        link.start.connectionId

    );

    const endExit = getNodeExitPoint(

        link.end.panelId,
        link.end.connectionId

    );

    if (

        !startCenter ||
        !endCenter ||
        !startExit ||
        !endExit

    ) {

        clearLinkGeometry(link);

        return;

    }

    //----------------------------------
    // Build Route
    //----------------------------------

    const route = createRoute(

        link,
        startCenter,
        startExit,
        endExit,
        endCenter

    );

    setLinkGeometry(

        link,
        route

    );

}

//----------------------------------
// Create Route
//----------------------------------

function createRoute(

    link,
    startCenter,
    startExit,
    endExit,
    endCenter

) {

    //----------------------------------
    // Get Grid Cells
    //----------------------------------

    const startCell = getNodeGridCell(

        link.start.panelId,
        link.start.connectionId

    );

    const endCell = getNodeGridCell(

        link.end.panelId,
        link.end.connectionId

    );

    if (!startCell || !endCell) {

        return [

            startCenter,
            endCenter

        ];

    }

    //----------------------------------
    // Debug
    //----------------------------------

    console.group("Pathfinding");

    console.log("Start Center", startCenter);
    console.log("Start Exit", startExit);

    console.log("End Exit", endExit);
    console.log("End Center", endCenter);

    console.log("Start Cell", startCell);
    console.log("End Cell", endCell);

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

        console.warn("NO PATH FOUND");

        console.groupEnd();

        return [

            startCenter,
            startExit,
            endExit,
            endCenter

        ];

    }

        //----------------------------------
    // Compress
    //----------------------------------

    const simplified = compressGridPath(

        cells

    );

    //----------------------------------
    // Remove Start / End Cells
    //----------------------------------

    if (simplified.length > 2) {

        simplified.shift();

        simplified.pop();

    }

    console.log(

        "Simplified Path",

        simplified

    );

    //----------------------------------
    // Build Pixel Route
    //----------------------------------

    const points = [

        startCenter,
        startExit

    ];

    for (const cell of simplified) {

        points.push(

            gridToPixel(cell)

        );

    }

    points.push(

        endExit,
        endCenter

    );

    //----------------------------------
    // Optimize
    //----------------------------------

    const optimized = optimizePixelRoute(

        points

    );

    console.log(

        "Pixel Route",

        optimized

    );

    console.groupEnd();

    return optimized;

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
// Clear Geometry
//----------------------------------

function clearLinkGeometry(link) {

    initializeLinkGeometry(link).points = [];

}

//----------------------------------
// Expose
//----------------------------------

window.initializeLinkGeometry = initializeLinkGeometry;
window.updateLinkGeometry = updateLinkGeometry;
window.createRoute = createRoute;
window.setLinkGeometry = setLinkGeometry;
window.getLinkGeometry = getLinkGeometry;
window.getLinkPoints = getLinkPoints;
window.clearLinkGeometry = clearLinkGeometry;