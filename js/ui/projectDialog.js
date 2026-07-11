//----------------------------------
// Project Dialog
//----------------------------------

let projectDialog = null;

//----------------------------------
// Show
//----------------------------------

function showProjectDialog() {

    //----------------------------------
    // Already Created
    //----------------------------------

    if (projectDialog) {

        const project = getProjectState();

        document.getElementById("projectJobName").value =
            project.jobName || "";

        document.getElementById("projectAddress").value =
            project.address || "";

        projectDialog.style.display = "flex";

        return;

    }

    //----------------------------------
    // Overlay
    //----------------------------------

    projectDialog = document.createElement("div");

    projectDialog.id = "projectDialog";

    Object.assign(projectDialog.style, {

        position: "fixed",

        left: "0",

        top: "0",

        width: "100vw",

        height: "100vh",

        background: "rgba(0,0,0,.45)",

        display: "flex",

        alignItems: "center",

        justifyContent: "center",

        zIndex: "9999"

    });

    //----------------------------------
    // Card
    //----------------------------------

    const card = document.createElement("div");

    Object.assign(card.style, {

        width: "420px",

        background: "#fff",

        borderRadius: "10px",

        padding: "24px",

        boxShadow: "0 10px 30px rgba(0,0,0,.2)"

    });

    //----------------------------------
    // Title
    //----------------------------------

    const title = document.createElement("h2");

    title.textContent = "Save Project";

    title.style.margin = "0 0 20px 0";

    //----------------------------------
    // Project Name
    //----------------------------------

    const jobLabel = document.createElement("label");

    jobLabel.textContent = "Project Name";

    const jobInput = document.createElement("input");

    jobInput.id = "projectJobName";

    jobInput.type = "text";

    jobInput.placeholder = "Enter Project Name";

    Object.assign(jobInput.style, {

        width: "100%",

        marginTop: "6px",

        marginBottom: "16px",

        padding: "10px"

    });

    //----------------------------------
    // Address
    //----------------------------------

    const addressLabel = document.createElement("label");

    addressLabel.textContent = "Address";

    const addressInput = document.createElement("input");

    addressInput.id = "projectAddress";

    addressInput.type = "text";

    addressInput.placeholder = "Enter Address";

    Object.assign(addressInput.style, {

        width: "100%",

        marginTop: "6px",

        marginBottom: "20px",

        padding: "10px"

    });

    //----------------------------------
    // Existing Values
    //----------------------------------

    const project = getProjectState();

    jobInput.value = project.jobName || "";

    addressInput.value = project.address || "";

    //----------------------------------
    // Buttons
    //----------------------------------

    const buttonRow = document.createElement("div");

    buttonRow.style.display = "flex";

    buttonRow.style.justifyContent = "flex-end";

    buttonRow.style.gap = "10px";

    //----------------------------------
    // Cancel
    //----------------------------------

    const cancelButton = document.createElement("button");

    cancelButton.textContent = "Cancel";

    cancelButton.onclick = hideProjectDialog;

    //----------------------------------
    // Save
    //----------------------------------

    const saveButton = document.createElement("button");

    saveButton.textContent = "Save";

    saveButton.onclick = async () => {

        const jobName = jobInput.value.trim();

        const address = addressInput.value.trim();

        if (!jobName) {

            alert("Project Name is required.");

            return;

        }

        //----------------------------------
        // Update ONE Project State
        //----------------------------------

        setProjectState({

            ...getProjectState(),

            jobName,

            address

        });

        console.log("Project State");

        console.log(getProjectState());

        //----------------------------------
        // Save
        //----------------------------------

        const result = await saveCurrentProject();

        console.log(result);

        if (result.success) {

            hideProjectDialog();

            alert("Project Saved!");

        }
        else {

            alert("Save Failed.");

        }

    };

    //----------------------------------
    // Build
    //----------------------------------

    buttonRow.appendChild(cancelButton);

    buttonRow.appendChild(saveButton);

    card.appendChild(title);

    card.appendChild(jobLabel);

    card.appendChild(jobInput);

    card.appendChild(addressLabel);

    card.appendChild(addressInput);

    card.appendChild(buttonRow);

    projectDialog.appendChild(card);

    document.body.appendChild(projectDialog);

}
    
//----------------------------------
// Hide
//----------------------------------

function hideProjectDialog() {

    if (!projectDialog) return;

    projectDialog.style.display = "none";

}

//----------------------------------
// Expose
//----------------------------------

window.showProjectDialog = showProjectDialog;

window.hideProjectDialog = hideProjectDialog;