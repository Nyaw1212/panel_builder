//----------------------------------
// Modal
//----------------------------------

const modal = document.getElementById("equipmentModal");
const modalList = document.getElementById("modalList");
const modalSearch = document.getElementById("modalSearch");
const closeModal = document.getElementById("closeModal");

//----------------------------------
// Filter UI
//----------------------------------

const modalFilters =
    document.getElementById("modalFilters");

const equipmentFilters =
    document.getElementById("equipmentFilters");

//----------------------------------
// State
//----------------------------------

let modalMode = "equipment";
let modalTitle = "Place Node";
let modalSource = [];
let modalOnSelect = null;
let modalOnClose = null;
let modalPickerOptions = {};

let currentCell = null;
let currentConnection = null;

//----------------------------------
// Material Modal History
//----------------------------------

let materialModalUndoStack = [];
let materialModalRedoStack = [];
let materialModalCaptureTimer = null;
let materialModalRestoring = false;
let materialModalHistoryConnection = null;

function cloneModalHardware(hardware) {

    const value =
        Array.isArray(hardware)
            ? hardware
            : [];

    if (typeof structuredClone === "function") {
        return structuredClone(value);
    }

    return JSON.parse(
        JSON.stringify(value)
    );

}

function serializeModalHardware(hardware) {

    return JSON.stringify(
        Array.isArray(hardware)
            ? hardware
            : []
    );

}

function resetMaterialModalHistory(connection) {

    clearTimeout(materialModalCaptureTimer);
    materialModalCaptureTimer = null;

    materialModalHistoryConnection =
        connection || null;

    materialModalUndoStack = [];
    materialModalRedoStack = [];

    if (!materialModalHistoryConnection) {
        return;
    }

    materialModalUndoStack.push(
        cloneModalHardware(
            materialModalHistoryConnection.hardware
        )
    );

}

function captureMaterialModalHistoryNow() {

    clearTimeout(materialModalCaptureTimer);
    materialModalCaptureTimer = null;

    if (
        materialModalRestoring ||
        !materialModalHistoryConnection
    ) {
        return false;
    }

    const state =
        cloneModalHardware(
            materialModalHistoryConnection.hardware
        );

    const previous =
        materialModalUndoStack[
            materialModalUndoStack.length - 1
        ];

    if (
        previous &&
        serializeModalHardware(previous) ===
        serializeModalHardware(state)
    ) {
        return false;
    }

    materialModalUndoStack.push(state);
    materialModalRedoStack = [];

    return true;

}

function scheduleMaterialModalHistoryCapture() {

    if (
        materialModalRestoring ||
        !materialModalHistoryConnection
    ) {
        return;
    }

    clearTimeout(materialModalCaptureTimer);

    materialModalCaptureTimer = setTimeout(
        captureMaterialModalHistoryNow,
        0
    );

}

function refreshMaterialModalAfterHistory() {

    if (
        modalMode === "material" &&
        typeof buildModalList === "function"
    ) {
        buildModalList(
            modalSearch?.value || ""
        );
    }

    if (typeof drawCanvas === "function") {
        drawCanvas();
    }

}

function restoreMaterialModalHistory(state) {

    if (!materialModalHistoryConnection) {
        return false;
    }

    materialModalRestoring = true;

    try {
        materialModalHistoryConnection.hardware =
            cloneModalHardware(state);

        refreshMaterialModalAfterHistory();

        return true;
    }
    finally {
        materialModalRestoring = false;
    }

}

function undoMaterialModal() {

    captureMaterialModalHistoryNow();

    if (materialModalUndoStack.length <= 1) {
        return false;
    }

    const current =
        materialModalUndoStack.pop();

    materialModalRedoStack.push(current);

    return restoreMaterialModalHistory(
        materialModalUndoStack[
            materialModalUndoStack.length - 1
        ]
    );

}

function redoMaterialModal() {

    clearTimeout(materialModalCaptureTimer);
    materialModalCaptureTimer = null;

    if (materialModalRedoStack.length === 0) {
        return false;
    }

    const state =
        materialModalRedoStack.pop();

    if (!restoreMaterialModalHistory(state)) {
        materialModalRedoStack.push(state);
        return false;
    }

    materialModalUndoStack.push(
        cloneModalHardware(state)
    );

    return true;

}

