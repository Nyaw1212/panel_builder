//----------------------------------
// Connection Identity
//----------------------------------

//----------------------------------
// Assign Identity
//----------------------------------

function assignConnectionIdentity(
    node,
    item,
    connection
) {

    node.dataset.panelId =
        item.id;

    node.dataset.connectionId =
        connection
            ? connection.id
            : "";

}

//----------------------------------
// Update Identity
//----------------------------------

function updateConnectionIdentity(
    node,
    connection
) {

    if (!connection) return;

    node.dataset.connectionId =
        connection.id;

}

//----------------------------------
// Get Connection Node
//----------------------------------

function getConnectionNode(
    panelId,
    connectionId
) {

    return document.querySelector(

        `.connection-node[data-panel-id="${panelId}"][data-connection-id="${connectionId}"]`

    );

}