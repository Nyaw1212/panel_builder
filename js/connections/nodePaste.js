//----------------------------------
// Node Paste History Helper
//----------------------------------

function captureNodePasteHistory(
    label
) {

    if (
        !window.HistoryManagerV2 ||
        typeof window
            .HistoryManagerV2
            .capture !==
            "function"
    ) {

        return false;

    }

    return window
        .HistoryManagerV2
        .capture(
            label
        );

}

//----------------------------------
// Clone Connection Data
//----------------------------------

function cloneConnectionData(
    value,
    fallback
) {

    const source =
        value ?? fallback;

    if (
        typeof structuredClone ===
        "function"
    ) {

        return structuredClone(
            source
        );

    }

    return JSON.parse(
        JSON.stringify(
            source
        )
    );

}

//----------------------------------
// Paste Connection
//----------------------------------

function pasteConnection(
    connection,
    options = {}
) {

    //----------------------------------
    // Clipboard?
    //----------------------------------

    if (
        !connection ||
        !hasNodeClipboard()
    ) {

        return false;

    }

    const data =
        getNodeClipboard();

    if (!data) {

        return false;

    }

    //----------------------------------
    // Restore
    //----------------------------------

    connection.hardware =
        cloneConnectionData(
            data.hardware,
            []
        );

    connection.wires =
        cloneConnectionData(
            data.wires,
            []
        );

    connection.materials =
        cloneConnectionData(
            data.materials,
            []
        );

    //----------------------------------
    // Refresh
    //----------------------------------

    if (
        options.refresh !== false &&
        typeof drawCanvas ===
            "function"
    ) {

        drawCanvas();

    }

    if (
        options.refreshInspector !==
            false &&
        typeof refreshLinkInspector ===
            "function"
    ) {

        refreshLinkInspector();

    }

    //----------------------------------
    // Capture History
    //----------------------------------

    if (
        options.captureHistory !==
            false
    ) {

        captureNodePasteHistory(
            options.historyLabel ||
            "Connection data pasted"
        );

    }

    console.log(
        "Connection pasted."
    );

    return true;

}

//----------------------------------
// Expose
//----------------------------------

window.captureNodePasteHistory =
    captureNodePasteHistory;

window.cloneConnectionData =
    cloneConnectionData;

window.pasteConnection =
    pasteConnection;