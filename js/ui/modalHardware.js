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

    return list

        .filter(item => !item.Placeable)

        .filter(item => {

            const text =

                `${item.Description} ${item.CatalogNumber}`

                    .toUpperCase();

            return (

                text.includes("CONNECTOR") ||

                text.includes("HUB") ||

                text.includes("LOCKNUT") ||

                text.includes("COUPLING")

            );

        })

        .sort((a, b) => {

            if (a.Size !== b.Size) {

                return a.Size.localeCompare(

                    b.Size

                );

            }

            return a.Description.localeCompare(

                b.Description

            );

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