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
    // Build Paste Plan
    //----------------------------------

    const plan =
        data.panels.map(panel => {

            const row =
                targetRow +
                panel.row;

            const column =
                targetColumn +
                panel.column;

            return {
                panel,
                row,
                column,
                startCell:
                    row *
                    SETTINGS.columns +
                    column
            };

        });

    //----------------------------------
    // Validate Entire Paste First
    //----------------------------------

    const plannedCells =
        new Set();

    const valid =
        plan.every(entry => {

            const equipment =
                entry.panel.equipment;

            const width =
                Number(
                    equipment.GridWidth ??
                    entry.panel.width ??
                    1
                ) || 1;

            const height =
                Number(
                    equipment.GridHeight ??
                    entry.panel.height ??
                    1
                ) || 1;

            for (
                let r = 0;
                r < height;
                r++
            ) {

                for (
                    let c = 0;
                    c < width;
                    c++
                ) {

                    const row =
                        entry.row + r;

                    const column =
                        entry.column + c;

                    if (
                        row < 0 ||
                        column < 0 ||
                        row >= SETTINGS.rows ||
                        column >= SETTINGS.columns
                    ) {

                        return false;

                    }

                    const index =
                        row *
                        SETTINGS.columns +
                        column;

                    if (
                        getLayout()[index] ||
                        plannedCells.has(index)
                    ) {

                        return false;

                    }

                    plannedCells.add(index);

                }

            }

            return true;

        });

    if (!valid) {

        console.warn(
            "Paste target is occupied or outside the grid."
        );

        return false;

    }

    //----------------------------------
    // Paste Panels
    //----------------------------------

    const pasted = [];

    plan.forEach(entry => {

        const panel =
            entry.panel;

        const item =
            placeItem(
                panel.equipment,
                entry.startCell,
                panel.preset,
                {
                    captureHistory:
                        false
                }
            );

        if (!item) {

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
                        panel.materials || []
                    )
                );

        }

        pasted.push(item);

    });

    if (
        pasted.length !==
        plan.length
    ) {

        console.error(
            "Paste aborted unexpectedly."
        );

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
