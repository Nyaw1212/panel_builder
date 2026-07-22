//----------------------------------
// Keyboard Shortcuts
//----------------------------------

document.addEventListener(
    "keydown",
    handleKeyboardShortcuts
);

//----------------------------------
// Handle Keyboard Shortcuts
//----------------------------------

async function handleKeyboardShortcuts(e) {

    //----------------------------------
    // Prevent Repeated Shortcut Firing
    //----------------------------------

    if (e.repeat) {
        return;
    }

    const key =
        String(e.key || "")
            .toLowerCase();

    const modifier =
        e.ctrlKey ||
        e.metaKey;

    const typing =
        isTypingElement(
            document.activeElement
        );

    //----------------------------------
    // Escape
    //
    // Must run before typing protection
    //----------------------------------

    if (e.key === "Escape") {

        e.preventDefault();

        const closed =
            closeTopmostElement();

        //----------------------------------
        // Nothing Open: Clear Selection
        //----------------------------------

        if (!closed) {

            clearCurrentSelection();

        }

        return;

    }

    //----------------------------------
    // Ctrl / Cmd + S
    //----------------------------------

    if (
        modifier &&
        key === "s"
    ) {

        e.preventDefault();

        await saveProjectFromShortcut();

        return;

    }

    //----------------------------------
    // Ignore Editing Shortcuts
    //
    // This allows native copy, paste,
    // select-all and delete in inputs.
    //----------------------------------

    if (typing) {
        return;
    }

    //----------------------------------
    // Ctrl / Cmd + N
    //----------------------------------

    if (
        modifier &&
        key === "n"
    ) {

        e.preventDefault();

        if (
            typeof newProject ===
            "function"
        ) {

            console.log(
                "Keyboard: New Project"
            );

            newProject();

        }

        return;

    }

    //----------------------------------
    // Ctrl / Cmd + O
    //----------------------------------

    if (
        modifier &&
        key === "o"
    ) {

        e.preventDefault();

        if (
            typeof showOpenProjectDialog ===
            "function"
        ) {

            console.log(
                "Keyboard: Open Project"
            );

            showOpenProjectDialog();

        }

        return;

    }

    //----------------------------------
    // Ctrl / Cmd + B
    //----------------------------------

    if (
        modifier &&
        key === "b"
    ) {

        e.preventDefault();

        if (
            typeof printBOM ===
            "function"
        ) {

            console.log(
                "Keyboard: BOM"
            );

            printBOM();

        }

        return;

    }

    //----------------------------------
    // Ctrl / Cmd + C
    //----------------------------------

    if (
        modifier &&
        key === "c"
    ) {

        e.preventDefault();

        //----------------------------------
        // Copy Hovered Connection
        //----------------------------------

        if (
            typeof hasHoveredConnection ===
                "function" &&
            hasHoveredConnection()
        ) {

            const hoveredConnection =
                typeof getHoveredConnection ===
                    "function"
                    ? getHoveredConnection()
                    : null;

            const copied =
                hoveredConnection &&
                typeof copyConnection ===
                    "function"
                    ? copyConnection(
                        hoveredConnection
                    )
                    : false;

            if (copied) {

                console.log(
                    "Copied connection."
                );

            }

            return;

        }

        //----------------------------------
        // Copy Selected Panels
        //----------------------------------

        const copied =
            typeof copySelection ===
                "function"
                ? copySelection()
                : false;

        if (copied) {

            const count =
                typeof getClipboardCount ===
                    "function"
                    ? getClipboardCount()
                    : 0;

            console.log(
                `Copied ${count} panel(s).`
            );

        }

        return;

    }

    //----------------------------------
    // Ctrl / Cmd + V
    //----------------------------------

    if (
        modifier &&
        key === "v"
    ) {

        e.preventDefault();

        //----------------------------------
        // Paste Connection
        //----------------------------------

        const canPasteConnection =
            typeof hasHoveredConnection ===
                "function" &&
            typeof hasNodeClipboard ===
                "function" &&
            hasHoveredConnection() &&
            hasNodeClipboard();

        if (canPasteConnection) {

            const hoveredConnection =
                typeof getHoveredConnection ===
                    "function"
                    ? getHoveredConnection()
                    : null;

            const pasted =
                hoveredConnection &&
                typeof pasteConnection ===
                    "function"
                    ? pasteConnection(
                        hoveredConnection
                    )
                    : false;

            if (pasted) {

                console.log(
                    "Pasted connection."
                );

            }

            return;

        }

        //----------------------------------
        // Paste Panels
        //----------------------------------

        const pasted =
            typeof pasteSelection ===
                "function"
                ? pasteSelection()
                : false;

        if (pasted) {

            const count =
                window.SelectionManager &&
                typeof SelectionManager.getCount ===
                    "function"
                    ? SelectionManager.getCount()
                    : 0;

            console.log(
                `Pasted ${count} panel(s).`
            );

        }

        return;

    }

    //----------------------------------
    // Ctrl / Cmd + A
    //----------------------------------

    if (
        modifier &&
        key === "a"
    ) {

        e.preventDefault();

        selectAllPanels();

        return;

    }

    //----------------------------------
    // Ctrl / Cmd + D
    //----------------------------------

    if (
        modifier &&
        key === "d"
    ) {

        e.preventDefault();

        duplicateCurrentSelection();

        return;

    }

    //----------------------------------
    // Delete Selection
    //----------------------------------

    if (
        e.key === "Delete" ||
        e.key === "Backspace"
    ) {

        e.preventDefault();

        if (
            typeof deleteSelection ===
            "function"
        ) {

            deleteSelection();

        }

        return;

    }

}

