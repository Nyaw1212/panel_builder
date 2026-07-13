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

    const allowed = [

        "CONNECTOR",
        "COUPLING",
        "HUB",
        "LOCKNUT",
        "LB",
        "LL",
        "LR",
        "T",
        "C",
        "ELBOW",
        "NIPPLE",
        "GROUND BUSHING",
        "ADAPTER",
        "BOX"

    ];

    return list

        .filter(item =>

            String(item.Type || "").toUpperCase() === "FITTING"

        )

        .filter(item =>

            allowed.includes(

                String(item.NodeType || "")
                    .toUpperCase()
                    .trim()

            )

        )

        .sort((a, b) => {

            const sizeCompare =

                String(a.Size || "")
                    .localeCompare(String(b.Size || ""));

            if (sizeCompare !== 0)
                return sizeCompare;

            const typeCompare =

                String(a.NodeType || "")
                    .localeCompare(String(b.NodeType || ""));

            if (typeCompare !== 0)
                return typeCompare;

            return String(a.Description || "")
                .localeCompare(String(b.Description || ""));

        });

}

//----------------------------------
// Add Hardware
//----------------------------------

function handleHardwareClick(item) {

    if (

        currentConnection.hardware.some(

            h => h.CatalogNumber === item.CatalogNumber

        )

    ) {

        return;

    }

    addHardware(

        currentConnection,

        item

    );

    buildModalList(

        modalSearch.value

    );

    drawCanvas();

}

//----------------------------------
// Expose
//----------------------------------

window.buildHardwarePanel = buildHardwarePanel;
window.getHardwareModalList = getHardwareModalList;
window.handleHardwareClick = handleHardwareClick;