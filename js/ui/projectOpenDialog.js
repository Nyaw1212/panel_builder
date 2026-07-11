//----------------------------------
// Open Project Dialog
//----------------------------------

let openProjectDialog = null;

//----------------------------------
// Show
//----------------------------------

async function showOpenProjectDialog() {

    //----------------------------------
    // Create Once
    //----------------------------------

    if (!openProjectDialog) {

        //----------------------------------
        // Overlay
        //----------------------------------

        openProjectDialog = document.createElement("div");

        openProjectDialog.id = "openProjectDialog";

        Object.assign(openProjectDialog.style, {

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

        title.textContent = "Open Project";

        title.style.margin = "0 0 20px 0";

        //----------------------------------
        // Label
        //----------------------------------

        const label = document.createElement("label");

        label.textContent = "Project";

        //----------------------------------
        // Dropdown
        //----------------------------------

        const select = document.createElement("select");

        select.id = "projectSelect";

        select.style.width = "100%";

        select.style.padding = "10px";

        select.style.marginTop = "6px";

        select.style.marginBottom = "20px";

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

        cancelButton.onclick = hideOpenProjectDialog;

        //----------------------------------
        // Open
        //----------------------------------

        const openButton = document.createElement("button");

        openButton.textContent = "Open";

        openButton.onclick = async () => {

            if (!select.value) {

                alert("Please select a project.");

                return;

            }

            const result = await apiRequest({

                action: "loadProjectById",

                projectId: select.value

            });

            console.log(result);

            if (!result.success || !result.found) {

                alert("Unable to load project.");

                return;

            }

            clearDraft();

            deserializeProject(result.project);

            hideOpenProjectDialog();

        };

        //----------------------------------
        // Build
        //----------------------------------

        buttonRow.appendChild(cancelButton);

        buttonRow.appendChild(openButton);

        card.appendChild(title);

        card.appendChild(label);

        card.appendChild(select);

        card.appendChild(buttonRow);

        openProjectDialog.appendChild(card);

        document.body.appendChild(openProjectDialog);

    }

    //----------------------------------
    // Populate Dropdown
    //----------------------------------

    const select = document.getElementById("projectSelect");

    select.innerHTML = "";

    const placeholder = document.createElement("option");

    placeholder.textContent = "-- Select Project --";

    placeholder.value = "";

    select.appendChild(placeholder);

    const projects = await getProjects();

    projects.forEach(project => {

        const option = document.createElement("option");

        option.value = project.projectId;

        option.textContent = project.jobName;

        select.appendChild(option);

    });

    //----------------------------------
    // Show
    //----------------------------------

    openProjectDialog.style.display = "flex";

}

//----------------------------------
// Hide
//----------------------------------

function hideOpenProjectDialog() {

    if (!openProjectDialog) return;

    openProjectDialog.style.display = "none";

}

//----------------------------------
// Expose
//----------------------------------

window.showOpenProjectDialog = showOpenProjectDialog;

window.hideOpenProjectDialog = hideOpenProjectDialog;