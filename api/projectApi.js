//----------------------------------
// API Mode
//----------------------------------

const LOCAL_MODE = false;

console.log(
    `Catalog Source: ${
        LOCAL_MODE ? "Local JSON" : "Apps Script"
    }`
);

//----------------------------------
// Project API
//----------------------------------

const PROJECT_API_URL =
  "https://script.google.com/macros/s/AKfycbztkGaSk-SGnzFk5ZnST0bIjma06J1WhPDF2Hd62sHTtkQH8fm6yq-F3FtJYQzFYLfM/exec";

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
// Load Local JSON
//----------------------------------

async function loadLocalJSON(path) {

    const response = await fetch(path);

    if (!response.ok) {

        throw new Error(`Unable to load ${path}`);

    }

    return await response.json();

}

//----------------------------------
// Get MML
//----------------------------------

async function getMML() {

    //----------------------------------
    // Local
    //----------------------------------

    if (LOCAL_MODE) {

        return await loadLocalJSON("./Mock/MML.json");

    }

    //----------------------------------
    // Cache
    //----------------------------------

    const cache = loadMMLCache();

    if (cache) {

        console.log("Catalog Source: Cache");

        return cache.data;

    }

    //----------------------------------
    // Apps Script
    //----------------------------------

    console.log("Catalog Source: Apps Script");

    const result = await apiRequest({

        action: "getMML"

    });

    if (!result.success) {

        console.error(result.message);

        return [];

    }

    const mml = result.mml || [];

    saveMMLCache(mml);

    console.log("MML Cached");

    return mml;

}

//----------------------------------
// Get Presets
//----------------------------------

async function getPresets() {

    //----------------------------------
    // Local
    //----------------------------------

    if (LOCAL_MODE) {

        return await loadLocalJSON("./Mock/PRESETS.json");

    }

    //----------------------------------
    // Cache
    //----------------------------------

    const cache = loadPresetCache();

    if (cache) {

        console.log("Preset Source: Cache");

        return cache.data;

    }

    //----------------------------------
    // Apps Script
    //----------------------------------

    console.log("Preset Source: Apps Script");

    const result = await apiRequest({

        action: "getPresets"

    });

    if (!result.success) {

        console.error(result.message);

        return [];

    }

    const presets = result.presets || [];

    savePresetCache(presets);

    console.log("Presets Cached");

    return presets;

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
// API Object
//----------------------------------

window.API = {

    getMML,

    getPresets,

    saveProject,

    loadProject,

    getProjects,

    deleteProject

};

//----------------------------------
// Legacy Compatibility
//----------------------------------

window.saveProject = saveProject;
window.loadProject = loadProject;
window.getProjects = getProjects;
window.deleteProject = deleteProject;
window.getPresets = getPresets;
window.getPresetMaterials = getPresetMaterials;