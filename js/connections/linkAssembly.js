//----------------------------------
// Update Assembly
//----------------------------------

function updateLinkAssembly(link) {

    if (!link) return [];

    const assembly = [];

    //----------------------------------
    // Create Generic Fittings
    //----------------------------------

    for (let i = 0; i < 10; i++) {

        assembly.push({

            id: crypto.randomUUID(),

            type: "Fitting",

            slot: i + 1,

            catalog: "",

            description: "",

            material: null,

            editable: true

        });

    }

    //----------------------------------
    // Preserve Existing Selections
    //----------------------------------

    if (Array.isArray(link.assembly)) {

        assembly.forEach((part, index) => {

            const existing = link.assembly[index];

            if (!existing) return;

            part.catalog = existing.catalog || "";

            part.description = existing.description || "";

            part.material = existing.material || null;

        });

    }

    link.assembly = assembly;

    return assembly;

}

//----------------------------------
// Get Assembly
//----------------------------------

function getLinkAssembly(link) {

    return Array.isArray(link?.assembly)

        ? link.assembly

        : [];

}

//----------------------------------
// Set Assembly
//----------------------------------

function setLinkAssembly(link, assembly) {

    if (!link) return;

    link.assembly = Array.isArray(assembly)

        ? [...assembly]

        : [];

}

//----------------------------------
// Update One Part
//----------------------------------

function updateAssemblyPart(

    link,

    index,

    values

) {

    if (!link) return;

    const part = link.assembly[index];

    if (!part) return;

    Object.assign(part, values);

}

//----------------------------------
// Get One Part
//----------------------------------

function getAssemblyPart(

    link,

    index

) {

    if (!link) return null;

    return link.assembly[index] || null;

}

//----------------------------------
// Clear Assembly
//----------------------------------

function clearLinkAssembly(link) {

    if (!link) return;

    link.assembly = [];

}

//----------------------------------
// Expose
//----------------------------------

window.updateLinkAssembly = updateLinkAssembly;
window.getLinkAssembly = getLinkAssembly;
window.setLinkAssembly = setLinkAssembly;
window.updateAssemblyPart = updateAssemblyPart;
window.getAssemblyPart = getAssemblyPart;
window.clearLinkAssembly = clearLinkAssembly;