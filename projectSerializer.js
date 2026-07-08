
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

            catalogNumber: item.data.CatalogNumber,

            startCell: item.startCell,

            width: item.width,

            height: item.height

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

        start: link.start,

        end: link.end,

        geometry: link.geometry,

        length: link.length,

        conduit: link.conduit,

        assembly: link.assembly,

        materials: link.materials

    }));

}

window.serializeLayout = serializeLayout;
window.serializeLinks = serializeLinks;