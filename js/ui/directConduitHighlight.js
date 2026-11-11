// ----------------------------------
// Direct conduit selected-state add-on
// ----------------------------------
//
// Kept independent from runsModal.js so older saved templates can be
// recognized without replacing the user's Runs implementation.

(function () {
    "use strict";

    const BUTTON_SELECTOR = "[data-action='quick-conduit']";
    const SELECTED_CLASS = "direct-conduit-addon-selected";
    let refreshQueued = false;

    function normalized(value) {
        return String(value || "").trim().toUpperCase();
    }

    function sizeFrom(material) {
        const explicit = normalized(material?.Size).replace(/\s+/g, "");
        if (explicit === '1"' || explicit === '2"') return explicit;

        const text = [
            material?.Description,
            material?.CatalogNumber,
            material?.catalogNumber,
            material?.PickerCardCode
        ].join(" ").toUpperCase();
        const inches = text.match(/(?:^|[^0-9])([12])\s*(?:"|IN\.?\b|INCH\b)/);
        if (inches) return `${inches[1]}"`;

        const shortCode = text.match(/(?:EMT|PVC|LT|L\/T)\s*([12])(?:$|[^0-9])/);
        return shortCode ? `${shortCode[1]}"` : "";
    }

    function typeFrom(material) {
        const color = normalized(material?.Color);
        const text = [
            material?.Description,
            material?.CatalogNumber,
            material?.catalogNumber,
            material?.PickerCardCode
        ].join(" ").toUpperCase();

        if (color === "EMT" || /\bEMT\b/.test(text)) return "EMT";
        if (color === "PVC" || /\bPVC\b/.test(text)) return "PVC";
        if (color === "LT" || color === "LQT" || /LIQUID|SEALTIGHT|\bL\/?T\b|\bLT[12]\b/.test(text)) return "LT";
        return "";
    }

    function catalogFrom(material) {
        return normalized(material?.CatalogNumber || material?.catalogNumber);
    }

    function getRun(runId) {
        const runs = typeof window.getProjectRuns === "function"
            ? window.getProjectRuns()
            : [];
        return (Array.isArray(runs) ? runs : []).find(run =>
            String(run?.id || "") === String(runId || "")
        ) || null;
    }

    function getCatalogMaterial(catalog) {
        const materials = typeof window.getMaterials === "function"
            ? window.getMaterials()
            : [];
        return (Array.isArray(materials) ? materials : []).find(item =>
            catalogFrom(item) === catalog
        ) || null;
    }

    function setSelectedAppearance(button, selected) {
        button.classList.toggle(SELECTED_CLASS, selected);
        button.classList.toggle("is-selected", selected);
        button.setAttribute("aria-pressed", String(selected));

        const small = button.querySelector("small");
        if (!small) return;

        if (!small.dataset.directConduitLabel) {
            small.dataset.directConduitLabel = small.textContent.trim();
        }
        const nextLabel = selected
            ? `✓ Selected · ${small.dataset.directConduitLabel.replace(/^✓\s*Selected\s*·\s*/, "")}`
            : small.dataset.directConduitLabel.replace(/^✓\s*Selected\s*·\s*/, "");
        if (small.textContent !== nextLabel) {
            small.textContent = nextLabel;
        }
    }

    function refreshRow(row) {
        const run = getRun(row?.dataset?.runId);
        const savedConduit = run?.conduit;
        if (!savedConduit) {
            row?.querySelectorAll(BUTTON_SELECTOR).forEach(button => {
                setSelectedAppearance(button, false);
            });
            return;
        }

        const savedCatalog = catalogFrom(savedConduit);
        const hydrated = getCatalogMaterial(savedCatalog);
        const selectedSource = hydrated || savedConduit;
        const selectedType = typeFrom(selectedSource);
        const selectedSize = sizeFrom(selectedSource);

        row.querySelectorAll(BUTTON_SELECTOR).forEach(button => {
            const buttonCatalog = normalized(button.dataset.conduitCatalog);
            const buttonMaterial = getCatalogMaterial(buttonCatalog);
            const matchesCatalog = Boolean(savedCatalog && buttonCatalog === savedCatalog);
            const matchesTypeAndSize = Boolean(
                selectedType && selectedSize && buttonMaterial &&
                typeFrom(buttonMaterial) === selectedType &&
                sizeFrom(buttonMaterial) === selectedSize
            );
            setSelectedAppearance(button, matchesCatalog || matchesTypeAndSize);
        });
    }

    function refreshAll() {
        document.querySelectorAll(".run-row[data-run-id]").forEach(refreshRow);
    }

    function queueRefresh() {
        if (refreshQueued) return;
        refreshQueued = true;
        requestAnimationFrame(() => {
            refreshQueued = false;
            refreshAll();
        });
    }

    function installStyle() {
        if (document.getElementById("directConduitHighlightAddonStyle")) return;
        const style = document.createElement("style");
        style.id = "directConduitHighlightAddonStyle";
        style.textContent = `
            .run-quick-conduit-choice.${SELECTED_CLASS}{
                border-color:#facc15!important;
                outline:2px solid rgba(250,204,21,.96)!important;
                outline-offset:-2px!important;
                background:linear-gradient(135deg,rgba(180,83,9,.88),rgba(2,132,199,.58))!important;
                box-shadow:inset 0 0 0 2px rgba(254,240,138,.94),0 0 16px rgba(250,204,21,.66)!important;
            }
            .run-quick-conduit-choice.${SELECTED_CLASS} small{color:#fef3c7!important;font-weight:800!important}
            .run-quick-conduit-choice.${SELECTED_CLASS} img{outline:1px solid #fef08a;box-shadow:0 0 8px rgba(254,240,138,.7)}
        `;
        document.head.appendChild(style);
    }

    function start() {
        installStyle();
        queueRefresh();

        document.addEventListener("click", event => {
            if (event.target.closest(BUTTON_SELECTOR)) {
                // The Runs click handler writes the conduit after its own
                // callback; schedule after that write and its render.
                window.setTimeout(queueRefresh, 0);
            }
        });

        new MutationObserver(queueRefresh).observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", start, { once: true });
    }
    else {
        start();
    }
})();
