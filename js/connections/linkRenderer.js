//----------------------------------
// Draw Links
//----------------------------------

function drawLinks() {

    const links = getLinks();

    if (!Array.isArray(links)) return;

    links.forEach(drawLink);

}

//----------------------------------
// Draw Link
//----------------------------------

function drawLink(link) {

    if (!link) return;

    //----------------------------------
    // Update
    //----------------------------------

    updateLinkGeometry(link);

    updateLinkLength(link);

    updateLinkAssembly(link);

    updateLinkMaterials(link);

    //----------------------------------
    // SVG Path
    //----------------------------------

    drawSVGPath(link);

    //----------------------------------
    // Link Node
    //----------------------------------

    drawLinkNode(link);

    //----------------------------------
    // Delete Button
    //----------------------------------

    if (typeof drawLinkDeleteButton === "function") {

        drawLinkDeleteButton(link);

    }

}

//----------------------------------
// Expose
//----------------------------------

window.drawLinks = drawLinks;
window.drawLink = drawLink;