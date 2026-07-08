//----------------------------------
// Get All Connections
//----------------------------------

function getConnections(item) {

    if (!item) return [];

    return [

        ...item.connections.top,
        ...item.connections.right,
        ...item.connections.bottom,
        ...item.connections.left

    ];

}

//----------------------------------
// Get Connection Count
//----------------------------------

function getConnectionCount(item) {

    return getConnections(item).length;

}

//----------------------------------
// Get Connection By ID
//----------------------------------

function getConnectionById(item, id) {

    if (!item) return null;

    for (const side of CONNECTION_SIDES) {

        const connection = item.connections[side]
            .find(c => c.id === id);

        if (connection) {

            return connection;

        }

    }

    return null;

}