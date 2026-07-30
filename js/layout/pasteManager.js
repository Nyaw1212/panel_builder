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
    // Mouse Target
    //----------------------------------

    const hoveredCell =
        document.querySelector(
            "#grid .cell:hover"
        );

    const hoveredIndex =
        hoveredCell
            ? Number(
                hoveredCell.dataset.index
              )
            : NaN;

    const hasMouseTarget =
        Number.isInteger(hoveredIndex) &&
        hoveredIndex >= 0;

    //----------------------------------
    // Paste Origin
    //----------------------------------

    const targetRow =
        hasMouseTarget
            ? Math.floor(
                hoveredIndex /
                SETTINGS.columns
              )
            : data.origin.row +
              data.offset.row;

    const targetColumn =
        hasMouseTarget
            ? hoveredIndex %
              SETTINGS.columns
            : data.origin.column +
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
                targetRow +
                panel.row;

            const col =
                targetColumn +
                panel.column;

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
    // Next Keyboard Paste Offset
    //----------------------------------

    if (!hasMouseTarget) {

        incrementPasteOffset();

    }

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
        "Target:",
        hasMouseTarget
            ? `Mouse cell ${hoveredIndex}`
            : data.offset
    );

    console.groupEnd();

    return true;

}

//----------------------------------
// Expose
//----------------------------------

window.pasteSelection =
    pasteSelection;
