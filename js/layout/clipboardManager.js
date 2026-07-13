//----------------------------------
// Clipboard Manager
//----------------------------------

let clipboard = null;

//----------------------------------
// Copy Selection
//----------------------------------

function copySelection() {

    const selected = SelectionManager.getSelectedItems();

    if (!selected.length) {

        console.log("Clipboard: Nothing selected.");

        return false;

    }

    //----------------------------------
    // Find Origin
    //----------------------------------

    const minRow = Math.min(

        ...selected.map(item =>
            Math.floor(item.startCell / SETTINGS.columns)
        )

    );

    const minCol = Math.min(

        ...selected.map(item =>
            item.startCell % SETTINGS.columns
        )

    );

    //----------------------------------
    // Serialize Panels
    //----------------------------------

    clipboard = {

        origin: {

            row: minRow,

            column: minCol

        },

        panels: selected.map(item => ({

            //----------------------------------
            // Relative Position
            //----------------------------------

            row:
                Math.floor(item.startCell / SETTINGS.columns) -
                minRow,

            column:
                (item.startCell % SETTINGS.columns) -
                minCol,

            //----------------------------------
            // Equipment
            //----------------------------------

            equipment: structuredClone(item.data),

            //----------------------------------
            // Properties
            //----------------------------------

            preset: item.preset,

            materials: structuredClone(item.materials),

            rotation: item.rotation,

            width: item.width,

            height: item.height

        })),

        //----------------------------------
        // Internal Links
        //----------------------------------

        links: []

    };

    console.group("Clipboard");

    console.log("Panels:", clipboard.panels.length);

    console.log(clipboard);

    console.groupEnd();

    return true;

}

//----------------------------------
// Clear Clipboard
//----------------------------------

function clearClipboard() {

    clipboard = null;

}

//----------------------------------
// Has Clipboard
//----------------------------------

function hasClipboard() {

    return clipboard !== null;

}

//----------------------------------
// Get Clipboard
//----------------------------------

function getClipboard() {

    return clipboard;

}

//----------------------------------
// Clipboard Count
//----------------------------------

function getClipboardCount() {

    return clipboard
        ? clipboard.panels.length
        : 0;

}

//----------------------------------
// Expose
//----------------------------------

window.copySelection = copySelection;
window.clearClipboard = clearClipboard;
window.hasClipboard = hasClipboard;
window.getClipboard = getClipboard;
window.getClipboardCount = getClipboardCount;