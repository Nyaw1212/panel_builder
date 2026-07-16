//----------------------------------
// Render Equipment Components
//----------------------------------

function renderEquipmentComponents() {
  //----------------------------------
  // Elements
  //----------------------------------

  const modal = document.getElementById("equipmentModal");

  const title = modal.querySelector(".modal-header h2");

  const list = document.getElementById("modalList");

  //----------------------------------
  // Title
  //----------------------------------

  title.textContent = "Equipment Components";

  //----------------------------------
  // Clear
  //----------------------------------

  list.innerHTML = "";

  //----------------------------------
  // Library
  //----------------------------------

  const components = getEquipmentCardLibrary();

  //----------------------------------
  // Empty
  //----------------------------------

  if (!components.length) {
    list.innerHTML = `

            <div style="padding:20px">

                No Components Found

            </div>

        `;

    return;
  }

  //----------------------------------
  // Cards
  //----------------------------------

  components.forEach((material) => {
    //----------------------------------
    // Image
    //----------------------------------

    const image = getEquipmentImage(material);

    //----------------------------------
    // Card
    //----------------------------------

    const card = document.createElement("div");

    card.className = "equipment";

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

                    ${material.Type || ""}

                </div>

            </div>

        `;

    //----------------------------------
    // Image Fallback
    //----------------------------------

    const img = card.querySelector(".equipment-image");

    img.onerror = () => {
      if (image.fallback) {
        img.src = image.fallback;
      }
    };

    //----------------------------------
    // Click
    //----------------------------------

    card.onclick = () => {
      addEquipmentComponent(material);
    };

    //----------------------------------
    // Add
    //----------------------------------

    list.appendChild(card);
  });
}

//----------------------------------
// Expose
//----------------------------------

window.renderEquipmentComponents = renderEquipmentComponents;
