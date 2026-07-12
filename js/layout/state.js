//----------------------------------
// Layout State
//----------------------------------

let layout = new Array(getGridSize()).fill(null);

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
// Expose
//----------------------------------

window.getLayout = getLayout;

window.getItem = getItem;

window.getItemById = getItemById;

window.clearLayout = clearLayout;

window.replaceLayout = replaceLayout;

window.resizeLayout = resizeLayout;