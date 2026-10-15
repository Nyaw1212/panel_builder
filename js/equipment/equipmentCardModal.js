//----------------------------------
// Current Equipment
//----------------------------------

let currentEquipment = null;

//----------------------------------
// Open
//----------------------------------

function openEquipmentCardModal(item) {

    //----------------------------------
    // L-DISC Material Picker
    //
    // L-DISC is a preset assembly, not a panel component.  Opening the
    // component editor here used to show the unrelated breaker library.
    //----------------------------------

    if (
        typeof isLDiscMaterialCard === "function" &&
        isLDiscMaterialCard(item) &&
        typeof openLDiscMaterialPicker === "function"
    ) {

        openLDiscMaterialPicker(item);

        return;

    }

    //----------------------------------
    // Store
    //----------------------------------

    currentEquipment = item;

    if (typeof resetPanelCircuitSelection === "function") {

        resetPanelCircuitSelection();

    }

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

    modal.classList.remove(
        "equipment-circuit-mode",
        "disconnect-preset-mode"
    );

    modal.querySelectorAll(
        ".panelboard, .disconnect-editor"
    ).forEach(node => node.remove());

    const filterPanel = modal.querySelector(".filter-panel");

    if (filterPanel) {

        filterPanel.style.display = "";

    }

    const modalList = document.getElementById("modalList");

    if (modalList) {

        modalList.className = "";

    }

    if (typeof resetPanelCircuitSelection === "function") {

        resetPanelCircuitSelection();

    }

    currentEquipment = null;

}

//----------------------------------
// Current Equipment
//----------------------------------

function getCurrentEquipment() {

    if (
        currentEquipment?.id &&
        typeof getLayout === "function"
    ) {

        const liveEquipment =
            getLayout().find(
                item =>
                    item?.id ===
                    currentEquipment.id
            );

        if (liveEquipment) {

            currentEquipment =
                liveEquipment;

        }

    }

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
