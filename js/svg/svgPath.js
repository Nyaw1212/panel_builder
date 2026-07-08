//----------------------------------
// SVG Path
//----------------------------------

//----------------------------------
// Draw SVG Path
//----------------------------------

function drawSVGPath(link) {

    const start =
        getConnectionCenter(

            link.start.panelId,

            link.start.connectionId

        );

    const end =
        getConnectionCenter(

            link.end.panelId,

            link.end.connectionId

        );

    if (!start || !end) return;

    //----------------------------------
    // Path
    //----------------------------------

    const midX =
        (start.x + end.x) / 2;

    const d = [
    `M ${start.x} ${start.y}`,
    `L ${end.x} ${start.y}`,
    `L ${end.x} ${end.y}`
].join(" ");

    //----------------------------------
    // SVG
    //----------------------------------

    const path =
        document.createElementNS(

            "http://www.w3.org/2000/svg",

            "path"

        );

    path.setAttribute("d", d);

    applySVGPathStyle(path);

    svgLayer.appendChild(path);

}