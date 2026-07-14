//----------------------------------
// Toolbar
//----------------------------------

function initializeToolbar() {

    //----------------------------------
    // Buttons
    //----------------------------------

    const saveButton =
        document.getElementById("saveButton");

    const openButton =
        document.getElementById("openProjectButton");

    const bomButton =
        document.getElementById("bomButton");

    //----------------------------------
    // Save
    //----------------------------------

    if (saveButton) {

        saveButton.addEventListener(

            "click",

            async () => {

                const project =
                    getProjectState();

                //----------------------------------
                // First Save
                //----------------------------------

                if (!project.jobName) {

                    console.log(
                        "Opening Save Dialog..."
                    );

                    showProjectDialog();

                    return;

                }

                //----------------------------------
                // Save Existing Project
                //----------------------------------

                console.log(
                    "Saving Project..."
                );

                const result =
                    await saveCurrentProject();

                console.log(result);

                if (result.success) {

                    alert(
                        "Project Saved!"
                    );

                }
                else {

                    alert(
                        "Save Failed."
                    );

                }

            }

        );

    }
    else {

        console.warn(
            "Save button not found."
        );

    }

    //----------------------------------
    // Open
    //----------------------------------

    if (openButton) {

        openButton.addEventListener(

            "click",

            () => {

                console.log(
                    "Opening Project Dialog..."
                );

                showOpenProjectDialog();

            }

        );

    }
    else {

        console.warn(
            "Open button not found."
        );

    }

    //----------------------------------
    // BOM
    //----------------------------------

    if (bomButton) {

        bomButton.addEventListener(

            "click",

            () => {

                console.log(
                    "Printing BOM..."
                );

                printBOM();

            }

        );

    }
    else {

        console.warn(
            "BOM button not found."
        );

    }

}

//----------------------------------
// Expose
//----------------------------------

window.initializeToolbar =
    initializeToolbar;