//----------------------------------
// Current Project
//----------------------------------

const currentProject = {

    id: "",

    jobName: "",

    address: ""

};

//----------------------------------
// Set Project
//----------------------------------

function setProject(jobName, address) {

    currentProject.jobName =
        String(jobName || "").trim();

    currentProject.address =
        String(address || "").trim();

}

//----------------------------------
// Get Project
//----------------------------------

function getProject() {

    return currentProject;

}

//----------------------------------
// Build Project
//----------------------------------

function buildProject() {

    return {

        jobName:
            currentProject.jobName,

        address:
            currentProject.address,

        layout:
            getLayout(),

        links:
            getLinks()

    };

}

//----------------------------------
// Save Current Project
//----------------------------------

async function saveCurrentProject() {

    const project =
        buildProject();

    const result =
        await saveProject(project);

    console.log(

        "Project Saved",

        result

    );

    if (

        result.success &&
        result.projectId

    ) {

        currentProject.id =
            result.projectId;

    }

    return result;

}

//----------------------------------
// Load Current Project
//----------------------------------

async function loadCurrentProject(jobName, address) {

    const result =
        await loadProject(

            jobName,

            address

        );

    console.log(

        "Project Loaded",

        result

    );

    if (

        result.success &&
        result.found

    ) {

        currentProject.id =
            result.projectId;

        currentProject.jobName =
            jobName;

        currentProject.address =
            address;

    }

    return result;

}

//----------------------------------
// New Project
//----------------------------------

function newProject(jobName, address) {

    currentProject.id = "";

    currentProject.jobName =
        String(jobName || "").trim();

    currentProject.address =
        String(address || "").trim();

}

//----------------------------------
// Expose
//----------------------------------

window.setProject = setProject;
window.getProject = getProject;
window.buildProject = buildProject;
window.saveCurrentProject = saveCurrentProject;
window.loadCurrentProject = loadCurrentProject;
window.newProject = newProject;