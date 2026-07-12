//----------------------------------
// Canvas
//----------------------------------

const grid = document.getElementById("grid");

//----------------------------------
// Currently Selected Panel
//----------------------------------

let selectedItem = null;

//----------------------------------
// Auto Save
//----------------------------------

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

    //----------------------------------
    // Dynamic Grid Style
    //----------------------------------

    grid.style.display = "grid";

    grid.style.gridTemplateColumns =
        `repeat(${SETTINGS.columns}, ${SETTINGS.cellSize}px)`;

    grid.style.gridAutoRows =
        `${SETTINGS.cellSize}px`;

    grid.style.gap =
        `${SETTINGS.gap}px`;

    //----------------------------------
    // Draw Cells
    //----------------------------------

    for (let index = 0; index < getGridSize(); index++) {

        const cell = document.createElement("div");

        cell.className = "cell";

        cell.dataset.index = index;

        //----------------------------------
        // Preview follows cursor
        //----------------------------------

        cell.onmouseenter = () => {

            const preset = getCurrentPreset();

            if (!preset) return;

            movePlacementPreview(index);

        };

        //----------------------------------
        // Click
        //----------------------------------

        cell.onclick = () => {

            const item = getItem(index);

            //----------------------------------
            // Existing Equipment
            //----------------------------------

            if (item) {

                selectedItem = item;

                drawCanvas();

                return;

            }

            //----------------------------------
            // Empty Cell
            //----------------------------------

            selectedItem = null;

            //----------------------------------
            // Preset Placement
            //----------------------------------

            const preset = getCurrentPreset();

            if (preset) {

                const placed = placePreset(
                    preset,
                    index
                );

                if (placed) {

                    hidePlacementPreview();

                }

                return;

            }

            //----------------------------------
            // Manual Placement
            //----------------------------------

            openModal(index);

        };

        grid.appendChild(cell);

    }

}

//----------------------------------
// Draw Equipment
//----------------------------------

function drawPlacedItems() {

    const drawn = new Set();

    getLayout().forEach(item => {

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

        //----------------------------------
        // Card
        //----------------------------------

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

        card.style.padding = "8px";

        card.style.display = "flex";
        card.style.flexDirection = "column";
        card.style.alignItems = "center";
        card.style.justifyContent = "center";
        card.style.gap = "6px";

        card.style.background = "#EAF3FF";
        card.style.borderRadius = "2px";

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

//----------------------------------
// Dynamic Image Size
//----------------------------------

const imageWidth =
    item.width * SETTINGS.cellSize * 0.55;

const imageHeight =
    item.height * SETTINGS.cellSize * 0.55;

img.style.width = `${imageWidth}px`;
img.style.height = `${imageHeight}px`;

img.style.maxWidth = "100%";
img.style.maxHeight = "100%";

img.style.objectFit = "contain";
img.style.pointerEvents = "none";
img.draggable = false;

        //----------------------------------
        // Catalog
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

        desc.textContent =
            `${item.data.Size || ""} ${item.data.Type || ""}`;

        desc.style.textAlign = "center";
        desc.style.fontSize = "10px";
        desc.style.pointerEvents = "none";

        //----------------------------------
// Assemble Card
//----------------------------------

card.appendChild(img);

card.appendChild(code);

card.appendChild(desc);

//----------------------------------
// Enable Drag
//----------------------------------

if (typeof enableDrag === "function") {

    enableDrag(card, item);

}

        console.group("Canvas Item");

console.log(item);

console.log("Preset:", item.preset);

console.log("Materials:", item.materials);

console.groupEnd();

        //----------------------------------
        // Equipment Node
        //----------------------------------

        if (typeof drawEquipmentNode === "function") {

            drawEquipmentNode(

                card,

                item

            );

        }

        //----------------------------------
        // Add to Cell
        //----------------------------------

        cell.appendChild(card);

    });

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

window.drawCanvas = drawCanvas;
window.drawGrid = drawGrid;
window.drawPlacedItems = drawPlacedItems;

window.getSelectedItem = getSelectedItem;
window.setSelectedItem = setSelectedItem;