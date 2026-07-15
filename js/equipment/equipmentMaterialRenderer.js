//----------------------------------
// Render Equipment Materials
//----------------------------------

function renderEquipmentMaterials(item) {

    //----------------------------------
    // Elements
    //----------------------------------

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

        list.innerHTML = `
            <div style="padding:20px">
                No Materials
            </div>
        `;

        return;

    }

    //----------------------------------
    // Visible Materials
    //----------------------------------

    let visibleMaterials = item.materials;

    if (
        item.preset &&
        item.preset.toUpperCase().startsWith("FSU")
    ) {

        visibleMaterials = item.materials.filter(itemMaterial => {

            const catalogNumber =
                itemMaterial.catalogNumber ??
                itemMaterial.CatalogNumber;

            const material =
                getMaterial(catalogNumber);

            if (!material) return false;

            const type =
                (material.Type || "")
                    .toUpperCase();

            return (
                type === "BREAKER" ||
                type === "GROUND"
            );

        });

    }

    //----------------------------------
    // Empty After Filter
    //----------------------------------

    if (visibleMaterials.length === 0) {

        list.innerHTML = `
            <div style="padding:20px">
                No Equipment Materials
            </div>
        `;

        return;

    }

    //----------------------------------
    // Cards
    //----------------------------------

    visibleMaterials.forEach(itemMaterial => {

        //----------------------------------
        // Lookup Material
        //----------------------------------

        const catalogNumber =
            itemMaterial.catalogNumber ??
            itemMaterial.CatalogNumber;

        const material =
            getMaterial(catalogNumber);

        if (!material) {

            console.warn(
                "Material not found:",
                catalogNumber
            );

            return;

        }

        //----------------------------------
        // Image
        //----------------------------------

        const image =
            getEquipmentImage(material);

        //----------------------------------
        // Qty
        //----------------------------------

        const qty =
            itemMaterial.qty ??
            itemMaterial.QTY ??
            itemMaterial.quantity ??
            1;

        //----------------------------------
        // Card
        //----------------------------------

        const card =
            document.createElement("div");

        card.className =
            "equipment";

        card.innerHTML = `

            <img
                class="equipment-image"
                src="${image.src}"
            >

            <div class="equipment-info">

                <div class="equipment-code">

                    ${material.CatalogNumber}

                </div>

                <div class="equipment-desc">

                    ${material.Description}

                </div>

                <div class="equipment-desc">

                    Qty : ${qty}

                </div>

            </div>

        `;

        //----------------------------------
        // Image Fallback
        //----------------------------------

        const img =
            card.querySelector(".equipment-image");

        img.onerror = () => {

            if (image.fallback) {

                img.src =
                    image.fallback;

            }

        };

        list.appendChild(card);

    });

}

//----------------------------------
// Expose
//----------------------------------

window.renderEquipmentMaterials =
    renderEquipmentMaterials;