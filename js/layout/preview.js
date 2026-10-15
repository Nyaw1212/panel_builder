//----------------------------------
// Preview Layer
//----------------------------------

const previewLayer =
    document.getElementById("previewLayer");

//----------------------------------
// State
//----------------------------------

let previewCard = null;
let previewItem = null;
let previewCell = null;
let pendingPreviewCell = null;
let previewMoveFrame = null;

function placePreviewAtCell(index) {
    if (!previewCard) return;

    const cellWidth = SETTINGS.cellSize + SETTINGS.gap;
    const column = index % SETTINGS.columns;
    const row = Math.floor(index / SETTINGS.columns);
    previewCard.style.transform = `translate3d(${column * cellWidth}px, ${row * cellWidth}px, 0)`;
}

//----------------------------------
// Show Preview
//----------------------------------

function showPlacementPreview(item) {

    hidePlacementPreview();

    if (!item) {

        return;

    }

    previewItem = item;

    previewCard = document.createElement("div");

    previewCard.id = "placementPreview";

    previewCard.className = "panel-card preview-card";

    //----------------------------------
    // Style
    //----------------------------------

    previewCard.style.position = "absolute";
    previewCard.style.pointerEvents = "none";
    previewCard.style.opacity = "0.40";
    previewCard.style.zIndex = "9999";

    previewCard.style.background = "#EAF3FF";
    previewCard.style.border = "2px dashed #2196F3";
    previewCard.style.borderRadius = "8px";

    previewCard.style.display = "flex";
    previewCard.style.flexDirection = "column";
    previewCard.style.alignItems = "center";
    previewCard.style.justifyContent = "center";
    previewCard.style.gap = "6px";

    previewCard.style.padding = "24px";
    previewCard.style.boxSizing = "border-box";

    previewCard.style.willChange = "transform";
    previewCard.style.transition = "transform .05s linear";

    previewCard.style.width =
        `${item.GridWidth * (SETTINGS.cellSize + SETTINGS.gap) - SETTINGS.gap}px`;

    previewCard.style.height =
        `${item.GridHeight * (SETTINGS.cellSize + SETTINGS.gap) - SETTINGS.gap}px`;

    //----------------------------------
    // Image
    //----------------------------------

    const img = document.createElement("img");

    img.className = "canvas-image";

    img.src = getDriveImageUrl(item.DriveFileID, 300);

    img.style.maxWidth = "60px";
    img.style.maxHeight = "60px";
    img.style.objectFit = "contain";
    img.style.pointerEvents = "none";

    //----------------------------------
    // Catalog
    //----------------------------------

    const code = document.createElement("div");

    code.className = "canvas-code";

    code.textContent = item.CatalogNumber;

    code.style.pointerEvents = "none";

    //----------------------------------
    // Description
    //----------------------------------

    const desc = document.createElement("div");

    desc.className = "canvas-desc";

    desc.textContent =
        `${item.Size || ""} ${item.Type || ""}`;

    desc.style.pointerEvents = "none";

    //----------------------------------
    // Assemble
    //----------------------------------

    previewCard.appendChild(img);
    previewCard.appendChild(code);
    previewCard.appendChild(desc);

    previewLayer.appendChild(previewCard);

}

//----------------------------------
// Move Preview
//----------------------------------

function movePlacementPreview(index) {

    if (!previewCard) {

        return;

    }

    previewCell = index;

    // Cell hover can happen hundreds of times while moving across the grid.
    // Avoid a DOM lookup and offset/layout read for each cell; one GPU-backed
    // transform per animation frame is enough for a smooth preview.
    pendingPreviewCell = index;
    if (previewMoveFrame !== null) return;

    previewMoveFrame = requestAnimationFrame(() => {
        previewMoveFrame = null;
        if (pendingPreviewCell === null) return;
        placePreviewAtCell(pendingPreviewCell);
        pendingPreviewCell = null;
    });

}

//----------------------------------
// Hide Preview
//----------------------------------

function hidePlacementPreview() {

    if (previewMoveFrame !== null) {
        cancelAnimationFrame(previewMoveFrame);
        previewMoveFrame = null;
    }
    pendingPreviewCell = null;

    if (

        previewCard &&

        previewCard.parentNode

    ) {

        previewCard.parentNode.removeChild(

            previewCard

        );

    }

    previewCard = null;
    previewItem = null;
    previewCell = null;

}

//----------------------------------
// State
//----------------------------------

function isPreviewVisible() {

    return previewCard !== null;

}

function getPreviewCell() {

    return previewCell;

}

function getPreviewItem() {

    return previewItem;

}

//----------------------------------
// Expose
//----------------------------------

window.showPlacementPreview = showPlacementPreview;
window.movePlacementPreview = movePlacementPreview;
window.hidePlacementPreview = hidePlacementPreview;

window.isPreviewVisible = isPreviewVisible;
window.getPreviewCell = getPreviewCell;
window.getPreviewItem = getPreviewItem;
