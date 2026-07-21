//----------------------------------
// Elements
//----------------------------------

const linkInspector =
    document.getElementById(
        "linkInspector"
    );

const inspectorBody =
    document.getElementById(
        "inspectorBody"
    );

//----------------------------------
// Show
//----------------------------------

function showLinkInspector() {

    if (!linkInspector) {

        return false;

    }

    linkInspector
        .classList
        .remove(
            "collapsed"
        );

    return true;

}

//----------------------------------
// Hide
//----------------------------------

function hideLinkInspector(
    options = {}
) {

    if (
        linkInspector
    ) {

        linkInspector
            .classList
            .add(
                "collapsed"
            );

    }

    if (
        inspectorBody &&
        options.clearBody !== false
    ) {

        inspectorBody.innerHTML = `

            <div class="inspector-placeholder">

                No Link Selected

            </div>

        `;

    }

    return true;

}

//----------------------------------
// Refresh
//----------------------------------

function refreshLinkInspector(
    options = {}
) {

    const link =
        typeof getEditingLink ===
            "function"
            ? getEditingLink()
            : null;

    if (!link) {

        hideLinkInspector(
            options
        );

        return false;

    }

    showLinkInspector();

    //----------------------------------
    // Render
    //----------------------------------

    if (
        typeof renderLinkInspector ===
        "function"
    ) {

        renderLinkInspector(
            link
        );

    }

    //----------------------------------
    // Bind Events
    //----------------------------------

    if (
        options.bindEvents !== false &&
        typeof bindLinkInspectorEvents ===
            "function"
    ) {

        bindLinkInspectorEvents(
            link
        );

    }

    return true;

}

//----------------------------------
// Refresh Without Rebinding
//----------------------------------

function refreshLinkInspectorView() {

    return refreshLinkInspector({
        bindEvents:
            false
    });

}

//----------------------------------
// Expose
//----------------------------------

window.showLinkInspector =
    showLinkInspector;

window.hideLinkInspector =
    hideLinkInspector;

window.refreshLinkInspector =
    refreshLinkInspector;

window.refreshLinkInspectorView =
    refreshLinkInspectorView;