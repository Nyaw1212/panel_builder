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

        console.warn(
            "Unable to add equipment component without a catalog number.",
            material
        );

        return;

    }

    //----------------------------------
    // Materials
    //----------------------------------

    if (!Array.isArray(equipment.materials)) {

        equipment.materials = [];

    }

    //----------------------------------
    // Add Complete Material Record
    //----------------------------------

    equipment.materials.push({

        CatalogNumber: catalogNumber,

        Description:
            material.Description ??
            material.description ??
            "",

        Type:
            material.Type ??
            material.type ??
            "",

        InventoryCategory:
            material.InventoryCategory ??
            material.inventoryCategory ??
            material.category ??
            "BOS",

        Supplier:
            material.Supplier ??
            material.supplier ??
            "",

        VendorCode:
            material.VendorCode ??
            material.vendorCode ??
            "",

        Price:
            Number(
                material.Price ??
                material.price ??
                0
            ) || 0,

        Qty: 1,

        source: "EQUIPMENT_COMPONENT"

    });

    //----------------------------------
    // Refresh Equipment Modal
    //----------------------------------

    refreshEquipmentCardModal();

    //----------------------------------
    // Refresh Material Views
    //----------------------------------

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
