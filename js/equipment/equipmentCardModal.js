//----------------------------------
// Current Equipment
//----------------------------------

let currentEquipment = null;

//----------------------------------
// Open
//----------------------------------

function openEquipmentCardModal(item) {

    //----------------------------------
    // Store
    //----------------------------------

    currentEquipment = item;

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
    // Filters
    //----------------------------------

    document.getElementById(
        "modalFilters"
    ).style.display = "none";

    document.getElementById(
        "equipmentFilters"
    ).style.display = "grid";

    //----------------------------------
    // Build Filters FIRST
    //----------------------------------

    buildEquipmentComponentChips();

    //----------------------------------
    // Render Library
    //----------------------------------

    renderEquipmentComponents();

    //----------------------------------
    // Show
    //----------------------------------

    modal.style.display = "flex";

}

//----------------------------------
// Refresh
//----------------------------------

function refreshEquipmentCardModal() {

    if (!currentEquipment) {

        return;

    }

    buildEquipmentComponentChips();

    renderEquipmentComponents();

}

//----------------------------------
// Close
//----------------------------------

function closeEquipmentCardModal() {

    const modal =
        document.getElementById(
            "equipmentModal"
        );

    if (!modal) {

        return;

    }

    //----------------------------------
    // Restore Filters
    //----------------------------------

    document.getElementById(
        "modalFilters"
    ).style.display = "grid";

    document.getElementById(
        "equipmentFilters"
    ).style.display = "none";

    //----------------------------------
    // Hide
    //----------------------------------

    modal.style.display = "none";

    currentEquipment = null;

}

//----------------------------------
// Current Equipment
//----------------------------------

function getCurrentEquipment() {

    return currentEquipment;

}

//----------------------------------
// Expose
//----------------------------------

window.openEquipmentCardModal =
    openEquipmentCardModal;

window.refreshEquipmentCardModal =
    refreshEquipmentCardModal;

window.closeEquipmentCardModal =
    closeEquipmentCardModal;

window.getCurrentEquipment =
    getCurrentEquipment;