//----------------------------------
// Is Typing Element
//----------------------------------

function isTypingElement(element) {

    if (!element) {
        return false;
    }

    const tag =
        String(
            element.tagName || ""
        ).toUpperCase();

    return (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        element.isContentEditable
    );

}

//----------------------------------
// Save Project Shortcut
//----------------------------------

async function saveProjectFromShortcut() {

    if (
        typeof getProjectState !==
        "function"
    ) {

        console.warn(
            "getProjectState() is unavailable."
        );

        return;

    }

    const project =
        getProjectState();

    //----------------------------------
    // First Save
    //----------------------------------

    if (!project?.jobName) {

        if (
            typeof showProjectDialog ===
            "function"
        ) {

            console.log(
                "Keyboard: Opening Save Dialog"
            );

            showProjectDialog();

        }

        return;

    }

    //----------------------------------
    // Existing Project
    //----------------------------------

    if (
        typeof saveCurrentProject !==
        "function"
    ) {

        console.warn(
            "saveCurrentProject() is unavailable."
        );

        return;

    }

    try {

        console.log(
            "Keyboard: Saving Project..."
        );

        const result =
            await saveCurrentProject();

        console.log(result);

        if (!result?.success) {

            alert(
                result?.message ||
                "Save Failed."
            );

            return;

        }

        console.log(
            "Project saved successfully."
        );

    }
    catch (error) {

        console.error(
            "Keyboard Save Failed:",
            error
        );

        alert(
            error?.message ||
            "Save Failed."
        );

    }

}

//----------------------------------
// Close Topmost Element
//----------------------------------

function closeTopmostElement() {

    //----------------------------------
    // Known Dialogs
    //----------------------------------

    const knownDialogs = [

        {
            id: "equipmentModal",
            closeFunction:
                "closeActiveModal"
        },

        {
            id: "projectDialog",
            closeFunction:
                "hideProjectDialog"
        },

        {
            id: "openProjectDialog",
            closeFunction:
                "hideOpenProjectDialog"
        },

        {
            id: "materialPanelV2",
            closeFunction:
                "hideMaterialPanelV2"
        },

        {
            id: "materialDebugPanelV2",
            closeFunction:
                "hideMaterialDebugPanelV2"
        },

        {
            id: "bomDialog",
            closeFunction:
                "hideBOMDialog"
        }

    ];

    //----------------------------------
    // Find Visible Known Dialogs
    //----------------------------------

    const visibleKnownDialogs =
        knownDialogs
            .map(config => {

                const element =
                    document.getElementById(
                        config.id
                    );

                return {
                    ...config,
                    element
                };

            })
            .filter(item =>
                isElementVisible(
                    item.element
                )
            )
            .sort(
                (
                    first,
                    second
                ) =>
                    getElementZIndex(
                        second.element
                    ) -
                    getElementZIndex(
                        first.element
                    )
            );

    if (visibleKnownDialogs.length) {

        const topDialog =
            visibleKnownDialogs[0];

        const closeFunction =
            window[
                topDialog.closeFunction
            ];

        if (
            typeof closeFunction ===
            "function"
        ) {

            closeFunction();

        }
        else {

            topDialog.element.style.display =
                "none";

        }

        return true;

    }

    //----------------------------------
    // Generic ESC-Close Elements
    //
    // Add:
    // data-esc-close="true"
    //----------------------------------

    const genericElements =
        Array.from(
            document.querySelectorAll(
                '[data-esc-close="true"]'
            )
        )
            .filter(
                isElementVisible
            )
            .sort(
                (
                    first,
                    second
                ) =>
                    getElementZIndex(second) -
                    getElementZIndex(first)
            );

    if (genericElements.length) {

        const element =
            genericElements[0];

        //----------------------------------
        // Optional Custom Close Event
        //----------------------------------

        element.dispatchEvent(
            new CustomEvent(
                "escapeclose",
                {
                    bubbles: false
                }
            )
        );

        //----------------------------------
        // Hide Unless Handler Already Did
        //----------------------------------

        if (isElementVisible(element)) {

            element.style.display =
                "none";

        }

        return true;

    }

    //----------------------------------
    // Context Menus
    //----------------------------------

    const contextMenu =
        getTopVisibleElement([
            ".context-menu",
            ".node-context-menu",
            ".connection-context-menu",
            "[role='menu']"
        ]);

    if (contextMenu) {

        contextMenu.style.display =
            "none";

        return true;

    }

    return false;

}

