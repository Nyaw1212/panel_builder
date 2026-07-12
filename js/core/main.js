//----------------------------------
// Global State
//----------------------------------

let pendingLink = null;

let equipment = [];

let materials = [];

let presets = [];

//----------------------------------
// Main
//----------------------------------

async function init() {

    try {

        //----------------------------------
        // Load Data
        //----------------------------------

        const mml = await API.getMML();

        const presets = await API.getPresets();

        //----------------------------------
        // Split MML
        //----------------------------------

        equipment = mml.filter(item => item.Placeable);

        materials = mml.filter(item => !item.Placeable);

        //----------------------------------
        // Expose Global Data
        //----------------------------------

        window.equipment = equipment;
        window.materials = materials;
        window.presets = presets;

        //----------------------------------
        // Initialization Summary
        //----------------------------------

        console.group("Initialization");

        console.log(`Equipment : ${equipment.length}`);
        console.table(equipment.slice(0, 3));

        console.log(`Materials : ${materials.length}`);
        console.table(materials.slice(0, 3));

        console.log(`Presets : ${presets.length}`);
        console.table(presets.slice(0, 3));

        console.groupEnd();

        //----------------------------------
        // Initialize SVG
        //----------------------------------

        initializeSVG();

        //----------------------------------
        // Build Libraries
        //----------------------------------

        buildEquipmentLibrary();

        buildPresetLibrary();

        //----------------------------------
        // Toolbar
        //----------------------------------

        if (typeof initializeToolbar === "function") {

            initializeToolbar();

        }

        //----------------------------------
        // Draw Empty Canvas
        //----------------------------------

        drawCanvas();

        //----------------------------------
        // Restore Draft
        //----------------------------------

        if (
            typeof loadDraft === "function" &&
            typeof deserializeProject === "function"
        ) {

            const draft = loadDraft();

            if (draft) {

                console.log("Restoring Draft...");

                deserializeProject(draft);

                console.log("Draft Restored Successfully");

            }

        }

        //----------------------------------
        // Enable Auto Save
        //----------------------------------

        autoSaveEnabled = true;

        console.log("Auto Save Enabled");

    }
    catch (err) {

        console.error("INITIALIZATION FAILED");
        console.error(err);
        console.error(err.stack);

        alert(err.message);

    }

}

//----------------------------------
// Start / Finish Link
//----------------------------------

function handleConnectionClick(item, connection) {

    if (!pendingLink) {

        pendingLink = {

            item,
            connection

        };

        drawCanvas();

        return;

    }

    if (

        pendingLink.item.id === item.id &&
        pendingLink.connection.id === connection.id

    ) {

        pendingLink = null;

        drawCanvas();

        return;

    }

    createLink(

        pendingLink,

        {

            item,
            connection

        }

    );

    pendingLink = null;

    drawCanvas();

}

//----------------------------------
// Get Equipment
//----------------------------------

function getEquipment() {

    return equipment;

}

//----------------------------------
// Get Materials
//----------------------------------

function getMaterials() {

    return materials;

}

//----------------------------------
// Get Presets
//----------------------------------

function getPresetList() {

    return presets;

}

//----------------------------------
// Expose
//----------------------------------

window.getEquipment = getEquipment;
window.getMaterials = getMaterials;
window.getPresetList = getPresetList;

//----------------------------------
// Start Application
//----------------------------------

init();