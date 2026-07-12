//----------------------------------
// Equipment Node Selection
//----------------------------------

let selectedEquipmentNode = null;

//----------------------------------
// Select
//----------------------------------

function selectEquipmentNode(node) {

    clearEquipmentNodeSelection();

    selectedEquipmentNode = node;

    node.classList.add(
        "selected-equipment-node"
    );

}

//----------------------------------
// Clear
//----------------------------------

function clearEquipmentNodeSelection() {

    document

        .querySelectorAll(

            ".equipment-node"

        )

        .forEach(node =>

            node.classList.remove(

                "selected-equipment-node"

            )

        );

    selectedEquipmentNode = null;

}

//----------------------------------
// Get
//----------------------------------

function getSelectedEquipmentNode() {

    return selectedEquipmentNode;

}

//----------------------------------
// Expose
//----------------------------------

window.selectEquipmentNode =
    selectEquipmentNode;

window.clearEquipmentNodeSelection =
    clearEquipmentNodeSelection;

window.getSelectedEquipmentNode =
    getSelectedEquipmentNode;