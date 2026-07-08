//----------------------------------
// Link Selection
//----------------------------------

let selectedLink = null;

//----------------------------------
// Select Link
//----------------------------------

function selectLink(link) {

    if (!link) return;

    selectedLink = link;

    console.log("Link Selected", link);

}

//----------------------------------
// Get Selected Link
//----------------------------------

function getSelectedLink() {

    return selectedLink;

}

//----------------------------------
// Is Selected
//----------------------------------

function isLinkSelected(link) {

    return selectedLink?.id === link?.id;

}

//----------------------------------
// Clear Selection
//----------------------------------

function clearSelectedLink() {

    selectedLink = null;

}

//----------------------------------
// Toggle Selection
//----------------------------------

function toggleLinkSelection(link) {

    if (isLinkSelected(link)) {

        clearSelectedLink();

    }
    else {

        selectLink(link);

    }

}

//----------------------------------
// Expose
//----------------------------------

window.selectLink = selectLink;
window.getSelectedLink = getSelectedLink;
window.isLinkSelected = isLinkSelected;
window.clearSelectedLink = clearSelectedLink;
window.toggleLinkSelection = toggleLinkSelection;