//----------------------------------
// Assembly Picker
//----------------------------------

let editingAssemblyLink = null;

let editingAssemblySection = "";

let editingAssemblyIndex = -1;

//----------------------------------
// Open
//----------------------------------

function openAssemblyPicker(
    link,
    section,
    index
) {

    if (!link) return;

    editingAssemblyLink = link;

    editingAssemblySection = section;

    editingAssemblyIndex = index;

    let part;

    switch (section) {

        case "start":

            part = {

                type: "HARDWARE"

            };

            break;

        case "end":

            part = {

                type: "HARDWARE"

            };

            break;

        default:

            part = link.assembly[index];

            break;

    }

    if (!part) return;

    //----------------------------------
// Filter Materials
//----------------------------------

const list =
    getAssemblyMaterials(part);

console.log("========== Assembly Picker ==========");

console.log("Section:", section);

console.log("Part:", part);

console.log("Materials Loaded:", getMaterials().length);

console.log("Filtered List:", list);

console.log("=====================================");

    //----------------------------------
    // Open Modal
    //----------------------------------

    openPickerModal(

        `Select ${part.type}`,

        list,

        selectAssemblyMaterial

    );

}

//----------------------------------
// Select
//----------------------------------

function selectAssemblyMaterial(item) {

    if (!editingAssemblyLink) return;

    switch (editingAssemblySection) {

        //----------------------------------
        // Start Hardware
        //----------------------------------

        case "start":

            editingAssemblyLink
                .nodes
                .start
                .hardware[
                    editingAssemblyIndex
                ] = item;

            break;

        //----------------------------------
        // End Hardware
        //----------------------------------

        case "end":

            editingAssemblyLink
                .nodes
                .end
                .hardware[
                    editingAssemblyIndex
                ] = item;

            break;

        //----------------------------------
        // Link Assembly
        //----------------------------------

        default: {

            const part =
                editingAssemblyLink
                    .assembly[
                        editingAssemblyIndex
                    ];

            if (!part) return;

            part.material = item;

            part.catalog =
                item.CatalogNumber || "";

            part.description =
                item.Description || "";

        }

    }

    //----------------------------------
    // Refresh
    //----------------------------------

    updateLinkMaterials(
        editingAssemblyLink
    );

    refreshLinkInspector();

    closeAssemblyPicker();

}

//----------------------------------
// Filter
//----------------------------------

function getAssemblyMaterials(part) {

    const type =
        String(part.type || "")
            .toUpperCase();

    return getMaterials().filter(item => {

        const nodeType =
            String(item.NodeType || "")
                .toUpperCase();

        //----------------------------------
        // Generic Hardware
        //----------------------------------

        if (type === "HARDWARE") {

            return [

                "CONNECTOR",
                "COUPLING",
                "HUB",
                "LOCKNUT"

            ].includes(nodeType);

        }

        //----------------------------------
        // Connector
        //----------------------------------

        if (type === "CONNECTOR") {

            return nodeType === "CONNECTOR";

        }

        //----------------------------------
        // Coupling
        //----------------------------------

        if (type === "COUPLING") {

            return nodeType === "COUPLING";

        }

        //----------------------------------
        // Hub
        //----------------------------------

        if (type === "HUB") {

            return nodeType === "HUB";

        }

        //----------------------------------
        // Locknut
        //----------------------------------

        if (type === "LOCKNUT") {

            return nodeType === "LOCKNUT";

        }

        //----------------------------------
        // LB
        //----------------------------------

        if (type === "LB") {

            return nodeType === "LB";

        }

        //----------------------------------
        // LL
        //----------------------------------

        if (type === "LL") {

            return nodeType === "LL";

        }

        //----------------------------------
        // LR
        //----------------------------------

        if (type === "LR") {

            return nodeType === "LR";

        }

        //----------------------------------
        // T
        //----------------------------------

        if (type === "T") {

            return nodeType === "T";

        }

        //----------------------------------
        // Conduit
        //----------------------------------

        if (type === "CONDUIT") {

            return String(item.Type || "")
                .toUpperCase() === "CONDUIT";

        }

        //----------------------------------
        // Generic Fitting
        //----------------------------------

        if (type === "FITTING") {

            return String(item.Type || "")
                .toUpperCase() === "FITTING";

        }

        return false;

    });

}

//----------------------------------
// Close
//----------------------------------

function closeAssemblyPicker() {

    editingAssemblyLink = null;

    editingAssemblySection = "";

    editingAssemblyIndex = -1;

}

//----------------------------------
// Expose
//----------------------------------

window.openAssemblyPicker =
    openAssemblyPicker;

window.closeAssemblyPicker =
    closeAssemblyPicker;

window.getAssemblyMaterials =
    getAssemblyMaterials;

window.selectAssemblyMaterial =
    selectAssemblyMaterial;