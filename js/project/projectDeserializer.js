//----------------------------------
// Deserialize Project
//----------------------------------

function deserializeProject(project) {

    if (!project) return;

    //----------------------------------
    // Clear Existing
    //----------------------------------

    replaceLayout([]);

    clearLinks();

    //----------------------------------
    // Restore Panels
    //----------------------------------

    const panels = [];

    const panelLookup = new Map();

    const connectionLookup = new Map();

    (project.layout || []).forEach(savedItem => {

        const item = structuredClone(savedItem);

        //----------------------------------
        // Validate
        //----------------------------------

        if (!item.connections) {

            throw new Error(
                `Panel ${item.id} has no connections`
            );

        }

        if (!item.data) {

            throw new Error(
                `Panel ${item.id} has no data`
            );

        }

        //----------------------------------
        // Occupied
        //----------------------------------

        item.occupied = [];

        for (let r = 0; r < Math.ceil(item.height); r++) {

            for (let c = 0; c < Math.ceil(item.width); c++) {

                item.occupied.push(

                    item.startCell +

                    r * SETTINGS.columns +

                    c

                );

            }

        }

        //----------------------------------
        // Reset Runtime Links
        //----------------------------------

        CONNECTION_SIDES.forEach(side => {

            if (!item.connections[side]) {

                item.connections[side] = [];

            }

            item.connections[side].forEach(connection => {

                connection.links = [];

            });

        });

        //----------------------------------
        // Lookup
        //----------------------------------

        panelLookup.set(item.id, item);

        CONNECTION_SIDES.forEach(side => {

            item.connections[side].forEach(connection => {

                connectionLookup.set(

                    connection.id,

                    connection

                );

            });

        });

        panels.push(item);

    });

    //----------------------------------
    // Replace Layout
    //----------------------------------

    replaceLayout(panels);

    //----------------------------------
    // Restore Links
    //----------------------------------

    const restoredLinks = [];

    (project.links || []).forEach(saved => {

        const startPanel =
            panelLookup.get(saved.start.panelId);

        const endPanel =
            panelLookup.get(saved.end.panelId);

        const startConnection =
            connectionLookup.get(saved.start.connectionId);

        const endConnection =
            connectionLookup.get(saved.end.connectionId);

        if (

            !startPanel ||

            !endPanel ||

            !startConnection ||

            !endConnection

        ) {

            console.warn("Broken Link", saved);

            return;

        }

        const link = {

            id: saved.id,

            start: structuredClone(saved.start),

            end: structuredClone(saved.end),

            panels: {

                start: startPanel,

                end: endPanel

            },

            nodes: {

                start: startConnection,

                end: endConnection

            },

            geometry: {

                type: "line",

                points: []

            },

            routingMode:
                saved.routingMode ??
                saved.manualRoutingV3
                    ?.routingMode ??
                "auto",

            manualRoute:
                structuredClone(
                    saved.manualRoute ??
                    saved.manualRoutingV3
                        ?.manualRoute ??
                    null
                ),

            conduit: saved.conduit || null,

            length: 0,

            assembly:

                structuredClone(saved.assembly || []),

            materials: []

        };

        startConnection.links.push(link);

        endConnection.links.push(link);

        updateLinkGeometry(link);

        updateLinkLength(link);

        updateLinkAssembly(link);

        updateLinkMaterials(link);

        restoredLinks.push(link);

    });

    replaceLinks(restoredLinks);

    drawCanvas();

}

//----------------------------------
// Expose
//----------------------------------

window.deserializeProject = deserializeProject;