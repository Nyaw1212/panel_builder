//----------------------------------
// Build Project
//----------------------------------

function buildProject() {

    const project = getProjectState();

    return {

        id: project.id,

        version: project.version,

        jobName: project.jobName,

        address: project.address,

        layout: getLayout(),

        links: getLinks()

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

        setProjectId(

            result.projectId

        );

    }

    return result;

}

//----------------------------------
// Load Current Project
//----------------------------------

async function loadCurrentProject(

    jobName,

    address

) {

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

        setProjectState({

            id: result.projectId,

            jobName,

            address,

            version:

                result.project.version || 2

        });

    }

    return result;

}

//----------------------------------
// New Project
//----------------------------------

function newProject(

    jobName,

    address

) {

    clearProjectState();

    setProjectState({

        id: "",

        version: 2,

        jobName,

        address

    });

}

//----------------------------------
// Expose
//----------------------------------

window.buildProject =
    buildProject;

window.saveCurrentProject =
    saveCurrentProject;

window.loadCurrentProject =
    loadCurrentProject;

window.newProject =
    newProject;