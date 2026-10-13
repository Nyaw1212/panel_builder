//----------------------------------
// Project History Helper
//----------------------------------

function resetProjectHistory(
    label
) {

    if (
        !window.HistoryManagerV2 ||
        typeof window
            .HistoryManagerV2
            .reset !==
            "function"
    ) {

        return false;

    }

    window
        .HistoryManagerV2
        .reset(
            label
        );

    return true;

}

//----------------------------------
// Finalize Loaded Project History
//----------------------------------

function finalizeLoadedProjectHistory() {

    /*
     * Call this only AFTER the loaded
     * project has been deserialized into
     * the canvas, layout, links, and UI.
     */

    return resetProjectHistory(
        "Project loaded"
    );

}

//----------------------------------
// Build Project
//----------------------------------

function buildProject() {

    const project =
        getProjectState();

    return {

        id:
            project.id,

        version:
            project.version,

        jobName:
            project.jobName,

        address:
            project.address,

        layout:
            getLayout(),

        links:
            getLinks(),

        runs:
            typeof serializeRuns === "function"
                ? serializeRuns()
                : [],

        gutters:
            typeof serializeGutters === "function"
                ? serializeGutters()
                : []

    };

}

//----------------------------------
// Save Current Project
//----------------------------------

async function saveCurrentProject() {

    console.time(
        "Build Project"
    );

    const project =
        buildProject();

    console.timeEnd(
        "Build Project"
    );

    console.time(
        "Save API"
    );

    const result =
        await saveProject(
            project
        );

    console.timeEnd(
        "Save API"
    );

    console.log(
        "Project Saved",
        result
    );

    if (
        result?.success &&
        result.projectId
    ) {

        setProjectId(
            result.projectId
        );

        //----------------------------------
        // Refresh Project Cache
        //----------------------------------

        if (
            typeof invalidateProjectCache ===
            "function"
        ) {

            invalidateProjectCache();

        }

    }

    /*
     * Saving does not change the project,
     * so no history entry is created.
     */

    return result;

}

//----------------------------------
// Load Current Project
//----------------------------------

async function loadCurrentProject(
    jobName,
    address,
    options = {}
) {

    console.time(
        "Load API"
    );

    const result =
        await loadProject(
            jobName,
            address
        );

    console.timeEnd(
        "Load API"
    );

    console.log(
        "Project Loaded",
        result
    );

    if (
        result?.success &&
        result.found
    ) {

        setProjectState({

            id:
                result.projectId,

            jobName,

            address,

            version:
                result.project?.version ||
                2

        });

        //----------------------------------
        // Optional Deserialization
        //----------------------------------

        if (
            options.deserialize === true &&
            typeof deserializeProject ===
                "function"
        ) {

            await deserializeProject(
                result.project
            );

            finalizeLoadedProjectHistory();

        }
        else if (
            options.resetHistory === true
        ) {

            /*
             * Use only when the caller has
             * already restored the loaded
             * project before this point.
             */

            finalizeLoadedProjectHistory();

        }

    }

    return result;

}

//----------------------------------
// New Project
//----------------------------------

function newProject(
    jobName,
    address,
    options = {}
) {

    clearProjectState();

    setProjectState({

        id:
            "",

        version:
            2,

        jobName,

        address

    });

    //----------------------------------
    // Optional Canvas Reset
    //----------------------------------

    if (
        options.clearCanvas === true
    ) {

        if (
            typeof clearLinks ===
            "function"
        ) {

            clearLinks({

                captureHistory:
                    false,

                refresh:
                    false

            });

        }

        const layout =
            typeof getLayout ===
                "function"
                ? getLayout()
                : null;

        if (
            Array.isArray(layout)
        ) {

            layout.fill(
                null
            );

        }

        if (
            typeof SelectionManager !==
                "undefined" &&
            typeof SelectionManager.clear ===
                "function"
        ) {

            SelectionManager.clear();

        }

        if (
            typeof drawCanvas ===
                "function"
        ) {

            drawCanvas();

        }

    }

    //----------------------------------
    // Reset History Baseline
    //----------------------------------

    if (
        options.resetHistory !==
        false
    ) {

        resetProjectHistory(
            "New project"
        );

    }

    return getProjectState();

}

//----------------------------------
// Expose
//----------------------------------

window.resetProjectHistory =
    resetProjectHistory;

window.finalizeLoadedProjectHistory =
    finalizeLoadedProjectHistory;

window.buildProject =
    buildProject;

window.saveCurrentProject =
    saveCurrentProject;

window.loadCurrentProject =
    loadCurrentProject;

window.newProject =
    newProject;
