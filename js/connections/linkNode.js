//----------------------------------
// Link Node
//----------------------------------

const LINK_NODE_SIZE = 24;
const LINK_DELETE_RADIUS = 8;

//----------------------------------
// Get Position
//----------------------------------

function getLinkNodePosition(link) {

    const points = getLinkPoints(link);

    if (!points || points.length < 2) return null;

    //----------------------------------
    // Total Polyline Length
    //----------------------------------

    const segments = [];

    let totalLength = 0;

    for (
        let index = 0;
        index < points.length - 1;
        index++
    ) {

        const start =
            points[index];

        const end =
            points[index + 1];

        const length =
            Math.hypot(
                end.x - start.x,
                end.y - start.y
            );

        if (length <= 0) {
            continue;
        }

        segments.push({
            start,
            end,
            length
        });

        totalLength += length;

    }

    if (
        !segments.length ||
        totalLength <= 0
    ) {
        return null;
    }

    //----------------------------------
    // Halfway Along Entire Route
    //----------------------------------

    const midpoint =
        totalLength / 2;

    let travelled = 0;

    for (
        const segment of
        segments
    ) {

        if (
            travelled +
            segment.length >=
            midpoint
        ) {

            const remaining =
                midpoint -
                travelled;

            const ratio =
                remaining /
                segment.length;

            return {

                x:
                    segment.start.x +
                    (
                        segment.end.x -
                        segment.start.x
                    ) *
                    ratio,

                y:
                    segment.start.y +
                    (
                        segment.end.y -
                        segment.start.y
                    ) *
                    ratio

            };

        }

        travelled +=
            segment.length;

    }

    const last =
        points[
            points.length - 1
        ];

    return {
        x: last.x,
        y: last.y
    };

}

//----------------------------------
// Draw Node
//----------------------------------

function drawLinkNode(link) {
  const position = getLinkNodePosition(link);

  if (!position) return;

  const group = document.createElementNS("http://www.w3.org/2000/svg", "g");

  //----------------------------------
  // Hit Area
  //----------------------------------

  const hit = document.createElementNS("http://www.w3.org/2000/svg", "circle");

  hit.setAttribute("cx", position.x);
  hit.setAttribute("cy", position.y);
  hit.setAttribute("r", 40);

  hit.setAttribute("fill", "transparent");

  hit.style.pointerEvents = "all";
  hit.style.cursor = "pointer";

  //----------------------------------
  // Main Square
  //----------------------------------

  const square = document.createElementNS("http://www.w3.org/2000/svg", "rect");

  square.setAttribute("x", position.x - LINK_NODE_SIZE / 2);
  square.setAttribute("y", position.y - LINK_NODE_SIZE / 2);

  square.setAttribute("width", LINK_NODE_SIZE);
  square.setAttribute("height", LINK_NODE_SIZE);

  square.setAttribute("rx", 2);
  square.setAttribute("ry", 2);

  square.setAttribute("fill", "#ffffff");
  square.setAttribute("stroke", "#2563eb");
  square.setAttribute("stroke-width", "2");

  square.style.pointerEvents = "none";

  //----------------------------------
  // Delete Button
  //----------------------------------

  const deleteX = position.x + 20;
  const deleteY = position.y - 10;

  const deleteButton = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "circle",
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

  deleteButton.addEventListener("click", (e) => {
    e.stopPropagation();

    console.log("Delete Clicked");

    removeLink(link.id);
  });

  //----------------------------------
  // X Line 1
  //----------------------------------

  const x1 = document.createElementNS("http://www.w3.org/2000/svg", "line");

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

  const x2 = document.createElementNS("http://www.w3.org/2000/svg", "line");

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
    const hover = LINK_NODE_SIZE + 6;

    square.setAttribute("x", position.x - hover / 2);
    square.setAttribute("y", position.y - hover / 2);

    square.setAttribute("width", hover);
    square.setAttribute("height", hover);

    //----------------------------------
    // Reuse Connection Preview Cards
    //----------------------------------

    const preview =
      typeof getConnectionPreviewOverlay ===
        "function"
        ? getConnectionPreviewOverlay()
        : null;

    showConnectionPreview(
      preview,
      link.nodes?.start,
      null,
      square,
    );
  });

  hit.addEventListener("mouseleave", () => {
    square.setAttribute("x", position.x - LINK_NODE_SIZE / 2);
    square.setAttribute("y", position.y - LINK_NODE_SIZE / 2);

    square.setAttribute("width", LINK_NODE_SIZE);
    square.setAttribute("height", LINK_NODE_SIZE);

    hideConnectionPreview(
      typeof getConnectionPreviewOverlay ===
        "function"
        ? getConnectionPreviewOverlay()
        : null,
    );
  });

  //----------------------------------
  // Click
  //----------------------------------

  hit.addEventListener("click", async (e) => {
    e.stopPropagation();

    console.log("NODE CLICK");

    selectLink(link);

    await openMaterialModal(link.nodes.start);

    drawCanvas();
  });

  //----------------------------------
  // Build
  //----------------------------------

  group.appendChild(hit);
  group.appendChild(square);

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
