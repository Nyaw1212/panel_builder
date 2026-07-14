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

    //----------------------------------
    // Assembly Slot
    //----------------------------------

    const part =

        section === "assembly"

            ? link.assembly[index]

            : {};

    //----------------------------------
    // Filter Materials
    //----------------------------------

    const list =
        getAssemblyMaterials();

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

        "Select Material",

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

            //----------------------------------
            // Default Quantity
            //----------------------------------

            let qty = 1;

            const nodeType = String(

                item.NodeType || ""

            ).toUpperCase();

            //----------------------------------
            // Pipe / Wire
            //----------------------------------

            if (

                nodeType === "PIPE" ||

                nodeType === "WIRE"

            ) {

                const value = prompt(

                    `Enter quantity for ${item.CatalogNumber}`,

                    part.qty ?? 1

                );

                //----------------------------------
                // Cancel
                //----------------------------------

                if (value === null) {

                    closeAssemblyPicker();

                    return;

                }

                qty = Number(value);

                //----------------------------------
                // Validate
                //----------------------------------

                if (

                    Number.isNaN(qty) ||

                    qty <= 0

                ) {

                    alert("Please enter a valid quantity.");

                    return;

                }

            }

            //----------------------------------
            // Save Material
            //----------------------------------

            part.material = item;

            part.catalog =
                item.CatalogNumber || "";

            part.description =
                item.Description || "";

            part.qty = qty;

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
// Filter Materials
//----------------------------------

function getAssemblyMaterials() {

    return getMaterials().filter(item =>

        !item.Placeable

    );

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