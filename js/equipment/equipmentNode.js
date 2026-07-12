//----------------------------------
// Equipment Node
//----------------------------------

const EQUIPMENT_NODE_SIZE = 14;

//----------------------------------
// Draw Equipment Node
//----------------------------------

function drawEquipmentNode(card, item) {

    if (!card || !item) {

        return;

    }

    //----------------------------------
    // Remove Existing
    //----------------------------------

    card.querySelectorAll(".equipment-node").forEach(node => {

        node.remove();

    });

    //----------------------------------
    // Create
    //----------------------------------

    const node = document.createElement("div");

    node.className = "equipment-node";

    //----------------------------------
    // Identity
    //----------------------------------

    node.dataset.catalog =
        item.data.CatalogNumber;

    node.dataset.itemId =
        item.id;

    //----------------------------------
    // Appearance
    //----------------------------------

    node.style.position = "absolute";

    node.style.width =
        `${EQUIPMENT_NODE_SIZE}px`;

    node.style.height =
        `${EQUIPMENT_NODE_SIZE}px`;

    node.style.borderRadius = "50%";

    node.style.background = "limegreen";

    node.style.border =
        "2px solid green";

    node.style.boxSizing =
        "border-box";

    node.style.cursor =
        "pointer";

    node.style.zIndex =
        "500";

    //----------------------------------
    // Position
    //----------------------------------

    node.style.left = "50%";

    node.style.bottom = "24px";

    node.style.transform =
        "translateX(-50%)";

    //----------------------------------
    // Hover
    //----------------------------------

    node.onmouseenter = () => {

        node.style.background = "#4CAF50";

        node.style.border = "2px solid #1B5E20";

        node.style.transform =
            "translateX(-50%) scale(3.5)";

        node.style.boxShadow =
            "0 0 10px rgba(76,175,80,.6)";

    };

    node.onmouseleave = () => {

        node.style.background = "limegreen";

        node.style.border = "2px solid green";

        node.style.transform =
            "translateX(-50%)";

        node.style.boxShadow = "none";

    };

    //----------------------------------
    // Click
    //----------------------------------

    node.onclick = e => {

        e.stopPropagation();

        openEquipmentMaterialModal(item);

    };

    //----------------------------------
    // Add
    //----------------------------------

    card.appendChild(node);

}

//----------------------------------
// Expose
//----------------------------------

window.drawEquipmentNode =
    drawEquipmentNode;