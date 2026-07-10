//----------------------------------
// Build Hardware Panel
//----------------------------------

function buildHardwarePanel() {

    if (modalMode !== "material") return;

    if (!currentConnection) return;

    const hardwarePanel = document.createElement("div");

    hardwarePanel.className = "selected-hardware";

    hardwarePanel.innerHTML = `

        <div class="selected-title">

            Selected Hardware (${currentConnection.hardware.length})

        </div>

    `;

    //----------------------------------
    // Empty
    //----------------------------------

    if (currentConnection.hardware.length === 0) {

        const empty = document.createElement("div");

        empty.className = "selected-empty";

        empty.textContent = "No hardware selected.";

        hardwarePanel.appendChild(empty);

    }

    //----------------------------------
    // Hardware List
    //----------------------------------

    else {

        currentConnection.hardware.forEach((hardware, index) => {

            const row = document.createElement("div");

            row.className = "selected-item";

            row.innerHTML = `

                <div>

                    <strong>${hardware.CatalogNumber}</strong>

                    <br>

                    ${hardware.Description}

                </div>

                <button class="remove-hardware">

                    ✕

                </button>

            `;

            row.querySelector("button").onclick = () => {

                removeHardware(

                    currentConnection,

                    index

                );

                buildModalList(

                    modalSearch.value

                );

                drawCanvas();

            };

            hardwarePanel.appendChild(row);

        });

    }

    //----------------------------------
    // Done Button
    //----------------------------------

    const saveButton = document.createElement("button");

    saveButton.className = "save-connection";

    saveButton.textContent = "Done";

    saveButton.onclick = () => {

        modal.style.display = "none";

        drawCanvas();

    };

    hardwarePanel.appendChild(saveButton);

    modalList.appendChild(hardwarePanel);

}

//----------------------------------
// Get Hardware List
//----------------------------------

function getHardwareModalList(list) {

    //----------------------------------
    // Allowed Hardware Types
    //----------------------------------

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

        //----------------------------------
        // Only Fittings
        //----------------------------------

        .filter(item =>

            String(item.Type || "").toUpperCase() === "FITTING"

        )

        //----------------------------------
        // Allowed Node Types
        //----------------------------------

        .filter(item =>

            allowed.includes(

                String(item.NodeType || "")
                    .toUpperCase()
                    .trim()

            )

        )

        //----------------------------------
        // Sort by Size then Type
        //----------------------------------

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