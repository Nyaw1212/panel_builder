//----------------------------------
// Link Hover
//----------------------------------

let linkHover = null;
let pendingHoverFrame = null;
let pendingHoverPosition = null;

function placeLinkHover(x, y) {
    if (!linkHover) return;
    // Transform avoids a layout pass for every pointer movement.
    linkHover.style.transform = `translate3d(${x}px, ${y + 20}px, 0)`;
}

//----------------------------------
// Initialize
//----------------------------------

function initializeLinkHover() {

    if (linkHover) return;

    linkHover = document.createElement("div");

    linkHover.id = "linkHover";

    Object.assign(linkHover.style, {

        position: "fixed",

        display: "none",

        background: "#fff",

        border: "1px solid #d1d5db",

        borderRadius: "8px",

        padding: "12px",

        boxShadow: "0 8px 20px rgba(0,0,0,.15)",

        zIndex: "99999",

        pointerEvents: "none",

        willChange: "transform"

    });

    document.body.appendChild(linkHover);

}

//----------------------------------
// Show
//----------------------------------

function showLinkHover(x, y) {

    initializeLinkHover();

    linkHover.textContent = "LINK";

    placeLinkHover(x, y);

    linkHover.style.display = "block";

}

//----------------------------------
// Move
//----------------------------------

function moveLinkHover(x, y) {

    if (!linkHover) return;

    // Browsers can emit many mousemove events inside a single frame. Coalesce
    // them into one visual update so hovering across a busy canvas stays smooth.
    pendingHoverPosition = { x, y };
    if (pendingHoverFrame !== null) return;

    pendingHoverFrame = requestAnimationFrame(() => {
        pendingHoverFrame = null;
        if (!pendingHoverPosition) return;
        placeLinkHover(pendingHoverPosition.x, pendingHoverPosition.y);
        pendingHoverPosition = null;
    });

}

//----------------------------------
// Hide
//----------------------------------

function hideLinkHover() {

    if (!linkHover) return;

    if (pendingHoverFrame !== null) {
        cancelAnimationFrame(pendingHoverFrame);
        pendingHoverFrame = null;
    }
    pendingHoverPosition = null;

    linkHover.style.display = "none";

}

//----------------------------------
// Expose
//----------------------------------

window.showLinkHover = showLinkHover;
window.moveLinkHover = moveLinkHover;
window.hideLinkHover = hideLinkHover;
