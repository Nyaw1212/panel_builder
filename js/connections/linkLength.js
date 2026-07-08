//----------------------------------
// Update Length
//----------------------------------

function updateLinkLength(link) {

    if (!link) return 0;

    const points = getLinkPoints(link);

    if (points.length < 2) {

        link.length = 0;
        return 0;

    }

    let length = 0;

    for (let i = 1; i < points.length; i++) {

        const dx = points[i].x - points[i - 1].x;
        const dy = points[i].y - points[i - 1].y;

        length += Math.hypot(dx, dy);

    }

    link.length = length;

    return length;

}

//----------------------------------
// Get Length
//----------------------------------

function getLinkLength(link) {

    return link?.length || 0;

}

//----------------------------------
// Set Length
//----------------------------------

function setLinkLength(link, length) {

    if (!link) return;

    link.length = Number(length) || 0;

}

//----------------------------------
// Expose
//----------------------------------

window.updateLinkLength = updateLinkLength;
window.getLinkLength = getLinkLength;
window.setLinkLength = setLinkLength;