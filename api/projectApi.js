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

    //----------------------------------
    // Debug
    //----------------------------------

    console.log("Payload");

    console.log(payload);

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
// Delete Project
//----------------------------------

async function deleteProject(projectId) {

    return await apiRequest({

        action: "deleteProject",

        projectId

    });

}

//----------------------------------
// Expose
//----------------------------------

window.saveProject = saveProject;
window.loadProject = loadProject;
window.deleteProject = deleteProject;