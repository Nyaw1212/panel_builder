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

    //----------------------------------
    // Placed Components
    //
    // Use the materials stored on each canvas item. This keeps the BOM in
    // sync when an existing component is replaced without deleting its links.
    //----------------------------------

    const layout = typeof getLayout === "function"
        ? getLayout()
        : [];
    const seenEquipment = new Set();

    (Array.isArray(layout) ? layout : []).forEach(item => {

        if (!item?.id || seenEquipment.has(item.id)) return;
        seenEquipment.add(item.id);

        const itemMaterials = Array.isArray(item.materials)
            ? item.materials
            : [];
        const mainCatalog = String(
            item.data?.CatalogNumber || ""
        ).trim().toUpperCase();
        const hasMainMaterial = itemMaterials.some(material => {
            return String(
                material?.CatalogNumber || material?.catalogNumber || ""
            ).trim().toUpperCase() === mainCatalog;
        });

        if (mainCatalog && !hasMainMaterial) {
            mergeMaterial(map, {
                ...item.data,
                CatalogNumber: item.data.CatalogNumber,
                qty: 1
            });
        }

        itemMaterials.forEach(material => {
            const catalogNumber = String(
                material?.CatalogNumber || material?.catalogNumber || ""
            ).trim();

            if (!catalogNumber) return;

            mergeMaterial(map, {
                ...material,
                CatalogNumber: catalogNumber,
                Description: material.Description || material.description || ""
            });
        });

    });

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

    //----------------------------------
    // Free-form material runs
    //----------------------------------

    const runs = typeof getProjectRuns === "function"
        ? getProjectRuns()
        : [];

    runs.forEach(run => {

        const length = Number(run?.length || 0);

        if (!Number.isFinite(length) || length <= 0) return;

        if (run.conduit) {
            mergeMaterial(map, {
                ...run.conduit,
                qty: length
            });
        }

        const wires = Array.isArray(run.wires)
            ? run.wires
            : (run.wire ? [run.wire] : []);

        wires.forEach(wire => {
            mergeMaterial(map, {
                ...wire,
                // Two feet of service allowance at each end.
                qty: length + 4
            });
        });

        (Array.isArray(run.fittings) ? run.fittings : []).forEach(fitting => {
            mergeMaterial(map, {
                ...fitting,
                qty: Number(fitting?.qty || fitting?.Qty || 0)
            });
        });

    });

    //----------------------------------
    // Gutter wires: every included run contributes its
    // selected wires for the exact gutter length.
    //----------------------------------

    const gutters = typeof getProjectGutters === "function"
        ? getProjectGutters()
        : [];

    gutters.forEach(gutter => {

        const length = Number(gutter?.length || 0);

        // Fittings are count-based and must remain on the BOM even when a
        // gutter length has not been entered yet.
        (Array.isArray(gutter?.fittings) ? gutter.fittings : []).forEach(fitting => {
            mergeMaterial(map, {
                ...fitting,
                qty: Number(fitting?.qty || fitting?.Qty || 0)
            });
        });

        if (!Number.isFinite(length) || length <= 0) return;

        const excluded = new Set(
            Array.isArray(gutter?.excludedRunIds)
                ? gutter.excludedRunIds.map(id => String(id))
                : []
        );

        runs
            .filter(run => !excluded.has(String(run?.id || "")))
            .forEach(run => {
                const wires = Array.isArray(run?.wires)
                    ? run.wires
                    : (run?.wire ? [run.wire] : []);

                wires.forEach(wire => {
                    mergeMaterial(map, {
                        ...wire,
                        qty: length
                    });
                });
            });

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
