//----------------------------------
// API Mode
//----------------------------------

const LOCAL_MODE = false;

console.log(
    `Catalog Source: ${LOCAL_MODE ? "Local JSON" : "Apps Script"}`
);

//----------------------------------
// Project API
//----------------------------------

const PROJECT_API_URL =
    "https://script.google.com/macros/s/AKfycbztkGaSk-SGnzFk5ZnST0bIjma06J1WhPDF2Hd62sHTtkQH8fm6yq-F3FtJYQzFYLfM/exec";

//----------------------------------
// Catalog Watcher Configuration
//----------------------------------

const CATALOG_WATCH_INTERVAL_MS = 30000;

let catalogWatchTimer = null;
let mmlWatchInFlight = false;
let presetWatchInFlight = false;
let catalogUpdateNoticeShown = false;

//----------------------------------
// API Request
//----------------------------------

async function apiRequest(data) {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 20000);

    try {
        const response = await fetch(PROJECT_API_URL, {
            method: "POST",
            body: JSON.stringify(data),
            signal: controller.signal
        });

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
    finally {
        window.clearTimeout(timeout);
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
// MML Version
//----------------------------------

async function getMMLVersion() {
    const result = await apiRequest({
        action: "getMMLVersion"
    });

    if (!result.success) {
        return null;
    }

    return String(
        result.version ||
        result.mmlVersion ||
        ""
    );
}

//----------------------------------
// PRESETS Version
//----------------------------------

async function getPresetsVersion() {
    const result = await apiRequest({
        action: "getPresetsVersion"
    });

    if (!result.success) {
        return null;
    }

    return String(
        result.version ||
        result.presetsVersion ||
        ""
    );
}

//----------------------------------
// Fetch MML
//----------------------------------

async function fetchMMLFromApi(version = "") {
    console.log("Catalog Source: Apps Script");

    const result = await apiRequest({
        action: "getMML"
    });

    if (!result.success) {
        console.error(result.message);
        return null;
    }

    const mml = result.mml || [];

    const resolvedVersion = String(
        result.version ||
        result.mmlVersion ||
        version ||
        "unversioned"
    );

    saveMMLCache(mml, resolvedVersion);

    console.log("MML Cached:", resolvedVersion);

    return mml;
}

//----------------------------------
// Fetch PRESETS
//----------------------------------

async function fetchPresetsFromApi(version = "") {
    console.log("Preset Source: Apps Script");

    const result = await apiRequest({
        action: "getPresets"
    });

    if (!result.success) {
        console.error(result.message);
        return null;
    }

    const presets = result.presets || [];

    const resolvedVersion = String(
        result.version ||
        result.presetsVersion ||
        version ||
        "unversioned"
    );

    savePresetCache(presets, resolvedVersion);

    console.log("Presets Cached:", resolvedVersion);

    return presets;
}

//----------------------------------
// Catalog Update Notice
//----------------------------------

function showCatalogUpdateNotice(catalogName, oldVersion, newVersion) {
    if (catalogUpdateNoticeShown) {
        return;
    }

    catalogUpdateNoticeShown = true;

    let notice = document.getElementById("panelBuilderCatalogUpdateNotice");

    if (!notice) {
        notice = document.createElement("div");
        notice.id = "panelBuilderCatalogUpdateNotice";

        Object.assign(notice.style, {
            position: "fixed",
            right: "18px",
            bottom: "72px",
            zIndex: "12000",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            maxWidth: "430px",
            padding: "12px 14px",
            border: "1px solid rgba(96, 165, 250, .5)",
            borderRadius: "10px",
            background: "rgba(7, 17, 31, .96)",
            boxShadow: "0 14px 36px rgba(0, 0, 0, .42)",
            color: "#e2e8f0",
            font: "600 13px/1.3 system-ui, sans-serif"
        });

        notice.innerHTML = `
            <span id="panelBuilderCatalogUpdateText" style="flex:1 1 auto;"></span>
            <button
                id="panelBuilderCatalogReloadButton"
                type="button"
                style="
                    border:0;
                    border-radius:7px;
                    padding:7px 10px;
                    background:#2563eb;
                    color:#fff;
                    font-weight:700;
                    cursor:pointer;
                "
            >Reload</button>
        `;

        document.body.appendChild(notice);

        document
            .getElementById("panelBuilderCatalogReloadButton")
            ?.addEventListener("click", () => location.reload());
    }

    const text = document.getElementById("panelBuilderCatalogUpdateText");

    if (text) {
        text.textContent = `${catalogName} updated. Reload to apply the new catalog.`;
    }

    notice.title = `${catalogName} ${oldVersion || "unknown"} → ${newVersion || "unknown"}`;
}

//----------------------------------
// Background MML Revalidation
//----------------------------------

async function revalidateMMLCache(cache = loadMMLCache(), options = {}) {
    if (LOCAL_MODE || !cache || mmlWatchInFlight) {
        return false;
    }

    mmlWatchInFlight = true;

    try {
        const remoteVersion = await getMMLVersion();

        if (!remoteVersion) {
            if (!options.silent) {
                console.warn(
                    "MML version check unavailable; keeping cached catalog."
                );
            }
            return false;
        }

        if (String(cache.version) === String(remoteVersion)) {
            if (!options.silent) {
                console.log("MML Cache Current:", remoteVersion);
            }
            return false;
        }

        console.log(
            "MML update detected:",
            cache.version,
            "→",
            remoteVersion
        );

        const updatedMML = await fetchMMLFromApi(remoteVersion);

        if (!updatedMML) {
            return false;
        }

        console.log("MML cache updated in background.");
        showCatalogUpdateNotice("MML catalog", cache.version, remoteVersion);

        return true;
    }
    catch (err) {
        if (!options.silent) {
            console.warn(
                "MML background version check failed:",
                err
            );
        }
        return false;
    }
    finally {
        mmlWatchInFlight = false;
    }
}

//----------------------------------
// Background PRESETS Revalidation
//----------------------------------

async function revalidatePresetCache(cache = loadPresetCache(), options = {}) {
    if (LOCAL_MODE || !cache || presetWatchInFlight) {
        return false;
    }

    presetWatchInFlight = true;

    try {
        const remoteVersion = await getPresetsVersion();

        if (!remoteVersion) {
            if (!options.silent) {
                console.warn(
                    "PRESETS version check unavailable; keeping cached presets."
                );
            }
            return false;
        }

        if (String(cache.version) === String(remoteVersion)) {
            if (!options.silent) {
                console.log("PRESETS Cache Current:", remoteVersion);
            }
            return false;
        }

        console.log(
            "PRESETS update detected:",
            cache.version,
            "→",
            remoteVersion
        );

        const updatedPresets = await fetchPresetsFromApi(remoteVersion);

        if (!updatedPresets) {
            return false;
        }

        console.log("PRESETS cache updated in background.");
        showCatalogUpdateNotice("PRESETS", cache.version, remoteVersion);

        return true;
    }
    catch (err) {
        if (!options.silent) {
            console.warn(
                "PRESETS background version check failed:",
                err
            );
        }
        return false;
    }
    finally {
        presetWatchInFlight = false;
    }
}

//----------------------------------
// Catalog Watcher
//----------------------------------

function checkCatalogUpdates(options = {}) {
    void revalidateMMLCache(loadMMLCache(), options);
    void revalidatePresetCache(loadPresetCache(), options);
}

function startCatalogWatcher() {
    if (LOCAL_MODE || catalogWatchTimer) {
        return;
    }

    catalogWatchTimer = window.setInterval(() => {
        checkCatalogUpdates({ silent: true });
    }, CATALOG_WATCH_INTERVAL_MS);

    document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") {
            checkCatalogUpdates();
        }
    });

    window.addEventListener("focus", () => {
        checkCatalogUpdates({ silent: true });
    });

    console.log(
        `Catalog watcher enabled (${CATALOG_WATCH_INTERVAL_MS / 1000}s).`
    );
}

