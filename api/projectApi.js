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

        const response = await fetch(

            PROJECT_API_URL,

            {

                method: "POST",

                body: JSON.stringify(data)

            }

        );

        if (!response.ok) {

            throw new Error(

                `HTTP ${response.status}`

            );

        }

        return await response.json();

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

    const payload = serializeProject(project);

    console.log("Payload:", payload);
    console.log("Material Summary:", payload.materialSummary);
    console.table(payload.materialSummary);

    //----------------------------------
    // Verify
    //----------------------------------

    JSON.stringify(payload);

    //----------------------------------
    // Save
    //----------------------------------

    return await apiRequest({

        action: "saveProject",

        ...payload

    });

}

//----------------------------------
// Load Project
//----------------------------------

async function loadProject(jobName, address) {

    return await apiRequest({

        action: "loadProject",

        jobName,

        address

    });

}

//----------------------------------
// Get Presets
//----------------------------------

async function getPresets() {

    console.log("Calling getPresets()...");

    const result = await apiRequest({

        action: "getPresets"

    });

    console.log("Raw API Result:", result);

    if (!result.success) {

        console.error(result.message);

        return [];

    }

    console.log("Returning Presets:", result.presets);

    return result.presets;

}
//----------------------------------
// Get Projects
//----------------------------------

async function getProjects() {

    const result = await apiRequest({

        action: "getProjects"

    });

    console.log("Projects:", result);

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

    const result = await apiRequest({

        action: "getMaterials"

    });

    console.log("API RESULT");
    console.log(result);

    if (!result.success) {

        console.error(result.message);

        return [];

    }

    console.log("Returned Materials:", result.materials?.length);

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