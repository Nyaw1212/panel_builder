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

        return;

    }

    console.log("Step 3");

    console.log("typeof clearDraft =", typeof clearDraft);

    clearDraft();

    console.log("Step 4");

}

//----------------------------------
// Expose
//----------------------------------

window.newProject = newProject;