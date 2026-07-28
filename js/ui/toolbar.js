//----------------------------------
// Toolbar
//----------------------------------

function initializeToolbar() {

    //----------------------------------
    // Buttons
    //----------------------------------

    const newButton =
        document.getElementById("newProjectButton");

    const saveButton =
        document.getElementById("saveButton");

    const openButton =
        document.getElementById("openProjectButton");

    const bomButton =
        document.getElementById("bomButton");

    const manualRouteButton =
        document.getElementById("manualRouteButton");

    //----------------------------------
    // New
    //----------------------------------

    if (newButton) {
        newButton.addEventListener("click", () => {
            console.log("New Project...");
            newProject();
        });
    }
    else {
        console.warn("New button not found.");
    }

    //----------------------------------
    // Save
    //----------------------------------

    if (saveButton) {
        saveButton.addEventListener("click", async () => {
            const project = getProjectState();

            //----------------------------------
            // First Save
            //----------------------------------

            if (!project.jobName) {
                console.log("Opening Save Dialog...");
                showProjectDialog();
                return;
            }

            //----------------------------------
            // Save Existing Project
            //----------------------------------

            console.log("Saving Project...");

            const result = await saveCurrentProject();

            console.log(result);

            if (result.success) {
                alert("Project Saved!");
            }
            else {
                alert("Save Failed.");
            }
        });
    }
    else {
        console.warn("Save button not found.");
    }

    //----------------------------------
    // Open
    //----------------------------------

    if (openButton) {
        openButton.addEventListener("click", () => {
            console.log("Opening Project Dialog...");
            showOpenProjectDialog();
        });
    }
    else {
        console.warn("Open button not found.");
    }

    //----------------------------------
    // BOM
    //----------------------------------

    if (bomButton) {
        bomButton.addEventListener("click", () => {
            console.log("Printing BOM...");
            printBOM();
        });
    }
    else {
        console.warn("BOM button not found.");
    }

    //----------------------------------
    // Manual Routing
    //----------------------------------

    if (manualRouteButton) {
        manualRouteButton.addEventListener("click", event => {
            event.preventDefault();
            event.stopPropagation();

            if (
                !window.ManualRouting ||
                typeof window.ManualRouting.toggle !== "function"
            ) {
                console.warn("Manual routing is not ready.");
                return;
            }

            window.ManualRouting.toggle();
        });
    }
    else {
        console.warn("Manual route button not found.");
    }
}

//----------------------------------
// Expose
//----------------------------------

window.initializeToolbar = initializeToolbar;
