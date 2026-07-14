//----------------------------------
// Cache Keys
//----------------------------------

const MML_CACHE = "panelbuilder_mml";

//----------------------------------
// Save
//----------------------------------

function saveMMLCache(data, version) {

    localStorage.setItem(

        MML_CACHE,

        JSON.stringify({

            version,

            data

        })

    );

}

//----------------------------------
// Load
//----------------------------------

function loadMMLCache() {

    const cache =

        localStorage.getItem(

            MML_CACHE

        );

    return cache

        ? JSON.parse(cache)

        : null;

}

//----------------------------------
// Clear
//----------------------------------

function clearMMLCache() {

    localStorage.removeItem(

        MML_CACHE

    );

}

//----------------------------------
// Expose
//----------------------------------

window.saveMMLCache = saveMMLCache;
window.loadMMLCache = loadMMLCache;
window.clearMMLCache = clearMMLCache;