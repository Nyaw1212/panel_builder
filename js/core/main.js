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

    PERF.start("Application Startup");

    try {

        //----------------------------------
        // Load MML
        //----------------------------------

        PERF.start("Load MML");

        const mml = await API.getMML();

        PERF.end("Load MML");

        //----------------------------------
        // Load Presets
        //----------------------------------

        PERF.start("Load Presets");

        presets = await API.getPresets();

        PERF.end("Load Presets");

        //----------------------------------
        // Split MML
        //----------------------------------

        PERF.start("Split MML");

        equipment = mml.filter(item => item.Placeable);

        materials = mml.filter(item => !item.Placeable);

        PERF.end("Split MML");

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

        PERF.start("Initialize SVG");

        initializeSVG();

        PERF.end("Initialize SVG");

        //----------------------------------
        // Equipment Library
        //----------------------------------

        PERF.start("Equipment Library");

        buildEquipmentLibrary();

        PERF.end("Equipment Library");

        //----------------------------------
        // Preset Library
        //----------------------------------

        PERF.start("Preset Library");

        buildPresetLibrary();

        PERF.end("Preset Library");

        //----------------------------------
        // Toolbar
        //----------------------------------

        if (typeof initializeToolbar === "function") {

            PERF.start("Toolbar");

            initializeToolbar();

            PERF.end("Toolbar");

        }

        //----------------------------------
        // Draw Empty Canvas
        //----------------------------------

        PERF.start("Draw Canvas");

        drawCanvas();

        PERF.end("Draw Canvas");

        //----------------------------------
        // Restore Draft
        //----------------------------------

        if (

            typeof loadDraft === "function" &&
            typeof deserializeProject === "function"

        ) {

            const draft = loadDraft();

            if (draft) {

                PERF.start("Restore Draft");

                console.log("Restoring Draft...");

                deserializeProject(draft);

                console.log("Draft Restored Successfully");

                PERF.end("Restore Draft");

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
    finally {

        PERF.end("Application Startup");

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