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

    usedMaterialsSpreadsheetId: "",

    usedMaterialsSpreadsheetUrl: "",

    created: null,

    modified: null,

    version: 1,

    runs: [],

    gutters: []

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

    projectState.usedMaterialsSpreadsheetId =
        String(project.usedMaterialsSpreadsheetId || "").trim();

    projectState.usedMaterialsSpreadsheetUrl =
        String(project.usedMaterialsSpreadsheetUrl || "").trim();

    projectState.created =
        project.created || null;

    projectState.modified =
        project.modified || null;

    projectState.version =
        project.version || 1;

    projectState.runs = Array.isArray(project.runs)
        ? structuredClone(project.runs)
        : [];

    projectState.gutters = Array.isArray(project.gutters)
        ? structuredClone(project.gutters)
        : [];

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

    projectState.usedMaterialsSpreadsheetId = "";

    projectState.usedMaterialsSpreadsheetUrl = "";

    projectState.created = null;

    projectState.modified = null;

    projectState.version = 1;

    projectState.runs = [];

    projectState.gutters = [];

}

//----------------------------------
// Runs
//----------------------------------

function getProjectRuns() {

    return Array.isArray(projectState.runs)
        ? projectState.runs
        : [];

}

function setProjectRuns(runs) {

    projectState.runs = Array.isArray(runs)
        ? structuredClone(runs)
        : [];

}

function getProjectGutters() {

    return Array.isArray(projectState.gutters)
        ? projectState.gutters
        : [];

}

function setProjectGutters(gutters) {

    projectState.gutters = Array.isArray(gutters)
        ? structuredClone(gutters)
        : [];

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
window.getProjectRuns = getProjectRuns;
window.setProjectRuns = setProjectRuns;
window.getProjectGutters = getProjectGutters;
window.setProjectGutters = setProjectGutters;
