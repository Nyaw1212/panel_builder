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

    const start = getNodeExitPoint(

        link.start.panelId,
        link.start.connectionId

    );

    const end = getNodeExitPoint(

        link.end.panelId,
        link.end.connectionId

    );

    if (!start || !end) {

        clearLinkGeometry(link);

        return;

    }

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

            start,
            end

        ];

    }

    //----------------------------------
    // Debug
    //----------------------------------

    console.group("Pathfinding");

    console.log("Start Pixel", start);
    console.log("End Pixel", end);

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

            start,
            end

        ];

    }

    //----------------------------------
    // Compress
    //----------------------------------

    const simplified = compressGridPath(

        cells

    );

    console.log(

        "Simplified Path",

        simplified

    );

    //----------------------------------
    // Convert To Pixels
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