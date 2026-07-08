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

                headers: {

                    "Content-Type": "application/json"

                },

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

    console.log("Testing layout...");
    JSON.stringify(project.layout);
    console.log("✔ Layout OK");

    console.log("Testing links...");
    JSON.stringify(project.links);
    console.log("✔ Links OK");

    return await apiRequest({

        action: "saveProject",

        jobName: project.jobName,

        address: project.address,

        layout: project.layout,

        links: project.links

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