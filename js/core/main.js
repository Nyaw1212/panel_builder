//----------------------------------
// Global State
//----------------------------------

let pendingLink = null;

let equipment = [];

let materials = [];

//----------------------------------
// Main
//----------------------------------

async function init() {

    //----------------------------------
    // Load MML Once
    //----------------------------------

    const mml = await API.getMML();

    //----------------------------------
    // Split Data
    //----------------------------------

    equipment = mml.filter(item => item.Placeable);

    materials = mml.filter(item => !item.Placeable);

    //----------------------------------
    // Expose Global Data
    //----------------------------------

    window.equipment = equipment;
    window.materials = materials;

    console.log("Equipment Loaded");
    console.table(equipment);

    console.log("Materials Loaded");
    console.table(materials);

    //----------------------------------
    // Initialize SVG
    //----------------------------------

    initializeSVG();

    //----------------------------------
    // Build Equipment Library
    //----------------------------------

    buildEquipmentLibrary();

    //----------------------------------
    // Initialize Toolbar
    //----------------------------------

    if (typeof initializeToolbar === "function") {

        initializeToolbar();

    }

    //----------------------------------
    // Draw Canvas
    //----------------------------------

    drawCanvas();

    //----------------------------------
    // Show Project Dialog
    //----------------------------------

    if (typeof showProjectDialog === "function") {

        showProjectDialog();

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
// Expose
//----------------------------------

window.getEquipment = getEquipment;
window.getMaterials = getMaterials;

//----------------------------------
// Start Application
//----------------------------------

init();