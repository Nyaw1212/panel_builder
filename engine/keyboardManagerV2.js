//----------------------------------
// Keyboard Manager V2
//----------------------------------

window.KeyboardManagerV2 = (() => {

    //----------------------------------
    // Registered UI Elements
    //----------------------------------

    const registeredElements = new Map();

    //----------------------------------
    // State
    //----------------------------------

    let initialized = false;

    //----------------------------------
    // Initialize
    //----------------------------------

    function init() {
        if (initialized) return;

        document.addEventListener(
            "keydown",
            handleKeydown
        );

        initialized = true;

        console.log(
            "KeyboardManagerV2 initialized."
        );
    }

    //----------------------------------
    // Register UI Element
    //----------------------------------

    function register(
        element,
        options = {}
    ) {
        if (!element) {
            console.warn(
                "KeyboardManagerV2.register: Missing element."
            );

            return null;
        }

        const existing =
            registeredElements.get(element);

        const config = {
            close:
                typeof options.close === "function"
                    ? options.close
                    : existing?.close || null,

            save:
                typeof options.save === "function"
                    ? options.save
                    : existing?.save || null,

            confirm:
                typeof options.confirm === "function"
                    ? options.confirm
                    : existing?.confirm || null,

            cancel:
                typeof options.cancel === "function"
                    ? options.cancel
                    : existing?.cancel || null,

            shortcuts: {
                ...(existing?.shortcuts || {}),
                ...(options.shortcuts || {})
            },

            closeOnOverlay:
                options.closeOnOverlay === true,

            closeOnEscape:
                options.closeOnEscape !== false,

            restoreFocus:
                options.restoreFocus !== false,

            clearSelectionOnClose:
                options.clearSelectionOnClose === true,

            blockGlobalShortcuts:
                options.blockGlobalShortcuts !== false,

            enterToConfirm:
                options.enterToConfirm === true,

            ctrlEnterToConfirm:
                options.ctrlEnterToConfirm === true,

            priority:
                Number(options.priority) || 0,

            previousFocus:
                document.activeElement
        };

        registeredElements.set(
            element,
            config
        );

        element.dataset.keyboardManaged =
            "true";

        bindOverlayClose(element);

        return element;
    }

    //----------------------------------
    // Backward-Compatible Registration
    //----------------------------------

    function registerClosable(
        element,
        closeFunction,
        options = {}
    ) {
        return register(
            element,
            {
                ...options,
                close: closeFunction
            }
        );
    }

    //----------------------------------
    // Unregister Element
    //----------------------------------

    function unregister(element) {
        if (!element) return;

        registeredElements.delete(element);

        delete element.dataset.keyboardManaged;
    }

    //----------------------------------
    // Backward-Compatible Unregister
    //----------------------------------

    function unregisterClosable(element) {
        unregister(element);
    }

    //----------------------------------
    // Bind Overlay Close
    //----------------------------------

    function bindOverlayClose(element) {
        if (
            element.dataset.keyboardOverlayBound ===
            "true"
        ) {
            return;
        }

        element.addEventListener(
            "click",
            event => {
                const config =
                    registeredElements.get(element);

                if (
                    !config ||
                    !config.closeOnOverlay
                ) {
                    return;
                }

                if (event.target === element) {
                    closeElement(element);
                }
            }
        );

        element.dataset.keyboardOverlayBound =
            "true";
    }

    //----------------------------------
    // Handle Keyboard
    //----------------------------------

    async function handleKeydown(event) {
        if (event.repeat) return;

        const key = normalizeKey(event);

        const activeEntry =
            getTopmostEntry();

        const activeElement =
            activeEntry?.[0] || null;

        const activeConfig =
            activeEntry?.[1] || null;

        //----------------------------------
        // Escape
        //----------------------------------

        if (event.key === "Escape") {
            if (
                activeElement &&
                activeConfig?.closeOnEscape
            ) {
                event.preventDefault();
                event.stopPropagation();

                closeElement(activeElement);

                return;
            }

            const automaticClosed =
                closeAutomaticElement();

            if (automaticClosed) {
                event.preventDefault();
                event.stopPropagation();

                return;
            }

            clearSelection();

            return;
        }

        //----------------------------------
        // Registered Element Shortcuts
        //----------------------------------

        if (
            activeElement &&
            activeConfig
        ) {
            const handled =
                await handleRegisteredShortcut(
                    event,
                    key,
                    activeElement,
                    activeConfig
                );

            if (handled) return;

            if (
                activeConfig.blockGlobalShortcuts
            ) {
                return;
            }
        }

        //----------------------------------
        // Browser Editing Controls
        //----------------------------------

        if (
            isTypingElement(
                document.activeElement
            )
        ) {
            return;
        }

        //----------------------------------
        // Global Save
        //----------------------------------

        if (key === "Ctrl+S") {
            event.preventDefault();
            await saveProject();
            return;
        }

        //----------------------------------
        // Copy
        //----------------------------------

        if (key === "Ctrl+C") {
            event.preventDefault();
            copy();
            return;
        }

        //----------------------------------
        // Paste
        //----------------------------------

        if (key === "Ctrl+V") {
            event.preventDefault();
            paste();
            return;
        }

        //----------------------------------
        // Select All
        //----------------------------------

        if (key === "Ctrl+A") {
            event.preventDefault();
            selectAll();
            return;
        }

        //----------------------------------
        // Duplicate
        //----------------------------------

        if (key === "Ctrl+D") {
            event.preventDefault();
            duplicate();
            return;
        }

        //----------------------------------
        // New Project
        //----------------------------------

        if (key === "Ctrl+N") {
            event.preventDefault();

            runFirstAvailable([
                "newProject",
                "createNewProject",
                "resetProject"
            ]);

            return;
        }

        //----------------------------------
        // Open Project
        //----------------------------------

        if (key === "Ctrl+O") {
            event.preventDefault();

            runFirstAvailable([
                "showOpenProjectDialog",
                "openProjectDialog",
                "showProjectLoader"
            ]);

            return;
        }

        //----------------------------------
        // BOM
        //----------------------------------

        if (key === "Ctrl+B") {
            event.preventDefault();

            runFirstAvailable([
                "showBOMDialog",
                "openBOMDialog",
                "showBOM"
            ]);

            return;
        }

        //----------------------------------
        // Delete
        //----------------------------------

        if (
            event.key === "Delete" ||
            event.key === "Backspace"
        ) {
            event.preventDefault();

            runFirstAvailable([
                "deleteSelection",
                "deleteSelectedPanels",
                "removeSelection"
            ]);
        }
    }

    //----------------------------------
    // Registered Shortcut Handler
    //----------------------------------

    async function handleRegisteredShortcut(
        event,
        key,
        element,
        config
    ) {
        const customAction =
            getShortcutAction(
                config.shortcuts,
                key
            );

        if (
            typeof customAction ===
            "function"
        ) {
            event.preventDefault();
            event.stopPropagation();

            await safelyRun(
                customAction,
                {
                    event,
                    element,
                    config
                }
            );

            return true;
        }

        //----------------------------------
        // Ctrl + S
        //----------------------------------

        if (
            key === "Ctrl+S" &&
            typeof config.save ===
                "function"
        ) {
            event.preventDefault();
            event.stopPropagation();

            await safelyRun(
                config.save,
                {
                    event,
                    element,
                    config
                }
            );

            return true;
        }

        //----------------------------------
        // Ctrl + Enter
        //----------------------------------

        if (
            key === "Ctrl+Enter" &&
            config.ctrlEnterToConfirm
        ) {
            const action =
                config.confirm ||
                config.save;

            if (
                typeof action ===
                "function"
            ) {
                event.preventDefault();
                event.stopPropagation();

                await safelyRun(
                    action,
                    {
                        event,
                        element,
                        config
                    }
                );

                return true;
            }
        }

        //----------------------------------
        // Enter
        //----------------------------------

        if (
            event.key === "Enter" &&
            config.enterToConfirm &&
            !isMultilineTypingElement(
                document.activeElement
            )
        ) {
            const action =
                config.confirm ||
                config.save;

            if (
                typeof action ===
                "function"
            ) {
                event.preventDefault();
                event.stopPropagation();

                await safelyRun(
                    action,
                    {
                        event,
                        element,
                        config
                    }
                );

                return true;
            }
        }

        return false;
    }

    //----------------------------------
    // Get Shortcut Action
    //----------------------------------

    function getShortcutAction(
        shortcuts,
        normalizedKey
    ) {
        if (!shortcuts) return null;

        if (
            typeof shortcuts[
                normalizedKey
            ] === "function"
        ) {
            return shortcuts[
                normalizedKey
            ];
        }

        const matchingKey =
            Object.keys(shortcuts).find(
                shortcut =>
                    normalizeShortcutString(
                        shortcut
                    ) === normalizedKey
            );

        return matchingKey
            ? shortcuts[matchingKey]
            : null;
    }

    //----------------------------------
    // Close Topmost
    //----------------------------------

    function closeTopmost() {
        const entry = getTopmostEntry();

        if (!entry) {
            return closeAutomaticElement();
        }

        return closeElement(entry[0]);
    }

    //----------------------------------
    // Close Registered Element
    //----------------------------------

    function closeElement(element) {
        const config =
            registeredElements.get(element);

        if (!config) return false;

        const action =
            config.cancel ||
            config.close;

        if (
            typeof action ===
            "function"
        ) {
            safelyRun(
                action,
                {
                    element,
                    config
                }
            );
        }
        else {
            hideElement(element);
        }

        if (
            config.clearSelectionOnClose
        ) {
            clearSelection();
        }

        if (
            config.restoreFocus &&
            config.previousFocus &&
            typeof config.previousFocus.focus ===
                "function"
        ) {
            setTimeout(
                () => {
                    try {
                        config.previousFocus.focus();
                    }
                    catch (error) {
                        console.warn(
                            "KeyboardManagerV2: Unable to restore focus.",
                            error
                        );
                    }
                },
                0
            );
        }

        return true;
    }

    //----------------------------------
    // Get Topmost Registered Element
    //----------------------------------

    function getTopmostEntry() {
        const visibleEntries =
            Array.from(
                registeredElements.entries()
            )
                .filter(
                    ([element]) =>
                        isVisible(element)
                )
                .sort(
                    (
                        [elementA, configA],
                        [elementB, configB]
                    ) => {
                        const priorityDifference =
                            configB.priority -
                            configA.priority;

                        if (
                            priorityDifference !== 0
                        ) {
                            return priorityDifference;
                        }

                        const zDifference =
                            getZIndex(elementB) -
                            getZIndex(elementA);

                        if (zDifference !== 0) {
                            return zDifference;
                        }

                        return (
                            getDocumentOrder(elementB) -
                            getDocumentOrder(elementA)
                        );
                    }
                );

        return visibleEntries[0] || null;
    }

    //----------------------------------
    // Close Automatic Element
    //----------------------------------

    function closeAutomaticElement() {
        const selectors = [
            '[data-esc-close="true"]',
            '[data-keyboard-close="true"]',
            ".modal:not([hidden])",
            ".dialog:not([hidden])",
            ".overlay:not([hidden])",
            ".context-menu:not([hidden])",
            '[role="dialog"]',
            '[role="menu"]'
        ];

        const elements =
            selectors
                .flatMap(
                    selector =>
                        Array.from(
                            document.querySelectorAll(
                                selector
                            )
                        )
                )
                .filter(
                    (
                        element,
                        index,
                        array
                    ) =>
                        array.indexOf(element) ===
                            index &&
                        isVisible(element)
                )
                .sort(
                    (
                        elementA,
                        elementB
                    ) =>
                        getZIndex(elementB) -
                        getZIndex(elementA)
                );

        const element = elements[0];

        if (!element) return false;

        const escapeEvent =
            new CustomEvent(
                "keyboardescape",
                {
                    bubbles: false,
                    cancelable: true
                }
            );

        const useDefaultClose =
            element.dispatchEvent(
                escapeEvent
            );

        if (useDefaultClose) {
            hideElement(element);
        }

        return true;
    }

    //----------------------------------
    // Hide Element
    //----------------------------------

    function hideElement(element) {
        if (!element) return;

        if (
            element.tagName === "DIALOG" &&
            typeof element.close ===
                "function"
        ) {
            element.close();
            return;
        }

        if (
            "open" in element &&
            element.open === true
        ) {
            element.open = false;
            return;
        }

        element.hidden = true;
        element.style.display = "none";
    }

    //----------------------------------
    // Copy
    //----------------------------------

    function copy() {
        if (
            hasFunction("hasHoveredConnection") &&
            window.hasHoveredConnection()
        ) {
            const connection =
                hasFunction("getHoveredConnection")
                    ? window.getHoveredConnection()
                    : null;

            if (
                connection &&
                hasFunction("copyConnection")
            ) {
                window.copyConnection(connection);
            }

            return;
        }

        if (hasFunction("copySelection")) {
            window.copySelection();
        }
    }

    //----------------------------------
    // Paste
    //----------------------------------

    function paste() {
        const canPasteConnection =
            hasFunction("hasHoveredConnection") &&
            hasFunction("hasNodeClipboard") &&
            window.hasHoveredConnection() &&
            window.hasNodeClipboard();

        if (canPasteConnection) {
            const connection =
                hasFunction("getHoveredConnection")
                    ? window.getHoveredConnection()
                    : null;

            if (
                connection &&
                hasFunction("pasteConnection")
            ) {
                window.pasteConnection(connection);
            }

            return;
        }

        if (hasFunction("pasteSelection")) {
            window.pasteSelection();
        }
    }

    //----------------------------------
    // Duplicate
    //----------------------------------

    function duplicate() {
        if (
            !hasFunction("copySelection") ||
            !hasFunction("pasteSelection")
        ) {
            return;
        }

        const copied =
            window.copySelection();

        if (!copied) return;

        window.pasteSelection();
    }

    //----------------------------------
    // Select All
    //----------------------------------

    function selectAll() {
        if (
            window.SelectionManager &&
            typeof window.SelectionManager.selectAll ===
                "function"
        ) {
            window.SelectionManager.selectAll();
            return;
        }

        runFirstAvailable([
            "selectAllPanels",
            "selectAllPanelsOnCanvas"
        ]);
    }

    //----------------------------------
    // Clear Selection
    //----------------------------------

    function clearSelection() {
        if (
            window.SelectionManager &&
            typeof window.SelectionManager.clear ===
                "function"
        ) {
            window.SelectionManager.clear();
            return;
        }

        runFirstAvailable([
            "deselectAll",
            "clearPanelSelection"
        ]);
    }

    //----------------------------------
    // Save Project
    //----------------------------------

    async function saveProject() {
        if (!hasFunction("getProjectState")) {
            console.warn(
                "KeyboardManagerV2: getProjectState() was not found."
            );

            return;
        }

        const project =
            window.getProjectState();

        if (!project?.jobName) {
            runFirstAvailable([
                "showProjectDialog"
            ]);

            return;
        }

        if (!hasFunction("saveCurrentProject")) {
            console.warn(
                "KeyboardManagerV2: saveCurrentProject() was not found."
            );

            return;
        }

        try {
            const result =
                await window.saveCurrentProject();

            if (
                result &&
                result.success === false
            ) {
                alert(
                    result.message ||
                    "Save Failed."
                );
            }
        }
        catch (error) {
            console.error(
                "KeyboardManagerV2 save failed:",
                error
            );

            alert(
                error?.message ||
                "Save Failed."
            );
        }
    }

    //----------------------------------
    // Normalize Keyboard Event
    //----------------------------------

    function normalizeKey(event) {
        const parts = [];

        if (
            event.ctrlKey ||
            event.metaKey
        ) {
            parts.push("Ctrl");
        }

        if (event.altKey) {
            parts.push("Alt");
        }

        if (event.shiftKey) {
            parts.push("Shift");
        }

        let key = String(event.key || "");

        if (key === " ") {
            key = "Space";
        }

        if (key.length === 1) {
            key = key.toUpperCase();
        }
        else {
            key =
                key.charAt(0).toUpperCase() +
                key.slice(1);
        }

        parts.push(key);

        return parts.join("+");
    }

    //----------------------------------
    // Normalize Shortcut String
    //----------------------------------

    function normalizeShortcutString(shortcut) {
        const parts =
            String(shortcut || "")
                .split("+")
                .map(part => part.trim())
                .filter(Boolean);

        const normalized = [];

        if (
            parts.some(
                part =>
                    /^(ctrl|control|cmd|command|meta)$/i
                        .test(part)
            )
        ) {
            normalized.push("Ctrl");
        }

        if (
            parts.some(
                part => /^alt$/i.test(part)
            )
        ) {
            normalized.push("Alt");
        }

        if (
            parts.some(
                part => /^shift$/i.test(part)
            )
        ) {
            normalized.push("Shift");
        }

        const keyPart =
            parts.find(
                part =>
                    !/^(ctrl|control|cmd|command|meta|alt|shift)$/i
                        .test(part)
            ) || "";

        if (keyPart) {
            normalized.push(
                keyPart.length === 1
                    ? keyPart.toUpperCase()
                    : keyPart.charAt(0).toUpperCase() +
                      keyPart.slice(1)
            );
        }

        return normalized.join("+");
    }

    //----------------------------------
    // Typing Detection
    //----------------------------------

    function isTypingElement(element) {
        if (!element) return false;

        const tag =
            String(element.tagName || "")
                .toUpperCase();

        return (
            tag === "INPUT" ||
            tag === "TEXTAREA" ||
            tag === "SELECT" ||
            element.isContentEditable
        );
    }

    //----------------------------------
    // Multiline Typing Detection
    //----------------------------------

    function isMultilineTypingElement(element) {
        if (!element) return false;

        return (
            String(element.tagName || "")
                .toUpperCase() ===
                "TEXTAREA" ||
            element.isContentEditable
        );
    }

    //----------------------------------
    // Visibility
    //----------------------------------

    function isVisible(element) {
        if (
            !element ||
            !element.isConnected ||
            element.hidden
        ) {
            return false;
        }

        const style =
            window.getComputedStyle(element);

        return (
            style.display !== "none" &&
            style.visibility !== "hidden" &&
            Number(style.opacity) !== 0 &&
            element.getClientRects().length > 0
        );
    }

    //----------------------------------
    // Z-Index
    //----------------------------------

    function getZIndex(element) {
        if (!element) return 0;

        const value =
            Number.parseInt(
                window.getComputedStyle(element)
                    .zIndex,
                10
            );

        return Number.isFinite(value)
            ? value
            : 0;
    }

    //----------------------------------
    // Document Order
    //----------------------------------

    function getDocumentOrder(element) {
        return Array.from(
            document.querySelectorAll("*")
        ).indexOf(element);
    }

    //----------------------------------
    // Safe Function Runner
    //----------------------------------

    async function safelyRun(
        callback,
        context = {}
    ) {
        try {
            return await callback(context);
        }
        catch (error) {
            console.error(
                "KeyboardManagerV2 action failed:",
                error
            );

            return null;
        }
    }

    //----------------------------------
    // Function Check
    //----------------------------------

    function hasFunction(name) {
        return (
            typeof window[name] ===
            "function"
        );
    }

    //----------------------------------
    // Run First Available Function
    //----------------------------------

    function runFirstAvailable(names) {
        for (const name of names) {
            if (hasFunction(name)) {
                return window[name]();
            }
        }

        console.warn(
            "KeyboardManagerV2: No matching function found.",
            names
        );

        return null;
    }

    //----------------------------------
    // Public API
    //----------------------------------

    return {
        init,
        register,
        registerClosable,
        unregister,
        unregisterClosable,
        closeTopmost,
        closeElement,
        clearSelection,
        copy,
        paste,
        duplicate,
        selectAll,
        saveProject
    };

})();

//----------------------------------
// Initialize
//----------------------------------

if (document.readyState === "loading") {
    document.addEventListener(
        "DOMContentLoaded",
        () => {
            window.KeyboardManagerV2.init();
        }
    );
}
else {
    window.KeyboardManagerV2.init();
}