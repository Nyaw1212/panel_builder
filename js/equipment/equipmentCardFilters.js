//----------------------------------
// Equipment Components
//----------------------------------

const equipmentComponents = [

    "BREAKER",

    "GROUND"

];

let selectedEquipmentComponent =

    "BREAKER";

//----------------------------------
// Build
//----------------------------------

function buildEquipmentComponentChips() {

    const container =

        document.getElementById(

            "equipmentComponentChips"

        );

    if (!container) {

        return;

    }

    container.innerHTML = "";

    equipmentComponents.forEach(component => {

        const chip =

            document.createElement("button");

        chip.className =

            "equipment-chip";

        if (

            component ===

            selectedEquipmentComponent

        ) {

            chip.classList.add(

                "active"

            );

        }

        chip.textContent =

            component;

        chip.onclick = () => {

            selectedEquipmentComponent =

                component;

            buildEquipmentComponentChips();

            refreshEquipmentCardModal();

        };

        container.appendChild(chip);

    });

}

//----------------------------------
// Current Filter
//----------------------------------

function getSelectedEquipmentComponent() {

    return selectedEquipmentComponent;

}

//----------------------------------
// Expose
//----------------------------------

window.buildEquipmentComponentChips =
    buildEquipmentComponentChips;

window.getSelectedEquipmentComponent =
    getSelectedEquipmentComponent;