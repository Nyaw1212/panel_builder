//----------------------------------
// Canvas
//----------------------------------

const grid = document.getElementById("grid");

const SETTINGS = {

    rows: 5,

    columns: 10,

    cellSize: 140,

    gap: 12

};

const GRID_SIZE = SETTINGS.rows * SETTINGS.columns;

//----------------------------------
// Layout
//----------------------------------

const layout = new Array(GRID_SIZE).fill(null);

// Currently Selected Panel
let selectedItem = null;

// Auto Save
let autoSaveEnabled = false;

//----------------------------------
// Draw Canvas
//----------------------------------

function drawCanvas() {

    //----------------------------------
    // Remove Floating Link Delete
    //----------------------------------

    if (typeof removeLinkDeleteButton === "function") {

        removeLinkDeleteButton();

    }

    //----------------------------------
    // Draw
    //----------------------------------

    drawGrid();

    drawPlacedItems();

    if (typeof clearSVG === "function") {

        clearSVG();

    }

    drawConnections();

    drawLinks();

    //----------------------------------
    // Update BOM
    //----------------------------------

    if (typeof renderBOM === "function") {

        renderBOM();

    }

    //----------------------------------
    // Auto Save Draft
    //----------------------------------

    if (

        autoSaveEnabled &&

        typeof saveDraft === "function"

    ) {

        saveDraft();

    }

}

//----------------------------------
// Draw Grid
//----------------------------------

function drawGrid() {

    grid.innerHTML = "";

    for (let index = 0; index < GRID_SIZE; index++) {

        const cell = document.createElement("div");

        cell.className = "cell";

        cell.dataset.index = index;

        cell.innerHTML = "+";

        cell.onclick = () => {

            const item = getItem(index);

            if (item) {

                selectedItem = item;

                drawCanvas();

            }
            else {

                selectedItem = null;

                openModal(index);

            }

        };

        grid.appendChild(cell);

    }

}

//----------------------------------
// Draw Equipment
//----------------------------------

function drawPlacedItems() {

    const drawn = new Set();

    layout.forEach(item => {

        if (!item) return;

        if (drawn.has(item.id)) return;

        drawn.add(item.id);

        const cell = grid.querySelector(

            `[data-index="${item.startCell}"]`

        );

        if (!cell) return;

        const image = item.data.DriveFileID
            ? `https://drive.google.com/thumbnail?id=${item.data.DriveFileID}&sz=w300`
            : "";

        const isSelected =

            selectedItem &&

            selectedItem.id === item.id;

        const card = document.createElement("div");

        card.className = "panel-card";

        card.style.position = "absolute";
        card.style.left = "0";
        card.style.top = "0";

        card.style.width =
            `${item.width * (SETTINGS.cellSize + SETTINGS.gap) - SETTINGS.gap}px`;

        card.style.height =
            `${item.height * (SETTINGS.cellSize + SETTINGS.gap) - SETTINGS.gap}px`;

        card.style.boxSizing = "border-box";

        //----------------------------------
        // Reserve space for knockout nodes
        //----------------------------------

        card.style.padding = "24px";

        card.style.display = "flex";
        card.style.flexDirection = "column";
        card.style.alignItems = "center";
        card.style.justifyContent = "center";
        card.style.gap = "6px";

        card.style.background = "#EAF3FF";
        card.style.borderRadius = "8px";

        if (isSelected) {

            card.style.border = "3px solid #2196F3";

        }
        else {

            card.style.border = "2px solid transparent";

        }

        //----------------------------------
        // Remove Button
        //----------------------------------

        const remove = document.createElement("button");

        remove.className = "panel-remove";

        remove.innerHTML = "✕";

        remove.onclick = e => {

            e.stopPropagation();

            removeItem(item.startCell);

            drawCanvas();

        };

        card.appendChild(remove);

        //----------------------------------
        // Image
        //----------------------------------

        const img = document.createElement("img");

        img.className = "canvas-image";

        img.src = image;

        img.style.maxWidth = "60px";
        img.style.maxHeight = "60px";
        img.style.objectFit = "contain";
        img.style.pointerEvents = "none";

        //----------------------------------
        // Catalog Number
        //----------------------------------

        const code = document.createElement("div");

        code.className = "canvas-code";

        code.textContent = item.data.CatalogNumber;

        code.style.textAlign = "center";
        code.style.fontSize = "11px";
        code.style.fontWeight = "600";
        code.style.pointerEvents = "none";

        //----------------------------------
        // Description
        //----------------------------------

        const desc = document.createElement("div");

        desc.className = "canvas-desc";

        desc.textContent = `${item.data.Size} ${item.data.Type}`;

        desc.style.textAlign = "center";
        desc.style.fontSize = "10px";
        desc.style.pointerEvents = "none";

        //----------------------------------
        // Assemble Card
        //----------------------------------

        card.appendChild(img);
        card.appendChild(code);
        card.appendChild(desc);

        cell.appendChild(card);

    });

}

//----------------------------------
// Get Layout
//----------------------------------

function getLayout() {

    return layout;

}

//----------------------------------
// Selected Item
//----------------------------------

function getSelectedItem() {

    return selectedItem;

}

function setSelectedItem(item) {

    selectedItem = item;

}

//----------------------------------
// Expose
//----------------------------------

window.getLayout = getLayout;

window.getSelectedItem = getSelectedItem;

window.setSelectedItem = setSelectedItem;