//----------------------------------
// Get Top Visible Element
//----------------------------------

function getTopVisibleElement(selectors) {

    const elements =
        selectors.flatMap(
            selector =>
                Array.from(
                    document.querySelectorAll(
                        selector
                    )
                )
        );

    const visibleElements =
        elements
            .filter(
                isElementVisible
            )
            .sort(
                (
                    first,
                    second
                ) =>
                    getElementZIndex(second) -
                    getElementZIndex(first)
            );

    return (
        visibleElements[0] ||
        null
    );

}

//----------------------------------
// Is Element Visible
//----------------------------------

function isElementVisible(element) {

    if (!element) {
        return false;
    }

    const style =
        window.getComputedStyle(
            element
        );

    return (
        style.display !== "none" &&
        style.visibility !== "hidden" &&
        Number(style.opacity) !== 0 &&
        element.getClientRects().length > 0
    );

}

//----------------------------------
// Get Element Z-Index
//----------------------------------

function getElementZIndex(element) {

    if (!element) {
        return 0;
    }

    const value =
        window
            .getComputedStyle(element)
            .zIndex;

    const zIndex =
        Number.parseInt(
            value,
            10
        );

    return (
        Number.isFinite(zIndex)
            ? zIndex
            : 0
    );

}

//----------------------------------
// Clear Current Selection
//----------------------------------

function clearCurrentSelection() {

    if (
        window.SelectionManager &&
        typeof SelectionManager.clear ===
            "function"
    ) {

        SelectionManager.clear();

        console.log(
            "Selection cleared."
        );

        return;

    }

    if (
        typeof clearSelection ===
        "function"
    ) {

        clearSelection();

        console.log(
            "Selection cleared."
        );

    }

}

//----------------------------------
// Select All Panels
//----------------------------------

function selectAllPanels() {

    if (
        window.SelectionManager &&
        typeof SelectionManager.selectAll ===
            "function"
    ) {

        SelectionManager.selectAll();

        console.log(
            "Selected all panels."
        );

        return;

    }

    if (
        typeof selectAllPanelsOnCanvas ===
        "function"
    ) {

        selectAllPanelsOnCanvas();

        console.log(
            "Selected all panels."
        );

        return;

    }

    console.warn(
        "Select-all function is not available."
    );

}

//----------------------------------
// Duplicate Selection
//----------------------------------

function duplicateCurrentSelection() {

    if (
        typeof copySelection !==
            "function" ||
        typeof pasteSelection !==
            "function"
    ) {

        console.warn(
            "Duplicate functions are unavailable."
        );

        return;

    }

    const copied =
        copySelection();

    if (!copied) {
        return;
    }

    const pasted =
        pasteSelection();

    if (pasted) {

        console.log(
            "Selection duplicated."
        );

    }

}

//----------------------------------
// Expose
//----------------------------------

window.handleKeyboardShortcuts =
    handleKeyboardShortcuts;

window.closeTopmostElement =
    closeTopmostElement;