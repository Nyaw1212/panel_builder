//----------------------------------
// Equipment Preview
//----------------------------------

let equipmentPreview = null;

//----------------------------------
// Init
//----------------------------------

function initEquipmentPreview() {

    equipmentPreview =
        document.createElement("div");

    equipmentPreview.id =
        "equipmentPreview";

    equipmentPreview.style.display =
        "none";

    document.body.appendChild(
        equipmentPreview
    );

}

//----------------------------------
// Show
//----------------------------------

function showEquipmentPreview(
    x,
    y
) {

    equipmentPreview.style.left =
        `${x + 20}px`;

    equipmentPreview.style.top =
        `${y + 20}px`;

    equipmentPreview.style.display =
        "block";

}

//----------------------------------
// Hide
//----------------------------------

function hideEquipmentPreview() {

    equipmentPreview.style.display =
        "none";

}

//----------------------------------
// Expose
//----------------------------------

window.initEquipmentPreview =
    initEquipmentPreview;

window.showEquipmentPreview =
    showEquipmentPreview;

window.hideEquipmentPreview =
    hideEquipmentPreview;