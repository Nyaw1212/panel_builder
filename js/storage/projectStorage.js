//----------------------------------
// Storage Key
//----------------------------------

const STORAGE_KEY = "panelBuilderProject";

//----------------------------------
// Save Draft
//----------------------------------

function saveDraft() {

    const project = serializeProject();

    localStorage.setItem(

        STORAGE_KEY,

        JSON.stringify(project)

    );

}

//----------------------------------
// Load Draft
//----------------------------------

function loadDraft() {

    const json = localStorage.getItem(

        STORAGE_KEY

    );

    if (!json)
        return null;

    return JSON.parse(json);

}

//----------------------------------
// Clear Draft
//----------------------------------

function clearDraft() {

    localStorage.removeItem(

        STORAGE_KEY

    );

}

//----------------------------------
// Expose
//----------------------------------

window.saveDraft = saveDraft;
window.loadDraft = loadDraft;
window.clearDraft = clearDraft;