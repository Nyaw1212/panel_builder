//----------------------------------
// Drag Manager
//----------------------------------

const drag = getDragState();

//----------------------------------
// Enable Drag
//----------------------------------

function enableDrag(card, item) {

    card.style.cursor = "grab";

    card.addEventListener(

        "mousedown",

        e => startDrag(e, item)

    );

}

//----------------------------------
// Start Drag
//----------------------------------

function startDrag(e, item) {

    //----------------------------------
    // Ignore Interactive Elements
    //----------------------------------

    if (

        e.target.closest(".panel-remove") ||

        e.target.closest(".connection-node") ||

        e.target.closest(".equipment-node")

    ) {

        return;

    }

    console.log("Start Drag", e.target);

    //----------------------------------
    // Left Click Only
    //----------------------------------

    if (e.button !== 0) {

        return;

    }

    e.preventDefault();

    e.stopPropagation();

    //----------------------------------
    // Selection
    //----------------------------------

    if (e.ctrlKey || e.metaKey) {

        SelectionManager.toggle(item);

    }
    else {

        SelectionManager.select(item);

    }

    drawCanvas();

    //----------------------------------
    // Drag State
    //----------------------------------

    drag.active = true;

    drag.moved = false;

    drag.item = item;

    drag.startCell = item.startCell;

    drag.hoverCell = item.startCell;

    drag.startMouseX = e.clientX;
    drag.startMouseY = e.clientY;

    drag.mouseX = e.clientX;
    drag.mouseY = e.clientY;

    document.body.style.userSelect = "none";

    document.addEventListener(

        "mousemove",

        onDrag

    );

    document.addEventListener(

        "mouseup",

        stopDrag

    );

}

//----------------------------------
// Drag
//----------------------------------

function onDrag(e) {

    if (!drag.active) {

        return;

    }

    //----------------------------------
    // Detect Movement
    //----------------------------------

    const dx = e.clientX - drag.startMouseX;

    const dy = e.clientY - drag.startMouseY;

    if (

        Math.abs(dx) > 4 ||

        Math.abs(dy) > 4

    ) {

        drag.moved = true;

    }

    drag.mouseX = e.clientX;

    drag.mouseY = e.clientY;

    //----------------------------------
    // Mouse Position Relative To Grid
    //----------------------------------

    const rect = grid.getBoundingClientRect();

    const x = e.clientX - rect.left;

    const y = e.clientY - rect.top;

    //----------------------------------
    // Cell
    //----------------------------------

    const cellWidth = SETTINGS.cellSize + SETTINGS.gap;

    const col = Math.floor(x / cellWidth);

    const row = Math.floor(y / cellWidth);

    //----------------------------------
    // Outside Grid
    //----------------------------------

    if (

        row < 0 ||

        col < 0 ||

        row >= SETTINGS.rows ||

        col >= SETTINGS.columns

    ) {

        return;

    }

    drag.hoverCell =

        row * SETTINGS.columns +

        col;

    console.clear();

    console.log("Dragging");

    console.log("Current Cell:", drag.hoverCell);

    console.log("Moved:", drag.moved);

    console.log(drag);

}

//----------------------------------
// Stop Drag
//----------------------------------

function stopDrag() {

    if (!drag.active) {

        return;

    }

    document.body.style.userSelect = "";

    document.removeEventListener(

        "mousemove",

        onDrag

    );

    document.removeEventListener(

        "mouseup",

        stopDrag

    );

    //----------------------------------
    // Move Equipment
    //----------------------------------

    if (

        drag.moved &&

        drag.item &&

        drag.hoverCell != null &&

        drag.hoverCell !== drag.startCell

    ) {

        console.log(

            "Moving",

            drag.startCell,

            "->",

            drag.hoverCell

        );

        const moved = moveItem(

            drag.item,

            drag.hoverCell

        );

        console.log("Moved:", moved);

        if (moved) {

            drawCanvas();

        }

    }

    console.log("Drag End");

    //----------------------------------
    // Clear State
    //----------------------------------

    clearDragState();

}

//----------------------------------
// Expose
//----------------------------------

window.enableDrag = enableDrag;