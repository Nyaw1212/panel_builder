//----------------------------------
// Free-form Material Runs
//----------------------------------

let runsModalElement = null;
let expandedGutterId = null;
let fittingModalElement = null;
let activeFittingRunId = null;

const FITTING_MATRIX_COLUMNS = [
    { key: "DIECAST", label: "Diecast", pattern: /DIE\s*CAST/ },
    { key: "SRT", label: "SRT", pattern: /\bSRT\b|STEEL.*RAIN\s*TIGHT|STL.*RAIN\s*TIGHT/ },
    { key: "RT", label: "RT", pattern: /\bRT\b|RAIN\s*TIGHT|CONCRETE\s*TIGHT/ },
    { key: "EMT", label: "EMT", pattern: /\bEMT\b/ },
    { key: "PVC", label: "PVC", pattern: /\bPVC\b|SCH\s*\d+/ },
    { key: "LQT", label: "LQT", pattern: /SEALTIGHT|LIQUID|\bL\/?T\b/ }
];

const FITTING_MATRIX_ROWS = [
    { key: "HUB", label: "Commercial hub", match: (node, desc) => node === "HUB" && /COMMERCIAL|MYERS|HUB/.test(desc) },
    { key: "CONNECTOR", label: "Connector", match: node => node === "CONNECTOR" },
    { key: "COUPLING", label: "Coupling", match: node => node === "COUPLING" },
    { key: "ELBOW", label: "Elbow 90", match: (node, desc) => node === "ELBOW" && /90/.test(desc) },
    { key: "OFFSET", label: "Offset", match: (node, desc) => node === "NIPPLE" && /OFFSET/.test(desc) },
    { key: "NIPPLE", label: "Nipple", match: (node, desc) => node === "NIPPLE" && !/OFFSET/.test(desc) },
    { key: "ADAPTER", label: "Adapter", match: node => node === "ADAPTER" },
    { key: "LB", label: "LB", match: node => node === "LB" },
    { key: "LR", label: "LR", match: node => node === "LR" },
    { key: "LF", label: "LF", match: (node, desc) => node === "LF" || /\bLF\b/.test(desc) },
    { key: "GROUND_BUSHING", label: "Ground bushing", match: (node, desc) => node === "GROUND BUSHING" || /GROUNDING BUSHING/.test(desc) },
    { key: "SEALING_LOCKNUT", label: "Sealing locknut", match: (node, desc) => node === "LOCKNUT" && /SEALING/.test(desc) },
    { key: "PLASTIC_LOCKNUT", label: "Plastic locknut", match: (node, desc) => node === "LOCKNUT" && /PLASTIC/.test(desc) },
    { key: "GROUND_ROD", label: "Ground rod", match: (node, desc) => node === "GROUND ROD" || /GROUND ROD/.test(desc) },
    { key: "GROUND_CLAMP", label: "Ground clamp", match: (node, desc) => /GROUND CLAMP/.test(desc) }
];

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
        wires: [],
        fittings: []
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

function getRunFittings(run) {

    if (!Array.isArray(run?.fittings)) {
        run.fittings = [];
    }

    return run.fittings;

}

function getRunFittingsSummary(run) {

    const fittings = getRunFittings(run);
    const quantity = fittings.reduce(
        (total, fitting) => total + Number(fitting?.qty || 0),
        0
    );

    return quantity
        ? `${fittings.length} fitting types (${quantity} qty)`
        : "Select fittings";

}

function normalizeFittingValue(value) {

    return String(value || "")
        .trim()
        .toUpperCase();

}

function isSameFittingSize(material, size) {

    if (!size) return true;

    const materialSize = normalizeFittingValue(material?.Size)
        .replace(/\s+/g, "");
    const selectedSize = normalizeFittingValue(size)
        .replace(/\s+/g, "");

    return !materialSize || materialSize === selectedSize;

}

function getFittingColumn(material) {

    const searchableText = [
        material?.CatalogNumber,
        material?.Description,
        material?.Color
    ].map(normalizeFittingValue).join(" ");

    return FITTING_MATRIX_COLUMNS.find(column =>
        column.pattern.test(searchableText)
    ) || null;

}

