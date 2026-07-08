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

    let length;

    if (side === "top" || side === "bottom") {

        length =
            item.width *
            SETTINGS.cellSize;

    }
    else {

        length =
            item.height *
            SETTINGS.cellSize;

    }

    const count = Math.max(
        1,
        Math.floor(length / KNOCKOUT_SPACING)
    );

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

    const gridRect =
        grid.getBoundingClientRect();

    const rect =
        connection.getBoundingClientRect();

    return {

        x:
            rect.left -
            gridRect.left +
            (rect.width / 2),

        y:
            rect.top -
            gridRect.top +
            (rect.height / 2)

    };

}

//----------------------------------
// Expose
//----------------------------------

window.getKnockoutPositions = getKnockoutPositions;
window.getNodePosition = getNodePosition;
window.getConnectionCenter = getConnectionCenter;