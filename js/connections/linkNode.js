//----------------------------------
// Link Node
//----------------------------------

const LINK_NODE_RADIUS = 12;
const LINK_DELETE_RADIUS = 8;

//----------------------------------
// Get Position
//----------------------------------

function getLinkNodePosition(link) {

    const points = getLinkPoints(link);

    if (points.length < 2) return null;

    const start = points[0];
    const end = points[1];

    //----------------------------------
    // Position on horizontal segment
    //----------------------------------

    const OFFSET = 80;

    return {

        x: start.x + Math.sign(end.x - start.x) *
            Math.min(
                OFFSET,
                Math.abs(end.x - start.x) / 2
            ),

        y: start.y

    };

}

//----------------------------------
// Draw Node
//----------------------------------

function drawLinkNode(link) {

    const position = getLinkNodePosition(link);

    if (!position) return;

    const group =
        document.createElementNS(
            "http://www.w3.org/2000/svg",
            "g"
        );

    //----------------------------------
    // Hit Area
    //----------------------------------

    const hit =
        document.createElementNS(
            "http://www.w3.org/2000/svg",
            "circle"
        );

    hit.setAttribute("cx", position.x);
    hit.setAttribute("cy", position.y);
    hit.setAttribute("r", 20);

    hit.setAttribute("fill", "transparent");

    hit.style.pointerEvents = "all";
    hit.style.cursor = "pointer";

    //----------------------------------
    // Main Circle
    //----------------------------------

    const circle =
        document.createElementNS(
            "http://www.w3.org/2000/svg",
            "circle"
        );

    circle.setAttribute("cx", position.x);
    circle.setAttribute("cy", position.y);
    circle.setAttribute("r", LINK_NODE_RADIUS);

    circle.setAttribute("fill", "#ffffff");
    circle.setAttribute("stroke", "#2563eb");
    circle.setAttribute("stroke-width", "2");

    circle.style.pointerEvents = "none";

    //----------------------------------
    // Delete Button
    //----------------------------------

    const deleteX = position.x + 20;
    const deleteY = position.y - 10;

    const deleteButton =
        document.createElementNS(
            "http://www.w3.org/2000/svg",
            "circle"
        );

    deleteButton.setAttribute("cx", deleteX);
    deleteButton.setAttribute("cy", deleteY);
    deleteButton.setAttribute("r", LINK_DELETE_RADIUS);

    deleteButton.setAttribute("fill", "#ef4444");
    deleteButton.setAttribute("stroke", "#ffffff");
    deleteButton.setAttribute("stroke-width", "2");

    deleteButton.style.pointerEvents = "all";
    deleteButton.style.cursor = "pointer";

    //----------------------------------
    // Delete Hover
    //----------------------------------

    deleteButton.addEventListener("mouseenter", () => {

        deleteButton.setAttribute("fill", "#dc2626");
        deleteButton.setAttribute("r", LINK_DELETE_RADIUS + 1);

    });

    deleteButton.addEventListener("mouseleave", () => {

        deleteButton.setAttribute("fill", "#ef4444");
        deleteButton.setAttribute("r", LINK_DELETE_RADIUS);

    });

    //----------------------------------
    // Delete Click
    //----------------------------------

    deleteButton.addEventListener("click", e => {

        e.stopPropagation();

        console.log("Delete Clicked");

        removeLink(link.id);

    });

    //----------------------------------
    // X Line 1
    //----------------------------------

    const x1 =
        document.createElementNS(
            "http://www.w3.org/2000/svg",
            "line"
        );

    x1.setAttribute("x1", deleteX - 3);
    x1.setAttribute("y1", deleteY - 3);
    x1.setAttribute("x2", deleteX + 3);
    x1.setAttribute("y2", deleteY + 3);

    x1.setAttribute("stroke", "#ffffff");
    x1.setAttribute("stroke-width", "2");
    x1.setAttribute("stroke-linecap", "round");

    x1.style.pointerEvents = "none";

    //----------------------------------
    // X Line 2
    //----------------------------------

    const x2 =
        document.createElementNS(
            "http://www.w3.org/2000/svg",
            "line"
        );

    x2.setAttribute("x1", deleteX + 3);
    x2.setAttribute("y1", deleteY - 3);
    x2.setAttribute("x2", deleteX - 3);
    x2.setAttribute("y2", deleteY + 3);

    x2.setAttribute("stroke", "#ffffff");
    x2.setAttribute("stroke-width", "2");
    x2.setAttribute("stroke-linecap", "round");

    x2.style.pointerEvents = "none";

    //----------------------------------
    // Hover
    //----------------------------------

    hit.addEventListener("mouseenter", () => {

        circle.setAttribute(
            "r",
            LINK_NODE_RADIUS + 3
        );

    });

    hit.addEventListener("mouseleave", () => {

        circle.setAttribute(
            "r",
            LINK_NODE_RADIUS
        );

    });

    //----------------------------------
    // Click
    //----------------------------------

    hit.addEventListener("click", async e => {

        e.stopPropagation();

        console.log("NODE CLICK");

        selectLink(link);

        // Reuse the existing Material Modal
        await openMaterialModal(link.nodes.start);

        drawCanvas();

    });

    //----------------------------------
    // Build
    //----------------------------------

    group.appendChild(hit);
    group.appendChild(circle);

    group.appendChild(deleteButton);
    group.appendChild(x1);
    group.appendChild(x2);

    svgLayer.appendChild(group);

}

//----------------------------------
// Expose
//----------------------------------

window.getLinkNodePosition = getLinkNodePosition;
window.drawLinkNode = drawLinkNode;