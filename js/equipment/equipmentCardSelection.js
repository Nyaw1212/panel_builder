//----------------------------------
// Add Component
//----------------------------------

function addEquipmentComponent(material) {

    //----------------------------------
    // Equipment
    //----------------------------------

    const equipment =
        getCurrentEquipment();

    if (!equipment || !material) {

        return;

    }

    //----------------------------------
    // Catalog Number
    //----------------------------------

    const catalogNumber = String(

        material.CatalogNumber ??
        material.catalogNumber ??
        ""

    ).trim();

    if (!catalogNumber) {

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

        catalogNumber,

        description:
            material.Description ??
            material.description ??
            "",

        inventoryCategory:
            material.InventoryCategory ??
            material.inventoryCategory ??
            material.category ??
            "BOS",

        qty: 1

    });

    //----------------------------------
    // Refresh
    //----------------------------------

    refreshEquipmentCardModal();

    if (
        window.MaterialDebugPanelV2 &&
        typeof window.MaterialDebugPanelV2.refresh === "function"
    ) {

        window.MaterialDebugPanelV2.refresh();

    }

    if (typeof window.renderBOM === "function") {

        window.renderBOM();

    }

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
        catalogNumber
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
