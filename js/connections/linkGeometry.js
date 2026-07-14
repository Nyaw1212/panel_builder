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

function createRoute(start, end) {

    const points = [];

    const dx = Math.abs(end.x - start.x);
    const dy = Math.abs(end.y - start.y);

    //----------------------------------
    // Horizontal First
    //----------------------------------

    if (dx >= dy) {

        const midX =

            (start.x + end.x) / 2;

        points.push(start);

        points.push({

            x: midX,

            y: start.y

        });

        points.push({

            x: midX,

            y: end.y

        });

        points.push(end);

    }

    //----------------------------------
    // Vertical First
    //----------------------------------

    else {

        const midY =

            (start.y + end.y) / 2;

        points.push(start);

        points.push({

            x: start.x,

            y: midY

        });

        points.push({

            x: end.x,

            y: midY

        });

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