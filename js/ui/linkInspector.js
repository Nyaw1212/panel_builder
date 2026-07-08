//----------------------------------
// Elements
//----------------------------------

const linkInspector =
    document.getElementById("linkInspector");

const inspectorBody =
    document.getElementById("inspectorBody");

//----------------------------------
// Show
//----------------------------------

function showLinkInspector() {

    linkInspector.classList.remove("collapsed");

}

//----------------------------------
// Hide
//----------------------------------

function hideLinkInspector() {

    linkInspector.classList.add("collapsed");

    inspectorBody.innerHTML = `

        <div class="inspector-placeholder">

            No Link Selected

        </div>

    `;

}

//----------------------------------
// Refresh
//----------------------------------

function refreshLinkInspector() {

    const link = getEditingLink();

    if (!link) {

        hideLinkInspector();

        return;

    }

    showLinkInspector();

    renderLinkInspector(link);

    bindLinkInspectorEvents(link);

}

//----------------------------------
// Expose
//----------------------------------

window.showLinkInspector = showLinkInspector;
window.hideLinkInspector = hideLinkInspector;
window.refreshLinkInspector = refreshLinkInspector;