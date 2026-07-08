//----------------------------------
// Update Materials
//----------------------------------

function updateLinkMaterials(link) {

    if (!link) return [];

    const materials = [];

    //----------------------------------
    // Start Node Materials
    //----------------------------------

    const startMaterials =
        link.nodes?.start?.materials || [];

    startMaterials.forEach(material => {

        materials.push({

            ...material,

            Source: "Start Node"

        });

    });

    //----------------------------------
    // End Node Materials
    //----------------------------------

    const endMaterials =
        link.nodes?.end?.materials || [];

    endMaterials.forEach(material => {

        materials.push({

            ...material,

            Source: "End Node"

        });

    });

    //----------------------------------
    // Link Assembly
    //----------------------------------

    const assembly =
        getLinkAssembly(link);

    assembly.forEach(part => {

        materials.push({

            ...part,

            Source: "Assembly"

        });

    });

    //----------------------------------
    // Save
    //----------------------------------

    setLinkMaterials(link, materials);

    return materials;

}

//----------------------------------
// Get Materials
//----------------------------------

function getLinkMaterials(link) {

    if (!link) return [];

    return Array.isArray(link.materials)
        ? link.materials
        : [];

}

//----------------------------------
// Set Materials
//----------------------------------

function setLinkMaterials(link, materials) {

    if (!link) return;

    link.materials = Array.isArray(materials)

        ? [...materials]

        : [];

}

//----------------------------------
// Add Material
//----------------------------------

function addLinkMaterial(link, material) {

    if (!link || !material) return;

    if (!Array.isArray(link.materials)) {

        link.materials = [];

    }

    link.materials.push(material);

}

//----------------------------------
// Clear Materials
//----------------------------------

function clearLinkMaterials(link) {

    if (!link) return;

    link.materials = [];

}
//----------------------------------
// Remove Assembly Material
//----------------------------------

function removeAssemblyMaterial(
    link,
    section,
    index
) {

    switch (section) {

        case "start":

            link.nodes.start.hardware[index] = null;

            break;

        case "end":

            link.nodes.end.hardware[index] = null;

            break;

        default: {

            const part = link.assembly[index];

            if (!part) return;

            part.material = null;
            part.catalog = "";
            part.description = "";

        }

    }

    updateLinkMaterials(link);

    refreshLinkInspector();

}

//----------------------------------
// Expose
//----------------------------------

window.removeAssemblyMaterial =
    removeAssemblyMaterial;
//----------------------------------
// Expose
//----------------------------------

window.updateLinkMaterials = updateLinkMaterials;
window.getLinkMaterials = getLinkMaterials;
window.setLinkMaterials = setLinkMaterials;
window.addLinkMaterial = addLinkMaterial;
window.clearLinkMaterials = clearLinkMaterials;