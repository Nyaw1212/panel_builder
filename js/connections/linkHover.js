//----------------------------------
// Link Hover
//----------------------------------

let linkHover = null;

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

        pointerEvents: "none"

    });

    document.body.appendChild(linkHover);

}

//----------------------------------
// Show
//----------------------------------

function showLinkHover(x, y) {

    initializeLinkHover();

    linkHover.innerHTML = "LINK";

    linkHover.style.left = `${x}px`;
    linkHover.style.top = `${y + 20}px`;

    linkHover.style.display = "block";

}

//----------------------------------
// Move
//----------------------------------

function moveLinkHover(x, y) {

    if (!linkHover) return;

    linkHover.style.left = `${x}px`;
    linkHover.style.top = `${y + 20}px`;

}

//----------------------------------
// Hide
//----------------------------------

function hideLinkHover() {

    if (!linkHover) return;

    linkHover.style.display = "none";

}

//----------------------------------
// Expose
//----------------------------------

window.showLinkHover = showLinkHover;
window.moveLinkHover = moveLinkHover;
window.hideLinkHover = hideLinkHover;