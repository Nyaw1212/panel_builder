//----------------------------------
// Node Clipboard
//----------------------------------

let nodeClipboard = null;

//----------------------------------
// Copy Connection
//----------------------------------

function copyConnection(connection) {

    if (!connection) {

        console.log("No connection to copy.");

        return false;

    }

    nodeClipboard = {

        hardware: structuredClone(

            connection.hardware

        ),

        wires: structuredClone(

            connection.wires

        ),

        materials: structuredClone(

            connection.materials

        )

    };

    console.group("Node Clipboard");

    console.log(nodeClipboard);

    console.groupEnd();

    return true;

}

//----------------------------------
// Clipboard
//----------------------------------

function getNodeClipboard() {

    return nodeClipboard;

}

function hasNodeClipboard() {

    return nodeClipboard !== null;

}

function clearNodeClipboard() {

    nodeClipboard = null;

}

//----------------------------------
// Expose
//----------------------------------

window.copyConnection = copyConnection;

window.getNodeClipboard = getNodeClipboard;

window.hasNodeClipboard = hasNodeClipboard;

window.clearNodeClipboard = clearNodeClipboard;