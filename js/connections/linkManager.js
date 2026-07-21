//----------------------------------
// Link Manager
//----------------------------------

const links = [];

//----------------------------------
// Capture Link History
//----------------------------------

function captureLinkHistory(
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
// Create Link
//----------------------------------

function createLink(
    start,
    end,
    options = {}
) {

    const link = {

        id:
            crypto.randomUUID(),

        //----------------------------------
        // Connections
        //----------------------------------

        start: {

            panelId:
                start.item.id,

            connectionId:
                start.connection.id

        },

        end: {

            panelId:
                end.item.id,

            connectionId:
                end.connection.id

        },

        //----------------------------------
        // Connected Panels
        //----------------------------------

        panels: {

            start:
                start.item,

            end:
                end.item

        },

        //----------------------------------
        // Connected Nodes
        //----------------------------------

        nodes: {

            start:
                start.connection,

            end:
                end.connection

        },

        //----------------------------------
        // Geometry
        //----------------------------------

        geometry: {

            type:
                "line",

            points:
                []

        },

        //----------------------------------
        // Conduit
        //----------------------------------

        length:
            0,

        conduit: {

            type:
                "EMT",

            size:
                '2"'

        },

        //----------------------------------
        // Materials
        //----------------------------------

        assembly:
            [],

        materials:
            []

    };

    //----------------------------------
    // Register Link
    //----------------------------------

    start.connection.links.push(
        link
    );

    end.connection.links.push(
        link
    );

    //----------------------------------
    // Build
    //----------------------------------

    updateLinkGeometry(
        link
    );

    updateLinkLength(
        link
    );

    updateLinkAssembly(
        link
    );

    updateLinkMaterials(
        link
    );

    //----------------------------------
    // Store
    //----------------------------------

    links.push(
        link
    );

    //----------------------------------
    // Capture History
    //----------------------------------

    if (
        options.captureHistory !==
        false
    ) {

        captureLinkHistory(
            options.historyLabel ||
            "Connection created"
        );

    }

    console.log(
        "Link Created",
        link
    );

    return link;

}

//----------------------------------
// Get All Links
//----------------------------------

function getLinks() {

    return links;

}

//----------------------------------
// Get Link
//----------------------------------

function getLink(
    id
) {

    return links.find(
        link =>
            link.id === id
    );

}

//----------------------------------
// Remove Link
//----------------------------------

function removeLink(
    id,
    options = {}
) {

    console.log(
        "removeLink()",
        id
    );

    console.log(
        "Before:",
        links.length
    );

    const index =
        links.findIndex(
            link =>
                link.id === id
        );

    console.log(
        "Index:",
        index
    );

    if (
        index < 0
    ) {

        console.log(
            "Link not found."
        );

        return null;

    }

    const link =
        links[index];

    //----------------------------------
    // Unregister
    //----------------------------------

    if (
        link.nodes?.start
    ) {

        link.nodes.start.links =
            link.nodes.start.links.filter(
                existingLink =>
                    existingLink.id !==
                    link.id
            );

    }

    if (
        link.nodes?.end
    ) {

        link.nodes.end.links =
            link.nodes.end.links.filter(
                existingLink =>
                    existingLink.id !==
                    link.id
            );

    }

    //----------------------------------
    // Remove
    //----------------------------------

    links.splice(
        index,
        1
    );

    console.log(
        "After:",
        links.length
    );

    //----------------------------------
    // Clear Selection
    //----------------------------------

    if (
        typeof isLinkSelected ===
            "function" &&
        isLinkSelected(
            link
        )
    ) {

        if (
            typeof clearSelectedLink ===
            "function"
        ) {

            clearSelectedLink();

        }

    }

    //----------------------------------
    // Hide Inspector
    //----------------------------------

    if (
        options.cleanupUi !== false &&
        typeof hideLinkInspector ===
            "function"
    ) {

        hideLinkInspector();

    }

    //----------------------------------
    // Remove Old Delete Button
    //----------------------------------

    if (
        options.cleanupUi !== false &&
        typeof removeLinkDeleteButton ===
            "function"
    ) {

        removeLinkDeleteButton();

    }

    //----------------------------------
    // Refresh Canvas
    //----------------------------------

    console.log(
        "drawCanvas =",
        typeof drawCanvas
    );

    if (
        options.refresh !== false &&
        typeof drawCanvas ===
            "function"
    ) {

        drawCanvas();

    }

    //----------------------------------
    // Capture History
    //----------------------------------

    if (
        options.captureHistory !==
        false
    ) {

        captureLinkHistory(
            options.historyLabel ||
            "Connection deleted"
        );

    }

    return link;

}

//----------------------------------
// Clear Links
//----------------------------------

function clearLinks(
    options = {}
) {

    const removedCount =
        links.length;

    links.forEach(
        link => {

            if (
                link.nodes?.start
            ) {

                link.nodes.start.links =
                    [];

            }

            if (
                link.nodes?.end
            ) {

                link.nodes.end.links =
                    [];

            }

        }
    );

    links.length =
        0;

    //----------------------------------
    // Clear Selection
    //----------------------------------

    if (
        typeof clearSelectedLink ===
        "function"
    ) {

        clearSelectedLink();

    }

    //----------------------------------
    // Refresh
    //----------------------------------

    if (
        options.refresh === true &&
        typeof drawCanvas ===
            "function"
    ) {

        drawCanvas();

    }

    //----------------------------------
    // Optional History
    //----------------------------------

    if (
        removedCount > 0 &&
        options.captureHistory ===
            true
    ) {

        captureLinkHistory(
            options.historyLabel ||
            (
                removedCount === 1
                    ? "Connection deleted"
                    : `${removedCount} connections deleted`
            )
        );

    }

    return removedCount;

}

//----------------------------------
// Replace Links
//----------------------------------

function replaceLinks(
    newLinks,
    options = {}
) {

    clearLinks({
        captureHistory:
            false,

        refresh:
            false
    });

    (
        Array.isArray(newLinks)
            ? newLinks
            : []
    ).forEach(
        link => {

            links.push(
                link
            );

        }
    );

    //----------------------------------
    // Refresh
    //----------------------------------

    if (
        options.refresh === true &&
        typeof drawCanvas ===
            "function"
    ) {

        drawCanvas();

    }

    //----------------------------------
    // Optional History
    //----------------------------------

    if (
        options.captureHistory ===
        true
    ) {

        captureLinkHistory(
            options.historyLabel ||
            "Connections replaced"
        );

    }

    return links;

}

//----------------------------------
// Expose
//----------------------------------

window.captureLinkHistory =
    captureLinkHistory;

window.createLink =
    createLink;

window.getLinks =
    getLinks;

window.getLink =
    getLink;

window.removeLink =
    removeLink;

window.clearLinks =
    clearLinks;

window.replaceLinks =
    replaceLinks;