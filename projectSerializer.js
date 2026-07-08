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

        uniqueItems.push({

            id: item.id,

            catalogNumber: item.data?.CatalogNumber || "",

            startCell: item.startCell,

            width: item.width,

            height: item.height,

            rotation: item.rotation || 0

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

        start: {

            panelId: link.start.panelId,

            connectionId: link.start.connectionId

        },

        end: {

            panelId: link.end.panelId,

            connectionId: link.end.connectionId

        },

        conduit: link.conduit || null,

        assembly: Array.isArray(link.assembly)
            ? structuredClone(link.assembly)
            : []

    }));

}

//----------------------------------
// Serialize Material Summary
//----------------------------------

function serializeMaterialSummary() {

    const bom = generateBOM();

    return bom.fittings.map(item => ({

        CatalogNumber: item.CatalogNumber,

        Qty: item.Qty

    }));

}

//----------------------------------
// Serialize Project
//----------------------------------

function serializeProject(project) {

    return {

        version: 1,

        jobName: project.jobName,

        address: project.address,

        layout: serializeLayout(),

        links: serializeLinks(),

        materialSummary: serializeMaterialSummary()

    };

}

//----------------------------------
// Expose
//----------------------------------

window.serializeLayout = serializeLayout;
window.serializeLinks = serializeLinks;
window.serializeMaterialSummary = serializeMaterialSummary;
window.serializeProject = serializeProject;