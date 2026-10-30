//----------------------------------
// Current Equipment
//----------------------------------

let currentEquipment = null;

function openPanelCircuitEditor(item) {

    if (!item) return;

    currentEquipment = item;

    if (typeof resetPanelCircuitSelection === "function") {
        resetPanelCircuitSelection();
    }

    const modal = document.getElementById("equipmentModal");
    if (!modal) {
        console.error("equipmentModal not found.");
        return;
    }

    if (typeof setModalHeaderAction === "function") {
        setModalHeaderAction(null);
    }

    document.getElementById("modalFilters").style.display = "none";
    document.getElementById("equipmentFilters").style.display = "grid";

    const search = document.getElementById("modalSearch");
    if (search) search.value = "";
    buildEquipmentComponentChips();
    renderEquipmentComponents();
    modal.style.display = "flex";

}

//----------------------------------
// Open
//----------------------------------

function openEquipmentCardModal(item) {

    const lDiscMatch =
        typeof isLDiscMaterialCard === "function" &&
        isLDiscMaterialCard(item);
    const meterMatch =
        typeof isMeterMaterialCard === "function" &&
        isMeterMaterialCard(item);
    const hDiscMatch =
        typeof isHDiscMaterialCard === "function" &&
        isHDiscMaterialCard(item);
    const mdpMatch =
        typeof isMDPMaterialCard === "function" &&
        isMDPMaterialCard(item);
    const gutterMatch =
        typeof isGutterMaterialCard === "function" &&
        isGutterMaterialCard(item);
    const boxMatch =
        typeof isBoxMaterialCard === "function" &&
        isBoxMaterialCard(item);
    const sonPlusMatch =
        typeof isSonPlusMaterialCard === "function" &&
        isSonPlusMaterialCard(item);

    console.group("[Equipment card click]");
    console.log("Canvas item:", item);
    console.log("Target values:", {
        id: item?.id || "",
        preset: item?.preset || "",
        dataPreset: item?.data?.PRESET || item?.data?.Preset || "",
        catalogNumber: item?.data?.CatalogNumber || "",
        nodeType: item?.data?.NodeType || "",
        isLDisc: lDiscMatch,
        isMeter: meterMatch,
        isHDisc: hDiscMatch,
        isMDP: mdpMatch,
        isGutter: gutterMatch,
        isBox: boxMatch,
        isSonPlus: sonPlusMatch
    });
    console.groupEnd();

    // The L-DISC picker applies a preset directly, so it needs the same
    // live target reference as the normal component editor.
    currentEquipment = item;

    // SON+ is a full PRESETS assembly. Applying its replacement follows the
    // same path as MDP: it keeps the canvas item/link identity but replaces
    // data and every BOM material, including the L30303 pad.
    if (
        sonPlusMatch &&
        typeof openSonPlusMaterialPicker === "function"
    ) {

        openSonPlusMaterialPicker(item);

        return;

    }

    //----------------------------------
    // L-DISC Material Picker
    //
    // L-DISC is a preset assembly, not a panel component.  Opening the
    // component editor here used to show the unrelated breaker library.
    //----------------------------------

    if (
        lDiscMatch &&
        typeof openLDiscMaterialPicker === "function"
    ) {

        openLDiscMaterialPicker(item);

        return;

    }

    if (
        hDiscMatch &&
        typeof openHDiscMaterialPicker === "function"
    ) {

        openHDiscMaterialPicker(item);

        return;

    }

    if (
        mdpMatch &&
        typeof openMDPMaterialPicker === "function"
    ) {

        openMDPMaterialPicker(item);

        return;

    }

    if (
        gutterMatch &&
        typeof openGutterMaterialPicker === "function"
    ) {

        openGutterMaterialPicker(item);

        return;

    }

    if (
        boxMatch &&
        typeof openBoxMaterialPicker === "function"
    ) {

        openBoxMaterialPicker(item);

        return;

    }

    if (
        meterMatch &&
        typeof openMeterMaterialPicker === "function"
    ) {

        openMeterMaterialPicker(item);

        return;

    }

    openPanelCircuitEditor(item);

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

    const search = document.getElementById("modalSearch");
    if (search) search.value = "";

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

window.openPanelCircuitEditor =
    openPanelCircuitEditor;

window.refreshEquipmentCardModal =
    refreshEquipmentCardModal;

window.closeEquipmentCardModal =
    closeEquipmentCardModal;

window.getCurrentEquipment =
    getCurrentEquipment;
