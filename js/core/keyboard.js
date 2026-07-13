//----------------------------------
// Keyboard Shortcuts
//----------------------------------

document.addEventListener(

    "keydown",

    handleKeyboardShortcuts

);

//----------------------------------
// Handle Keyboard
//----------------------------------

function handleKeyboardShortcuts(e) {

    //----------------------------------
    // Ignore Typing
    //----------------------------------

    const tag = document.activeElement?.tagName;

    if (

        tag === "INPUT" ||

        tag === "TEXTAREA" ||

        document.activeElement?.isContentEditable

    ) {

        return;

    }

    //----------------------------------
    // Ctrl + C
    //----------------------------------

    if (

        (e.ctrlKey || e.metaKey) &&

        e.key.toLowerCase() === "c"

    ) {

        e.preventDefault();

        const copied = copySelection();

        if (copied) {

            console.log(

                `Copied ${getClipboardCount()} panel(s).`

            );

        }

        return;

    }

    //----------------------------------
    // Ctrl + V
    //----------------------------------

    if (

        (e.ctrlKey || e.metaKey) &&

        e.key.toLowerCase() === "v"

    ) {

        e.preventDefault();

        const pasted = pasteSelection();

        if (pasted) {

            console.log(

                `Pasted ${SelectionManager.getCount()} panel(s).`

            );

        }

        return;

    }

    //----------------------------------
    // Ctrl + A
    //----------------------------------

    if (

        (e.ctrlKey || e.metaKey) &&

        e.key.toLowerCase() === "a"

    ) {

        e.preventDefault();

        console.log("Select All - Coming Soon");

        return;

    }

    //----------------------------------
    // Delete
    //----------------------------------

    if (

        e.key === "Delete" ||

        e.key === "Backspace"

    ) {

        e.preventDefault();

        console.log("Delete Selection - Coming Soon");

        return;

    }

}