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
        // Load MML
        //----------------------------------

        const mml = await API.getMML();

        //----------------------------------
        // Load Presets
        //----------------------------------

        presets = await getPresets() || [];

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
        // Debug
        //----------------------------------

        console.log("Equipment Loaded");
        console.table(equipment);

        console.log("Materials Loaded");
        console.table(materials);

        console.log("Presets Loaded");
        console.table(presets);

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
        // Initialize Toolbar
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

                try {

                    deserializeProject(draft);

                    console.log("Draft Restored Successfully");

                }
                catch (err) {

                    console.error("DESERIALIZER FAILED");
                    console.error(err);
                    console.error(err.stack);

                    debugger;

                    throw err;

                }

            }

        }

        //----------------------------------
        // Show Project Dialog
        //----------------------------------

        if (typeof showProjectDialog === "function") {

            showProjectDialog();

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

        debugger;

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