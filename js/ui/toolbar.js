//----------------------------------
// Toolbar
//----------------------------------

function initializeToolbar() {

    //----------------------------------
    // Save Button
    //----------------------------------

    const saveButton =
        document.getElementById("saveButton");

    if (!saveButton) {

        console.warn(
            "Save button not found."
        );

        return;

    }

    saveButton.addEventListener(

        "click",

        async () => {

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

//----------------------------------
// Expose
//----------------------------------

window.initializeToolbar =
    initializeToolbar;