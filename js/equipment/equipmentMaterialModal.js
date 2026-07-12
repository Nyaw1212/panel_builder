//----------------------------------
// Equipment Material Modal
//----------------------------------

function openEquipmentMaterialModal(item) {

    //----------------------------------
    // Modal
    //----------------------------------

    const modal =

        document.getElementById(

            "equipmentModal"

        );

    if (!modal) {

        console.error(

            "equipmentModal not found."

        );

        return;

    }

    //----------------------------------
    // Show
    //----------------------------------

    modal.style.display = "flex";

    //----------------------------------
    // Render
    //----------------------------------

    renderEquipmentMaterials(item);

    //----------------------------------
    // Debug
    //----------------------------------

    console.group(

        "Equipment Material"

    );

    console.log(

        "Equipment:",

        item

    );

    console.log(

        "Catalog:",

        item.data.CatalogNumber

    );

    console.log(

        "Preset:",

        item.preset

    );

    console.log(

        "Materials:"

    );

    console.table(

        item.materials

    );

    console.groupEnd();

}

//----------------------------------
// Close
//----------------------------------

function closeEquipmentMaterialModal() {

    const modal =

        document.getElementById(

            "equipmentModal"

        );

    if (!modal) {

        return;

    }

    modal.style.display = "none";

}

//----------------------------------
// Expose
//----------------------------------

window.openEquipmentMaterialModal =
    openEquipmentMaterialModal;

window.closeEquipmentMaterialModal =
    closeEquipmentMaterialModal;