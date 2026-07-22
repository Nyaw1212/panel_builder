//----------------------------------
// SVG Path
//----------------------------------

function drawSVGPath(link) {

    //----------------------------------
    // Geometry
    //----------------------------------

    const geometryPoints =
        getLinkPoints(link);

    if (
        !geometryPoints ||
        geometryPoints.length < 2
    ) return;

    //----------------------------------
    // Visual Endpoint Clearance
    //
    // Geometry remains attached to the
    // exact connector centers. Only the
    // rendered stroke is shortened so it
    // does not cover connector artwork.
    //----------------------------------

    const points =
        applyLinkEndpointClearance(
            geometryPoints,
            11
        );

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

    hit.dataset.linkId =
        String(link.id);

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

    path.dataset.linkId =
        String(link.id);

    //----------------------------------
    // Hover Enter
    //----------------------------------

    hit.addEventListener("mouseenter", (e) => {

        path.setAttribute("stroke-width", "5");

        if (typeof showLinkHover === "function") {

            showLinkHover(
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

        if (typeof hideLinkHover === "function") {

            hideLinkHover();

        }

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

//----------------------------------
// Visual Endpoint Clearance
//----------------------------------

function applyLinkEndpointClearance(
    points,
    clearance = 11
) {

    const output = points.map(
        point => ({
            x: Number(point.x),
            y: Number(point.y)
        })
    );

    if (
        output.length < 2 ||
        clearance <= 0
    ) {
        return output;
    }

    output[0] =
        movePointToward(
            output[0],
            output[1],
            clearance
        );

    const lastIndex =
        output.length - 1;

    output[lastIndex] =
        movePointToward(
            output[lastIndex],
            output[lastIndex - 1],
            clearance
        );

    return output;

}

//----------------------------------
// Move Point Toward Target
//----------------------------------

function movePointToward(
    point,
    target,
    distance
) {

    const dx =
        target.x -
        point.x;

    const dy =
        target.y -
        point.y;

    const length =
        Math.hypot(
            dx,
            dy
        );

    if (length <= 0) {
        return {
            ...point
        };
    }

    const safeDistance =
        Math.min(
            Number(distance) || 0,
            length * 0.45
        );

    return {

        x:
            point.x +
            (
                dx /
                length
            ) *
            safeDistance,

        y:
            point.y +
            (
                dy /
                length
            ) *
            safeDistance

    };

}

//----------------------------------
// Expose Endpoint Clearance
//----------------------------------

window.applyLinkEndpointClearance =
    applyLinkEndpointClearance;