function isMaterialModalVisible() {

    if (
        modalMode !== "material" ||
        !modal
    ) {
        return false;
    }

    const style =
        window.getComputedStyle(modal);

    return (
        style.display !== "none" &&
        style.visibility !== "hidden" &&
        modal.getClientRects().length > 0
    );

}

function installMaterialModalHistoryHooks() {

    if (
        window.__materialModalHistoryHooksInstalled
    ) {
        return;
    }

    const originalAddHardware =
        window.addHardware;

    const originalRemoveHardware =
        window.removeHardware;

    const originalClearHardware =
        window.clearHardware;

    if (typeof originalAddHardware === "function") {
        window.addHardware = function (...args) {
            const result =
                originalAddHardware.apply(
                    this,
                    args
                );

            if (
                args[0] === materialModalHistoryConnection
            ) {
                scheduleMaterialModalHistoryCapture();
            }

            return result;
        };
    }

    if (typeof originalRemoveHardware === "function") {
        window.removeHardware = function (...args) {
            const result =
                originalRemoveHardware.apply(
                    this,
                    args
                );

            if (
                args[0] === materialModalHistoryConnection
            ) {
                scheduleMaterialModalHistoryCapture();
            }

            return result;
        };
    }

    if (typeof originalClearHardware === "function") {
        window.clearHardware = function (...args) {
            const result =
                originalClearHardware.apply(
                    this,
                    args
                );

            if (
                args[0] === materialModalHistoryConnection
            ) {
                scheduleMaterialModalHistoryCapture();
            }

            return result;
        };
    }

    window.__materialModalHistoryHooksInstalled =
        true;

}

window.addEventListener(
    "load",
    installMaterialModalHistoryHooks
);

document.addEventListener(
    "keydown",
    event => {

        if (
            event.repeat ||
            !isMaterialModalVisible()
        ) {
            return;
        }

        const modifier =
            event.ctrlKey ||
            event.metaKey;

        if (!modifier) {
            return;
        }

        const key =
            String(event.key || "")
                .toLowerCase();

        if (
            key === "z" &&
            !event.shiftKey
        ) {
            event.preventDefault();
            event.stopImmediatePropagation();

            undoMaterialModal();
            return;
        }

        if (
            key === "y" ||
            (
                key === "z" &&
                event.shiftKey
            )
        ) {
            event.preventDefault();
            event.stopImmediatePropagation();

            redoMaterialModal();
        }

    },
    true
);

//----------------------------------
// Close
//----------------------------------

function closeActiveModal() {

    if (
        typeof getCurrentEquipment === "function" &&
        getCurrentEquipment() &&
        typeof closeEquipmentCardModal === "function"
    ) {

        closeEquipmentCardModal();

        return;

    }

    modal.style.display = "none";

    const onClose = modalOnClose;
    modalOnClose = null;

    if (typeof onClose === "function") {
        onClose();
    }

}

closeModal.onclick = closeActiveModal;

modal.onclick = e => {

    if (e.target === modal) {

        closeActiveModal();

    }

};

//----------------------------------
// Generic Picker
//----------------------------------

function openPickerModal(

    title,

    source,

    callback,

    options = {}

) {

    modalMode = "picker";

    modalTitle = title;

    modalSource = source || [];

    modalOnSelect = callback || null;
    modalOnClose = options.onClose || null;
    modalPickerOptions = options;

    currentCell = null;

    currentConnection = null;

    modalSearch.value = "";

    if (modalFilters) {
        modalFilters.style.display = options.materialFilters
            ? "grid"
            : "none";
    }

    if (equipmentFilters) {
        equipmentFilters.style.display = "none";
    }

    document.querySelector(
        ".modal-header h2"
    ).textContent = title;

    if (options.materialFilters) {
        if (typeof resetModalFilters === "function") {
            resetModalFilters();
        }

        if (
            options.category &&
            typeof setModalCategory === "function"
        ) {
            setModalCategory(options.category);
        }

        if (typeof buildFilterChips === "function") {
            buildFilterChips(
                typeof getHardwareModalList === "function"
                    ? getHardwareModalList(modalSource)
                    : modalSource
            );
        }
    }

    buildModalList();

    modal.style.display = "flex";

}

