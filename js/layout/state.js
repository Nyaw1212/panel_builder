//----------------------------------
// Layout State
//----------------------------------

let layout = new Array(getGridSize()).fill(null);

//----------------------------------
// Runtime State
//----------------------------------

const runtime = {

    //----------------------------------
    // Selection
    //----------------------------------

    selectedItem: null,

    //----------------------------------
    // Pending Link
    //----------------------------------

    pendingLink: null,

    //----------------------------------
    // Drag
    //----------------------------------

    drag: {

        active: false,

        item: null,

        startCell: null,

        hoverCell: null,

        mouseX: 0,

        mouseY: 0,

        offsetX: 0,

        offsetY: 0

    }

};

//----------------------------------
// Resize Layout
//----------------------------------

function resizeLayout() {

    const requiredSize = getGridSize();

    if (layout.length >= requiredSize) {

        return;

    }

    while (layout.length < requiredSize) {

        layout.push(null);

    }

}

//----------------------------------
// Get Layout
//----------------------------------

function getLayout() {

    return layout;

}

//----------------------------------
// Get Item
//----------------------------------

function getItem(index) {

    return layout[index] || null;

}

//----------------------------------
// Get Item By ID
//----------------------------------

function getItemById(id) {

    for (const item of layout) {

        if (!item) continue;

        if (item.id === id) {

            return item;

        }

    }

    return null;

}

//----------------------------------
// Clear Layout
//----------------------------------

function clearLayout() {

    layout.fill(null);

}

//----------------------------------
// Replace Layout
//----------------------------------

function replaceLayout(items) {

    resizeLayout();

    clearLayout();

    items.forEach(item => {

        item.occupied.forEach(index => {

            layout[index] = item;

        });

    });

}

//----------------------------------
// Runtime
//----------------------------------

function getRuntime() {

    return runtime;

}

function getDragState() {

    return runtime.drag;

}

function clearDragState() {

    runtime.drag.active = false;

    runtime.drag.item = null;

    runtime.drag.startCell = null;

    runtime.drag.hoverCell = null;

    runtime.drag.mouseX = 0;

    runtime.drag.mouseY = 0;

    runtime.drag.offsetX = 0;

    runtime.drag.offsetY = 0;

}

//----------------------------------
// Expose
//----------------------------------

window.getLayout = getLayout;
window.getItem = getItem;
window.getItemById = getItemById;
window.clearLayout = clearLayout;
window.replaceLayout = replaceLayout;
window.resizeLayout = resizeLayout;

window.getRuntime = getRuntime;
window.getDragState = getDragState;
window.clearDragState = clearDragState;