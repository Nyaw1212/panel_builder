//----------------------------------
// Connection Position
//----------------------------------

const KNOCKOUT_SPACING = 70;
const KNOCKOUT_INSET = 12;
const KNOCKOUT_SIZE = 18;

//----------------------------------
// Knockout Positions
//----------------------------------

function getKnockoutPositions(item, side) {

    const positions = [];

    const count = item.connections[side].length;

    if (count === 0) {

        return positions;

    }

    for (let i = 1; i <= count; i++) {

        positions.push(

            i / (count + 1)

        );

    }

    return positions;

}

//----------------------------------
// Node Position
//----------------------------------

function getNodePosition(item, side, offset) {

    const width =
        item.width *
        (SETTINGS.cellSize + SETTINGS.gap) -
        SETTINGS.gap;

    const height =
        item.height *
        (SETTINGS.cellSize + SETTINGS.gap) -
        SETTINGS.gap;

    switch (side) {

        case "top":

            return {

                x: width * offset - (KNOCKOUT_SIZE / 2),

                y: 6

            };

        case "bottom":

            return {

                x: width * offset - (KNOCKOUT_SIZE / 2),

                y: height - KNOCKOUT_SIZE - 6

            };

        case "left":

            return {

                x: 6,

                y: height * offset - (KNOCKOUT_SIZE / 2)

            };

        case "right":

            return {

                x: width - KNOCKOUT_SIZE - 6,

                y: height * offset - (KNOCKOUT_SIZE / 2)

            };

    }

    return {

        x: 0,

        y: 0

    };

}

//----------------------------------
// Connection Center
//----------------------------------

function getConnectionCenter(
    panelId,
    connectionId
) {

    const connection =
        getRegisteredConnectionNode(

            panelId,

            connectionId

        );

    if (!connection) return null;

    const rect =
        connection.getBoundingClientRect();

    const clientCenter = {

        x:
            rect.left +
            (rect.width / 2),

        y:
            rect.top +
            (rect.height / 2)

    };

    //----------------------------------
    // Convert the connector's browser
    // coordinates into the exact SVG
    // coordinate system used by links.
    //----------------------------------

    const svg =
        document.getElementById(
            "svgLayer"
        );

    const matrix =
        svg?.getScreenCTM?.();

    if (
        svg &&
        matrix
    ) {

        const point =
            svg.createSVGPoint();

        point.x =
            clientCenter.x;

        point.y =
            clientCenter.y;

        const transformed =
            point.matrixTransform(
                matrix.inverse()
            );

        return {

            x:
                transformed.x,

            y:
                transformed.y

        };

    }

    //----------------------------------
    // Fallback when SVG CTM is not
    // available.
    //----------------------------------

    const canvas =
        document.getElementById(
            "canvasContainer"
        );

    const canvasRect =
        canvas?.getBoundingClientRect() ??
        {
            left: 0,
            top: 0
        };

    return {

        x:
            clientCenter.x -
            canvasRect.left,

        y:
            clientCenter.y -
            canvasRect.top

    };

}

//----------------------------------
// Connection Exit Point
//----------------------------------

function getConnectionExitPoint(
    panelId,
    connectionId
) {

    const node =
        getRegisteredConnectionNode(

            panelId,

            connectionId

        );

    if (!node) return null;

    const point =
        getConnectionCenter(

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
// Expose
//----------------------------------

window.getKnockoutPositions = getKnockoutPositions;
window.getNodePosition = getNodePosition;
window.getConnectionCenter = getConnectionCenter;
window.getConnectionExitPoint = getConnectionExitPoint;