function getFittingCandidates(materials, run, row, column) {

    const selectedSize = run?.conduit?.Size || "";

    return (Array.isArray(materials) ? materials : [])
        .filter(item => !item?.Placeable)
        .filter(item => {
            const node = normalizeFittingValue(item?.NodeType);
            const description = normalizeFittingValue(item?.Description);

            return row.match(node, description);
        })
        .filter(item => isSameFittingSize(item, selectedSize))
        .filter(item => {
            const itemColumn = getFittingColumn(item);

            // Rigid/neutral fittings and grounding parts are listed under
            // EMT when the catalog does not label a conduit system.
            if (!itemColumn && column.key === "EMT") {
                return [
                    "HUB",
                    "LB",
                    "LR",
                    "LF",
                    "NIPPLE",
                    "GROUND_BUSHING",
                    "SEALING_LOCKNUT",
                    "PLASTIC_LOCKNUT",
                    "GROUND_ROD",
                    "GROUND_CLAMP"
                ].includes(row.key);
            }

            return itemColumn?.key === column.key;
        })
        .sort((a, b) => {
            const favorite = Number(b.Favorite || 0) - Number(a.Favorite || 0);
            if (favorite) return favorite;

            return String(a.CatalogNumber || "").localeCompare(
                String(b.CatalogNumber || "")
            );
        });

}

function getFittingQuantity(run, material) {

    const catalog = String(material?.CatalogNumber || "");

    return getRunFittings(run).find(fitting =>
        String(fitting?.CatalogNumber || "") === catalog
    )?.qty || 0;

}

function addRunFitting(run, material) {

    const fittings = getRunFittings(run);
    const catalog = String(material?.CatalogNumber || "");
    const existing = fittings.find(fitting =>
        String(fitting?.CatalogNumber || "") === catalog
    );

    if (existing) {
        existing.qty = Number(existing.qty || 0) + 1;
    }
    else {
        fittings.push({
            ...structuredClone(material),
            qty: 1
        });
    }

}

