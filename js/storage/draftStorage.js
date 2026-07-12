//----------------------------------
// Storage Key
//----------------------------------

const DRAFT_KEY = "PanelBuilderDraft";

//----------------------------------
// Save Draft
//----------------------------------

function saveDraft() {

    try {

        const project = serializeProject();

        localStorage.setItem(

            DRAFT_KEY,

            JSON.stringify(project)

        );

    }
    catch (err) {

        console.error("Failed to save draft.", err);

    }

}

//----------------------------------
// Load Draft
//----------------------------------

function loadDraft() {

    try {

        const json = localStorage.getItem(

            DRAFT_KEY

        );

        if (!json) {

            return null;

        }

        return JSON.parse(json);

    }
    catch (err) {

        console.error("Failed to load draft.", err);

        return null;

    }

}

//----------------------------------
// Delete Draft
//----------------------------------

function clearDraft() {

    localStorage.removeItem(

        DRAFT_KEY

    );

}

//----------------------------------
// Has Draft
//----------------------------------

function hasDraft() {

    return localStorage.getItem(

        DRAFT_KEY

    ) !== null;

}

//----------------------------------
// Expose
//----------------------------------

window.saveDraft = saveDraft;
window.loadDraft = loadDraft;
window.clearDraft = clearDraft;
window.hasDraft = hasDraft;