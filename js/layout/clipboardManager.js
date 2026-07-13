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

        //----------------------------------
        // Origin
        //----------------------------------

        origin: {

            row: minRow,

            column: minCol

        },

        //----------------------------------
        // Paste Offset
        //----------------------------------

        offset: {

            row: 1,

            column: 1

        },

        //----------------------------------
        // Panels
        //----------------------------------

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

    console.log("Offset:", clipboard.offset);

    console.log(clipboard);

    console.groupEnd();

    return true;

}

//----------------------------------
// Clipboard
//----------------------------------

function clearClipboard() {

    clipboard = null;

}

function hasClipboard() {

    return clipboard !== null;

}

function getClipboard() {

    return clipboard;

}

function getClipboardCount() {

    return clipboard
        ? clipboard.panels.length
        : 0;

}

//----------------------------------
// Paste Offset
//----------------------------------

function incrementPasteOffset() {

    if (!clipboard) return;

    clipboard.offset.row++;

    clipboard.offset.column++;

}

function resetPasteOffset() {

    if (!clipboard) return;

    clipboard.offset.row = 1;

    clipboard.offset.column = 1;

}

//----------------------------------
// Expose
//----------------------------------

window.copySelection = copySelection;
window.clearClipboard = clearClipboard;
window.hasClipboard = hasClipboard;
window.getClipboard = getClipboard;
window.getClipboardCount = getClipboardCount;

window.incrementPasteOffset = incrementPasteOffset;
window.resetPasteOffset = resetPasteOffset;