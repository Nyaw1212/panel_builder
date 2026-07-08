//----------------------------------
// SVG Line
//----------------------------------

//----------------------------------
// Draw SVG Line
//----------------------------------

function drawSVGLine(link) {

    const points = getLinkPoints(link);

    if (points.length < 2) return;

    const start = points[0];
    const end = points[1];

    const line =
        document.createElementNS(

            "http://www.w3.org/2000/svg",

            "line"

        );

    line.setAttribute("x1", start.x);

    line.setAttribute("y1", start.y);

    line.setAttribute("x2", end.x);

    line.setAttribute("y2", end.y);

    applySVGLineStyle(line);

    //----------------------------------
    // Ignore Mouse
    //----------------------------------

    line.style.pointerEvents = "none";

const svg = getSVGRoot();

if (!svg) return;

svg.appendChild(line);

}