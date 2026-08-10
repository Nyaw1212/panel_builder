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
// MML Watcher Configuration
//----------------------------------

const MML_WATCH_INTERVAL_MS = 30000;

let mmlWatchTimer = null;
let mmlWatchInFlight = false;
let mmlUpdateNoticeShown = false;

//----------------------------------
// API Request
//----------------------------------

async function apiRequest(data) {
    try {
        const response = await fetch(PROJECT_API_URL, {
            method: "POST",
            body: JSON.stringify(data)
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
// Catalog Update Notice
//----------------------------------

function showMMLUpdateNotice(oldVersion, newVersion) {
    if (mmlUpdateNoticeShown) {
        return;
    }

    mmlUpdateNoticeShown = true;

    let notice = document.getElementById("panelBuilderMMLUpdateNotice");

    if (!notice) {
        notice = document.createElement("div");
        notice.id = "panelBuilderMMLUpdateNotice";

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
            <span style="flex:1 1 auto;">
                MML catalog updated. Reload to apply the new catalog.
            </span>
            <button
                id="panelBuilderMMLReloadButton"
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
            .getElementById("panelBuilderMMLReloadButton")
            ?.addEventListener("click", () => location.reload());
    }

    notice.title = `MML ${oldVersion || "unknown"} → ${newVersion || "unknown"}`;
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
        showMMLUpdateNotice(cache.version, remoteVersion);

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
// MML Watcher
//----------------------------------

function startMMLWatcher() {
    if (LOCAL_MODE || mmlWatchTimer) {
        return;
    }

    mmlWatchTimer = window.setInterval(() => {
        void revalidateMMLCache(loadMMLCache(), { silent: true });
    }, MML_WATCH_INTERVAL_MS);

    document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") {
            void revalidateMMLCache(loadMMLCache());
        }
    });

    window.addEventListener("focus", () => {
        void revalidateMMLCache(loadMMLCache(), { silent: true });
    });

    console.log(
        `MML watcher enabled (${MML_WATCH_INTERVAL_MS / 1000}s).`
    );
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
    // Cache First
    //----------------------------------

    const cache = loadMMLCache();

    if (cache) {
        console.log("Catalog Source: Cache", cache.version);

        // Do not block application startup waiting for Apps Script.
        // Revalidate in the background and keep watching for later edits.
        void revalidateMMLCache(cache);
        startMMLWatcher();

        return cache.data;
    }

    //----------------------------------
    // First Load
    //----------------------------------

    const mml = (
        await fetchMMLFromApi()
    ) || [];

    if (mml.length) {
        startMMLWatcher();
    }

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
    getMMLVersion,
    getPresets,
    saveProject,
    loadProject,
    getProjects,
    deleteProject
};

//----------------------------------
// Legacy Compatibility
//----------------------------------

window.getMMLVersion = getMMLVersion;
window.saveProject = saveProject;
window.loadProject = loadProject;
window.getProjects = getProjects;
window.deleteProject = deleteProject;
window.getPresets = getPresets;
window.getPresetMaterials = getPresetMaterials;
