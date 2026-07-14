//----------------------------------
// Cache Keys
//----------------------------------

const CACHE_KEYS = {

    MML: "panelbuilder_mml",

    PRESETS: "panelbuilder_presets"

};

//----------------------------------
// Save Cache
//----------------------------------

function saveCache(

    key,

    data,

    version = "local"

) {

    localStorage.setItem(

        key,

        JSON.stringify({

            version,

            timestamp: Date.now(),

            data

        })

    );

}

//----------------------------------
// Load Cache
//----------------------------------

function loadCache(key) {

    const cache =

        localStorage.getItem(key);

    if (!cache) {

        return null;

    }

    try {

        return JSON.parse(cache);

    }

    catch {

        console.warn(

            "Invalid Cache:",

            key

        );

        localStorage.removeItem(key);

        return null;

    }

}

//----------------------------------
// Clear Cache
//----------------------------------

function clearCache(key) {

    localStorage.removeItem(key);

}

//----------------------------------
// Clear All
//----------------------------------

function clearAllCache() {

    Object.values(CACHE_KEYS).forEach(key =>

        localStorage.removeItem(key)

    );

}

//----------------------------------
// MML Helpers
//----------------------------------

function saveMMLCache(

    data,

    version = "local"

) {

    saveCache(

        CACHE_KEYS.MML,

        data,

        version

    );

}

function loadMMLCache() {

    return loadCache(

        CACHE_KEYS.MML

    );

}

function clearMMLCache() {

    clearCache(

        CACHE_KEYS.MML

    );

}

//----------------------------------
// Preset Helpers
//----------------------------------

function savePresetCache(

    data,

    version = "local"

) {

    saveCache(

        CACHE_KEYS.PRESETS,

        data,

        version

    );

}

function loadPresetCache() {

    return loadCache(

        CACHE_KEYS.PRESETS

    );

}

function clearPresetCache() {

    clearCache(

        CACHE_KEYS.PRESETS

    );

}

//----------------------------------
// Expose
//----------------------------------

window.saveMMLCache = saveMMLCache;
window.loadMMLCache = loadMMLCache;
window.clearMMLCache = clearMMLCache;

window.savePresetCache = savePresetCache;
window.loadPresetCache = loadPresetCache;
window.clearPresetCache = clearPresetCache;

window.clearAllCache = clearAllCache;