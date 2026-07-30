//----------------------------------
// Build Hardware Panel
//----------------------------------

function buildHardwarePanel() {

    if (modalMode !== "material") return;

    if (!currentConnection) return;

    const assemblyPanel = document.getElementById("assemblyPanel");

    if (!assemblyPanel) return;

    //----------------------------------
    // Clear
    //----------------------------------

    assemblyPanel.innerHTML = "";

    const hardwarePanel = document.createElement("div");

    hardwarePanel.className = "selected-hardware";

    hardwarePanel.innerHTML = `

        <div class="selected-title">

            Connection Assembly (${currentConnection.hardware.length})

        </div>

    `;

    //----------------------------------
    // Addition Mode
    //----------------------------------

    hardwarePanel.appendChild(
        buildHardwareAdditionControls()
    );

    //----------------------------------
    // Empty
    //----------------------------------

    if (currentConnection.hardware.length === 0) {

        const empty = document.createElement("div");

        empty.className = "selected-empty";

        empty.textContent = "No fittings added.";

        hardwarePanel.appendChild(empty);

    }

    //----------------------------------
    // Assembly Row
    //----------------------------------

    else {

        const row = document.createElement("div");

        row.className = "assembly-row";

        currentConnection.hardware.forEach((hardware, index) => {

            //----------------------------------
            // Image
            //----------------------------------

            const image = hardware.DriveFileID
                ? `https://drive.google.com/thumbnail?id=${hardware.DriveFileID}&sz=w200`
                : "";

            //----------------------------------
            // Card
            //----------------------------------

            const card = document.createElement("div");

            card.className = "assembly-card";

            card.innerHTML = `

    <button class="assembly-remove">

        ✕

    </button>

    <img
        class="assembly-image"
        src="${image}"
    >

    <div class="assembly-code">

        ${hardware.CatalogNumber}

    </div>

    <div class="assembly-qty">

        Qty: ${hardware.qty ?? 1}

    </div>

`;

            //----------------------------------
            // Remove
            //----------------------------------

            card.querySelector(".assembly-remove").onclick = () => {

                removeHardware(

                    currentConnection,

                    index

                );

                buildModalList(

                    modalSearch.value

                );

                drawCanvas();

            };

            row.appendChild(card);

            //----------------------------------
            // Arrow
            //----------------------------------

            if (index < currentConnection.hardware.length - 1) {

                const arrow = document.createElement("div");

                arrow.className = "assembly-arrow";

                arrow.textContent = "➜";

                row.appendChild(arrow);

            }

        });

        hardwarePanel.appendChild(row);

    }

    //----------------------------------
    // Done
    //----------------------------------

    const saveButton = document.createElement("button");

    saveButton.className = "save-connection";

    saveButton.textContent = "Done";

    saveButton.onclick = () => {

        modal.style.display = "none";

        drawCanvas();

    };

    hardwarePanel.appendChild(saveButton);

    //----------------------------------
    // Render
    //----------------------------------

    assemblyPanel.appendChild(hardwarePanel);

}


//----------------------------------
// Hardware Library Cache
//----------------------------------

let hardwareModalLibrary = [];

//----------------------------------
// Hardware Addition Settings
//----------------------------------

let hardwareAdditionMode = "ONE";
let hardwareAdditionQty = 1;

//----------------------------------
// Build Addition Controls
//----------------------------------

