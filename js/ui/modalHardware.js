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
// Get Hardware List
//----------------------------------

function getHardwareModalList(list) {

    return list

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

    const nodeType = String(

        item.NodeType || ""

    ).toUpperCase();

    //----------------------------------
    // Pipe / Wire
    //----------------------------------

    if (

        nodeType === "PIPE" ||

        nodeType === "WIRE"

    ) {

        const value = prompt(

            `Enter quantity for ${item.CatalogNumber}`,

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

            alert("Please enter a valid quantity.");

            return;

        }

    }

    //----------------------------------
    // Clone Hardware
    //----------------------------------

    const hardware = structuredClone(item);

    hardware.qty = qty;

    //----------------------------------
    // Add Hardware
    //----------------------------------

    addHardware(

        currentConnection,

        hardware

    );

    //----------------------------------
    // Refresh Modal
    //----------------------------------

    buildModalList(

        modalSearch.value

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