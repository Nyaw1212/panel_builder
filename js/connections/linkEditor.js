//----------------------------------
// Link Editor
//----------------------------------

let editingLink = null;

//----------------------------------
// Open Editor
//----------------------------------

function openLinkEditor(link) {

    if (!link) return;

    editingLink = link;

    console.log("Editing Link", link);

    console.log("START NODE", link.nodes.start);

    console.log("END NODE", link.nodes.end);

    refreshLinkEditor();

    if (typeof refreshLinkInspector === "function") {

        refreshLinkInspector();

    }

}

//----------------------------------
// Close Editor
//----------------------------------

function closeLinkEditor() {

    editingLink = null;

    if (typeof hideLinkInspector === "function") {

        hideLinkInspector();

    }

}

//----------------------------------
// Refresh Editor
//----------------------------------

function refreshLinkEditor() {

    if (!editingLink) return;

    console.log({

        id: editingLink.id,

        length: editingLink.length,

        conduit: editingLink.conduit,

        assembly: editingLink.assembly,

        materials: editingLink.materials

    });

}

//----------------------------------
// Get Editing Link
//----------------------------------

function getEditingLink() {

    return editingLink;

}

//----------------------------------
// Is Editing
//----------------------------------

function isEditingLink(link) {

    return editingLink?.id === link?.id;

}

//----------------------------------
// Save
//----------------------------------

function saveLinkEditor() {

    if (!editingLink) return;

    updateLinkAssembly(editingLink);

    updateLinkMaterials(editingLink);

    drawCanvas();

    refreshLinkEditor();

    if (typeof refreshLinkInspector === "function") {

        refreshLinkInspector();

    }

}

//----------------------------------
// Expose
//----------------------------------

window.openLinkEditor = openLinkEditor;
window.closeLinkEditor = closeLinkEditor;
window.refreshLinkEditor = refreshLinkEditor;
window.getEditingLink = getEditingLink;
window.isEditingLink = isEditingLink;
window.saveLinkEditor = saveLinkEditor;