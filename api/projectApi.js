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

            throw new Error(`HTTP ${response.status}`);

        }

        return await response.json();

    }
    catch (err) {

        console.error("Project API Error", err);

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

    const payload = serializeProject(project);

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

    const result = await apiRequest({

        action: "getPresets"

    });

    if (!result.success) {

        console.error(result.message);

        return [];

    }

    return result.presets || [];

}

//----------------------------------
// Get Preset Materials
//----------------------------------

function getPresetMaterials(preset) {

    if (!preset) {

        return [];

    }

    return (window.presets || [])

        .filter(item => item.PRESET === preset)

        .map(item => ({

            catalogNumber: item.CatalogNumber,

            description: item.DESCRIPTION,

            qty: Number(item.QTY)

        }));

}

//----------------------------------
// Get Projects
//----------------------------------

async function getProjects() {

    const result = await apiRequest({

        action: "getProjects"

    });

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

    if (!result.success) {

        console.error(result.message);

        return [];

    }

    return result.materials || [];

}

//----------------------------------
// Expose
//----------------------------------

window.saveProject = saveProject;
window.loadProject = loadProject;
window.getProjects = getProjects;
window.deleteProject = deleteProject;
window.getPresets = getPresets;
window.getMaterials = getMaterials;
window.getPresetMaterials = getPresetMaterials;