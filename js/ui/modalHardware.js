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

    const isRunWirePicker = Boolean(
        currentConnection.runWirePicker
    );

    hardwarePanel.innerHTML = `

        <div class="selected-title">

            ${isRunWirePicker
                ? "Run Wire Selection"
                : "Connection Assembly"}
            (${currentConnection.hardware.length})

        </div>

    `;

    //----------------------------------
    // Empty
    //----------------------------------

    if (currentConnection.hardware.length === 0) {

        const empty = document.createElement("div");

        empty.className = "selected-empty";

        empty.textContent = isRunWirePicker
            ? "No wires selected. Choose a wire or preset."
            : "No fittings added.";

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

            const image = getDriveImageUrl(hardware.DriveFileID, 200);

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

    ${isRunWirePicker
        ? `
            <label class="assembly-qty assembly-qty-edit">
                <span>Qty</span>
                <input class="assembly-qty-input" type="number" min="1" step="1" inputmode="numeric"
                    value="${Math.max(1, Number(hardware.qty || 1))}" aria-label="Quantity for ${hardware.CatalogNumber}">
            </label>
        `
        : `
            <div class="assembly-qty">
                Qty: ${hardware.qty ?? 1}
            </div>
        `
    }

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

            card.querySelector(".assembly-qty-input")?.addEventListener(
                "change",
                event => {
                    const quantity = Number(event.target.value);

                    if (!Number.isInteger(quantity) || quantity < 1) {
                        event.target.value = String(Math.max(1, Number(hardware.qty || 1)));
                        alert("Enter a whole number of at least 1.");
                        return;
                    }

                    hardware.qty = quantity;
                    buildModalList(modalSearch?.value || "");
                    drawCanvas();
                }
            );

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

    saveButton.textContent = isRunWirePicker
        ? "Use Selected Wires"
        : "Done";

    saveButton.onclick = () => {

        if (typeof drawCanvas === "function") {
            drawCanvas();
        }

        if (typeof closeActiveModal === "function") {
            closeActiveModal();
        }
        else {
            modal.style.display = "none";
        }

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
    // Pipe / Wire Quantity
    //----------------------------------

    if (

        (
            nodeType === "PIPE" ||
            nodeType === "WIRE"
        ) &&
        !currentConnection?.runWirePicker

    ) {

        const presetName =

            nodeType === "WIRE" &&
            typeof getSelectedWirePreset ===
            "function"

                ? getSelectedWirePreset()

                : "SINGLE";

        const promptLabel =

            nodeType === "WIRE" &&
            presetName !== "SINGLE"

                ? `${item.Type || "WIRE"} ` +
                  `${item.Size || ""} ` +
                  `${presetName} preset`

                : item.CatalogNumber;

        const value = prompt(

            `Enter quantity for ${promptLabel}`,

            1

        );

        //----------------------------------
        // Cancel
        //----------------------------------

        if (value === null) {

            return;

        }

        qty = Number(value);

        //----------------------------------
        // Validate
        //----------------------------------

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
