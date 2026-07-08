//----------------------------------
// Link Delete Button
//----------------------------------

let linkDeleteButton = null;

//----------------------------------
// Remove Existing
//----------------------------------

function removeLinkDeleteButton() {

    if (linkDeleteButton) {

        linkDeleteButton.remove();

        linkDeleteButton = null;

    }

}

//----------------------------------
// Draw
//----------------------------------

function drawLinkDeleteButton(link) {

    removeLinkDeleteButton();

    const editingLink = getEditingLink();

    if (!editingLink)
        return;

    if (editingLink !== link)
        return;

    const position = getLinkNodePosition(link);

    if (!position)
        return;

    const container =
        document.getElementById("canvasContainer");

    linkDeleteButton =
        document.createElement("div");

    linkDeleteButton.className =
        "link-delete-button";

    linkDeleteButton.innerHTML = "✕";

    linkDeleteButton.style.left =
        `${position.x - 11}px`;

    linkDeleteButton.style.top =
        `${position.y - 36}px`;

    linkDeleteButton.onclick = e => {

        e.stopPropagation();

        removeLink(link);

        removeLinkDeleteButton();

        hideLinkInspector();

        drawCanvas();

    };

    container.appendChild(linkDeleteButton);

}

//----------------------------------
// Expose
//----------------------------------

window.drawLinkDeleteButton =
    drawLinkDeleteButton;

window.removeLinkDeleteButton =
    removeLinkDeleteButton;