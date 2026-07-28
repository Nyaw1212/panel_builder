//----------------------------------
// New Project
//----------------------------------

function newProject() {

    const confirmed = confirm(
        "Discard current project?"
    );

    if (!confirmed) {
        return false;
    }

    //----------------------------------
    // Disable Manual Routing
    //----------------------------------

    if (
        window.ManualRouting &&
        typeof window.ManualRouting.disable === "function"
    ) {
        window.ManualRouting.disable();
    }

    //----------------------------------
    // Clear Draft
    //----------------------------------

    if (typeof clearDraft === "function") {
        clearDraft();
    }

    //----------------------------------
    // Clear Project State
    //----------------------------------

    if (typeof clearProjectState === "function") {
        clearProjectState();
    }

    //----------------------------------
    // Clear Connections
    //----------------------------------

    if (typeof clearLinks === "function") {
        clearLinks({
            captureHistory: false,
            refresh: false
        });
    }

    //----------------------------------
    // Clear Layout
    //----------------------------------

    if (typeof clearLayout === "function") {
        clearLayout();
    }

    //----------------------------------
    // Clear Runtime State
    //----------------------------------

    if (typeof clearDragState === "function") {
        clearDragState();
    }

    const runtime =
        typeof getRuntime === "function"
            ? getRuntime()
            : null;

    if (runtime) {
        runtime.pendingLink = null;
    }

    if (typeof clearSelection === "function") {
        clearSelection();
    }

    if (typeof clearSelectedLink === "function") {
        clearSelectedLink();
    }

    if (typeof hideLinkInspector === "function") {
        hideLinkInspector();
    }

    if (typeof removeLinkDeleteButton === "function") {
        removeLinkDeleteButton();
    }

    //----------------------------------
    // Reset History
    //----------------------------------

    if (
        window.HistoryManagerV2 &&
        typeof window.HistoryManagerV2.reset === "function"
    ) {
        window.HistoryManagerV2.reset(
            "New project"
        );
    }

    //----------------------------------
    // Refresh UI
    //----------------------------------

    if (typeof drawCanvas === "function") {
        drawCanvas();
    }

    if (typeof renderBOM === "function") {
        renderBOM();
    }

    console.log("New project initialized.");

    return true;
}

//----------------------------------
// Expose
//----------------------------------

window.newProject = newProject;
