//----------------------------------
// Link Node
//----------------------------------

const LINK_NODE_SIZE = 24;

// Link-node clipboard: copies assigned materials/wires between existing links.
let linkNodeClipboard = null;
let activeLinkNode = null;
function persistLinkNodeEdit() {
  if (typeof saveProject === "function") saveProject();
  if (typeof renderCanvas === "function") renderCanvas();
  else if (typeof render === "function") render();
}
document.addEventListener("keydown", event => {
  if (!activeLinkNode || event.target?.closest?.("input,textarea,[contenteditable='true']")) return;
  if (!(event.ctrlKey || event.metaKey) || event.altKey) return;
  const key = event.key.toLowerCase();
  if (key === "c") {
    linkNodeClipboard = structuredClone({
      materials: activeLinkNode.materials || [],
      assembly: activeLinkNode.assembly || [],
      startHardware: activeLinkNode.nodes?.start?.hardware || [],
      endHardware: activeLinkNode.nodes?.end?.hardware || [],
      startMaterials: activeLinkNode.nodes?.start?.materials || [],
      endMaterials: activeLinkNode.nodes?.end?.materials || []
    });
    event.preventDefault();
  } else if (key === "v" && linkNodeClipboard) {
    const data = structuredClone(linkNodeClipboard);
    activeLinkNode.materials = data.materials;
    activeLinkNode.assembly = data.assembly;
    if (activeLinkNode.nodes?.start) {
      activeLinkNode.nodes.start.hardware = data.startHardware;
      activeLinkNode.nodes.start.materials = data.startMaterials;
    }
    if (activeLinkNode.nodes?.end) {
      activeLinkNode.nodes.end.hardware = data.endHardware;
      activeLinkNode.nodes.end.materials = data.endMaterials;
    }
    event.preventDefault();
    persistLinkNodeEdit();
  }
});

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

  const hasMaterials =
    hasLinkNodeMaterials(link);

  square.setAttribute(
    "fill",
    hasMaterials
      ? "#dcfce7"
      : "#ffffff",
  );

  square.setAttribute(
    "stroke",
    hasMaterials
      ? "#22c55e"
      : "#2563eb",
  );

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

    if (typeof window.openCanvasLinkRunWirePicker === "function") {
      window.openCanvasLinkRunWirePicker(link);
    } else {
      alert("Material Runs wire selection is unavailable. Reload the app and try again.");
    }
  });

  // Visible, editable link label.
  const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
  label.setAttribute("x", position.x);
  label.setAttribute("y", position.y + 29);
  label.setAttribute("text-anchor", "middle");
  label.setAttribute("font-size", "12");
  label.setAttribute("font-weight", "600");
  label.setAttribute("fill", "#1d4ed8");
  label.style.cursor = "text";
  label.style.pointerEvents = "all";
  label.textContent = link.label || "Link";
  label.addEventListener("dblclick", event => {
    event.stopPropagation();
    const next = prompt("Connection label", link.label || "");
    if (next === null) return;
    link.label = next.trim().slice(0, 80);
    label.textContent = link.label || "Link";
    persistLinkNodeEdit();
  });
  hit.addEventListener("mousedown", () => { activeLinkNode = link; });
  label.addEventListener("mousedown", () => { activeLinkNode = link; });
  //----------------------------------
  // Build
  //----------------------------------

  group.appendChild(hit);
  group.appendChild(square);
  group.appendChild(label);

  group.appendChild(deleteButton);
  group.appendChild(x1);
  group.appendChild(x2);

  svgLayer.appendChild(group);
}

//----------------------------------
// Has Real Link Materials
//----------------------------------

function hasLinkNodeMaterials(link) {

  const candidates = [
    ...(link?.nodes?.start?.hardware || []),
    ...(link?.nodes?.end?.hardware || []),
    ...(link?.nodes?.start?.materials || []),
    ...(link?.nodes?.end?.materials || []),
    ...(link?.materials || []),
    ...(link?.assembly || []),
  ];

  return candidates.some(entry => {

    if (!entry) return false;

    const material =
      entry.material ||
      entry;

    return Boolean(
      material.CatalogNumber ||
      material.catalogNumber ||
      material.catalog ||
      material.Description ||
      material.description ||
      material.DriveFileID
    );

  });

}

//----------------------------------
// Expose
//----------------------------------

window.hasLinkNodeMaterials =
  hasLinkNodeMaterials;

window.getLinkNodePosition = getLinkNodePosition;
window.drawLinkNode = drawLinkNode;
