//----------------------------------
// Free-form Material Runs
//----------------------------------

let runsModalElement = null;

function runModalEscape(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}

function getEditableRuns() {

    const project = typeof getProjectState === "function"
        ? getProjectState()
        : null;

    if (!project) return [];

    if (!Array.isArray(project.runs)) {
        project.runs = [];
    }

    return project.runs;

}

function createRun() {

    const runs = getEditableRuns();

    const run = {
        id: crypto.randomUUID(),
        name: `Run ${runs.length + 1}`,
        length: 0,
        conduit: null,
        wire: null
    };

    runs.push(run);

    return run;

}

function findRun(runId) {

    return getEditableRuns().find(
        run => run.id === runId
    ) || null;

}

function normalizeRunNames() {

    getEditableRuns().forEach((run, index) => {
        run.name = `Run ${index + 1}`;
    });

}

function captureRunsHistory(label) {

    if (
        window.HistoryManagerV2 &&
        typeof window.HistoryManagerV2.capture === "function"
    ) {
        window.HistoryManagerV2.capture(label || "Runs updated");
    }

}

function refreshRunsBOM() {

    if (typeof renderBOM === "function") {
        renderBOM();
    }

}

function formatRunFeet(value) {

    const number = Number(value || 0);

    if (!Number.isFinite(number)) return "0";

    return Number.isInteger(number)
        ? String(number)
        : String(Number(number.toFixed(2)));

}

function getRunMaterialLabel(material, emptyLabel) {

    if (!material) return emptyLabel;

    const catalog = String(
        material.CatalogNumber || material.catalogNumber || ""
    ).trim();

    const description = String(material.Description || "").trim();

    return [catalog, description]
        .filter(Boolean)
        .join(" — ") || emptyLabel;

}

function ensureRunsModal() {

    if (runsModalElement) return runsModalElement;

    const overlay = document.createElement("div");

    overlay.id = "runsModal";
    overlay.className = "runs-modal";
    overlay.addEventListener("click", event => {
        if (event.target === overlay) {
            closeRunsModal();
        }
    });

    document.body.appendChild(overlay);

    runsModalElement = overlay;

    return overlay;

}

