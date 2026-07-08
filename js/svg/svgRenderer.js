//----------------------------------
// SVG Renderer
//----------------------------------

let svgRoot = null;

//----------------------------------
// Initialize SVG
//----------------------------------

function initializeSVG() {

    svgRoot = document.getElementById("svgLayer");

    if (!svgRoot) {

        console.error("SVG layer not found.");

        return;

    }

    resizeSVG();

}

//----------------------------------
// Resize SVG
//----------------------------------

function resizeSVG() {

    if (!svgRoot) return;

    const canvas = document.getElementById("canvas");

    if (!canvas) return;

    svgRoot.setAttribute(
        "width",
        canvas.scrollWidth
    );

    svgRoot.setAttribute(
        "height",
        canvas.scrollHeight
    );

    svgRoot.setAttribute(
        "viewBox",
        `0 0 ${canvas.scrollWidth} ${canvas.scrollHeight}`
    );

}

//----------------------------------
// Clear SVG
//----------------------------------

function clearSVG() {

    if (!svgRoot) return;

    svgRoot.replaceChildren();

}

//----------------------------------
// Get SVG Root
//----------------------------------

function getSVGRoot() {

    return svgRoot;

}

//----------------------------------
// Expose
//----------------------------------

window.initializeSVG = initializeSVG;
window.resizeSVG = resizeSVG;
window.clearSVG = clearSVG;
window.getSVGRoot = getSVGRoot;