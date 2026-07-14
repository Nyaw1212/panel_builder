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

    const points = [];

    //----------------------------------
    // Get Connection Sides
    //----------------------------------

    const startNode = getRegisteredConnectionNode(

        link.start.panelId,
        link.start.connectionId

    );

    const endNode = getRegisteredConnectionNode(

        link.end.panelId,
        link.end.connectionId

    );

    const startSide = startNode?.dataset.side;
    const endSide = endNode?.dataset.side;

    //----------------------------------
    // Exit Distance
    //----------------------------------

    const EXIT = SETTINGS.cellSize * 0.45;

    const p1 = { ...start };
    const p2 = { ...end };

    //----------------------------------
    // Leave Start
    //----------------------------------

    switch (startSide) {

        case "left":
            p1.x -= EXIT;
            break;

        case "right":
            p1.x += EXIT;
            break;

        case "top":
            p1.y -= EXIT;
            break;

        case "bottom":
            p1.y += EXIT;
            break;

    }

    //----------------------------------
    // Enter End
    //----------------------------------

    switch (endSide) {

        case "left":
            p2.x -= EXIT;
            break;

        case "right":
            p2.x += EXIT;
            break;

        case "top":
            p2.y -= EXIT;
            break;

        case "bottom":
            p2.y += EXIT;
            break;

    }

    //----------------------------------
    // Horizontal vs Vertical
    //----------------------------------

    if (Math.abs(p2.x - p1.x) >= Math.abs(p2.y - p1.y)) {

        const midX = (p1.x + p2.x) / 2;

        points.push(start);

        points.push(p1);

        points.push({

            x: midX,
            y: p1.y

        });

        points.push({

            x: midX,
            y: p2.y

        });

        points.push(p2);

        points.push(end);

    }

    else {

        const midY = (p1.y + p2.y) / 2;

        points.push(start);

        points.push(p1);

        points.push({

            x: p1.x,
            y: midY

        });

        points.push({

            x: p2.x,
            y: midY

        });

        points.push(p2);

        points.push(end);

    }

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