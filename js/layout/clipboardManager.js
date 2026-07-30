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
    // Find Selection Bounds
    //----------------------------------

    const maxRow = Math.max(

        ...selected.map(item =>
            Math.floor(item.startCell / SETTINGS.columns) +
            Number(item.height || item.data?.GridHeight || 1)
        )

    );

    const maxCol = Math.max(

        ...selected.map(item =>
            (item.startCell % SETTINGS.columns) +
            Number(item.width || item.data?.GridWidth || 1)
        )

    );

    const bounds = {

        width: Math.max(1, maxCol - minCol),

        height: Math.max(1, maxRow - minRow)

    };

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
        // Selection Bounds
        //----------------------------------

        bounds,

        //----------------------------------
        // Paste Offset
        //----------------------------------

        offset: {

            row: bounds.height,

            column: bounds.width

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

    console.log("Bounds:", clipboard.bounds);

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

    const width =
        Number(clipboard.bounds?.width) || 1;

    const height =
        Number(clipboard.bounds?.height) || 1;

    clipboard.offset.row += height;

    clipboard.offset.column += width;

}

function resetPasteOffset() {

    if (!clipboard) return;

    const width =
        Number(clipboard.bounds?.width) || 1;

    const height =
        Number(clipboard.bounds?.height) || 1;

    clipboard.offset.row = height;

    clipboard.offset.column = width;

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