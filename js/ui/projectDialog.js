//----------------------------------
// Project Dialog
//----------------------------------

let projectDialog = null;

//----------------------------------
// Show
//----------------------------------

function showProjectDialog() {

    if (projectDialog) {

        projectDialog.style.display = "flex";

        return;

    }

    //----------------------------------
    // Overlay
    //----------------------------------

    projectDialog = document.createElement("div");

    projectDialog.id = "projectDialog";

    projectDialog.style.position = "fixed";
    projectDialog.style.left = "0";
    projectDialog.style.top = "0";
    projectDialog.style.width = "100vw";
    projectDialog.style.height = "100vh";

    projectDialog.style.background =
        "rgba(0,0,0,.45)";

    projectDialog.style.display = "flex";

    projectDialog.style.alignItems = "center";

    projectDialog.style.justifyContent = "center";

    projectDialog.style.zIndex = "9999";

    //----------------------------------
    // Card
    //----------------------------------

    const card =
        document.createElement("div");

    card.style.width = "420px";

    card.style.background = "#ffffff";

    card.style.borderRadius = "10px";

    card.style.padding = "24px";

    card.style.boxShadow =
        "0 10px 30px rgba(0,0,0,.2)";

    //----------------------------------
    // Title
    //----------------------------------

    const title =
        document.createElement("h2");

    title.textContent = "Project";

    title.style.margin = "0 0 20px 0";

    //----------------------------------
    // Job Name
    //----------------------------------

    const jobLabel =
        document.createElement("label");

    jobLabel.textContent = "Job Name";

    const jobInput =
        document.createElement("input");

    jobInput.id = "projectJobName";

    jobInput.type = "text";

    jobInput.placeholder =
        "Enter Job Name";

    jobInput.style.width = "100%";

    jobInput.style.marginTop = "6px";

    jobInput.style.marginBottom = "16px";

    jobInput.style.padding = "10px";

    //----------------------------------
    // Address
    //----------------------------------

    const addressLabel =
        document.createElement("label");

    addressLabel.textContent = "Address";

    const addressInput =
        document.createElement("input");

    addressInput.id = "projectAddress";

    addressInput.type = "text";

    addressInput.placeholder =
        "Enter Address";

    addressInput.style.width = "100%";

    addressInput.style.marginTop = "6px";

    addressInput.style.marginBottom = "20px";

    addressInput.style.padding = "10px";

    //----------------------------------
    // Button
    //----------------------------------

    const button =
        document.createElement("button");

    button.textContent =
        "Open / Create";

    button.style.width = "100%";

    button.style.padding = "12px";

    button.style.cursor = "pointer";

    //----------------------------------
    // Click
    //----------------------------------

    button.onclick = async () => {

        const jobName =
            jobInput.value.trim();

        const address =
            addressInput.value.trim();

        if (!jobName) {

            alert("Job Name is required.");

            return;

        }

        //----------------------------------
        // Save State
        //----------------------------------

        setJobName(jobName);

        setAddress(address);

        //----------------------------------
        // Load Project
        //----------------------------------

        const result =
            await loadCurrentProject(

                jobName,

                address

            );

        //----------------------------------
        // Existing Project
        //----------------------------------

        if (

            result.success &&
            result.found

        ) {

            console.log(

                "Existing Project",

                result

            );

            // restoreProject(result.project);

        }

        //----------------------------------
        // New Project
        //----------------------------------

        else {

            newProject(

                jobName,

                address

            );

            console.log(

                "New Project"

            );

        }

        hideProjectDialog();

    };

    //----------------------------------
    // Build
    //----------------------------------

    card.appendChild(title);

    card.appendChild(jobLabel);

    card.appendChild(jobInput);

    card.appendChild(addressLabel);

    card.appendChild(addressInput);

    card.appendChild(button);

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