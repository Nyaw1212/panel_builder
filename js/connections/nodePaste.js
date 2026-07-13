//----------------------------------
// Paste Connection
//----------------------------------

function pasteConnection(connection) {

    //----------------------------------
    // Clipboard?
    //----------------------------------

    if (

        !connection ||

        !hasNodeClipboard()

    ) {

        return false;

    }

    const data = getNodeClipboard();

    //----------------------------------
    // Restore
    //----------------------------------

    connection.hardware = structuredClone(

        data.hardware

    );

    connection.wires = structuredClone(

        data.wires

    );

    connection.materials = structuredClone(

        data.materials

    );

    //----------------------------------
    // Refresh
    //----------------------------------

    drawCanvas();

    console.log(

        "Connection pasted."

    );

    return true;

}

//----------------------------------
// Expose
//----------------------------------

window.pasteConnection = pasteConnection;