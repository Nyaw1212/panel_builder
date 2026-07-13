console.log("Clipboard:", getClipboard());
//----------------------------------
// Paste Selection
//----------------------------------

function pasteSelection() {

    //----------------------------------
    // Clipboard Exists?
    //----------------------------------

    if (!hasClipboard()) {

        console.log("Clipboard is empty.");

        return false;

    }

    const data = getClipboard();

    //----------------------------------
    // Paste Offset
    //----------------------------------

    const rowOffset = 1;

    const colOffset = 1;

    //----------------------------------
    // Paste Panels
    //----------------------------------

    const pasted = [];

    data.panels.forEach(panel => {

        //----------------------------------
        // Calculate Cell
        //----------------------------------

        const row =
            data.origin.row +
            panel.row +
            rowOffset;

        const col =
            data.origin.column +
            panel.column +
            colOffset;

        const startCell =
            row * SETTINGS.columns +
            col;

        //----------------------------------
        // Place
        //----------------------------------

        const item = placeItem(

            panel.equipment,

            startCell,

            panel.preset

        );

        //----------------------------------
        // Placement Failed
        //----------------------------------

        if (!item) {

            console.warn(

                "Paste failed:",

                panel.equipment.CatalogNumber

            );

            return;

        }

        //----------------------------------
        // Restore Properties
        //----------------------------------

        item.rotation = panel.rotation;

        item.materials = structuredClone(

            panel.materials

        );

        pasted.push(item);

    });

    //----------------------------------
    // Select Newly Pasted
    //----------------------------------

    SelectionManager.clear();

    pasted.forEach(item => {

        SelectionManager.add(item);

    });

    //----------------------------------
    // Draw
    //----------------------------------

    drawCanvas();

    console.group("Paste");

    console.log(

        "Panels:",

        pasted.length

    );

    console.groupEnd();

    return true;

}

//----------------------------------
// Expose
//----------------------------------

window.pasteSelection = pasteSelection;