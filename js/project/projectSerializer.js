//----------------------------------
// Serialize Connection
//----------------------------------

function serializeConnection(connection) {

    return {

        id: connection.id,

        side: connection.side,

        offset: connection.offset,

        connected: connection.connected,

        hardware: structuredClone(connection.hardware),

        wires: structuredClone(connection.wires),

        materials: structuredClone(connection.materials),

        conduit: structuredClone(connection.conduit),

        conduitLength: connection.conduitLength,

        notes: connection.notes

    };

}

//----------------------------------
// Serialize Layout
//----------------------------------

function serializeLayout() {

    const uniqueItems = [];

    const seen = new Set();

    getLayout().forEach(item => {

        if (!item) return;

        if (seen.has(item.id)) return;

        seen.add(item.id);

        const connections = {};

        CONNECTION_SIDES.forEach(side => {

            connections[side] = item.connections[side].map(

                serializeConnection

            );

        });

        uniqueItems.push({

            id: item.id,

            startCell: item.startCell,

            width: item.width,

            height: item.height,

            rotation: item.rotation || 0,

            data: structuredClone(item.data),

            connections

        });

    });

    return uniqueItems;

}

//----------------------------------
// Serialize Links
//----------------------------------

function serializeLinks() {

    return getLinks().map(link => ({

        id: link.id,

        start: structuredClone(link.start),

        end: structuredClone(link.end),

        conduit: structuredClone(link.conduit),

        assembly: structuredClone(link.assembly),

        materials: structuredClone(link.materials),

        geometry: structuredClone(link.geometry)

    }));

}

//----------------------------------
// Serialize Material Summary
//----------------------------------

function serializeMaterialSummary() {

    const map = {};

    const seen = new Set();

    getLayout().forEach(item => {

        if (!item) return;

        if (seen.has(item.id)) return;

        seen.add(item.id);

        if (!item.data?.CatalogNumber) return;

        const key = item.data.CatalogNumber;

        if (!map[key]) {

            map[key] = {

                CatalogNumber: key,

                Qty: 0

            };

        }

        map[key].Qty++;

    });

    const bom = generateBOM();

    bom.fittings.forEach(item => {

        if (!item?.CatalogNumber) return;

        const key = item.CatalogNumber;

        if (!map[key]) {

            map[key] = {

                CatalogNumber: key,

                Qty: 0

            };

        }

        map[key].Qty += item.Qty;

    });

    return Object.values(map)

        .sort((a, b) =>

            a.CatalogNumber.localeCompare(

                b.CatalogNumber

            )

        );

}

//----------------------------------
// Serialize Project
//----------------------------------

function serializeProject(project = {}) {

    return {

        version: 2,

        jobName: project.jobName || "",

        address: project.address || "",

        layout: serializeLayout(),

        links: serializeLinks(),

        materialSummary: serializeMaterialSummary(),

        savedAt: Date.now()

    };

}

//----------------------------------
// Expose
//----------------------------------

window.serializeConnection = serializeConnection;

window.serializeLayout = serializeLayout;

window.serializeLinks = serializeLinks;

window.serializeMaterialSummary = serializeMaterialSummary;

window.serializeProject = serializeProject;