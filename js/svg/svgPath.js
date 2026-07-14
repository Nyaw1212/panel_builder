//----------------------------------
// SVG Path
//----------------------------------

//----------------------------------
// Draw SVG Path
//----------------------------------

function drawSVGPath(link) {

    //----------------------------------
    // Geometry
    //----------------------------------

    const points = getLinkPoints(link);

    if (!points || points.length < 2) {

        return;

    }

    //----------------------------------
    // Build Path
    //----------------------------------

    let d =

        `M ${points[0].x} ${points[0].y}`;

    for (

        let i = 1;

        i < points.length;

        i++

    ) {

        d +=

            ` L ${points[i].x} ${points[i].y}`;

    }

    //----------------------------------
    // SVG
    //----------------------------------

    const path =

        document.createElementNS(

            "http://www.w3.org/2000/svg",

            "path"

        );

    path.setAttribute(

        "d",

        d

    );

    applySVGPathStyle(path);

    svgLayer.appendChild(path);

}