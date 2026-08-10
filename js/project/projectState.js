//----------------------------------
// Project State
//----------------------------------

const projectState = {

    id: "",

    jobName: "",

    address: "",

    electrician: "",

    lender: "",

    model: "",

    created: null,

    modified: null,

    version: 1

};

//----------------------------------
// Get State
//----------------------------------

function getProjectState() {

    return projectState;

}

//----------------------------------
// Set Project ID
//----------------------------------

function setProjectId(id) {

    projectState.id = id;

}

//----------------------------------
// Set Job Name
//----------------------------------

function setJobName(jobName) {

    projectState.jobName =
        String(jobName || "").trim();

}

//----------------------------------
// Set Address
//----------------------------------

function setAddress(address) {

    projectState.address =
        String(address || "").trim();

}

//----------------------------------
// Set Project
//----------------------------------

function setProjectState(project) {

    if (!project) return;

    projectState.id =
        project.id || "";

    projectState.jobName =
        String(project.jobName || "").trim();

    projectState.address =
        String(project.address || "").trim();

    projectState.electrician =
        String(project.electrician || "").trim();

    projectState.lender =
        String(project.lender || "").trim();

    projectState.model =
        String(project.model || "").trim();

    projectState.created =
        project.created || null;

    projectState.modified =
        project.modified || null;

    projectState.version =
        project.version || 1;

}

//----------------------------------
// Reset
//----------------------------------

function clearProjectState() {

    projectState.id = "";

    projectState.jobName = "";

    projectState.address = "";

    projectState.electrician = "";

    projectState.lender = "";

    projectState.model = "";

    projectState.created = null;

    projectState.modified = null;

    projectState.version = 1;

}

//----------------------------------
// Expose
//----------------------------------

window.getProjectState = getProjectState;

window.setProjectState = setProjectState;

window.setProjectId = setProjectId;

window.setJobName = setJobName;

window.setAddress = setAddress;

window.clearProjectState = clearProjectState;
