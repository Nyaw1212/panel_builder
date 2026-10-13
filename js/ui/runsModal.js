//----------------------------------
// Free-form Material Runs
//----------------------------------

let runsModalElement = null;
let expandedGutterId = null;

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

function promptRunLength(label) {

    const input = window.prompt(
        `Enter length for ${label} (ft)`,
        "0"
    );

    if (input === null) return null;

    const length = Math.max(0, Number(input || 0));

    if (!Number.isFinite(length)) {
        alert("Please enter a valid length in feet.");
        return null;
    }

    return length;

}

function createRun() {

    const runs = getEditableRuns();
    const name = `Run ${runs.length + 1}`;
    const length = promptRunLength(name);

    if (length === null) return null;

    const run = {
        id: crypto.randomUUID(),
        name,
        length,
        conduit: null,
        wires: []
    };

    runs.push(run);

    saveRunsDraft();

    return run;

}

function getEditableGutters() {

    const project = typeof getProjectState === "function"
        ? getProjectState()
        : null;

    if (!project) return [];

    if (!Array.isArray(project.gutters)) {
        project.gutters = [];
    }

    return project.gutters;

}

function createGutter() {

    const gutters = getEditableGutters();
    const name = `Gutter ${gutters.length + 1}`;
    const length = promptRunLength(name);

    if (length === null) return null;

    const gutter = {
        id: crypto.randomUUID(),
        name,
        length,
        excludedRunIds: []
    };

    gutters.push(gutter);
    saveRunsDraft();

    return gutter;

}

function findRun(runId) {

    return getEditableRuns().find(
        run => run.id === runId
    ) || null;

}

function findGutter(gutterId) {

    return getEditableGutters().find(
        gutter => gutter.id === gutterId
    ) || null;

}

function normalizeRunNames() {

    getEditableRuns().forEach((run, index) => {
        run.name = `Run ${index + 1}`;
    });

}

