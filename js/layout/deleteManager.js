//----------------------------------
// Delete Selection
//----------------------------------

function deleteSelection() {

    const selected = SelectionManager.getSelectedItems();

    if (!selected.length) {

        return false;

    }

    //----------------------------------
    // Remove Panels
    //----------------------------------

    selected.forEach(item => {

        removeItem(item.startCell);

    });

    //----------------------------------
    // Clear Selection
    //----------------------------------

    SelectionManager.clear();

    //----------------------------------
    // Refresh
    //----------------------------------

    drawCanvas();

    console.log(

        `Deleted ${selected.length} panel(s).`

    );

    return true;

}

//----------------------------------
// Expose
//----------------------------------

window.deleteSelection = deleteSelection;