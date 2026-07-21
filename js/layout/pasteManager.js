//----------------------------------
// Paste Selection
//----------------------------------

function pasteSelection(
    options = {}
) {

    //----------------------------------
    // Clipboard Exists?
    //----------------------------------

    if (
        !hasClipboard()
    ) {

        console.log(
            "Clipboard is empty."
        );

        return false;

    }

    const data =
        getClipboard();

    //----------------------------------
    // Paste Offset
    //----------------------------------

    const rowOffset =
        data.offset.row;

    const colOffset =
        data.offset.column;

    //----------------------------------
    // Paste Panels
    //----------------------------------

    const pasted = [];

    data.panels.forEach(
        panel => {

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
                row *
                    SETTINGS.columns +
                col;

            //----------------------------------
            // Place
            //----------------------------------

            const item =
                placeItem(
                    panel.equipment,
                    startCell,
                    panel.preset,
                    {
                        /*
                         * Disable per-item history.
                         * Paste is captured once
                         * after all panels finish.
                         */
                        captureHistory:
                            false
                    }
                );

            //----------------------------------
            // Placement Failed
            //----------------------------------

            if (!item) {

                console.warn(
                    "Paste failed:",
                    panel
                        .equipment
                        .CatalogNumber
                );

                return;

            }

            //----------------------------------
            // Restore Properties
            //----------------------------------

            item.rotation =
                panel.rotation || 0;

            if (
                typeof cloneSerializable ===
                "function"
            ) {

                item.materials =
                    cloneSerializable(
                        panel.materials || []
                    );

            }
            else if (
                typeof structuredClone ===
                "function"
            ) {

                item.materials =
                    structuredClone(
                        panel.materials || []
                    );

            }
            else {

                item.materials =
                    JSON.parse(
                        JSON.stringify(
                            panel.materials ||
                            []
                        )
                    );

            }

            pasted.push(
                item
            );

        }
    );

    //----------------------------------
    // Nothing Pasted
    //----------------------------------

    if (
        !pasted.length
    ) {

        return false;

    }

    //----------------------------------
    // Next Paste Offset
    //----------------------------------

    incrementPasteOffset();

    //----------------------------------
    // Select Newly Pasted
    //----------------------------------

    SelectionManager.clear();

    pasted.forEach(
        item => {

            SelectionManager.add(
                item
            );

        }
    );

    //----------------------------------
    // Draw
    //----------------------------------

    drawCanvas();

    //----------------------------------
    // Capture History Once
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
                pasted.length === 1
                    ? "Equipment pasted"
                    : `${pasted.length} equipment pasted`
            );

    }

    console.group(
        "Paste"
    );

    console.log(
        "Panels:",
        pasted.length
    );

    console.log(
        "Next Offset:",
        data.offset
    );

    console.groupEnd();

    return true;

}

//----------------------------------
// Expose
//----------------------------------

window.pasteSelection =
    pasteSelection;