//----------------------------------
// Get MML
//----------------------------------

async function getMML() {
    if (LOCAL_MODE) {
        return await loadLocalJSON("./Mock/MML.json");
    }

    const cache = loadMMLCache();

    if (cache) {
        console.log("Catalog Source: Cache", cache.version);

        // Never hold the whole app hostage while a background version check
        // waits on Apps Script. The Reload MML button is available whenever a
        // user needs an immediate, fresh catalog.
        void revalidateMMLCache(cache);
        startCatalogWatcher();
        return cache.data;
    }

    const mml = (
        await fetchMMLFromApi()
    ) || [];

    if (mml.length) {
        startCatalogWatcher();
    }

    return mml;
}

//----------------------------------
// Force MML Reload
//----------------------------------

async function reloadMML() {
    if (LOCAL_MODE) {
        return await loadLocalJSON("./Mock/MML.json");
    }

    clearMMLCache();

    const mml = await fetchMMLFromApi();

    if (!Array.isArray(mml) || !mml.length) {
        throw new Error("MML reload returned no materials. The existing catalog was not replaced.");
    }

    startCatalogWatcher();

    return mml;
}

//----------------------------------
// Get Presets
//----------------------------------

async function getPresets() {
    if (LOCAL_MODE) {
        return await loadLocalJSON("./Mock/PRESETS.json");
    }

    const cache = loadPresetCache();

    if (cache) {
        console.log("Preset Source: Cache", cache.version);
        void revalidatePresetCache(cache);
        startCatalogWatcher();
        return cache.data;
    }

    const presets = (
        await fetchPresetsFromApi()
    ) || [];

    if (presets.length) {
        startCatalogWatcher();
    }

    return presets;
}

