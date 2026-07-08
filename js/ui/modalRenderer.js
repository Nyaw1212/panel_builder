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

        //----------------------------------
        // Generic Picker
        //----------------------------------

        if (modalMode === "picker") {

            if (typeof modalOnSelect === "function") {

                modalOnSelect(item);

            }

            modal.style.display = "none";

            return;

        }

        //----------------------------------
        // Equipment
        //----------------------------------

        if (modalMode === "equipment") {

            handleEquipmentClick(item);

            return;

        }

        //----------------------------------
        // Connection Hardware
        //----------------------------------

        if (modalMode === "material") {

            handleHardwareClick(item);

            return;

        }

    };

    return card;

}

//----------------------------------
// Render Cards
//----------------------------------

function renderModalCards(list) {

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