//----------------------------------
// Link Materials History Helper
//----------------------------------

function captureLinkMaterialsHistory(
    label
) {

    if (
        !window.HistoryManagerV2 ||
        typeof window
            .HistoryManagerV2
            .capture !==
            "function"
    ) {

        return false;

    }

    return window
        .HistoryManagerV2
        .capture(
            label
        );

}

//----------------------------------
// Clone Material List
//----------------------------------

function cloneLinkMaterialList(
    materials
) {

    const list =
        Array.isArray(materials)
            ? materials
            : [];

    if (
        typeof structuredClone ===
        "function"
    ) {

        return structuredClone(
            list
        );

    }

    return JSON.parse(
        JSON.stringify(
            list
        )
    );

}

//----------------------------------
// Update Materials
//----------------------------------

function updateLinkMaterials(
    link,
    options = {}
) {

    if (!link) {

        return [];

    }

    const materials = [];

    //----------------------------------
    // Start Node Materials
    //----------------------------------

    const startMaterials =
        link.nodes?.start?.materials ||
        [];

    startMaterials.forEach(
        material => {

            materials.push({

                ...material,

                Source:
                    "Start Node"

            });

        }
    );

    //----------------------------------
    // End Node Materials
    //----------------------------------

    const endMaterials =
        link.nodes?.end?.materials ||
        [];

    endMaterials.forEach(
        material => {

            materials.push({

                ...material,

                Source:
                    "End Node"

            });

        }
    );

    //----------------------------------
    // Link Assembly
    //----------------------------------

    const assembly =
        typeof getLinkAssembly ===
            "function"
            ? getLinkAssembly(
                link
            )
            : [];

    (
        Array.isArray(assembly)
            ? assembly
            : []
    ).forEach(
        part => {

            materials.push({

                ...part,

                Source:
                    "Assembly"

            });

        }
    );

    //----------------------------------
    // Save
    //----------------------------------

    setLinkMaterials(
        link,
        materials,
        {
            captureHistory:
                false
        }
    );

    //----------------------------------
    // Optional History
    //----------------------------------

    if (
        options.captureHistory ===
        true
    ) {

        captureLinkMaterialsHistory(
            options.historyLabel ||
            "Connection materials updated"
        );

    }

    return materials;

}

//----------------------------------
// Get Materials
//----------------------------------

function getLinkMaterials(
    link
) {

    if (!link) {

        return [];

    }

    return Array.isArray(
        link.materials
    )
        ? link.materials
        : [];

}

//----------------------------------
// Set Materials
//----------------------------------

function setLinkMaterials(
    link,
    materials,
    options = {}
) {

    if (!link) {

        return false;

    }

    link.materials =
        cloneLinkMaterialList(
            materials
        );

    //----------------------------------
    // Optional History
    //----------------------------------

    if (
        options.captureHistory ===
        true
    ) {

        captureLinkMaterialsHistory(
            options.historyLabel ||
            "Connection materials changed"
        );

    }

    return true;

}

//----------------------------------
// Add Material
//----------------------------------

function addLinkMaterial(
    link,
    material,
    options = {}
) {

    if (
        !link ||
        !material
    ) {

        return false;

    }

    if (
        !Array.isArray(
            link.materials
        )
    ) {

        link.materials = [];

    }

    const clonedMaterial =
        cloneLinkMaterialList([
            material
        ])[0];

    link.materials.push(
        clonedMaterial
    );

    //----------------------------------
    // Optional History
    //----------------------------------

    if (
        options.captureHistory !==
        false
    ) {

        captureLinkMaterialsHistory(
            options.historyLabel ||
            "Connection material added"
        );

    }

    return true;

}

//----------------------------------
// Clear Materials
//----------------------------------

function clearLinkMaterials(
    link,
    options = {}
) {

    if (!link) {

        return false;

    }

    const hadMaterials =
        Array.isArray(
            link.materials
        ) &&
        link.materials.length > 0;

    link.materials = [];

    //----------------------------------
    // Optional History
    //----------------------------------

    if (
        hadMaterials &&
        options.captureHistory ===
            true
    ) {

        captureLinkMaterialsHistory(
            options.historyLabel ||
            "Connection materials cleared"
        );

    }

    return hadMaterials;

}

//----------------------------------
// Remove Assembly Material
//----------------------------------

function removeAssemblyMaterial(
    link,
    section,
    index,
    options = {}
) {

    if (!link) {

        return false;

    }

    let removed = false;

    switch (section) {

        case "start": {

            const hardware =
                link.nodes?.start
                    ?.hardware;

            if (
                !Array.isArray(
                    hardware
                ) ||
                !hardware[index]
            ) {

                return false;

            }

            hardware[index] =
                null;

            removed = true;

            break;

        }

        case "end": {

            const hardware =
                link.nodes?.end
                    ?.hardware;

            if (
                !Array.isArray(
                    hardware
                ) ||
                !hardware[index]
            ) {

                return false;

            }

            hardware[index] =
                null;

            removed = true;

            break;

        }

        default: {

            const part =
                link.assembly?.[index];

            if (!part) {

                return false;

            }

            const hadMaterial =
                Boolean(
                    part.material ||
                    part.catalog ||
                    part.description
                );

            if (!hadMaterial) {

                return false;

            }

            part.material =
                null;

            part.catalog =
                "";

            part.description =
                "";

            removed = true;

        }

    }

    if (!removed) {

        return false;

    }

    //----------------------------------
    // Rebuild Derived Materials
    //----------------------------------

    updateLinkMaterials(
        link,
        {
            captureHistory:
                false
        }
    );

    //----------------------------------
    // Refresh Inspector
    //----------------------------------

    if (
        options.refresh !== false &&
        typeof refreshLinkInspector ===
            "function"
    ) {

        refreshLinkInspector();

    }

    //----------------------------------
    // Capture History Once
    //----------------------------------

    if (
        options.captureHistory !==
        false
    ) {

        captureLinkMaterialsHistory(
            options.historyLabel ||
            "Assembly material removed"
        );

    }

    return true;

}

//----------------------------------
// Expose
//----------------------------------

window.captureLinkMaterialsHistory =
    captureLinkMaterialsHistory;

window.updateLinkMaterials =
    updateLinkMaterials;

window.getLinkMaterials =
    getLinkMaterials;

window.setLinkMaterials =
    setLinkMaterials;

window.addLinkMaterial =
    addLinkMaterial;

window.clearLinkMaterials =
    clearLinkMaterials;

window.removeAssemblyMaterial =
    removeAssemblyMaterial;