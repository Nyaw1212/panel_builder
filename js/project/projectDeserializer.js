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
    // Restore free-form material runs
    //----------------------------------

    if (typeof setProjectRuns === "function") {
        const runs = (project.runs || []).map((savedRun, index) => ({
            id: String(savedRun?.id || crypto.randomUUID()),
            name: String(savedRun?.name || `Run ${index + 1}`),
            canvasLinkId: String(savedRun?.canvasLinkId || ""),
            fromCanvasItemId: String(savedRun?.fromCanvasItemId || ""),
            toCanvasItemId: String(savedRun?.toCanvasItemId || ""),
            length: Math.max(0, Number(savedRun?.length || 0)),
            conduit: savedRun?.conduit && typeof hydrateCatalogRecord === "function"
                ? hydrateCatalogRecord(savedRun.conduit)
                : (savedRun?.conduit || null),
            wires: typeof hydrateCatalogList === "function"
                ? hydrateCatalogList(
                    Array.isArray(savedRun?.wires)
                        ? savedRun.wires
                        : (savedRun?.wire ? [savedRun.wire] : [])
                )
                : structuredClone(
                    Array.isArray(savedRun?.wires)
                        ? savedRun.wires
                        : (savedRun?.wire ? [savedRun.wire] : [])
                )
            ,
            manualWires: typeof hydrateCatalogList === "function"
                ? hydrateCatalogList(Array.isArray(savedRun?.manualWires) ? savedRun.manualWires : [])
                : structuredClone(Array.isArray(savedRun?.manualWires) ? savedRun.manualWires : []),
            autoRunWires: typeof hydrateCatalogList === "function"
                ? hydrateCatalogList(Array.isArray(savedRun?.autoRunWires) ? savedRun.autoRunWires : [])
                : structuredClone(Array.isArray(savedRun?.autoRunWires) ? savedRun.autoRunWires : []),
            autoMainWires: typeof hydrateCatalogList === "function"
                ? hydrateCatalogList(Array.isArray(savedRun?.autoMainWires) ? savedRun.autoMainWires : [])
                : structuredClone(Array.isArray(savedRun?.autoMainWires) ? savedRun.autoMainWires : []),
            breakerWireAssignments: (Array.isArray(savedRun?.breakerWireAssignments)
                ? savedRun.breakerWireAssignments
                : []
            ).map(assignment => ({
                panelId: String(assignment?.panelId || ""),
                breakerId: String(assignment?.breakerId || ""),
                panelPreset: String(assignment?.panelPreset || ""),
                catalogNumber: String(assignment?.catalogNumber || ""),
                rating: Math.max(0, Number(assignment?.rating || 0)),
                poles: Math.max(1, Number(assignment?.poles || 1)),
                wires: typeof hydrateCatalogList === "function"
                    ? hydrateCatalogList(Array.isArray(assignment?.wires) ? assignment.wires : [])
                    : structuredClone(Array.isArray(assignment?.wires) ? assignment.wires : [])
            })).filter(assignment => assignment.panelId && assignment.catalogNumber && assignment.wires.length),
            panelBreakerSources: (Array.isArray(savedRun?.panelBreakerSources)
                ? savedRun.panelBreakerSources
                : []
            ).map(source => ({
                panelId: String(source?.panelId || ""),
                breakerId: String(source?.breakerId || ""),
                panelPreset: String(source?.panelPreset || ""),
                catalogNumber: String(source?.catalogNumber || ""),
                rating: Math.max(0, Number(source?.rating || 0)),
                poles: Math.max(1, Number(source?.poles || 1))
            })).filter(source => source.panelId && source.catalogNumber),
            panelBreakerSourcesConfigured: savedRun?.panelBreakerSourcesConfigured === true,
            fittings: (Array.isArray(savedRun?.fittings)
                ? savedRun.fittings
                : []
            ).map(savedFitting => {
                const material = savedFitting?.material ?? savedFitting;

                return {
                    ...(typeof hydrateCatalogRecord === "function"
                        ? hydrateCatalogRecord(material)
                        : structuredClone(material)
                    ),
                    qty: Math.max(
                        0,
                        Number(savedFitting?.qty ?? savedFitting?.Qty ?? 0)
                    )
                };
            }).filter(fitting => fitting?.CatalogNumber && fitting.qty > 0)
        }));

        setProjectRuns(runs);
    }

    if (typeof setProjectGutters === "function") {
        const gutters = (project.gutters || []).map((savedGutter, index) => ({
            id: String(savedGutter?.id || crypto.randomUUID()),
            name: String(savedGutter?.name || `Gutter ${index + 1}`),
            canvasItemId: String(savedGutter?.canvasItemId || ""),
            length: Math.max(0, Number(savedGutter?.length || 0)),
            excludedRunIds: (Array.isArray(savedGutter?.excludedRunIds)
                ? savedGutter.excludedRunIds
                : []
            ).map(id => String(id)).filter(Boolean),
            fittings: (Array.isArray(savedGutter?.fittings)
                ? savedGutter.fittings
                : []
            ).map(savedFitting => {
                const material = savedFitting?.material ?? savedFitting;

                return {
                    ...(typeof hydrateCatalogRecord === "function"
                        ? hydrateCatalogRecord(material)
                        : structuredClone(material)
                    ),
                    qty: Math.max(
                        0,
                        Number(savedFitting?.qty ?? savedFitting?.Qty ?? 0)
                    )
                };
            }).filter(fitting => fitting?.CatalogNumber && fitting.qty > 0)
        }));

        setProjectGutters(gutters);
    }

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

        item.rotation = Number(savedItem.rotation || 0);
        item.preset = savedItem.preset || "";

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

                restored.side = connection.side || side;
                restored.connected = Boolean(connection.connected);
                restored.conduitLength = Number(connection.conduitLength || 0);
                restored.notes = connection.notes || "";

                if (typeof hydrateCatalogList === "function") {
                    restored.hardware = hydrateCatalogList(connection.hardware || []);
                    restored.wires = hydrateCatalogList(connection.wires || []);
                    restored.materials = hydrateCatalogList(connection.materials || []);
                }
                else {
                    restored.hardware = structuredClone(connection.hardware || []);
                    restored.wires = structuredClone(connection.wires || []);
                    restored.materials = structuredClone(connection.materials || []);
                }

                if (typeof hydrateCatalogRecord === "function") {
                    restored.conduit = connection.conduit
                        ? hydrateCatalogRecord(connection.conduit)
                        : null;
                }
                else {
                    restored.conduit = connection.conduit || null;
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
            assembly: [],
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
