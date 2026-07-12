//----------------------------------
// Build Card
//----------------------------------

function buildModalCard(item) {

    const image = item.DriveFileID
        ? `https://drive.google.com/thumbnail?id=${item.DriveFileID}&sz=w200`
        : "";

    const card = document.createElement("div");

    card.className = "equipment";

    //----------------------------------
    // Selected
    //----------------------------------

    if (

        modalMode === "material" &&

        currentConnection &&

        currentConnection.hardware.some(

            h => h.CatalogNumber === item.CatalogNumber

        )

    ) {

        card.classList.add("selected");

    }

    //----------------------------------
    // HTML
    //----------------------------------

    card.innerHTML = `

        <img
            class="equipment-image"
            src="${image}"
        >

        <div class="equipment-info">

            <div class="equipment-code">

                ${item.CatalogNumber || ""}

            </div>

            <div class="equipment-desc">

                ${item.Description || ""}

            </div>

            <div class="equipment-size">

                ${modalMode === "equipment"

                    ? `${item.GridWidth} × ${item.GridHeight}`

                    : `${item.Size || ""} ${item.Type || ""}`}

            </div>

        </div>

    `;

    //----------------------------------
    // Click
    //----------------------------------

    card.onclick = () => {

        console.group("Modal Card Click");

        console.log("Catalog:", item.CatalogNumber);

        console.log("Mode:", modalMode);

        console.log("Current Cell:", currentCell);

        //----------------------------------
        // Generic Picker
        //----------------------------------

        if (modalMode === "picker") {

            console.log("Branch: picker");

            if (typeof modalOnSelect === "function") {

                modalOnSelect(item);

            }

            modal.style.display = "none";

            console.groupEnd();

            return;

        }

        //----------------------------------
        // Equipment
        //----------------------------------

        if (modalMode === "equipment") {

            console.log("Branch: equipment");

            handleEquipmentClick(item);

            console.groupEnd();

            return;

        }

        //----------------------------------
        // Connection Hardware
        //----------------------------------

        if (modalMode === "material") {

            console.log("Branch: material");

            handleHardwareClick(item);

            console.groupEnd();

            return;

        }

        console.warn("Unknown modalMode:", modalMode);

        console.groupEnd();

    };

    return card;

}

//----------------------------------
// Render Cards
//----------------------------------

function renderModalCards(list) {

    console.log("Cards:", list.length);

    modalList.innerHTML = "";

    list.forEach(item => {

        modalList.appendChild(

            buildModalCard(item)

        );

    });

}

//----------------------------------
// Expose
//----------------------------------

window.buildModalCard = buildModalCard;
window.renderModalCards = renderModalCards;