//----------------------------------
// Equipment
//----------------------------------

function openModal(index) {

    modalMode = "equipment";

    modalTitle = "Place Node";

    modalSource = equipment;

    modalOnSelect = null;
    modalOnClose = null;
    modalPickerOptions = {};

    currentCell = index;

    currentConnection = null;

    modalSearch.value = "";

    if (modalFilters) {
        modalFilters.style.display = "none";
    }

    if (equipmentFilters) {
        equipmentFilters.style.display = "none";
    }

    document.querySelector(
        ".modal-header h2"
    ).textContent = modalTitle;

    buildModalList();

    modal.style.display = "flex";

}

//----------------------------------
// Connection Hardware
//----------------------------------

async function openMaterialModal(connection, options = {}) {

    modalMode = "material";

    modalTitle = options.title || "Connection Hardware";

    modalSource = Array.isArray(options.source)
        ? options.source
        : await getMaterials();

    modalOnSelect = null;
    modalOnClose = options.onClose || null;
    modalPickerOptions = options;

    currentConnection = connection;

    currentCell = null;

    modalSearch.value = "";

    resetMaterialModalHistory(connection);

    if (modalFilters) {
        modalFilters.style.display = "grid";
    }

    if (equipmentFilters) {
        equipmentFilters.style.display = "none";
    }

    if (typeof resetModalFilters === "function") {
        resetModalFilters();
    }

    if (
        options.category &&
        typeof setModalCategory === "function"
    ) {
        setModalCategory(options.category);
    }

    if (typeof buildFilterChips === "function") {
        buildFilterChips(
            getHardwareModalList(
                modalSource
            )
        );
    }

    document.querySelector(
        ".modal-header h2"
    ).textContent = modalTitle;

    buildModalList();

    modal.style.display = "flex";

}

//----------------------------------
// Build
//----------------------------------

function buildModalList(searchText = "") {

    modalList.innerHTML = "";

    if (modalMode === "material") {
        buildHardwarePanel();
    }

    let list = [...modalSource];

    if (modalMode === "equipment") {
        list = getEquipmentModalList(list);
    }
    else if (
        modalMode === "material" ||
        (modalMode === "picker" && modalPickerOptions.materialFilters)
    ) {

        list = getHardwareModalList(list);

        if (typeof applyModalFilters === "function") {
            list = applyModalFilters(list);
        }

        list.sort((a, b) => {

            const priorityA =
                Number(a.Favorite || 0);

            const priorityB =
                Number(b.Favorite || 0);

            if (priorityA !== priorityB) {
                return priorityB - priorityA;
            }

            return (
                a.CatalogNumber || ""
            ).localeCompare(
                b.CatalogNumber || ""
            );

        });

    }

    list = filterModalSearch(
        list,
        searchText
    );

    renderModalCards(list);

}

//----------------------------------
// Search
//----------------------------------

modalSearch.addEventListener(

    "input",

    () => {

        if (
            typeof getCurrentEquipment === "function" &&
            getCurrentEquipment() &&
            typeof renderEquipmentComponents === "function"
        ) {

            renderEquipmentComponents();

            return;

        }

        buildModalList(
            modalSearch.value
        );

    }

);

//----------------------------------
// Expose
//----------------------------------

window.openModal = openModal;
window.openMaterialModal = openMaterialModal;
window.openPickerModal = openPickerModal;
window.closeActiveModal = closeActiveModal;
window.buildModalList = buildModalList;

window.undoMaterialModal = undoMaterialModal;
window.redoMaterialModal = redoMaterialModal;
window.resetMaterialModalHistory = resetMaterialModalHistory;
window.captureMaterialModalHistoryNow = captureMaterialModalHistoryNow;