function removeRunFitting(run, material) {

    const fittings = getRunFittings(run);
    const catalog = String(material?.CatalogNumber || "");
    const index = fittings.findIndex(fitting =>
        String(fitting?.CatalogNumber || "") === catalog
    );

    if (index < 0) return;

    const fitting = fittings[index];
    fitting.qty = Number(fitting.qty || 0) - 1;

    if (fitting.qty <= 0) {
        fittings.splice(index, 1);
    }

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
                <span>Fittings</span>
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
                                <button class="run-material-button" type="button" data-action="fittings" title="Select run fittings">
                                    ${runModalEscape(getRunFittingsSummary(run))}
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

        row.querySelector("[data-action='fittings']")?.addEventListener(
            "click",
            () => openRunFittingModal(runId)
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

    const materials = typeof getMaterials === "function"
        ? await getMaterials()
        : [];

    if (materialType === "wire") {
        openRunWireModal(runId);
        return;
    }

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

function openRunWireModal(runId) {

    const run = findRun(runId);

    if (!run) return;

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

function ensureFittingModal() {

    if (fittingModalElement) return fittingModalElement;

    const overlay = document.createElement("div");

    overlay.id = "runFittingModal";
    overlay.className = "run-fitting-modal";
    overlay.addEventListener("click", event => {
        if (event.target === overlay) closeRunFittingModal();
    });

    document.body.appendChild(overlay);
    fittingModalElement = overlay;

    return overlay;

}

function getFittingImage(material) {

    const driveId = String(material?.DriveFileID || "").trim();

    if (driveId) {
        return `https://drive.google.com/thumbnail?id=${encodeURIComponent(driveId)}&sz=w200`;
    }

    return `images/materials/${encodeURIComponent(
        String(material?.CatalogNumber || "")
    )}.png`;

}

async function openRunFittingModal(runId) {

    const run = findRun(runId);

    if (!run) return;

    if (!run.conduit?.Size) {
        alert("Select the conduit first so fittings can be filtered by size.");
        return;
    }

    activeFittingRunId = runId;

    const materials = typeof getMaterials === "function"
        ? await getMaterials()
        : [];

    renderRunFittingModal(run, materials);

}

function renderRunFittingModal(run, materials) {

    const overlay = ensureFittingModal();
    const catalogLookup = new Map();
    const selectedFittings = getRunFittings(run)
        .filter(fitting => Number(fitting?.qty || 0) > 0)
        .sort((a, b) => String(a?.CatalogNumber || "").localeCompare(
            String(b?.CatalogNumber || "")
        ));

    const fittingSummary = selectedFittings.length
        ? selectedFittings.map(fitting => {
            const catalog = String(fitting?.CatalogNumber || "");
            const description = String(fitting?.Description || catalog);

            return `
                <article class="fitting-summary-item">
                    <div class="fitting-summary-image-wrap">
                        <img class="fitting-summary-image" src="${runModalEscape(getFittingImage(fitting))}" alt="${runModalEscape(description)}">
                        <span class="fitting-summary-fallback">${runModalEscape(catalog)}</span>
                    </div>
                    <div class="fitting-summary-details">
                        <strong>${runModalEscape(catalog)}</strong>
                        <small title="${runModalEscape(description)}">${runModalEscape(description)}</small>
                    </div>
                    <b class="fitting-summary-qty">${Number(fitting.qty || 0)}</b>
                </article>
            `;
        }).join("")
        : `<p class="fitting-summary-empty">Click a fitting image to add it here.</p>`;

    // Put conduit systems on the vertical axis and fitting types across the
    // horizontal axis. This gives each square material tile more room.
    const rows = FITTING_MATRIX_COLUMNS.map(column => {
        const cells = FITTING_MATRIX_ROWS.map(row => {
            const material = getFittingCandidates(materials, run, row, column)[0] || null;

            if (!material) return `<td class="fitting-matrix-empty">—</td>`;

            const catalog = String(material.CatalogNumber || "");
            const quantity = getFittingQuantity(run, material);
            catalogLookup.set(catalog, material);

            return `
                <td>
                    <div class="fitting-matrix-cell ${quantity ? "has-quantity" : ""}">
                        <button type="button" class="fitting-image-button" data-catalog="${runModalEscape(catalog)}" title="Add 1 × ${runModalEscape(material.Description || catalog)}">
                            <img src="${runModalEscape(getFittingImage(material))}" alt="${runModalEscape(material.Description || catalog)}">
                            <span class="fitting-image-fallback">${runModalEscape(catalog)}</span>
                        </button>
                        <div class="fitting-cell-footer">
                            <small title="${runModalEscape(material.Description || catalog)}">${runModalEscape(catalog)}</small>
                            <span class="fitting-quantity">${quantity}</span>
                            <button type="button" class="fitting-remove-button" data-catalog="${runModalEscape(catalog)}" ${quantity ? "" : "disabled"} title="Remove 1">−</button>
                        </div>
                    </div>
                </td>
            `;
        }).join("");

        return `<tr><th scope="row">${runModalEscape(column.label)}</th>${cells}</tr>`;
    }).join("");

    overlay.innerHTML = `
        <section class="run-fitting-dialog" role="dialog" aria-modal="true" aria-labelledby="runFittingTitle">
            <header class="run-fitting-header">
                <div>
                    <h2 id="runFittingTitle">${runModalEscape(run.name || "Run")} Fittings</h2>
                    <p>Conduit size: <strong>${runModalEscape(run.conduit.Size)}</strong>. Click an image to add one fitting.</p>
                </div>
                <button class="run-fitting-close" type="button" aria-label="Close fittings">&times;</button>
            </header>
            <div class="run-fitting-content">
                <div class="run-fitting-table-wrap">
                    <table class="run-fitting-table">
                        <thead><tr><th>System</th>${FITTING_MATRIX_ROWS.map(row => `<th>${runModalEscape(row.label)}</th>`).join("")}</tr></thead>
                        <tbody>${rows}</tbody>
                    </table>
                </div>
                <aside class="fitting-summary" aria-label="Selected fitting summary">
                    <header><h3>Material summary</h3><span>${selectedFittings.length} item${selectedFittings.length === 1 ? "" : "s"}</span></header>
                    <div class="fitting-summary-list">${fittingSummary}</div>
                </aside>
            </div>
            <footer class="run-fitting-footer">
                <span>${runModalEscape(getRunFittingsSummary(run))}</span>
                <button class="runs-done fitting-done" type="button">Done</button>
            </footer>
        </section>
    `;

    overlay.querySelector(".run-fitting-close")?.addEventListener("click", closeRunFittingModal);
    overlay.querySelector(".fitting-done")?.addEventListener("click", closeRunFittingModal);

    overlay.querySelectorAll(".fitting-image-button img").forEach(image => {
        image.addEventListener("error", () => {
            image.style.display = "none";
            const fallback = image.nextElementSibling;
            if (fallback) fallback.style.display = "block";
        });
    });

    overlay.querySelectorAll(".fitting-summary-image").forEach(image => {
        image.addEventListener("error", () => {
            image.style.display = "none";
            const fallback = image.nextElementSibling;
            if (fallback) fallback.style.display = "grid";
        });
    });

    overlay.querySelectorAll(".fitting-image-button").forEach(button => {
        button.addEventListener("click", () => {
            const material = catalogLookup.get(button.dataset.catalog || "");
            if (!material) return;

            addRunFitting(run, material);
            captureRunsHistory("Run fitting added");
            refreshRunsBOM();
            renderRunFittingModal(run, materials);
        });
    });

    overlay.querySelectorAll(".fitting-remove-button").forEach(button => {
        button.addEventListener("click", () => {
            const material = catalogLookup.get(button.dataset.catalog || "");
            if (!material) return;

            removeRunFitting(run, material);
            captureRunsHistory("Run fitting removed");
            refreshRunsBOM();
            renderRunFittingModal(run, materials);
        });
    });

    overlay.style.display = "flex";

}

function closeRunFittingModal() {

    if (fittingModalElement) fittingModalElement.style.display = "none";

    activeFittingRunId = null;
    renderRunsModal();

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
