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

function setModalHeaderAction(action) {

    const header = modal?.querySelector(".modal-header");
    if (!header) return;

    header.querySelector(".modal-header-action")?.remove();

    if (!action?.label || typeof action.onClick !== "function") {
        return;
    }

    const button = document.createElement("button");
    button.type = "button";
    button.className = "modal-header-action";
    button.textContent = action.label;
    button.title = action.title || action.label;
    button.addEventListener("click", event => {
        event.preventDefault();
        action.onClick(event);
    });

    header.insertBefore(button, closeModal);

}

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

    setModalHeaderAction(options.headerAction);

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

    setModalHeaderAction(null);

    buildModalList();

    modal.style.display = "flex";

}

//----------------------------------
// Connection Hardware
//----------------------------------

async function openMaterialModal(connection, options = {}) {

    modalMode = "material";

    modalTitle = options.title || "Connection Hardware";

    modalSource = await getMaterials();

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

    setModalHeaderAction(null);

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

    const usePresetMatrix = modalMode === "picker" &&
        modalPickerOptions.presetMatrix === true;
    const useConduitMatrix = modalMode === "picker" &&
        modalPickerOptions.conduitMatrix === true;

    modalList.classList.toggle(
        "preset-picker-matrix-list",
        usePresetMatrix
    );
    modalList.classList.toggle(
        "conduit-picker-matrix-list",
        useConduitMatrix
    );

    if (usePresetMatrix) {
        renderDisconnectPresetMatrix(list);
        return;
    }

    if (useConduitMatrix) {
        renderConduitPickerMatrix(list);
        return;
    }

    renderModalCards(list);

}

function getDisconnectPresetMatrixType(preset) {

    const values = [
        preset?.PresetType,
        preset?.NodeType,
        preset?.Type,
        preset?.Category,
        preset?.System,
        preset?.Material,
        preset?.Description
    ]
        .filter(Boolean)
        .join(" ")
        .replace(/[^A-Z0-9]/gi, "")
        .toUpperCase();

    return values.includes("HDISC") ? "H" : "L";

}

function getDisconnectPresetMatrixColumn(preset) {

    const code = String(
        preset?.PickerCardCode ||
        preset?.presetCode ||
        preset?.Code ||
        ""
    )
        .trim()
        .toUpperCase();

    if (code.startsWith("3")) return "3";
    if (code.startsWith("D")) return "D";
    if (code.startsWith("E")) return "E";
    if (code.startsWith("F") || code.startsWith("NF")) return "F";

    return "Other";

}

function getDisconnectPresetMatrixRating(preset) {

    const code = String(
        preset?.PickerCardCode ||
        preset?.presetCode ||
        preset?.Code ||
        ""
    );
    const codeMatch = code.match(/(\d+)(?!.*\d)/);
    const rating = Number(
        codeMatch?.[1] ||
        preset?.Rating ||
        preset?.Amps ||
        0
    );

    return Number.isFinite(rating) ? rating : 0;

}

function selectDisconnectPresetFromMatrix(preset) {

    if (typeof modalOnSelect === "function") {
        modalOnSelect(preset);
    }

    closeActiveModal();

}

function renderDisconnectPresetMatrix(list) {

    modalList.innerHTML = "";

    const columns = ["3", "D", "E", "F"];
    const entries = (Array.isArray(list) ? list : []).map(preset => ({
        preset,
        type: getDisconnectPresetMatrixType(preset),
        column: getDisconnectPresetMatrixColumn(preset),
        rating: getDisconnectPresetMatrixRating(preset),
        code: String(
            preset?.PickerCardCode ||
            preset?.presetCode ||
            preset?.Code ||
            ""
        ).trim()
    }));
    const hasOther = entries.some(entry => entry.column === "Other");

    if (hasOther) columns.push("Other");

    const rowsByKey = new Map();
    entries.forEach(entry => {
        const key = `${entry.type}:${entry.rating}`;
        if (!rowsByKey.has(key)) {
            rowsByKey.set(key, {
                type: entry.type,
                rating: entry.rating,
                cells: new Map()
            });
        }

        const row = rowsByKey.get(key);
        const cell = row.cells.get(entry.column) || [];
        cell.push(entry);
        row.cells.set(entry.column, cell);
    });

    const rows = Array.from(rowsByKey.values()).sort((left, right) => {
        return right.rating - left.rating ||
            left.type.localeCompare(right.type);
    });

    if (!rows.length) {
        const empty = document.createElement("div");
        empty.className = "preset-matrix-empty";
        empty.textContent = "No matching presets found.";
        modalList.appendChild(empty);
        return;
    }

    const table = document.createElement("table");
    table.className = "preset-picker-matrix";
    table.setAttribute("aria-label", "Disconnect preset choices");

    const head = table.createTHead();
    const headRow = head.insertRow();
    ["Type", "Rating", ...columns].forEach(label => {
        const cell = document.createElement("th");
        cell.scope = "col";
        cell.textContent = label;
        headRow.appendChild(cell);
    });

    const body = table.createTBody();
    rows.forEach(row => {
        const tableRow = body.insertRow();
        const typeCell = tableRow.insertCell();
        typeCell.className = "preset-matrix-type";
        typeCell.textContent = row.type;

        const ratingCell = tableRow.insertCell();
        ratingCell.className = "preset-matrix-rating";
        ratingCell.textContent = row.rating ? `${row.rating}A` : "—";

        columns.forEach(column => {
            const cell = tableRow.insertCell();
            cell.className = "preset-matrix-choice";
            const choices = (row.cells.get(column) || [])
                .sort((left, right) => left.code.localeCompare(right.code));

            choices.forEach(entry => {
                const button = document.createElement("button");
                button.type = "button";
                button.className = "preset-matrix-button";
                button.textContent = entry.code || "Select";
                button.title = [
                    entry.code,
                    entry.preset?.Description,
                    entry.preset?.CatalogNumber
                ].filter(Boolean).join(" — ");
                button.addEventListener("click", () =>
                    selectDisconnectPresetFromMatrix(entry.preset)
                );
                cell.appendChild(button);
            });
        });
    });

    modalList.appendChild(table);

}

