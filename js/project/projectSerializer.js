//----------------------------------
// Serialize Equipment Data
//----------------------------------

function serializeEquipmentData(data) {

    return structuredClone(data);

}

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
// Serialize Item
//----------------------------------

function serializeItem(item) {

    const connections = {};

    CONNECTION_SIDES.forEach(side => {

        connections[side] =

            item.connections[side].map(

                serializeConnection

            );

    });

    return {

        //----------------------------------
        // Identity
        //----------------------------------

        id: item.id,

        //----------------------------------
        // Layout
        //----------------------------------

        startCell: item.startCell,

        width: item.width,

        height: item.height,

        rotation: item.rotation || 0,

        //----------------------------------
        // Equipment
        //----------------------------------

        data: serializeEquipmentData(

            item.data

        ),

        preset: item.preset || "",

        materials: structuredClone(

            item.materials || []

        ),

        //----------------------------------
        // Connections
        //----------------------------------

        connections

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

        uniqueItems.push(

            serializeItem(item)

        );

    });

    return uniqueItems;

}

//----------------------------------
// Serialize Link
//----------------------------------

function serializeLink(link) {

    return {

        id: link.id,

        start: structuredClone(link.start),

        end: structuredClone(link.end),

        conduit: structuredClone(link.conduit),

        assembly: structuredClone(link.assembly),

        materials: structuredClone(link.materials),

        geometry: structuredClone(link.geometry)

    };

}

//----------------------------------
// Serialize Links
//----------------------------------

function serializeLinks() {

    return getLinks().map(

        serializeLink

    );

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

function serializeProject() {

    const project = getProjectState();

    return {

        id: project.id,

        version: project.version,

        jobName: project.jobName,

        address: project.address,

        layout: serializeLayout(),

        links: serializeLinks(),

        materialSummary:

            serializeMaterialSummary(),

        savedAt: Date.now()

    };

}

//----------------------------------
// Expose
//----------------------------------

window.serializeEquipmentData =

    serializeEquipmentData;

window.serializeConnection =

    serializeConnection;

window.serializeItem =

    serializeItem;

window.serializeLayout =

    serializeLayout;

window.serializeLink =

    serializeLink;

window.serializeLinks =

    serializeLinks;

window.serializeMaterialSummary =

    serializeMaterialSummary;

window.serializeProject =

    serializeProject;