//----------------------------------
// Current Preset
//----------------------------------

let currentPreset = "";

//----------------------------------
// Set Current Preset
//----------------------------------

function setCurrentPreset(preset) {

    currentPreset = preset || "";

    console.log("Current Preset:", currentPreset);

}

//----------------------------------
// Get Current Preset
//----------------------------------

function getCurrentPreset() {

    return currentPreset;

}

//----------------------------------
// Clear Current Preset
//----------------------------------

function clearCurrentPreset() {

    currentPreset = "";

    //----------------------------------
    // Remove Highlight
    //----------------------------------

    document
        .querySelectorAll(".preset-button")
        .forEach(button =>
            button.classList.remove("selected")
        );

    console.log("Preset Cleared");

}

//----------------------------------
// Get Equipment From Preset
//----------------------------------

function getPresetEquipment(preset) {

    if (!preset) {

        return null;

    }

    //----------------------------------
    // First Row Of Preset
    //----------------------------------

    const presetRow = (window.presets || []).find(

        row => row.PRESET === preset

    );

    if (!presetRow) {

        console.warn(

            "Preset not found:",

            preset

        );

        return null;

    }

    //----------------------------------
    // Find Equipment
    //----------------------------------

    const equipment = getEquipment().find(

        item =>

            item.CatalogNumber ===

            presetRow.CatalogNumber

    );

    if (!equipment) {

        console.warn(

            "Equipment not found:",

            presetRow.CatalogNumber

        );

        return null;

    }

    return equipment;

}

//----------------------------------
// Place Preset
//----------------------------------

function placePreset(

    preset,

    startCell

) {

    console.group("Place Preset");

    console.log("Preset:", preset);

    console.log("Cell:", startCell);

    //----------------------------------
    // Lookup Equipment
    //----------------------------------

    const equipment =

        getPresetEquipment(

            preset

        );

    if (!equipment) {

        console.warn(

            "Unable to locate preset equipment."

        );

        console.groupEnd();

        return null;

    }

    console.log(

        "Equipment:",

        equipment.CatalogNumber

    );

    //----------------------------------
    // Place Equipment
    //----------------------------------

    const placedItem = placeItem(

        equipment,

        startCell,

        preset

    );

    if (!placedItem) {

        console.warn(

            "Placement Failed."

        );

        console.groupEnd();

        return null;

    }

    //----------------------------------
    // Draw
    //----------------------------------

    drawCanvas();

    //----------------------------------
    // Exit Placement Mode
    //----------------------------------

    clearCurrentPreset();

    console.groupEnd();

    return placedItem;

}

//----------------------------------
// Expose
//----------------------------------

window.setCurrentPreset =

    setCurrentPreset;

window.getCurrentPreset =

    getCurrentPreset;

window.clearCurrentPreset =

    clearCurrentPreset;

window.getPresetEquipment =

    getPresetEquipment;

window.placePreset =

    placePreset;