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

        console.log("Draft Saved");
        console.log(project);

    }
    catch (err) {

        console.error(err);

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

        console.log("Draft JSON:", json);

        if (!json) {

            console.log("No Draft Found");

            return null;

        }

        const draft = JSON.parse(json);

        console.log("Draft Loaded:");
        console.log(draft);

        return draft;

    }
    catch (err) {

        console.error(err);

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

    console.log("Draft Cleared");

}

//----------------------------------
// Has Draft
//----------------------------------

function hasDraft() {

    const exists = !!localStorage.getItem(

        DRAFT_KEY

    );

    console.log("Has Draft:", exists);

    return exists;

}

//----------------------------------
// Expose
//----------------------------------

window.saveDraft = saveDraft;
window.loadDraft = loadDraft;
window.clearDraft = clearDraft;
window.hasDraft = hasDraft;