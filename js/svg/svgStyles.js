//----------------------------------
// SVG Style
//----------------------------------

const SVG_STYLE = {

    stroke: "#2563eb",

    strokeWidth: 4,

    lineCap: "round",

    lineJoin: "round",

    fill: "none"

};

//----------------------------------
// Apply Line Style
//----------------------------------

function applySVGLineStyle(line) {

    line.setAttribute(

        "stroke",

        SVG_STYLE.stroke

    );

    line.setAttribute(

        "stroke-width",

        SVG_STYLE.strokeWidth

    );

    line.setAttribute(

        "stroke-linecap",

        SVG_STYLE.lineCap

    );

    line.setAttribute(

        "fill",

        SVG_STYLE.fill

    );

}

//----------------------------------
// Apply Path Style
//----------------------------------

function applySVGPathStyle(path) {

    path.setAttribute(

        "stroke",

        SVG_STYLE.stroke

    );

    path.setAttribute(

        "stroke-width",

        SVG_STYLE.strokeWidth

    );

    path.setAttribute(

        "stroke-linecap",

        SVG_STYLE.lineCap

    );

    path.setAttribute(

        "stroke-linejoin",

        SVG_STYLE.lineJoin

    );

    path.setAttribute(

        "fill",

        SVG_STYLE.fill

    );

}