//----------------------------------
// Delete Selection
//----------------------------------

function deleteSelection(
    options = {}
) {

    const selected =
        SelectionManager
            .getSelectedItems();

    if (
        !selected.length
    ) {

        return false;

    }

    //----------------------------------
    // Remove Panels
    //----------------------------------

    selected.forEach(
        item => {

            removeItem(
                item.startCell,
                {
                    /*
                     * Capture only once after the
                     * entire delete operation.
                     */
                    captureHistory:
                        false
                }
            );

        }
    );

    //----------------------------------
    // Clear Selection
    //----------------------------------

    SelectionManager.clear();

    //----------------------------------
    // Refresh
    //----------------------------------

    drawCanvas();

    //----------------------------------
    // History
    //----------------------------------

    if (
        options.captureHistory !==
            false &&
        window.HistoryManagerV2 &&
        typeof window
            .HistoryManagerV2
            .capture ===
            "function"
    ) {

        window
            .HistoryManagerV2
            .capture(
                selected.length === 1
                    ? "Equipment deleted"
                    : `${selected.length} equipment deleted`
            );

    }

    console.log(
        `Deleted ${selected.length} panel(s).`
    );

    return true;

}

//----------------------------------
// Expose
//----------------------------------

window.deleteSelection =
    deleteSelection;