function renderRunsModal() {

    const overlay = ensureRunsModal();
    const runs = getEditableRuns();

    overlay.innerHTML = `
        <section class="runs-dialog" role="dialog" aria-modal="true" aria-labelledby="runsModalTitle">
            <header class="runs-header">
                <div>
                    <h2 id="runsModalTitle">Material Runs</h2>
                    <p>
                        Add free-form conduit and wire runs. Wire length automatically includes 2 ft at each end.
                    </p>
                </div>
                <button class="runs-close" type="button" aria-label="Close runs">&times;</button>
            </header>

            <div class="runs-grid-header" aria-hidden="true">
                <span>Run</span>
                <span>Conduit</span>
                <span>Wire</span>
                <span>Length</span>
                <span>Calculated BOM</span>
                <span></span>
            </div>

            <div class="runs-list">
                ${runs.length
                    ? runs.map((run, index) => {
                        const length = Math.max(0, Number(run.length || 0));
                        const conduitQty = run.conduit
                            ? `${formatRunFeet(length)} ft`
                            : "—";
                        const wireQty = run.wire
                            ? `${formatRunFeet(length + 4)} ft`
                            : "—";

                        return `
                            <article class="run-row" data-run-id="${runModalEscape(run.id)}">
                                <div class="run-name">Run ${index + 1}</div>
                                <button class="run-material-button" type="button" data-action="conduit" title="Select conduit">
                                    ${runModalEscape(getRunMaterialLabel(run.conduit, "Select conduit"))}
                                </button>
                                <button class="run-material-button" type="button" data-action="wire" title="Select wire using ampacity filters">
                                    ${runModalEscape(getRunMaterialLabel(run.wire, "Select wire"))}
                                </button>
                                <label class="run-length-field">
                                    <input
                                        class="run-length-input"
                                        type="number"
                                        min="0"
                                        step="0.1"
                                        inputmode="decimal"
                                        value="${runModalEscape(length)}"
                                        aria-label="Run ${index + 1} length in feet"
                                    >
                                    <span>ft</span>
                                </label>
                                <div class="run-calculated">
                                    <span>Conduit: <strong>${conduitQty}</strong></span>
                                    <span>Wire: <strong>${wireQty}</strong></span>
                                </div>
                                <button class="run-delete" type="button" title="Remove Run ${index + 1}" aria-label="Remove Run ${index + 1}">✕</button>
                            </article>
                        `;
                    }).join("")
                    : `
                        <div class="runs-empty">
                            No runs yet. Add a run to begin estimating conduit and wire.
                        </div>
                    `
                }
            </div>

            <footer class="runs-footer">
                <button id="addRunButton" class="runs-add" type="button">+ Add Run</button>
                <div class="runs-rule">Wire BOM = run length + 4 ft</div>
                <button id="doneRunsButton" class="runs-done" type="button">Done</button>
            </footer>
        </section>
    `;

    overlay.querySelector(".runs-close")?.addEventListener(
        "click",
        closeRunsModal
    );

    overlay.querySelector("#doneRunsButton")?.addEventListener(
        "click",
        closeRunsModal
    );

    overlay.querySelector("#addRunButton")?.addEventListener(
        "click",
        () => {
            createRun();
            captureRunsHistory("Run added");
            renderRunsModal();
        }
    );

    overlay.querySelectorAll(".run-row").forEach(row => {
        const runId = row.dataset.runId;

        row.querySelector("[data-action='conduit']")?.addEventListener(
            "click",
            () => openRunMaterialPicker(runId, "conduit")
        );

        row.querySelector("[data-action='wire']")?.addEventListener(
            "click",
            () => openRunMaterialPicker(runId, "wire")
        );

        row.querySelector(".run-length-input")?.addEventListener(
            "change",
            event => {
                const run = findRun(runId);
                if (!run) return;

                const value = Math.max(0, Number(event.target.value || 0));
                run.length = Number.isFinite(value) ? value : 0;

                captureRunsHistory("Run length updated");
                refreshRunsBOM();
                renderRunsModal();
            }
        );

        row.querySelector(".run-delete")?.addEventListener(
            "click",
            () => {
                const runs = getEditableRuns();
                const index = runs.findIndex(run => run.id === runId);

                if (index < 0) return;

                runs.splice(index, 1);
                normalizeRunNames();
                captureRunsHistory("Run removed");
                refreshRunsBOM();
                renderRunsModal();
            }
        );
    });

}

async function openRunMaterialPicker(runId, materialType) {

    const materials = typeof getMaterials === "function"
        ? await getMaterials()
        : [];

    const nodeType = materialType === "wire" ? "WIRE" : "PIPE";

    const source = (Array.isArray(materials) ? materials : [])
        .filter(item => String(item?.NodeType || "").toUpperCase() === nodeType);

    if (source.length === 0) {
        alert(`No ${materialType} materials are available.`);
        return;
    }

    const overlay = ensureRunsModal();
    overlay.style.display = "none";

    openPickerModal(
        materialType === "wire"
            ? "Select Wire"
            : "Select Conduit",
        source,
        item => {
            const run = findRun(runId);
            if (!run) return;

            run[materialType] = structuredClone(item);

            captureRunsHistory(
                materialType === "wire"
                    ? "Run wire selected"
                    : "Run conduit selected"
            );

            refreshRunsBOM();
        },
        {
            materialFilters: true,
            category: nodeType,
            onClose: () => {
                openRunsModal();
            }
        }
    );

}

function openRunsModal() {

    const overlay = ensureRunsModal();

    if (getEditableRuns().length === 0) {
        createRun();
    }

    renderRunsModal();
    overlay.style.display = "flex";

}

function closeRunsModal() {

    if (runsModalElement) {
        runsModalElement.style.display = "none";
    }

}

window.openRunsModal = openRunsModal;
window.closeRunsModal = closeRunsModal;
