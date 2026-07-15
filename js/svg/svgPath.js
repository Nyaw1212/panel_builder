//----------------------------------
// SVG Path
//----------------------------------

function drawSVGPath(link) {

    //----------------------------------
    // Geometry
    //----------------------------------

    const points = getLinkPoints(link);

    if (!points || points.length < 2) return;

    //----------------------------------
    // Build Path
    //----------------------------------

    let d = `M ${points[0].x} ${points[0].y}`;

    for (let i = 1; i < points.length; i++) {

        d += ` L ${points[i].x} ${points[i].y}`;

    }

    //----------------------------------
    // Invisible Hit Path
    //----------------------------------

    const hit = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "path"
    );

    hit.setAttribute("d", d);
    hit.setAttribute("fill", "none");
    hit.setAttribute("stroke", "transparent");
    hit.setAttribute("stroke-width", "20");

    hit.style.pointerEvents = "stroke";
    hit.style.cursor = "pointer";

    //----------------------------------
    // Visible Path
    //----------------------------------

    const path = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "path"
    );

    path.setAttribute("d", d);

    applySVGPathStyle(path);

    path.style.pointerEvents = "none";

    //----------------------------------
    // Hover Enter
    //----------------------------------

    hit.addEventListener("mouseenter", (e) => {

        path.setAttribute("stroke-width", "5");

        if (typeof showLinkHover === "function") {

            showLinkHover(
                link,
                e.clientX,
                e.clientY
            );

        }

    });

    //----------------------------------
    // Hover Move
    //----------------------------------

    hit.addEventListener("mousemove", (e) => {

        if (typeof moveLinkHover === "function") {

            moveLinkHover(
                e.clientX,
                e.clientY
            );

        }

    });

    //----------------------------------
    // Hover Leave
    //----------------------------------

    hit.addEventListener("mouseleave", () => {

        path.setAttribute("stroke-width", "4");

        setTimeout(() => {

            if (
                typeof isLinkHoverActive === "function" &&
                !isLinkHoverActive()
            ) {

                hideLinkHover();

            }

        }, 100);

    });

    //----------------------------------
    // Click
    //----------------------------------

    hit.addEventListener("click", (e) => {

        e.stopPropagation();

        console.log("LINK CLICK");

        selectLink(link);

        drawCanvas();

    });

    //----------------------------------
    // Build
    //----------------------------------

    svgLayer.appendChild(hit);
    svgLayer.appendChild(path);

}