function getConduitMatrixType(item) {

    const color = String(item?.Color || "").trim().toUpperCase();
    const description = String(item?.Description || "").toUpperCase();

    if (color === "EMT" || description.includes(" EMT ")) return "EMT";
    if (color === "PVC" || description.includes(" PVC ")) return "PVC";
    if (color === "LT" || description.includes(" L/T")) return "LT";

    return "";

}

function getConduitMatrixSize(item) {

    return String(item?.Size || "")
        .trim()
        .replace(/\s+/g, "")
        .replace("1-/1/2", "1-1/2");

}

function selectConduitFromMatrix(item) {

    if (typeof modalOnSelect === "function") {
        modalOnSelect(item);
    }

    closeActiveModal();

}

function buildConduitMatrixChoice(item) {

    const button = document.createElement("button");
    button.type = "button";
    button.className = "conduit-matrix-choice";
    button.title = [
        item?.CatalogNumber,
        item?.Description
    ].filter(Boolean).join(" — ");

    const imageWrap = document.createElement("span");
    imageWrap.className = "conduit-matrix-image material-card-image-wrap";

    const localImage = typeof getModalLocalImage === "function"
        ? getModalLocalImage(item)
        : "";
    const driveImage = typeof getModalDriveImage === "function"
        ? getModalDriveImage(item)
        : "";
    const placeholderImage = "images/placeholder.png";
    const image = document.createElement("img");
    image.className = "conduit-matrix-image-element material-card-image";
    image.src = localImage || driveImage || placeholderImage;
    image.alt = String(item?.Description || item?.CatalogNumber || "Conduit");
    image.loading = "lazy";
    image.dataset.fallbackStage = localImage ? "0" : driveImage ? "1" : "2";
    image.dataset.driveImage = driveImage;
    image.dataset.placeholderImage = placeholderImage;

    if (typeof handleModalMaterialImageError === "function") {
        image.addEventListener("error", handleModalMaterialImageError);
    }

    imageWrap.appendChild(image);

    const code = document.createElement("span");
    code.className = "conduit-matrix-code";
    code.textContent = String(item?.PickerCardCode || item?.CatalogNumber || "Select");

    button.append(imageWrap, code);
    button.addEventListener("click", () => selectConduitFromMatrix(item));

    return button;

}

function renderConduitPickerMatrix(list) {

    modalList.innerHTML = "";

    const entries = (Array.isArray(list) ? list : [])
        .map(item => ({
            item,
            type: getConduitMatrixType(item),
            size: getConduitMatrixSize(item)
        }))
        .filter(entry => entry.type && entry.size);

    if (!entries.length) {
        const empty = document.createElement("div");
        empty.className = "preset-matrix-empty";
        empty.textContent = "No matching conduit materials found.";
        modalList.appendChild(empty);
        return;
    }

    const preferredSizes = ["2\"", "1\"", "3/4\""];
    const allSizes = [...new Set(entries.map(entry => entry.size))];
    const sizes = [
        ...preferredSizes.filter(size => allSizes.includes(size)),
        ...allSizes
            .filter(size => !preferredSizes.includes(size))
            .sort((left, right) => left.localeCompare(right, undefined, { numeric: true }))
    ];
    const types = ["EMT", "PVC", "LT"];
    const choices = new Map();

    entries.forEach(entry => {
        const key = `${entry.type}:${entry.size}`;
        const current = choices.get(key);
        const currentPriority = Number(current?.Favorite || 0);
        const nextPriority = Number(entry.item?.Favorite || 0);

        if (!current || nextPriority > currentPriority) {
            choices.set(key, entry.item);
        }
    });

    const table = document.createElement("table");
    table.className = "conduit-picker-matrix";
    table.setAttribute("aria-label", "Conduit choices by type and size");

    const head = table.createTHead();
    const headRow = head.insertRow();
    ["Type", ...sizes].forEach(label => {
        const cell = document.createElement("th");
        cell.scope = "col";
        cell.textContent = label;
        headRow.appendChild(cell);
    });

    const body = table.createTBody();
    types.forEach(type => {
        const row = body.insertRow();
        const typeCell = row.insertCell();
        typeCell.className = "conduit-matrix-type";
        typeCell.textContent = type;

        sizes.forEach(size => {
            const cell = row.insertCell();
            cell.className = "conduit-matrix-cell";
            const item = choices.get(`${type}:${size}`);

            if (item) {
                cell.appendChild(buildConduitMatrixChoice(item));
            }
            else {
                cell.textContent = "—";
            }
        });
    });

    modalList.appendChild(table);

}

//----------------------------------
// Search
//----------------------------------

modalSearch.addEventListener(

    "input",

    () => {

        if (
            modalMode === "equipment" &&
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
