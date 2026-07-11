//----------------------------------
// Project Cache
//----------------------------------

let projectCache = null;

//----------------------------------
// Get Cached Projects
//----------------------------------

async function getCachedProjects() {

    //----------------------------------
    // Already Cached
    //----------------------------------

    if (projectCache) {

        console.log("Using Cached Projects");

        return projectCache;

    }

    //----------------------------------
    // Load From API
    //----------------------------------

    console.log("Loading Projects From API");

    projectCache = await getProjects();

    return projectCache;

}

//----------------------------------
// Refresh Cache
//----------------------------------

async function refreshProjectCache() {

    console.log("Refreshing Project Cache");

    projectCache = await getProjects();

    return projectCache;

}

//----------------------------------
// Invalidate Cache
//----------------------------------

function invalidateProjectCache() {

    console.log("Project Cache Cleared");

    projectCache = null;

}

//----------------------------------
// Expose
//----------------------------------

window.getCachedProjects =
    getCachedProjects;

window.refreshProjectCache =
    refreshProjectCache;

window.invalidateProjectCache =
    invalidateProjectCache;