//----------------------------------
// Wire assignment rules
//----------------------------------

async function getWireAssignments() {
    if (LOCAL_MODE) {
        return [];
    }

    const result = await apiRequest({
        action: "getWireAssignments"
    });

    if (!result.success) {
        console.warn("WireAss unavailable:", result.message);
        return [];
    }

    return Array.isArray(result.wireAssignments)
        ? result.wireAssignments
        : [];
}

//----------------------------------
// Save Project
//----------------------------------

async function saveProject(project, options = {}) {
    const payload = serializeProject(project);

    if ("usedMaterialsOutput" in options) {
        payload.usedMaterialsOutput =
            String(options.usedMaterialsOutput || "");
    }

    return await apiRequest({
        action: "saveProject",
        ...payload,
        forceNew: options.forceNew === true
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

let getProjectsError = "";

async function getProjects() {
    const result = await apiRequest({
        action: "getProjects"
    });

    if (!result.success) {
        getProjectsError = String(
            result.message ||
            "The Project API did not return a project list."
        );
        console.error("Unable to load saved projects:", getProjectsError);
        return [];
    }

    getProjectsError = "";
    return result.projects || [];
}

function getProjectsLoadError() {
    return getProjectsError;
}

window.getProjectsLoadError = getProjectsLoadError;

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
    reloadMML,
    getMMLVersion,
    getPresets,
    getPresetsVersion,
    getWireAssignments,
    saveProject,
    loadProject,
    getProjects,
    deleteProject
};

//----------------------------------
// Legacy Compatibility
//----------------------------------

window.getMMLVersion = getMMLVersion;
window.reloadMML = reloadMML;
window.getPresetsVersion = getPresetsVersion;
window.saveProject = saveProject;
window.loadProject = loadProject;
window.getProjects = getProjects;
window.deleteProject = deleteProject;
window.getPresets = getPresets;
window.getWireAssignments = getWireAssignments;
window.getPresetMaterials = getPresetMaterials;
