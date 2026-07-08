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

    updateLinkGeometry(link);

    updateLinkLength(link);

    updateLinkAssembly(link);

    updateLinkMaterials(link);

    drawSVGLine(link);
    drawLinkNode(link);

    //----------------------------------
    // Delete Button
    //----------------------------------

    if (typeof drawLinkDeleteButton === "function") {

    drawLinkDeleteButton(link);

}

    //----------------------------------
    // Midpoint Node
    //----------------------------------

    

}

//----------------------------------
// Expose
//----------------------------------

window.drawLinks = drawLinks;
window.drawLink = drawLink;