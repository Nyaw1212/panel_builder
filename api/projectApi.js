//----------------------------------
// Project API
//----------------------------------

const PROJECT_API_URL =
    "https://script.google.com/macros/s/AKfycbxfVzIQUNC8CYTvbW5_STUgc11-ZjxNEqWN-NWbtm-XqPEuZXz4bmOl7-hdMZkeGV7D/exec";

//----------------------------------
// API Request
//----------------------------------

async function apiRequest(data) {

    try {

        console.time("Fetch");

        const response = await fetch(

            PROJECT_API_URL,

            {

                method: "POST",

                body: JSON.stringify(data)

            }

        );

        console.timeEnd("Fetch");

        if (!response.ok) {

            throw new Error(

                `HTTP ${response.status}`

            );

        }

        console.time("Parse JSON");

        const result = await response.json();

        console.timeEnd("Parse JSON");

        return result;

    }
    catch (err) {

        console.error(

            "Project API Error",

            err

        );

        return {

            success: false,

            message: err.message

        };

    }

}

//----------------------------------
// Save Project
//----------------------------------

async function saveProject(project) {

    //----------------------------------
    // Serialize
    //----------------------------------

    console.time("Serialize");

    const payload = serializeProject(project);

    console.timeEnd("Serialize");

    console.log("Payload:", payload);

    console.log("Material Summary:", payload.materialSummary);

    console.table(payload.materialSummary);

    //----------------------------------
    // Verify JSON
    //----------------------------------

    console.time("JSON Verify");

    JSON.stringify(payload);

    console.timeEnd("JSON Verify");

    //----------------------------------
    // POST
    //----------------------------------

    console.time("POST");

    const result = await apiRequest({

        action: "saveProject",

        ...payload

    });

    console.timeEnd("POST");

    return result;

}

//----------------------------------
// Load Project
//----------------------------------

async function loadProject(jobName, address) {

    console.time("Load Project");

    const result = await apiRequest({

        action: "loadProject",

        jobName,

        address

    });

    console.timeEnd("Load Project");

    return result;

}

//----------------------------------
// Get Presets
//----------------------------------

async function getPresets() {

    console.time("Get Presets");

    const result = await apiRequest({

        action: "getPresets"

    });

    console.timeEnd("Get Presets");

    if (!result.success) {

        console.error(result.message);

        return [];

    }

    return result.presets;

}

//----------------------------------
// Get Projects
//----------------------------------

async function getProjects() {

    console.time("Get Projects");

    const result = await apiRequest({

        action: "getProjects"

    });

    console.timeEnd("Get Projects");

    if (!result.success) {

        console.error(result.message);

        return [];

    }

    return result.projects || [];

}

//----------------------------------
// Delete Project
//----------------------------------

async function deleteProject(projectId) {

    return await apiRequest({

        action: "deleteProject",

        projectId

    });

}

//----------------------------------
// Get Materials
//----------------------------------

async function getMaterials() {

    console.time("Get Materials");

    const result = await apiRequest({

        action: "getMaterials"

    });

    console.timeEnd("Get Materials");

    if (!result.success) {

        console.error(result.message);

        return [];

    }

    return result.materials || [];

}

window.getMaterials = getMaterials;

//----------------------------------
// Expose
//----------------------------------

window.saveProject = saveProject;
window.loadProject = loadProject;
window.getProjects = getProjects;
window.deleteProject = deleteProject;
window.getPresets = getPresets;