function buildHardwareAdditionControls() {

    const controls = document.createElement("div");

    controls.className = "hardware-addition-controls";

    controls.style.display = "flex";
    controls.style.alignItems = "center";
    controls.style.flexWrap = "wrap";
    controls.style.gap = "8px";
    controls.style.margin = "8px 0 12px";
    controls.style.padding = "8px 10px";
    controls.style.border = "1px solid #334155";
    controls.style.borderRadius = "6px";
    controls.style.background = "rgba(15, 23, 42, 0.55)";

    const title = document.createElement("span");

    title.textContent = "Addition:";
    title.style.fontWeight = "700";

    controls.appendChild(title);

    const oneLabel = document.createElement("label");
    const oneInput = document.createElement("input");

    oneLabel.style.display = "inline-flex";
    oneLabel.style.alignItems = "center";
    oneLabel.style.gap = "4px";
    oneLabel.style.cursor = "pointer";

    oneInput.type = "radio";
    oneInput.name = "hardwareAdditionMode";
    oneInput.value = "ONE";
    oneInput.checked = hardwareAdditionMode === "ONE";

    oneLabel.appendChild(oneInput);
    oneLabel.appendChild(
        document.createTextNode("1:1")
    );

    const qtyLabel = document.createElement("label");
    const qtyRadio = document.createElement("input");

    qtyLabel.style.display = "inline-flex";
    qtyLabel.style.alignItems = "center";
    qtyLabel.style.gap = "4px";
    qtyLabel.style.cursor = "pointer";

    qtyRadio.type = "radio";
    qtyRadio.name = "hardwareAdditionMode";
    qtyRadio.value = "QTY";
    qtyRadio.checked = hardwareAdditionMode === "QTY";

    qtyLabel.appendChild(qtyRadio);
    qtyLabel.appendChild(
        document.createTextNode("By Qty")
    );

    const qtyInput = document.createElement("input");

    qtyInput.type = "number";
    qtyInput.min = "1";
    qtyInput.step = "1";
    qtyInput.value = String(hardwareAdditionQty);
    qtyInput.title = "Quantity added per material click";
    qtyInput.style.width = "72px";
    qtyInput.style.padding = "5px 7px";
    qtyInput.style.border = "1px solid #475569";
    qtyInput.style.borderRadius = "4px";
    qtyInput.style.background = "#0f172a";
    qtyInput.style.color = "#fff";

    function syncControls() {

        qtyInput.disabled =
            hardwareAdditionMode !== "QTY";

        qtyInput.style.opacity =
            qtyInput.disabled ? "0.5" : "1";

    }

    oneInput.onchange = () => {

        if (!oneInput.checked) return;

        hardwareAdditionMode = "ONE";

        syncControls();

    };

    qtyRadio.onchange = () => {

        if (!qtyRadio.checked) return;

        hardwareAdditionMode = "QTY";

        syncControls();

        qtyInput.focus();
        qtyInput.select();

    };

    qtyInput.oninput = () => {

        const qty = Number(qtyInput.value);

        if (Number.isInteger(qty) && qty > 0) {

            hardwareAdditionQty = qty;

        }

    };

    controls.appendChild(oneLabel);
    controls.appendChild(qtyLabel);
    controls.appendChild(qtyInput);

    syncControls();

    return controls;

}

//----------------------------------
// Get Addition Quantity
//----------------------------------

function getHardwareAdditionQty() {

    if (hardwareAdditionMode === "ONE") {

        return 1;

    }

    const qty = Number(hardwareAdditionQty);

    if (!Number.isInteger(qty) || qty <= 0) {

        return null;

    }

    return qty;

}

//----------------------------------
// Normalize Hardware Value
//----------------------------------

function normalizeHardwareValue(value) {

    return String(value || "")
        .trim()
        .toUpperCase();

}

//----------------------------------
// Get Wire Color
//----------------------------------

function getWireColor(item) {

    //----------------------------------
    // Dedicated Color Columns
    //----------------------------------

    const directColor =
        normalizeHardwareValue(

            item.Color ||
            item.WireColor ||
            item.Colour

        );

    if (directColor) {

        if (directColor.includes("BLACK")) return "BLACK";
        if (directColor.includes("GREEN")) return "GREEN";
        if (directColor.includes("WHITE")) return "WHITE";
        if (directColor.includes("RED")) return "RED";

    }

    //----------------------------------
    // Description Detection
    //----------------------------------

    const description =
        normalizeHardwareValue(
            item.Description
        );

    if (/\bBLACK\b/.test(description)) return "BLACK";
    if (/\bGREEN\b/.test(description)) return "GREEN";
    if (/\bWHITE\b/.test(description)) return "WHITE";
    if (/\bRED\b/.test(description)) return "RED";

    //----------------------------------
    // Catalog Number Detection
    //
    // Examples:
    // THHN14STBK500 = BLACK
    // THHN14STGN500 = GREEN
    // THHN14STRD500 = RED
    // THHN14STWH500 = WHITE
    //----------------------------------

    const catalog =
        normalizeHardwareValue(
            item.CatalogNumber
        );

    if (/BK\d*$/.test(catalog)) return "BLACK";
    if (/GN\d*$/.test(catalog)) return "GREEN";
    if (/RD\d*$/.test(catalog)) return "RED";
    if (/WH\d*$/.test(catalog)) return "WHITE";

    return "";

}

//----------------------------------
// Find Preset Wire
//----------------------------------

function findPresetWire(

    sourceWire,
    requiredColor

) {

    const sourceType =
        normalizeHardwareValue(
            sourceWire.Type
        );

    const sourceSize =
        normalizeHardwareValue(
            sourceWire.Size
        );

    return hardwareModalLibrary.find(item => {

        return (

            normalizeHardwareValue(
                item.NodeType
            ) === "WIRE" &&

            normalizeHardwareValue(
                item.Type
            ) === sourceType &&

            normalizeHardwareValue(
                item.Size
            ) === sourceSize &&

            getWireColor(item) ===
            requiredColor

        );

    });

}

//----------------------------------
// Add Wire Preset
//----------------------------------

