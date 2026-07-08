//----------------------------------
// Connection Registry
//----------------------------------

const connectionRegistry = new Map();

//----------------------------------
// Build Key
//----------------------------------

function getConnectionKey(
    panelId,
    connectionId
) {

    return `${panelId}:${connectionId}`;

}

//----------------------------------
// Register Node
//----------------------------------

function registerConnectionNode(
    panelId,
    connectionId,
    node
) {

    if (!connectionId) return;

    connectionRegistry.set(

        getConnectionKey(

            panelId,

            connectionId

        ),

        node

    );

}

//----------------------------------
// Get Node
//----------------------------------

function getRegisteredConnectionNode(
    panelId,
    connectionId
) {

    return connectionRegistry.get(

        getConnectionKey(

            panelId,

            connectionId

        )

    ) || null;

}

//----------------------------------
// Clear Registry
//----------------------------------

function clearConnectionRegistry() {

    connectionRegistry.clear();

}