function normalizeGutterNames() {

    getEditableGutters().forEach((gutter, index) => {
        gutter.name = `Gutter ${index + 1}`;
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

    saveRunsDraft();

}

function saveRunsDraft() {

    if (typeof saveDraft === "function") {
        saveDraft();
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

function getRunWireLabel(wires) {

    const selection = Array.isArray(wires)
        ? wires
        : [];

    if (selection.length === 0) return "Select wire";

    const preset = String(
        selection[0]?.wirePreset || ""
    ).trim();

    const type = String(selection[0]?.Type || "").trim();
    const size = String(selection[0]?.Size || "").trim();

    if (preset) {
        return [preset, type, size]
            .filter(Boolean)
            .join(" — ") + ` (${selection.length} wires)`;
    }

    if (selection.length === 1) {
        return getRunMaterialLabel(selection[0], "Select wire");
    }

    return `${selection.length} wires selected`;

}

function getIncludedGutterRuns(gutter, runs) {

    const excluded = new Set(
        Array.isArray(gutter?.excludedRunIds)
            ? gutter.excludedRunIds.map(id => String(id))
            : []
    );

    return runs.filter(run =>
        !excluded.has(String(run?.id || ""))
    );

}

function getGutterRunSummary(gutter, runs) {

    const included = getIncludedGutterRuns(gutter, runs);

    if (runs.length === 0) return "No runs available";

    return `${included.length} of ${runs.length} runs included`;

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
    const gutters = getEditableGutters();

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
                        const wires = Array.isArray(run.wires)
                            ? run.wires
                            : (run.wire ? [run.wire] : []);
                        const wireQty = wires.length
                            ? `${formatRunFeet(length + 4)} ft`
                            : "—";

                        return `
                            <article class="run-row" data-run-id="${runModalEscape(run.id)}">
                                <div class="run-name">Run ${index + 1}</div>
                                <button class="run-material-button" type="button" data-action="conduit" title="Select conduit">
                                    ${runModalEscape(getRunMaterialLabel(run.conduit, "Select conduit"))}
                                </button>
                                <button class="run-material-button" type="button" data-action="wire" title="Select wire using ampacity filters">
                                    ${runModalEscape(getRunWireLabel(wires))}
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

            <section class="gutters-section" aria-labelledby="guttersTitle">
                <div class="runs-section-heading">
                    <div>
                        <h3 id="guttersTitle">Gutters</h3>
                        <p>Included run wires are added at the gutter length.</p>
                    </div>
                </div>

                <div class="gutters-grid-header" aria-hidden="true">
                    <span>Gutter</span>
                    <span>Included runs</span>
                    <span>Length</span>
                    <span>Calculated BOM</span>
                    <span></span>
                </div>

                <div class="gutters-list">
                    ${gutters.length
                        ? gutters.map((gutter, index) => {
                            const length = Math.max(0, Number(gutter.length || 0));
                            const includedRuns = getIncludedGutterRuns(gutter, runs);
                            const includedWireCount = includedRuns.reduce(
                                (total, run) => total + (
                                    Array.isArray(run?.wires)
                                        ? run.wires.length
                                        : (run?.wire ? 1 : 0)
                                ),
                                0
                            );
                            const isExpanded = expandedGutterId === gutter.id;
                            const excluded = new Set(
                                Array.isArray(gutter.excludedRunIds)
                                    ? gutter.excludedRunIds.map(id => String(id))
                                    : []
                            );

                            return `
                                <article class="gutter-entry" data-gutter-id="${runModalEscape(gutter.id)}">
                                    <div class="gutter-row">
                                        <div class="gutter-name">Gutter ${index + 1}</div>
                                        <button class="gutter-runs-button" type="button" data-action="toggle-gutter-runs">
                                            ${runModalEscape(getGutterRunSummary(gutter, runs))}
                                        </button>
                                        <label class="run-length-field">
                                            <input
                                                class="gutter-length-input"
                                                type="number"
                                                min="0"
                                                step="0.1"
                                                inputmode="decimal"
                                                value="${runModalEscape(length)}"
                                                aria-label="Gutter ${index + 1} length in feet"
                                            >
                                            <span>ft</span>
                                        </label>
                                        <div class="run-calculated">
                                            <span>Wires: <strong>${includedWireCount}</strong></span>
                                            <span>Each: <strong>${formatRunFeet(length)} ft</strong></span>
                                        </div>
                                        <button class="run-delete" type="button" data-action="delete-gutter" title="Remove Gutter ${index + 1}" aria-label="Remove Gutter ${index + 1}">✕</button>
                                    </div>
                                    ${isExpanded ? `
                                        <div class="gutter-run-picker">
                                            <div class="gutter-run-picker-title">Include wires from:</div>
                                            ${runs.length
                                                ? runs.map((run, runIndex) => `
                                                    <label class="gutter-run-choice">
                                                        <input
                                                            type="checkbox"
                                                            data-run-id="${runModalEscape(run.id)}"
                                                            ${excluded.has(String(run.id)) ? "" : "checked"}
                                                        >
                                                        <span>Run ${runIndex + 1}</span>
                                                        <small>${runModalEscape(getRunWireLabel(
                                                            Array.isArray(run.wires)
                                                                ? run.wires
                                                                : (run.wire ? [run.wire] : [])
                                                        ))}</small>
                                                    </label>
                                                `).join("")
                                                : `<div class="gutter-run-none">Add a Run first, then it will appear here.</div>`
                                            }
                                        </div>
                                    ` : ""}
                                </article>
                            `;
                        }).join("")
                        : `<div class="runs-empty">No gutters yet. Add one to route selected run wires through a shared gutter.</div>`
                    }
                </div>
            </section>

            <footer class="runs-footer">
                <button id="addRunButton" class="runs-add" type="button">+ Add Run</button>
                <button id="addGutterButton" class="runs-add" type="button">+ Add Gutter</button>
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
            const run = createRun();
            if (!run) return;

            captureRunsHistory("Run added");
            renderRunsModal();
        }
    );

    overlay.querySelector("#addGutterButton")?.addEventListener(
        "click",
        () => {
            const gutter = createGutter();
            if (!gutter) return;

            captureRunsHistory("Gutter added");
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
            "input",
            event => {
                const run = findRun(runId);
                if (!run) return;

                const value = Math.max(0, Number(event.target.value || 0));
                run.length = Number.isFinite(value) ? value : 0;

                // Preserve an in-progress value even if the page refreshes
                // before the field loses focus.
                saveRunsDraft();
            }
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

    overlay.querySelectorAll(".gutter-entry").forEach(entry => {
        const gutterId = entry.dataset.gutterId;

        entry.querySelector("[data-action='toggle-gutter-runs']")?.addEventListener(
            "click",
            () => {
                expandedGutterId = expandedGutterId === gutterId
                    ? null
                    : gutterId;
                renderRunsModal();
            }
        );

        entry.querySelector(".gutter-length-input")?.addEventListener(
            "input",
            event => {
                const gutter = findGutter(gutterId);
                if (!gutter) return;

                const value = Math.max(0, Number(event.target.value || 0));
                gutter.length = Number.isFinite(value) ? value : 0;
                saveRunsDraft();
            }
        );

        entry.querySelector(".gutter-length-input")?.addEventListener(
            "change",
            event => {
                const gutter = findGutter(gutterId);
                if (!gutter) return;

                const value = Math.max(0, Number(event.target.value || 0));
                gutter.length = Number.isFinite(value) ? value : 0;

                captureRunsHistory("Gutter length updated");
                refreshRunsBOM();
                renderRunsModal();
            }
        );

        entry.querySelectorAll(".gutter-run-choice input").forEach(input => {
            input.addEventListener("change", event => {
                const gutter = findGutter(gutterId);
                if (!gutter) return;

                const runId = String(event.target.dataset.runId || "");
                const excluded = new Set(
                    Array.isArray(gutter.excludedRunIds)
                        ? gutter.excludedRunIds.map(id => String(id))
                        : []
                );

                if (event.target.checked) {
                    excluded.delete(runId);
                }
                else {
                    excluded.add(runId);
                }

                gutter.excludedRunIds = [...excluded];
                captureRunsHistory("Gutter run selection updated");
                refreshRunsBOM();
                renderRunsModal();
            });
        });

        entry.querySelector("[data-action='delete-gutter']")?.addEventListener(
            "click",
            () => {
                const gutters = getEditableGutters();
                const index = gutters.findIndex(gutter => gutter.id === gutterId);

                if (index < 0) return;

                gutters.splice(index, 1);
                normalizeGutterNames();
                if (expandedGutterId === gutterId) {
                    expandedGutterId = null;
                }

                captureRunsHistory("Gutter removed");
                refreshRunsBOM();
                renderRunsModal();
            }
        );
    });

}

async function openRunMaterialPicker(runId, materialType) {

    if (materialType === "wire") {
        openRunWireModal(runId);
        return;
    }

    const materials = typeof getMaterials === "function"
        ? await getMaterials()
        : [];

    const nodeType = "PIPE";

    const source = (Array.isArray(materials) ? materials : [])
        .filter(item => String(item?.NodeType || "").toUpperCase() === nodeType);

    if (source.length === 0) {
        alert(`No ${materialType} materials are available.`);
        return;
    }

    const overlay = ensureRunsModal();
    overlay.style.display = "none";

    openPickerModal(
        "Select Conduit",
        source,
        item => {
            const run = findRun(runId);
            if (!run) return;

            run[materialType] = structuredClone(item);

            captureRunsHistory(
                "Run conduit selected"
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

function isPieceWireMaterial(material) {

    const nodeType = String(material?.NodeType || "")
        .trim()
        .toUpperCase();

    const description = String(material?.Description || "")
        .trim()
        .toUpperCase();

    return nodeType === "WIRE" && /\bPCS\b/.test(description);

}

async function openRunWireModal(runId) {

    const run = findRun(runId);

    if (!run) return;

    const materials = typeof getMaterials === "function"
        ? await getMaterials()
        : [];

    const pieceWires = (Array.isArray(materials) ? materials : [])
        .filter(isPieceWireMaterial);

    if (pieceWires.length === 0) {
        alert("No PCS wire materials are available.");
        return;
    }

    const draftConnection = {
        hardware: structuredClone(
            Array.isArray(run.wires)
                ? run.wires
                : (run.wire ? [run.wire] : [])
        ),
        runWirePicker: true
    };

    const overlay = ensureRunsModal();
    overlay.style.display = "none";

    openMaterialModal(draftConnection, {
        category: "WIRE",
        source: pieceWires,
        onClose: () => {
            const currentRun = findRun(runId);

            if (currentRun) {
                currentRun.wires = structuredClone(
                    draftConnection.hardware
                );
                delete currentRun.wire;

                captureRunsHistory("Run wire selection updated");
                refreshRunsBOM();
            }

            openRunsModal();
        }
    });

}

function openRunsModal() {

    const overlay = ensureRunsModal();

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
