//----------------------------------
// New Project
//----------------------------------

function newProject() {

    console.log("Step 1");

    const confirmed = confirm(

        "Discard current project?"

    );

    console.log("Step 2");

    if (!confirmed) {

        console.log("Cancelled");

        return false;

    }

    console.log("Step 3");

    console.log(

        "typeof clearDraft =",

        typeof clearDraft

    );

    //----------------------------------
    // Clear Draft
    //----------------------------------

    clearDraft();

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

    console.log("Step 4");

    return true;

}

//----------------------------------
// Expose
//----------------------------------

window.newProject = newProject;