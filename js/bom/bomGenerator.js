//----------------------------------
// Generate BOM
//----------------------------------

function generateBOM() {

    return {

        fittings: getFittingBOM()

    };

}

//----------------------------------
// Fittings
//----------------------------------

function getFittingBOM() {

    const map = {};

    links.forEach(link => {

        if (!link) return;

        //----------------------------------
        // Start Hardware
        //----------------------------------

        addMaterials(

            map,

            link.nodes?.start?.hardware

        );

        //----------------------------------
        // Link Assembly
        //----------------------------------

        link.assembly?.forEach(part => {

            if (!part?.material) return;

            mergeMaterial(

                map,

                {

                    ...part.material,

                    qty: part.qty

                }

            );

        });

        //----------------------------------
        // End Hardware
        //----------------------------------

        addMaterials(

            map,

            link.nodes?.end?.hardware

        );

    });

    return Object.values(map)

        .sort((a, b) =>

            String(a.CatalogNumber || "").localeCompare(

                String(b.CatalogNumber || "")

            )

        );

}

//----------------------------------
// Add Materials
//----------------------------------

function addMaterials(

    map,

    list

) {

    if (!Array.isArray(list)) return;

    list.forEach(material => {

        mergeMaterial(

            map,

            material

        );

    });

}

//----------------------------------
// Merge Material
//----------------------------------

function mergeMaterial(

    map,

    material

) {

    if (!material) return;

    const key = material.CatalogNumber;

    if (!key) return;

    //----------------------------------
    // Material Quantity
    //----------------------------------

    const qty = Number(

        material.qty ??

        material.Qty ??

        1

    );

    //----------------------------------
    // Existing
    //----------------------------------

    if (map[key]) {

        map[key].Qty += qty;

        return;

    }

    //----------------------------------
    // New
    //----------------------------------

    map[key] = {

        ...structuredClone(material),

        Qty: qty

    };

}

//----------------------------------
// Print BOM
//----------------------------------

function printBOM() {

    const bom = generateBOM();

    console.clear();

    console.table(

        bom.fittings

    );

    return bom;

}

//----------------------------------
// Expose
//----------------------------------

window.generateBOM = generateBOM;
window.printBOM = printBOM;