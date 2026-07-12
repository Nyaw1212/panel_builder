//----------------------------------
// Render Equipment Materials
//----------------------------------

function renderEquipmentMaterials(item) {

    const modal =
        document.getElementById("equipmentModal");

    const title =
        modal.querySelector(".modal-header h2");

    const list =
        document.getElementById("modalList");

    //----------------------------------
    // Title
    //----------------------------------

    title.textContent =
        "Equipment Materials";

    //----------------------------------
    // Clear
    //----------------------------------

    list.innerHTML = "";

    //----------------------------------
    // Empty
    //----------------------------------

    if (

        !item.materials ||

        item.materials.length === 0

    ) {

        list.innerHTML =

            "<div style='padding:20px'>No Materials</div>";

        return;

    }

    //----------------------------------
    // Cards
    //----------------------------------

    item.materials.forEach(material => {

        const card =
            document.createElement("div");

        card.className =
            "equipment";

        card.innerHTML = `

            <div class="equipment-info">

                <div class="equipment-code">

                    ${material.CatalogNumber}

                </div>

                <div class="equipment-desc">

                    Qty : ${material.QTY}

                </div>

            </div>

        `;

        list.appendChild(card);

    });

}

//----------------------------------
// Expose
//----------------------------------

window.renderEquipmentMaterials =
    renderEquipmentMaterials;