function addWirePreset(

    sourceWire,
    qty

) {

    const presetName =
        typeof getSelectedWirePreset ===
        "function"

            ? getSelectedWirePreset()

            : "SINGLE";

    const colors =
        typeof getSelectedWirePresetColors ===
        "function"

            ? getSelectedWirePresetColors()

            : null;

    //----------------------------------
    // Single Wire
    //----------------------------------

    if (

        presetName === "SINGLE" ||
        !Array.isArray(colors)

    ) {

        const hardware =
            structuredClone(sourceWire);

        hardware.qty = qty;

        addHardware(
            currentConnection,
            hardware
        );

        return true;

    }

    //----------------------------------
    // Resolve Every Required Color
    //----------------------------------

    const resolved = [];
    const missing = [];

    colors.forEach(color => {

        const wire = findPresetWire(

            sourceWire,
            color

        );

        if (wire) {

            resolved.push(wire);

        }

        else {

            missing.push(color);

        }

    });

    //----------------------------------
    // Stop on Missing Colors
    //----------------------------------

    if (missing.length > 0) {

        alert(

            `Cannot add ${presetName} preset.\n\n` +

            `Missing matching wire colors: ` +
            missing.join(", ") +

            `\n\nRequired match:\n` +

            `Type: ${sourceWire.Type || ""}\n` +
            `Size: ${sourceWire.Size || ""}`

        );

        return false;

    }

    //----------------------------------
    // Add All Preset Wires
    //----------------------------------

    resolved.forEach(wire => {

        const hardware =
            structuredClone(wire);

        hardware.qty = qty;
        hardware.wirePreset = presetName;

        addHardware(
            currentConnection,
            hardware
        );

    });

    return true;

}

//----------------------------------
// Get Hardware List
//----------------------------------

function getHardwareModalList(list) {

    hardwareModalLibrary = Array.isArray(list)
        ? list
        : [];

    return hardwareModalLibrary

        //----------------------------------
        // Everything Except Equipment
        //----------------------------------

        .filter(item => !item.Placeable)

        //----------------------------------
        // Sort
        //----------------------------------

        .sort((a, b) => {

            //----------------------------------
            // Node Type
            //----------------------------------

            const nodeCompare =

                String(a.NodeType || "")
                    .localeCompare(

                        String(b.NodeType || "")

                    );

            if (nodeCompare !== 0)

                return nodeCompare;

            //----------------------------------
            // Size
            //----------------------------------

            const sizeCompare =

                String(a.Size || "")
                    .localeCompare(

                        String(b.Size || "")

                    );

            if (sizeCompare !== 0)

                return sizeCompare;

            //----------------------------------
            // Catalog
            //----------------------------------

            return String(a.CatalogNumber || "")
                .localeCompare(

                    String(b.CatalogNumber || "")

                );

        });

}

//----------------------------------
// Add Hardware
//----------------------------------

function handleHardwareClick(item) {

    //----------------------------------
    // Default Quantity
    //----------------------------------

    let qty = 1;

    const nodeType =
        normalizeHardwareValue(
            item.NodeType
        );

    //----------------------------------
    // Wire Quantity Prompt
    //----------------------------------

    if (nodeType === "WIRE") {

        const presetName =

            typeof getSelectedWirePreset ===
            "function"

                ? getSelectedWirePreset()

                : "SINGLE";

        const promptLabel =

            presetName !== "SINGLE"

                ? `${item.Type || "WIRE"} ` +
                  `${item.Size || ""} ` +
                  `${presetName} preset`

                : item.CatalogNumber;

        const value = prompt(

            `Enter quantity for ${promptLabel}`,

            1

        );

        if (value === null) {

            return;

        }

        qty = Number(value);

        if (

            Number.isNaN(qty) ||
            qty <= 0

        ) {

            alert(
                "Please enter a valid quantity."
            );

            return;

        }

    }

    //----------------------------------
    // Fitting / Pipe / Breaker Quantity
    //----------------------------------

    else {

        qty = getHardwareAdditionQty();

        if (qty === null) {

            alert(
                "Please enter a whole quantity greater than zero."
            );

            return;

        }

    }

    //----------------------------------
    // Wire Preset
    //----------------------------------

    if (nodeType === "WIRE") {

        const added = addWirePreset(

            item,
            qty

        );

        if (!added) return;

    }

    //----------------------------------
    // Normal Hardware / Pipe / Breaker
    //----------------------------------

    else {

        const hardware =
            structuredClone(item);

        hardware.qty = qty;

        addHardware(

            currentConnection,
            hardware

        );

    }

    //----------------------------------
    // Refresh Modal
    //----------------------------------

    buildModalList(

        modalSearch
            ? modalSearch.value
            : ""

    );

    //----------------------------------
    // Redraw
    //----------------------------------

    drawCanvas();

}

//----------------------------------
// Expose
//----------------------------------

window.buildHardwarePanel = buildHardwarePanel;
window.getHardwareModalList = getHardwareModalList;
window.handleHardwareClick = handleHardwareClick;
window.addWirePreset = addWirePreset;
window.getHardwareAdditionQty = getHardwareAdditionQty;