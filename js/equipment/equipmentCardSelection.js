//----------------------------------
// Add Component
//----------------------------------

function addEquipmentComponent(material) {

    //----------------------------------
    // Equipment
    //----------------------------------

    const equipment =
        getCurrentEquipment();

    if (!equipment) {

        return;

    }

    //----------------------------------
    // Materials
    //----------------------------------

    if (!Array.isArray(equipment.materials)) {

        equipment.materials = [];

    }

    //----------------------------------
    // Add
    //----------------------------------

    equipment.materials.push({

        catalogNumber:
            material.CatalogNumber,

        qty: 1

    });

    //----------------------------------
    // Refresh
    //----------------------------------

    refreshEquipmentCardModal();

    //----------------------------------
    // Debug
    //----------------------------------

    console.group("Equipment Component Added");

    console.log(
        "Equipment:",
        equipment.data.CatalogNumber
    );

    console.log(
        "Added:",
        material.CatalogNumber
    );

    console.table(
        equipment.materials
    );

    console.groupEnd();

}

//----------------------------------
// Expose
//----------------------------------

window.addEquipmentComponent =
    addEquipmentComponent;