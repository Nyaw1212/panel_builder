//----------------------------------
// Link Manager
//----------------------------------

const links = [];

//----------------------------------
// Create Link
//----------------------------------

function createLink(start, end) {

    const link = {

        id: crypto.randomUUID(),

        //----------------------------------
        // Connections
        //----------------------------------

        start: {

            panelId: start.item.id,

            connectionId: start.connection.id

        },

        end: {

            panelId: end.item.id,

            connectionId: end.connection.id

        },

        //----------------------------------
        // Connected Panels
        //----------------------------------

        panels: {

            start: start.item,

            end: end.item

        },

        //----------------------------------
        // Connected Nodes
        //----------------------------------

        nodes: {

            start: start.connection,

            end: end.connection

        },

        //----------------------------------
        // Geometry
        //----------------------------------

        geometry: {

            type: "line",

            points: []

        },

        //----------------------------------
        // Conduit
        //----------------------------------

        length: 0,

        conduit: {

            type: "EMT",

            size: '2"'

        },

        //----------------------------------
        // Materials
        //----------------------------------

        assembly: [],

        materials: []

    };

    //----------------------------------
    // Register Link
    //----------------------------------

    start.connection.links.push(link);

    end.connection.links.push(link);

    //----------------------------------
    // Build
    //----------------------------------

    updateLinkGeometry(link);

    updateLinkLength(link);

    updateLinkAssembly(link);

    updateLinkMaterials(link);

    //----------------------------------
    // Store
    //----------------------------------

    links.push(link);

    console.log("Link Created", link);

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

function getLink(id) {

    return links.find(

        link => link.id === id

    );

}

//----------------------------------
// Remove Link
//----------------------------------

function removeLink(id) {

    console.log("removeLink()", id);

    console.log("Before:", links.length);

    const index = links.findIndex(

        link => link.id === id

    );

    console.log("Index:", index);

    if (index < 0) {

        console.log("Link not found.");

        return;

    }

    const link = links[index];

    //----------------------------------
    // Unregister
    //----------------------------------

    if (link.nodes?.start) {

        link.nodes.start.links =

            link.nodes.start.links.filter(

                l => l.id !== link.id

            );

    }

    if (link.nodes?.end) {

        link.nodes.end.links =

            link.nodes.end.links.filter(

                l => l.id !== link.id

            );

    }

    //----------------------------------
    // Remove
    //----------------------------------

    links.splice(index, 1);

    console.log("After:", links.length);

    //----------------------------------
    // Clear Selection
    //----------------------------------

    if (isLinkSelected(link)) {

        clearSelectedLink();

    }

    //----------------------------------
    // Hide Inspector
    //----------------------------------

    if (typeof hideLinkInspector === "function") {

        hideLinkInspector();

    }

    //----------------------------------
    // Remove Old Delete Button
    //----------------------------------

    if (typeof removeLinkDeleteButton === "function") {

        removeLinkDeleteButton();

    }

    //----------------------------------
    // Refresh Canvas
    //----------------------------------

    console.log("drawCanvas =", typeof drawCanvas);

    if (typeof drawCanvas === "function") {

        drawCanvas();

    }

}

//----------------------------------
// Clear Links
//----------------------------------

function clearLinks() {

    links.forEach(link => {

        if (link.nodes?.start) {

            link.nodes.start.links = [];

        }

        if (link.nodes?.end) {

            link.nodes.end.links = [];

        }

    });

    links.length = 0;

}

//----------------------------------
// Expose
//----------------------------------

window.createLink = createLink;
window.getLinks = getLinks;
window.getLink = getLink;
window.removeLink = removeLink;
window.clearLinks = clearLinks;