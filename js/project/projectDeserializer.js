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
        // Hydrate compact catalog records
        //----------------------------------

        item.data =
            typeof hydrateCatalogRecord === "function"
                ? hydrateCatalogRecord(savedItem.data)
                : structuredClone(savedItem.data);

        item.materials =
            typeof hydrateCatalogList === "function"
                ? hydrateCatalogList(savedItem.materials || [])
                : structuredClone(savedItem.materials || []);

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

        CONNECTION_SIDES.forEach(side => {

            if (!item.connections[side]) {
                item.connections[side] = [];
            }

            item.connections[side] = item.connections[side].map(connection => {
                const restored = structuredClone(connection);

                if (typeof hydrateCatalogList === "function") {
                    restored.hardware = hydrateCatalogList(connection.hardware || []);
                    restored.wires = hydrateCatalogList(connection.wires || []);
                    restored.materials = hydrateCatalogList(connection.materials || []);
                }

                if (typeof hydrateCatalogRecord === "function") {
                    restored.conduit = connection.conduit
                        ? hydrateCatalogRecord(connection.conduit)
                        : null;
                }

                restored.links = [];

                return restored;
            });

        });

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

        const restoredConduit =
            saved.conduit && typeof hydrateCatalogRecord === "function"
                ? hydrateCatalogRecord(saved.conduit)
                : (saved.conduit || null);

        const restoredAssembly =
            typeof hydrateCatalogList === "function"
                ? hydrateCatalogList(saved.assembly || [])
                : structuredClone(saved.assembly || []);

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
                saved.manualRoutingV3?.routingMode ??
                "auto",

            manualRoute:
                structuredClone(
                    saved.manualRoute ??
                    saved.manualRoutingV3?.manualRoute ??
                    null
                ),

            conduit: restoredConduit,
            length: 0,
            assembly: restoredAssembly,
            materials: []
        };

        startConnection.links.push(link);
        endConnection.links.push(link);

        //----------------------------------
        // Derived runtime values
        //----------------------------------

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