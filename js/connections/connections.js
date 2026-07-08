

//----------------------------------
// Add Connection
//----------------------------------

function addConnection(item, side, offset = null) {

    if (!item) return null;

    if (!CONNECTION_SIDES.includes(side)) {

        console.error("Invalid side:", side);

        return null;

    }

    if (offset === null) {

        const count = item.connections[side].length;

        offset = (count + 1) / (count + 2);

    }

    const connection = createConnection(side, offset);

    item.connections[side].push(connection);

    return connection;

}

//----------------------------------
// Remove Connection
//----------------------------------

function removeConnection(item, connectionId) {

    if (!item) return;

    CONNECTION_SIDES.forEach(side => {

        item.connections[side] =
            item.connections[side].filter(
                c => c.id !== connectionId
            );

    });

}




//----------------------------------
// Clear Connections
//----------------------------------

function clearConnections(item) {

    if (!item) return;

    CONNECTION_SIDES.forEach(side => {

        item.connections[side] = [];

    });

}

//----------------------------------
// Redistribute Offsets
//----------------------------------

function normalizeConnections(item, side) {

    const list = item.connections[side];

    const total = list.length;

    if (total === 0) return;

    list.forEach((connection, index) => {

        connection.offset =
            (index + 1) /
            (total + 1);

    });

}

//----------------------------------
// Normalize All
//----------------------------------

function normalizeAllConnections(item) {

    CONNECTION_SIDES.forEach(side => {

        normalizeConnections(item, side);

    });

}

//----------------------------------
// Get Connection Position
//----------------------------------

function getConnectionPosition(item, connection) {

    const col =
        item.startCell % SETTINGS.columns;

    const row =
        Math.floor(
            item.startCell / SETTINGS.columns
        );

    const x =
        col *
        (SETTINGS.cellSize + SETTINGS.gap);

    const y =
        row *
        (SETTINGS.cellSize + SETTINGS.gap);

    const width =
        item.width *
        (SETTINGS.cellSize + SETTINGS.gap) -
        SETTINGS.gap;

    const height =
        item.height *
        (SETTINGS.cellSize + SETTINGS.gap) -
        SETTINGS.gap;

    switch (connection.side) {

        case "top":

            return {

                x: x + (width * connection.offset),
                y

            };

        case "bottom":

            return {

                x: x + (width * connection.offset),
                y: y + height

            };

        case "left":

            return {

                x,
                y: y + (height * connection.offset)

            };

        case "right":

            return {

                x: x + width,
                y: y + (height * connection.offset)

            };

    }

    return { x, y };

}

//----------------------------------
// Set Port Count
//----------------------------------

function setConnectionCount(item, side, count) {

    if (!item) return;

    if (!CONNECTION_SIDES.includes(side)) return;

    count = Math.max(0, count);

    const list = item.connections[side];

    //----------------------------------
    // Add Ports
    //----------------------------------

    while (list.length < count) {

        list.push(
            createConnection(side)
        );

    }

    //----------------------------------
    // Remove Unused Ports
    //----------------------------------

    while (list.length > count) {

        const last = list[list.length - 1];

        if (last.connected) {

            alert(
                "Cannot remove a connected port."
            );

            break;

        }

        list.pop();

    }

    normalizeConnections(item, side);

}

