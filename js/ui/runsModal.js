//----------------------------------
// Free-form Material Runs
//----------------------------------

let runsModalElement = null;
let runMaterialsModalElement = null;
let expandedGutterId = null;
let fittingModalElement = null;
let activeFittingTarget = null;
let fittingQuantityMode = false;
let runWireClipboard = null;
let runCircuitModalElement = null;
let runWireAssignmentModalElement = null;
let runWireConditionModalElement = null;
let runCanvasLinkModalElement = null;
let runsModalScrollTop = 0;
let runMaterialsModalScrollTop = 0;
let fittingReturnModal = "runs";

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

// Project defaults for automatic wire sizing. WireAss controls colors and
// per-run/per-breaker behavior; this map applies the company-standard
// conductor choice for each breaker/disconnect rating band.
const BREAKER_WIRE_SIZE_RULES = [
    [15, "#14"], [20, "#12"], [30, "#10"], [60, "#8"],
    [70, "#6"], [85, "#4"], [100, "#3"], [125, "#2"],
    [150, "#1"], [175, "1/0"], [200, "2/0"], [225, "3/0"],
    [260, "4/0"]
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
        fromCanvasItemId: "",
        toCanvasItemId: "",
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

function getGutterFittings(gutter) {

    if (!Array.isArray(gutter?.fittings)) {
        gutter.fittings = [];
    }

    return gutter.fittings;

}

function getGutterFittingSizeOptions(gutter, runs) {

    const options = new Map();
    const excluded = new Set(
        Array.isArray(gutter?.excludedRunIds)
            ? gutter.excludedRunIds.map(id => String(id))
            : []
    );

    (Array.isArray(runs) ? runs : []).forEach((run, index) => {
        if (excluded.has(String(run?.id || ""))) return;

        const size = String(run?.conduit?.Size || "").trim();
        if (!size) return;

        if (!options.has(size)) {
            options.set(size, []);
        }

        options.get(size).push(run?.name || `Run ${index + 1}`);
    });

    return [...options.entries()].map(([size, sourceRuns]) => ({
        size,
        sourceRuns
    }));

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
        canvasItemId: "",
        excludedRunIds: [],
        fittings: []
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

function getDuplicateRunName(run, runs) {

    const base = String(run?.name || "Run").trim();
    const names = new Set((runs || []).map(item => String(item?.name || "").trim()));
    let suffix = 2;
    let candidate = `${base} copy`;

    while (names.has(candidate)) {
        candidate = `${base} copy ${suffix}`;
        suffix += 1;
    }

    return candidate;

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
        if (!String(gutter.name || "").trim()) {
            gutter.name = `Gutter ${index + 1}`;
        }
    });

}

function getCanvasTagOptions() {

    const layout = typeof getLayout === "function" ? getLayout() : [];
    const seen = new Set();
    const counts = new Map();

    return (Array.isArray(layout) ? layout : []).reduce((options, item) => {
        if (!item?.id || seen.has(item.id)) return options;
        seen.add(item.id);

        // A placed preset already has a short, project-friendly identifier
        // (GEN, D60, F60, etc.). Use it in connection pickers instead of
        // making the user identify equipment from long catalog numbers.
        const code = String(
            item?.preset ||
            item?.data?.CatalogNumber ||
            item?.data?.Description ||
            "Canvas item"
        ).trim();
        const number = (counts.get(code) || 0) + 1;
        counts.set(code, number);
        const detail = [item?.data?.Size, item?.data?.Type].filter(Boolean).join(" ");

        options.push({
            id: String(item.id),
            label: `${code}${number > 1 ? ` #${number}` : ""}${detail ? ` — ${detail}` : ""}`
        });
        return options;
    }, []);

}

function getCanvasTagLabel(itemId, options) {

    return (options || getCanvasTagOptions())
        .find(option => option.id === String(itemId || ""))
        ?.label || "";

}

function getRunCanvasComponentImage(item) {

    if (!item?.data) return "";

    const driveId = String(item.data.DriveFileID || "").trim();

    if (driveId && typeof getDriveImageUrl === "function") {
        return getDriveImageUrl(driveId, 100);
    }

    const catalogNumber = String(item.data.CatalogNumber || "").trim();

    return catalogNumber
        ? `images/materials/${encodeURIComponent(catalogNumber)}.png`
        : "";

}

function renderRunCanvasComponentPreview(itemId, endpointLabel) {

    const item = getCanvasItem(itemId);

    if (!item) {
        return `
            <div class="run-canvas-component-preview is-empty">
                <span>${runModalEscape(endpointLabel)}</span>
                <small>Choose component</small>
            </div>
        `;
    }

    const image = getRunCanvasComponentImage(item);
    const label = String(
        item.preset ||
        item.data?.CatalogNumber ||
        item.data?.Description ||
        "Canvas item"
    ).trim();

    return `
        <div class="run-canvas-component-preview">
            <span>${runModalEscape(endpointLabel)}</span>
            ${image ? `
                <img src="${runModalEscape(image)}" alt="" onerror="this.style.display='none'">
            ` : ""}
            <small>${runModalEscape(label)}</small>
        </div>
    `;

}

function getRunCanvasLinks() {
    const options = getCanvasTagOptions();

    return (typeof getLinks === "function" ? getLinks() : [])
        .map(link => {
            const fromCanvasItemId = String(link?.start?.panelId || "");
            const toCanvasItemId = String(link?.end?.panelId || "");
            const fromLabel = getCanvasTagLabel(fromCanvasItemId, options);
            const toLabel = getCanvasTagLabel(toCanvasItemId, options);

            return {
                id: String(link?.id || ""),
                fromCanvasItemId,
                toCanvasItemId,
                label: [fromLabel, toLabel].filter(Boolean).join(" → ")
            };
        })
        .filter(link => link.id && link.fromCanvasItemId && link.toCanvasItemId && link.label);
}

function createRunFromCanvasLink(link) {
    const existing = getEditableRuns().find(run =>
        String(run?.canvasLinkId || "") === String(link?.id || "")
    );
    if (existing) return null;

    const length = promptRunLength(link.label);
    if (length === null) return null;

    const run = {
        id: crypto.randomUUID(),
        name: link.label,
        canvasLinkId: link.id,
        length,
        fromCanvasItemId: link.fromCanvasItemId,
        toCanvasItemId: link.toCanvasItemId,
        conduit: null,
        wires: [],
        fittings: []
    };

    const circuits = getRunPanelCircuits(run);
    run.panelBreakerSources = circuits.map(createRunCircuitSource);
    run.panelBreakerSourcesConfigured = true;
    run.panelBreakerExcludedSourceKeys = [];
    autoAssignRunWires(run);

    getEditableRuns().push(run);
    return run;
}

function autoCreateRunFromCanvasLink(canvasLink) {
    const link = getRunCanvasLinks().find(item =>
        item.id === String(canvasLink?.id || "")
    );
    if (!link) return null;

    const run = createRunFromCanvasLink(link);
    if (!run) return null;

    captureRunsHistory("Run created from canvas link");
    refreshRunsBOM();
    return run;
}

function ensureRunCanvasLinkModal() {
    if (runCanvasLinkModalElement) return runCanvasLinkModalElement;

    const overlay = document.createElement("div");
    overlay.className = "run-circuit-modal";
    overlay.addEventListener("click", event => {
        if (event.target === overlay) overlay.style.display = "none";
    });
    document.body.appendChild(overlay);
    runCanvasLinkModalElement = overlay;
    return overlay;
}

function openRunFromCanvasLinkModal() {
    const links = getRunCanvasLinks();
    if (!links.length) {
        alert("Create a visual canvas link first, then it will appear here.");
        return;
    }

    const overlay = ensureRunCanvasLinkModal();
    overlay.innerHTML = `
        <section class="run-circuit-dialog run-wire-assignment-dialog" role="dialog" aria-modal="true" aria-labelledby="runCanvasLinkTitle">
            <header>
                <div>
                    <h2 id="runCanvasLinkTitle">Create Run from Canvas Link</h2>
                    <p>Choose a visual canvas link. It maps the run endpoints, selects the panel breakers, and applies automatic wiring.</p>
                </div>
                <button type="button" class="run-circuit-close" aria-label="Close">&times;</button>
            </header>
            <div class="run-circuit-list">
                ${links.map(link => `
                    <div class="run-wire-assignment-row">
                        <span><strong>${runModalEscape(link.label)}</strong><small>Canvas link</small></span>
                        <button type="button" data-canvas-link-id="${runModalEscape(link.id)}">Create run</button>
                    </div>`).join("")}
            </div>
            <footer><button type="button" class="run-circuit-close">Cancel</button></footer>
        </section>`;

    const close = () => { overlay.style.display = "none"; };
    overlay.querySelectorAll(".run-circuit-close").forEach(button => button.addEventListener("click", close));
    overlay.querySelectorAll("[data-canvas-link-id]").forEach(button => button.addEventListener("click", () => {
        const link = links.find(item => item.id === button.dataset.canvasLinkId);
        if (!link) return;

        const run = createRunFromCanvasLink(link);
        if (!run) {
            alert("This canvas link already has a Run.");
            return;
        }

        captureRunsHistory("Run created from canvas link");
        refreshRunsBOM();
        close();
        renderRunsModal();
    }));

    overlay.style.display = "flex";
}

function getCanvasItem(itemId) {
    const id = String(itemId || "");
    return (typeof getLayout === "function" ? getLayout() : [])
        .find(item => String(item?.id || "") === id) || null;
}

function getCanvasItemWireRating(item) {
    const presetCode = String(
        item?.preset ||
        item?.data?.PRESET ||
        item?.data?.Preset ||
        ""
    ).trim();
    const disconnectPresetRating = presetCode &&
        typeof window.getPresetAssemblyRating === "function"
        ? Number(
            window.getPresetAssemblyRating(
                presetCode,
                ["L-DISC", "H-DISC"]
            ) || 0
        )
        : 0;

    if (disconnectPresetRating > 0) {
        return disconnectPresetRating;
    }

    const value = item?.data?.RATING ??
        item?.data?.Rating ??
        item?.data?.rating ??
        item?.data?.AMPACITY ??
        item?.data?.Amperage ??
        item?.data?.AMPS ??
        0;
    return Math.max(0, Number(value) || 0);
}

function isPanelCanvasItem(item) {
    const type = [item?.data?.Type, item?.data?.NodeType, item?.data?.Category]
        .map(value => String(value || "").toUpperCase())
        .join(" ");
    return type.includes("PANEL") || type.includes("FSU");
}

function isPanelRunEndpoint(item) {
    if (isPanelCanvasItem(item)) return true;

    return [
        item?.name,
        item?.label,
        item?.preset,
        item?.data?.CatalogNumber,
        item?.data?.Description
    ].some(value => /\bPANEL\b/i.test(String(value || "")));
}

function isDisconnectCanvasItem(item) {
    const type = [item?.data?.Type, item?.data?.NodeType]
        .map(value => String(value || "").toUpperCase())
        .join(" ");
    return type.includes("DISCONNECT") || type.includes("DISC") || type.includes("FUSE");
}

function runConnectsToContactor(run) {
    // Contactor control runs (for example, C96 — contactor) only carry the
    // selected hot conductors. Do not add neutral or equipment ground from
    // WireAss, regardless of whether those are configured per breaker or run.
    return [run?.fromCanvasItemId, run?.toCanvasItemId]
        .map(getCanvasItem)
        .filter(Boolean)
        .some(item => [
            item?.preset,
            item?.name,
            item?.label,
            item?.data?.CatalogNumber,
            item?.data?.Description,
            item?.data?.Type,
            item?.data?.NodeType,
            item?.data?.Category
        ].some(value => String(value || "").toUpperCase().includes("CONTACTOR")));
}

function isThreePoleBreakerToPanelRun(run, source) {
    const connectsToPanel = [run?.fromCanvasItemId, run?.toCanvasItemId]
        .map(getCanvasItem)
        .filter(Boolean)
        .some(isPanelRunEndpoint);
    const isThreePole = Number(source?.poles || 0) === 3 ||
        /^3P\b/i.test(String(source?.catalogNumber || "").trim());

    return isThreePole && connectsToPanel;
}

function normalizeWireAssignmentPreset(value) {
    const preset = String(value || "").trim().toUpperCase();
    const compact = preset.replace(/[^A-Z0-9]/g, "");

    if (compact === "LDISC") return "L-DISC";
    if (compact === "HDISC") return "H-DISC";
    return preset;
}

function getCanvasWireAssignmentPreset(item) {
    const candidates = [
        item?.data?.["Wire Preset"],
        item?.data?.WirePreset,
        item?.data?.PRESET,
        item?.preset,
        item?.data?.Type,
        item?.data?.NodeType
    ];

    return candidates
        .map(normalizeWireAssignmentPreset)
        .find(preset => getWireAssignmentRule(preset)) || "";
}

function findRunCircuitMaterial(catalogNumber) {
    const target = String(catalogNumber || "").trim();
    return (typeof getMaterials === "function" ? getMaterials() : [])
        .find(item => String(item?.CatalogNumber || "").trim() === target) || null;
}

function getRunPanelCircuits(run) {
    const panelIds = [...new Set([run?.fromCanvasItemId, run?.toCanvasItemId]
        .map(id => String(id || "")).filter(Boolean))];

    return panelIds.flatMap(panelId => {
        const panel = getCanvasItem(panelId);
        if (!isPanelCanvasItem(panel)) return [];
        if (typeof ensurePresetMainBreakerSlot === "function") {
            ensurePresetMainBreakerSlot(panel);
        }

        const panelLabel = String(panel?.preset || panel?.data?.CatalogNumber || "Panel").trim();
        // Prefer the WireAss-recognized preset. This makes panel catalog
        // names such as "FSU 40/200" use the generic FSU breaker rule.
        const panelPreset = getCanvasWireAssignmentPreset(panel) ||
            String(panel?.preset || panel?.data?.PRESET || "").trim().toUpperCase();
        return (Array.isArray(panel.materials) ? panel.materials : [])
            .filter(component => component?.panelSlot?.section === "branch")
            .map(component => {
                const catalogNumber = String(component?.catalogNumber || component?.CatalogNumber || "").trim();
                const material = findRunCircuitMaterial(catalogNumber) || component;
                const rating = Number(material?.RATING ?? material?.Rating ?? material?.rating ?? 0) ||
                    (typeof getBreakerAmperage === "function" ? Number(getBreakerAmperage(material) || 0) : 0);
                const poles = typeof getBreakerPoleCount === "function"
                    ? Number(getBreakerPoleCount(material) || 1)
                    : Number(material?.Pole || 1);

                return {
                    id: `${panelId}:${String(component?.id || catalogNumber)}`,
                    panelId,
                    breakerId: String(component?.id || ""),
                    panelLabel,
                    panelPreset,
                    catalogNumber,
                    rating,
                    poles: Math.max(1, poles || 1)
                };
            })
            .filter(circuit => circuit.catalogNumber);
    });
}

function getRunPanelMainBreakers(run) {
    const panelIds = [...new Set([run?.fromCanvasItemId, run?.toCanvasItemId]
        .map(id => String(id || "")).filter(Boolean))];

    return panelIds.flatMap(panelId => {
        const panel = getCanvasItem(panelId);
        if (!isPanelCanvasItem(panel)) return [];
        if (typeof ensurePresetMainBreakerSlot === "function") {
            ensurePresetMainBreakerSlot(panel);
        }

        const panelLabel = String(panel?.preset || panel?.data?.CatalogNumber || "Panel").trim();
        return (Array.isArray(panel.materials) ? panel.materials : [])
            .filter(component => component?.panelSlot?.section === "main")
            .map(component => {
                const catalogNumber = String(component?.catalogNumber || component?.CatalogNumber || "").trim();
                const material = findRunCircuitMaterial(catalogNumber) || component;
                const rating = Number(material?.RATING ?? material?.Rating ?? material?.rating ?? 0) ||
                    (typeof getBreakerAmperage === "function" ? Number(getBreakerAmperage(material) || 0) : 0);

                return { panelId, panelLabel, catalogNumber, rating };
            })
            .filter(breaker => breaker.catalogNumber);
    });
}

function getRunMainConductorSources(run) {
    const endpoints = [run?.fromCanvasItemId, run?.toCanvasItemId]
        .map(getCanvasItem)
        .filter(Boolean);
    const panel = endpoints.find(isPanelCanvasItem);

    if (!panel) return [];

    const panelPreset = String(panel?.preset || panel?.data?.PRESET || "").trim().toUpperCase();

    return endpoints
        .filter(isDisconnectCanvasItem)
        .map(disconnect => {
            const rating = getCanvasItemWireRating(disconnect);
            const label = String(disconnect?.preset || disconnect?.data?.CatalogNumber || "Disconnect").trim();
            const wirePreset = getCanvasWireAssignmentPreset(disconnect) || panelPreset;

            return {
                id: `main:${String(panel.id)}:${String(disconnect.id)}`,
                panelId: String(panel.id),
                panelPreset,
                wirePreset,
                disconnectId: String(disconnect.id),
                catalogNumber: label,
                rating,
                sourceType: "main"
            };
        })
        .filter(source => source.rating > 0);
}

function getRunPanelMainConductorSources(run) {
    return getRunPanelMainBreakers(run)
        .map(breaker => {
            const panel = getCanvasItem(breaker.panelId);
            const panelPreset = String(panel?.preset || panel?.data?.PRESET || "").trim().toUpperCase();

            return {
                id: `panel-main:${String(breaker.panelId)}:${breaker.catalogNumber}`,
                panelId: String(breaker.panelId),
                panelPreset,
                wirePreset: getCanvasWireAssignmentPreset(panel) || panelPreset,
                catalogNumber: breaker.catalogNumber,
                rating: breaker.rating,
                sourceType: "main"
            };
        })
        .filter(source => source.rating > 0);
}

function getRunPresetMainConductorSources(run) {
    const endpoints = [run?.fromCanvasItemId, run?.toCanvasItemId]
        .map(getCanvasItem)
        .filter(Boolean);
    const configuredWireSizeSource = endpoints.find(item => {
        const rule = getWireAssignmentRule(getCanvasWireAssignmentPreset(item));
        return String(rule?.["WIRE SIZE"] || "").trim();
    });

    // A WireAss row with an explicit WIRE SIZE (such as SON11/SON+) is a
    // complete prescribed feeder. Otherwise, treat the From endpoint as a
    // rated main source whenever it has a WireAss preset. This lets items
    // such as SD wire themselves even when their canvas type is not labelled
    // as a panel or disconnect.
    const startItem = getCanvasItem(run?.fromCanvasItemId);
    const startPreset = getCanvasWireAssignmentPreset(startItem);
    const startRule = getWireAssignmentRule(startPreset);
    const source = configuredWireSizeSource || (
        startRule && getCanvasItemWireRating(startItem) > 0 ? startItem : null
    );

    if (!source) return [];

    const wirePreset = getCanvasWireAssignmentPreset(source);
    return [{
        id: `preset-main:${String(source.id)}`,
        panelId: String(source.id),
        panelPreset: wirePreset,
        wirePreset,
        catalogNumber: String(source?.preset || source?.data?.CatalogNumber || wirePreset).trim(),
        rating: getCanvasItemWireRating(source),
        sourceType: "main"
    }];
}

function isPrescribedWireAssMainSource(source) {
    if (!String(source?.id || "").startsWith("preset-main:")) return false;
    const rule = getWireAssignmentRule(getRunPanelPreset(source));
    return Boolean(String(rule?.["WIRE SIZE"] || "").trim());
}

function getRunAllMainConductorSources(run) {
    const breakerOrDisconnectSources = [
        ...getRunMainConductorSources(run),
        ...getRunPanelMainConductorSources(run)
    ];

    return breakerOrDisconnectSources.length
        ? breakerOrDisconnectSources
        : getRunPresetMainConductorSources(run);
}

function getRunCircuitSources(run) {
    // A new/manual canvas mapping starts with every installed branch breaker
    // selected. An explicitly saved empty selection still means "no breakers".
    if (run?.panelBreakerSourcesConfigured === true) {
        return Array.isArray(run?.panelBreakerSources) ? run.panelBreakerSources : [];
    }

    return getRunPanelCircuits(run).map(circuit => ({
        panelId: circuit.panelId,
        breakerId: circuit.breakerId,
        panelPreset: circuit.panelPreset,
        catalogNumber: circuit.catalogNumber,
        rating: circuit.rating,
        poles: circuit.poles
    }));
}

function getRunPanelBreakerExcludedSourceKeys(run) {
    return new Set(
        Array.isArray(run?.panelBreakerExcludedSourceKeys)
            ? run.panelBreakerExcludedSourceKeys
                .map(value => String(value || ""))
                .filter(Boolean)
            : []
    );
}

function createRunCircuitSource(circuit) {
    return {
        panelId: circuit.panelId,
        breakerId: circuit.breakerId,
        panelPreset: circuit.panelPreset,
        catalogNumber: circuit.catalogNumber,
        rating: circuit.rating,
        poles: circuit.poles
    };
}

// The panel editor stores each breaker once, but Runs keeps its own selected
// source list. Refresh that list after a panel breaker is added, removed, or
// replaced so the run count and automatic wires follow the live panelboard.
// Explicitly unchecked breakers remain excluded; newly added breakers are
// included by default.
function syncRunPanelBreakerSources(run) {
    if (!run || run.panelBreakerSourcesConfigured !== true) return false;

    const circuits = getRunPanelCircuits(run);
    const validKeys = new Set(circuits.map(getRunCircuitSourceKey));
    const excluded = getRunPanelBreakerExcludedSourceKeys(run);
    const nextExcluded = [...excluded].filter(key => validKeys.has(key));
    const nextSources = circuits
        .filter(circuit => !excluded.has(getRunCircuitSourceKey(circuit)))
        .map(createRunCircuitSource);
    const previousSources = Array.isArray(run.panelBreakerSources)
        ? run.panelBreakerSources
        : [];
    const sourceChanged = JSON.stringify(previousSources) !== JSON.stringify(nextSources);
    const exclusionChanged = JSON.stringify(
        Array.isArray(run.panelBreakerExcludedSourceKeys)
            ? run.panelBreakerExcludedSourceKeys
            : []
    ) !== JSON.stringify(nextExcluded);

    run.panelBreakerSources = nextSources;
    run.panelBreakerExcludedSourceKeys = nextExcluded;

    return sourceChanged || exclusionChanged;
}

function getRunCircuitSourceKey(source) {
    return `${String(source?.panelId || "")}:${String(source?.breakerId || source?.catalogNumber || "")}`;
}

function getRunBreakerWireAssignments(run) {
    return Array.isArray(run?.breakerWireAssignments)
        ? run.breakerWireAssignments
        : [];
}

function getRunSuppressedWireGroups(run) {
    return new Set(
        Array.isArray(run?.suppressedWireGroups)
            ? run.suppressedWireGroups.map(value => String(value || "")).filter(Boolean)
            : []
    );
}

function isRunWireGroupSuppressed(run, groupKey) {
    return getRunSuppressedWireGroups(run).has(String(groupKey || ""));
}

function suppressRunWireGroup(run, groupKey) {
    const suppressed = getRunSuppressedWireGroups(run);
    if (groupKey) suppressed.add(String(groupKey));
    run.suppressedWireGroups = [...suppressed];
}

function restoreRunWireGroup(run, groupKey) {
    const suppressed = getRunSuppressedWireGroups(run);
    suppressed.delete(String(groupKey || ""));
    run.suppressedWireGroups = [...suppressed];
}

function getMainAutoWireGroupKey(source) {
    return `main:${getRunCircuitSourceKey(source)}`;
}

function getBreakerAutoWireGroupKey(source) {
    return `breaker:${getRunCircuitSourceKey(source)}`;
}

function getSharedAutoWireGroupKey(wire) {
    const color = normalizeWireToken(wire?.Color);
    if (color === "WHITE") return "shared:neutral";
    if (color === "GREEN") return "shared:ground";
    return "shared:communication";
}

function getRunManualWires(run) {
    return Array.isArray(run?.manualWires)
        ? run.manualWires
        : (Array.isArray(run?.wires) ? run.wires : (run?.wire ? [run.wire] : []));
}

function getRunAutoWires(run) {
    return (Array.isArray(run?.autoRunWires) ? run.autoRunWires : [])
        .filter(wire => !isRunWireGroupSuppressed(run, getSharedAutoWireGroupKey(wire)));
}

function getRunAutoMainWires(run) {
    return (Array.isArray(run?.autoMainWires) ? run.autoMainWires : [])
        .filter(wire => !wire?.runWireGroup || !isRunWireGroupSuppressed(run, wire.runWireGroup));
}

function rebuildRunWiresFromAssignments(run) {
    if (!Array.isArray(run.manualWires)) {
        run.manualWires = structuredClone(
            Array.isArray(run?.wires) ? run.wires : (run?.wire ? [run.wire] : [])
        );
    }
    const selectedKeys = new Set(getRunCircuitSources(run).map(getRunCircuitSourceKey));
    const assignments = getRunBreakerWireAssignments(run)
        .filter(assignment => selectedKeys.has(getRunCircuitSourceKey(assignment)))
        .filter(assignment => !isRunWireGroupSuppressed(run, getBreakerAutoWireGroupKey(assignment)));

    run.breakerWireAssignments = assignments;
    run.wires = [
        ...structuredClone(getRunManualWires(run)),
        ...assignments.flatMap(assignment => structuredClone(Array.isArray(assignment.wires) ? assignment.wires : [])),
        ...structuredClone(getRunAutoMainWires(run)),
        ...structuredClone(getRunAutoWires(run))
    ];
    delete run.wire;
}

function getRunWireAssignmentSummary(run) {
    const assigned = getRunBreakerWireAssignments(run)
        .filter(assignment => Array.isArray(assignment.wires) && assignment.wires.length)
        .length;
    const total = getRunCircuitSources(run).length;
    if (total) return `Wire assignments ${assigned}/${total}`;
    return getRunAllMainConductorSources(run).length
        ? "Main feeder wires"
        : "Wire assignments";
}

function normalizeWireToken(value) {
    const token = String(value || "").trim().toUpperCase().replace(/[^A-Z0-9/]/g, "");
    return ({ RED: "RED", RD: "RED", BLACK: "BLACK", BLK: "BLACK", BK: "BLACK", WHITE: "WHITE", WHT: "WHITE", WH: "WHITE", GREEN: "GREEN", GRN: "GREEN", GN: "GREEN" })[token] || token;
}

function normalizeWireSize(value) {
    return String(value || "").trim().toUpperCase().replace(/^#/, "").replace(/\s+/g, "");
}

function getRunPanelPreset(source) {
    return String(
        source?.wirePreset ||
        source?.panelPreset ||
        getCanvasItem(source?.panelId)?.preset ||
        getCanvasItem(source?.panelId)?.data?.PRESET ||
        ""
    ).trim().toUpperCase();
}

function getWirePresetColors(value) {
    const preset = String(value || "").trim().toUpperCase();
    const configured = window.WIRE_PRESETS?.[preset];
    if (Array.isArray(configured)) return [...configured];

    const colorByLetter = { R: "RED", B: "BLACK", W: "WHITE", G: "GREEN" };
    const colors = [...preset].map(letter => colorByLetter[letter]);
    return colors.length && colors.every(Boolean) ? colors : [];
}

function getRedWireFallbackPreset(rule) {
    const fallbackEntry = Object.entries(rule || {}).find(([header]) =>
        String(header || "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "") === "IFNOAVAILRED"
    );
    return String(fallbackEntry?.[1] || "").trim().toUpperCase();
}

function getWireAssignmentRule(panelPreset) {
    const target = String(panelPreset || "").trim().toUpperCase();
    const compactTarget = target.replace(/[^A-Z0-9]/g, "");
    const acceptedPresets = new Set([target, compactTarget]);

    // Panel catalog presets such as FSU40/200 use the generic FSU WireAss row.
    if (/^FSU\d/.test(compactTarget)) acceptedPresets.add("FSU");

    return (Array.isArray(window.wireAssignments) ? window.wireAssignments : [])
        .find(rule => {
            const preset = String(rule?.["Panel Preset"] || "").trim().toUpperCase();
            const compactPreset = preset.replace(/[^A-Z0-9]/g, "");
            return acceptedPresets.has(preset) || acceptedPresets.has(compactPreset);
        }) || null;
}

function getRunWireAssignmentRule(run, source) {
    const directRule = getWireAssignmentRule(getRunPanelPreset(source));
    if (directRule) return directRule;

    // Some canvas panels carry a generic catalog/type label instead of their
    // WireAss family. Their branch breakers still belong to the feeder, so
    // use the connected main source's WireAss rule as a fallback.
    const fallbackPresets = [
        ...getRunAllMainConductorSources(run).map(getRunPanelPreset),
        ...[run?.fromCanvasItemId, run?.toCanvasItemId]
            .map(getCanvasItem)
            .filter(Boolean)
            .map(getCanvasWireAssignmentPreset)
    ];

    return fallbackPresets
        .map(getWireAssignmentRule)
        .find(Boolean) || null;
}

function getAutomaticWireSize(rating) {
    const amps = Math.max(0, Number(rating || 0));
    return BREAKER_WIRE_SIZE_RULES.find(([maximum]) => amps <= maximum)?.[1] || "";
}

function findAutomaticWireMaterial(size, color) {
    const targetSize = normalizeWireSize(size);
    const targetColor = normalizeWireToken(color);

    return (typeof getMaterials === "function" ? getMaterials() : [])
        .find(material => String(material?.NodeType || "").toUpperCase() === "WIRE" &&
            normalizeWireSize(material?.Size) === targetSize &&
            normalizeWireToken(material?.Color) === targetColor) || null;
}

function findAutomaticMaterialByCatalog(catalogNumber) {
    const target = String(catalogNumber || "").trim().toUpperCase();
    if (!target) return null;

    return (typeof getMaterials === "function" ? getMaterials() : [])
        .find(material => String(material?.CatalogNumber || "").trim().toUpperCase() === target) || null;
}

function addAutomaticWire(target, size, color, qty) {
    const material = findAutomaticWireMaterial(size, color);
    if (!material || qty < 1) return false;
    target.push({ ...structuredClone(material), qty: Math.max(1, Number(qty || 1)) });
    return true;
}

function addAutomaticCatalogMaterial(target, catalogNumber, qty = 1) {
    const material = findAutomaticMaterialByCatalog(catalogNumber);
    if (!material || qty < 1) return false;
    target.push({ ...structuredClone(material), qty: Math.max(1, Number(qty || 1)) });
    return true;
}

function getWireRuleMode(rule, key) {
    return String(rule?.[key] || "None").trim().toUpperCase().replace(/\s+/g, " ");
}

function getRunWireListLabel(wires) {
    return (Array.isArray(wires) ? wires : [])
        .map(wire => `${wire.qty || 1}× ${wire.CatalogNumber || "wire"}`)
        .join(", ") || "No wire assigned";
}

function getRunWireCondition(run) {
    const saved = run?.wireCondition || {};

    return {
        main: saved.main !== false,
        breakers: saved.breakers !== false,
        neutral: saved.neutral !== false,
        ground: saved.ground !== false,
        communication: saved.communication !== false
    };
}

function isRunWireConditionEnabled(run, group) {
    return getRunWireCondition(run)[group] !== false;
}

function getRunCommunicationCatalogs(run) {
    const mainSources = runConnectsToContactor(run)
        ? []
        : getRunAllMainConductorSources(run);
    const circuitSources = getRunCircuitSources(run);
    const sharedSource = mainSources[0] || circuitSources[0] || null;
    const rule = sharedSource
        ? getRunWireAssignmentRule(run, sharedSource)
        : null;

    return String(rule?.COM || "")
        .split(/[;,\n]+/)
        .map(value => value.trim())
        .filter(Boolean);
}

function getRunWireConditionSummary(run) {
    const labels = [
        isRunWireConditionEnabled(run, "main") ? "Main" : "",
        isRunWireConditionEnabled(run, "breakers") ? "Breaker" : "",
        isRunWireConditionEnabled(run, "neutral") ? "Neutral" : "",
        isRunWireConditionEnabled(run, "ground") ? "Ground" : "",
        isRunWireConditionEnabled(run, "communication") ? "COM" : ""
    ].filter(Boolean);

    if (labels.length === 5) return "Condition: all";
    return labels.length ? `Condition: ${labels.join(" + ")}` : "Condition: none";
}

function autoAssignRunWires(run, options = {}) {
    if (options.resetSuppressed === true) {
        run.suppressedWireGroups = [];
    }

    const isContactorRun = runConnectsToContactor(run);
    const wireCondition = getRunWireCondition(run);
    // A contactor path is always a breaker-only run. The feeder/main on the
    // other endpoint is deliberately ignored.
    const mainSources = isContactorRun || !wireCondition.main
        ? []
        : getRunAllMainConductorSources(run);
    // A contactor is a dedicated two/three-hot control path. Its colors must
    // come solely from the CONTACTOR WireAss row (for example RB or BBC),
    // never from the connected panel or feeder preset.
    const contactorRule = isContactorRun
        ? getWireAssignmentRule("CONTACTOR")
        : null;
    // SON+/SON11-style rows define a complete feeder in WireAss. Do not add
    // branch-breaker conductors for those runs, even if the connected canvas
    // panel happens to contain installed breakers.
    const usesPresetMainWire = mainSources.some(isPrescribedWireAssMainSource);
    const sources = wireCondition.breakers && (isContactorRun || !usesPresetMainWire)
        ? getRunCircuitSources(run)
        : [];
    const wireSources = [...sources, ...mainSources];
    const assignments = [];
    const mainWires = [];
    const sharedWires = [];
    const missing = [];

    wireSources.forEach(source => {
        const wireGroupKey = source.sourceType === "main"
            ? getMainAutoWireGroupKey(source)
            : getBreakerAutoWireGroupKey(source);
        if (isRunWireGroupSuppressed(run, wireGroupKey)) return;

        const rule = isContactorRun
            ? contactorRule
            : getRunWireAssignmentRule(run, source);
        // WireAss can explicitly override the ampacity-table size.  This is
        // needed for panel families such as SON+/SON11 where the approved
        // conductor size is defined in the assignment table.
        const configuredSize = String(rule?.["WIRE SIZE"] || "").trim();
        const size = configuredSize || getAutomaticWireSize(source.rating);
        const presetColumn = source.sourceType === "main"
            ? "Hot Preset"
            : "Breaker Preset";
        let hotPreset = String(
            rule?.[presetColumn] ||
            (source.sourceType === "main" ? "" : rule?.["Hot Preset"]) ||
            ""
        ).trim().toUpperCase();
        let hotColors = getWirePresetColors(hotPreset);
        // A 3P breaker feeding a panel always uses three red hots.
        const forceThreeRedHots = isThreePoleBreakerToPanelRun(run, source);
        if (forceThreeRedHots) {
            hotPreset = "RRR";
            hotColors = ["RED", "RED", "RED"];
        }

        // WireAss can provide a fallback (for example BB) when the preferred
        // preset includes RED but that color/size is not present in the MML.
        const redIsUnavailable = hotColors.includes("RED") &&
            !findAutomaticWireMaterial(
                String(rule?.["WIRE SIZE"] || "").trim() || getAutomaticWireSize(source.rating),
                "RED"
            );
        if (!forceThreeRedHots && redIsUnavailable) {
            const fallbackPreset = getRedWireFallbackPreset(rule);
            const fallbackColors = getWirePresetColors(fallbackPreset);
            if (fallbackColors.length) {
                hotPreset = fallbackPreset;
                hotColors = fallbackColors;
            }
        }

        if (!rule || !size || !hotColors.length) {
            missing.push(`${getRunPanelPreset(source) || "panel"} ${source.rating || "?"}A`);
            return;
        }

        // SET is the number of complete hot-conductor groups. Keep every
        // conductor as its own entry so RB + #8 + SET 2 reads as
        // 1× Red, 1× Black, 1× Red, 1× Black in the Main list.
        const hotSetCount = Math.max(1, Number(rule?.SET || 1) || 1);
        const wires = [];
        const missingMaterials = [];
        const addWire = (wireSize, color, qty = 1) => {
            if (!addAutomaticWire(wires, wireSize, color, qty)) {
                missingMaterials.push(`${qty}× THHN ${wireSize} ${color}`);
            }
        };
        for (let setIndex = 0; setIndex < hotSetCount; setIndex += 1) {
            hotColors.forEach(color => addWire(size, color, 1));
        }

        if (
            wireCondition.neutral &&
            !isContactorRun &&
            getWireRuleMode(rule, "Neutral Mode") === "PER BREAKER"
        ) {
            addWire(size, "WHITE", Number(rule?.["Neutral Qty"] || 1));
        }

        if (source.sourceType === "main") {
            wires.forEach(wire => { wire.runWireGroup = wireGroupKey; });
            mainWires.push(...wires);
        }
        else {
            assignments.push({ ...source, wires, missingMaterials });
        }
    });

    const largestSize = getAutomaticWireSize(Math.max(0, ...wireSources.map(source => Number(source.rating || 0))));
    // Neutral/ground marked "Per Run" are shared conductors.  Use the main
    // feeder rule when there is one (for example L-DISC), otherwise the first
    // circuit's panel rule.  They must not be added once for every source rule.
    const sharedWireSource = mainSources[0] || sources[0] || null;
    const sharedRule = isContactorRun
        ? contactorRule
        : sharedWireSource
        ? getRunWireAssignmentRule(run, sharedWireSource)
        : null;

    if (
        wireCondition.neutral &&
        !isContactorRun &&
        getWireRuleMode(sharedRule, "Neutral Mode") === "PER RUN"
    ) {
        const neutralSize = String(sharedRule?.["NEUTRAL SIZE"] || "").trim() || largestSize;
        if (!isRunWireGroupSuppressed(run, "shared:neutral")) {
            addAutomaticWire(sharedWires, neutralSize, "WHITE", Number(sharedRule?.["Neutral Qty"] || 1));
        }
    }
    if (
        wireCondition.ground &&
        !isContactorRun &&
        getWireRuleMode(sharedRule, "Ground Mode") === "PER RUN"
    ) {
        // Some existing WireAss rows intentionally leave Ground Size blank.
        // Do not try to use the (often very large) feeder conductor as ground:
        // it may not exist in green in the MML.  #10 is the company fallback;
        // an entered Ground Size always takes precedence.
        const groundSize = String(sharedRule?.["Ground Size"] || "").trim() || "#10";
        if (!isRunWireGroupSuppressed(run, "shared:ground")) {
            addAutomaticWire(sharedWires, groundSize, "GREEN", Number(sharedRule?.["Ground Qty"] || 1));
        }
    }
    // COM accepts one or more catalog numbers separated by commas, semicolons,
    // or new lines. For example, SON11/SON+ uses COM = CAT6BLUE.
    if (
        wireCondition.communication &&
        !isRunWireGroupSuppressed(run, "shared:communication")
    ) String(isContactorRun ? "" : sharedRule?.COM || "")
        .split(/[;,\n]+/)
        .map(value => value.trim())
        .filter(Boolean)
        .forEach(catalogNumber => {
            if (!addAutomaticCatalogMaterial(sharedWires, catalogNumber, 1)) {
                missing.push(`${catalogNumber} communication cable`);
            }
        });

    run.breakerWireAssignments = assignments;
    run.autoMainWires = mainWires;
    run.autoRunWires = sharedWires;
    rebuildRunWiresFromAssignments(run);

    return { assigned: assignments.length + (mainWires.length ? 1 : 0), missing };
}

function removeRunWireGroup(run, groupKey, source = null) {
    if (!run || !groupKey) return false;

    const key = String(groupKey);
    suppressRunWireGroup(run, key);

    if (key.startsWith("breaker:")) {
        run.breakerWireAssignments = getRunBreakerWireAssignments(run)
            .filter(assignment => getBreakerAutoWireGroupKey(assignment) !== key);
    }
    else if (key.startsWith("main:")) {
        const fallbackSize = source
            ? normalizeWireSize(getAutomaticWireSize(source.rating))
            : "";
        run.autoMainWires = (Array.isArray(run.autoMainWires) ? run.autoMainWires : [])
            .filter(wire => {
                if (wire?.runWireGroup) return wire.runWireGroup !== key;
                return !fallbackSize || normalizeWireSize(wire?.Size) !== fallbackSize;
            });
    }
    else if (key === "shared:neutral") {
        run.autoRunWires = (Array.isArray(run.autoRunWires) ? run.autoRunWires : [])
            .filter(wire => normalizeWireToken(wire?.Color) !== "WHITE");
    }
    else if (key === "shared:ground") {
        run.autoRunWires = (Array.isArray(run.autoRunWires) ? run.autoRunWires : [])
            .filter(wire => normalizeWireToken(wire?.Color) !== "GREEN");
    }
    else if (key === "shared:communication") {
        run.autoRunWires = (Array.isArray(run.autoRunWires) ? run.autoRunWires : [])
            .filter(wire => !["WHITE", "GREEN"].includes(normalizeWireToken(wire?.Color)));
    }

    rebuildRunWiresFromAssignments(run);
    captureRunsHistory("Run wire group removed");
    refreshRunsBOM();
    return true;
}

function getRunCircuitSummary(run) {
    const sources = getRunCircuitSources(run);
    return sources.length
        ? sources.map(source => `${source.rating || "?"}A ${source.catalogNumber || "breaker"}`).join(" + ")
        : (getRunAllMainConductorSources(run).length ? "Main feeder (no breakers)" : "Panel breakers");
}

function ensureRunCircuitModal() {
    if (runCircuitModalElement) return runCircuitModalElement;

    const overlay = document.createElement("div");
    overlay.className = "run-circuit-modal";
    overlay.addEventListener("click", event => {
        if (event.target === overlay) overlay.style.display = "none";
    });
    document.body.appendChild(overlay);
    runCircuitModalElement = overlay;
    return overlay;
}

function openRunCircuitModal(runId) {
    const run = findRun(runId);
    if (!run) return;

    const circuits = getRunPanelCircuits(run);
    const mainBreakers = getRunPanelMainBreakers(run);
    if (!circuits.length) {
        if (mainBreakers.length) {
            alert(`${mainBreakers.map(breaker => breaker.catalogNumber).join(", ")} is the preset main breaker. This panel has no installed branch breakers to select.`);
        }
        else {
            alert(getRunAllMainConductorSources(run).length
                ? "This is a main-feeder run. It has no branch breakers to select. Use Auto wire or Wire assignments to review the feeder wires."
                : "Map this Run to a Panel with installed branch breakers first.");
        }
        return;
    }

    const savedSources = getRunCircuitSources(run);
    const selected = new Set(run.panelBreakerSourcesConfigured === true
        ? savedSources.map(getRunCircuitSourceKey)
        : circuits.map(circuit => circuit.id));
    const overlay = ensureRunCircuitModal();

    overlay.innerHTML = `
        <section class="run-circuit-dialog" role="dialog" aria-modal="true" aria-labelledby="runCircuitTitle">
            <header>
                <div>
                    <h2 id="runCircuitTitle">${runModalEscape(run.name || "Run")} · Panel breakers</h2>
                    <p>Choose the branch circuits carried by this run. Main breakers are shown for reference and are not run circuits.</p>
                </div>
                <button type="button" class="run-circuit-close" aria-label="Close">&times;</button>
            </header>
            <div class="run-circuit-list">
                ${mainBreakers.map(breaker => `
                    <div class="run-wire-assignment-row run-wire-generated-row">
                        <span>
                            <strong>${runModalEscape(`Main breaker · ${breaker.panelLabel} · ${breaker.catalogNumber}`)}</strong>
                            <small>${runModalEscape(`${breaker.rating || "?"}A · preset component`)}</small>
                        </span>
                        <em>Main</em>
                    </div>
                `).join("")}
                ${circuits.map(circuit => `
                    <label class="run-circuit-choice">
                        <input type="checkbox" value="${runModalEscape(circuit.id)}" ${selected.has(circuit.id) ? "checked" : ""}>
                        <span>
                            <strong>${runModalEscape(circuit.panelLabel)} · ${runModalEscape(circuit.catalogNumber)}</strong>
                            <small>${runModalEscape(`${circuit.rating || "?"}A · ${circuit.poles}P`)}</small>
                        </span>
                    </label>
                `).join("")}
            </div>
            <footer>
                <button type="button" class="run-circuit-cancel">Cancel</button>
                <button type="button" class="run-circuit-save">Use selected breakers</button>
            </footer>
        </section>
    `;

    const close = () => { overlay.style.display = "none"; };
    overlay.querySelector(".run-circuit-close")?.addEventListener("click", close);
    overlay.querySelector(".run-circuit-cancel")?.addEventListener("click", close);
    overlay.querySelector(".run-circuit-save")?.addEventListener("click", () => {
        const ids = new Set([...overlay.querySelectorAll("input[type='checkbox']:checked")]
            .map(input => input.value));

        run.panelBreakerSources = circuits
            .filter(circuit => ids.has(circuit.id))
            .map(createRunCircuitSource);
        run.panelBreakerSourcesConfigured = true;
        run.panelBreakerExcludedSourceKeys = circuits
            .filter(circuit => !ids.has(circuit.id))
            .map(getRunCircuitSourceKey);

        const autoResult = autoAssignRunWires(run);

        captureRunsHistory(autoResult.assigned ? "Run panel breakers and wires selected" : "Run panel breakers selected");
        saveRunsDraft();
        renderRunsModal();
        close();
    });

    overlay.style.display = "flex";
}

function ensureRunWireConditionModal() {
    if (runWireConditionModalElement) return runWireConditionModalElement;

    const overlay = document.createElement("div");
    overlay.className = "run-circuit-modal";
    overlay.addEventListener("click", event => {
        if (event.target === overlay) overlay.style.display = "none";
    });
    document.body.appendChild(overlay);
    runWireConditionModalElement = overlay;
    return overlay;
}

function openRunWireConditionModal(runId) {
    const run = findRun(runId);
    if (!run) return;

    const runNumber = Math.max(
        1,
        getEditableRuns().findIndex(candidate => candidate?.id === run.id) + 1
    );
    const condition = getRunWireCondition(run);
    const communicationCatalogs = getRunCommunicationCatalogs(run);
    const overlay = ensureRunWireConditionModal();
    const choice = (key, label, detail) => `
        <label class="run-circuit-choice">
            <input type="checkbox" data-wire-condition="${key}" ${condition[key] ? "checked" : ""}>
            <span>
                <strong>${runModalEscape(label)}</strong>
                <small>${runModalEscape(detail)}</small>
            </span>
        </label>`;

    overlay.innerHTML = `
        <section class="run-circuit-dialog" role="dialog" aria-modal="true" aria-labelledby="runWireConditionTitle">
            <header>
                <div>
                    <h2 id="runWireConditionTitle">Run ${runNumber} · Wire condition</h2>
                    <p>Choose the wire groups this run should use. Sizes, colors, and COM catalog numbers still come from WireAss.</p>
                </div>
                <button type="button" class="run-circuit-close" aria-label="Close">&times;</button>
            </header>
            <div class="run-circuit-list">
                ${choice("main", "Main", "Main feeder conductors from the connected equipment")}
                ${choice("breakers", "Breaker", "Conductors for selected panel breakers")}
                ${choice("neutral", "Neutral", "Neutral conductors defined in WireAss")}
                ${choice("ground", "Ground", "Ground conductors defined in WireAss")}
                ${choice(
                    "communication",
                    "COM",
                    communicationCatalogs.length
                        ? `WireAss: ${communicationCatalogs.join(", ")}`
                        : "No COM catalog number is set in WireAss"
                )}
            </div>
            <footer>
                <button type="button" class="run-circuit-cancel">Cancel</button>
                <button type="button" class="run-circuit-save">Apply condition</button>
            </footer>
        </section>`;

    const close = () => { overlay.style.display = "none"; };
    overlay.querySelector(".run-circuit-close")?.addEventListener("click", close);
    overlay.querySelector(".run-circuit-cancel")?.addEventListener("click", close);
    overlay.querySelector(".run-circuit-save")?.addEventListener("click", () => {
        const enabled = key => Boolean(
            overlay.querySelector(`[data-wire-condition="${key}"]`)?.checked
        );

        run.wireCondition = {
            main: enabled("main"),
            breakers: enabled("breakers"),
            neutral: enabled("neutral"),
            ground: enabled("ground"),
            communication: enabled("communication")
        };

        autoAssignRunWires(run);
        captureRunsHistory("Run wire condition updated");
        saveRunsDraft();
        refreshRunsBOM();
        renderRunsModal();
        close();
    });

    overlay.style.display = "flex";
}

function ensureRunWireAssignmentModal() {
    if (runWireAssignmentModalElement) return runWireAssignmentModalElement;

    const overlay = document.createElement("div");
    overlay.className = "run-circuit-modal";
    overlay.addEventListener("click", event => {
        if (event.target === overlay) overlay.style.display = "none";
    });
    document.body.appendChild(overlay);
    runWireAssignmentModalElement = overlay;
    return overlay;
}

function openRunBreakerWirePicker(runId, source) {
    const run = findRun(runId);
    if (!run) return;

    const key = getRunCircuitSourceKey(source);
    const existing = getRunBreakerWireAssignments(run)
        .find(assignment => getRunCircuitSourceKey(assignment) === key);
    const draftConnection = {
        hardware: structuredClone(existing?.wires || []),
        runWirePicker: true
    };

    ensureRunWireAssignmentModal().style.display = "none";
    ensureRunsModal().style.display = "none";

    openMaterialModal(draftConnection, {
        title: `${source.rating || "?"}A ${source.catalogNumber} · Wire assignment`,
        category: "WIRE",
        onClose: () => {
            const currentRun = findRun(runId);
            if (currentRun) {
                const assignments = getRunBreakerWireAssignments(currentRun)
                    .filter(assignment => getRunCircuitSourceKey(assignment) !== key);
                if (draftConnection.hardware.length) {
                    restoreRunWireGroup(currentRun, getBreakerAutoWireGroupKey(source));
                    assignments.push({ ...source, wires: structuredClone(draftConnection.hardware) });
                }
                currentRun.breakerWireAssignments = assignments;
                rebuildRunWiresFromAssignments(currentRun);
                captureRunsHistory("Breaker wire assignment updated");
                refreshRunsBOM();
            }
            openRunsModal();
            openRunWireAssignmentModal(runId);
        }
    });
}

function openRunWireAssignmentModal(runId) {
    const run = findRun(runId);
    if (!run) return;

    const runNumber = Math.max(1, getEditableRuns().findIndex(candidate => candidate?.id === run.id) + 1);

    const sources = getRunCircuitSources(run);
    const mainSources = runConnectsToContactor(run)
        ? []
        : getRunAllMainConductorSources(run);
    if (!sources.length && !mainSources.length) {
        alert("Choose panel breakers for this run first.");
        return;
    }

    const assignments = getRunBreakerWireAssignments(run);
    const autoMainWires = getRunAutoMainWires(run);
    const neutralWires = getRunAutoWires(run)
        .filter(wire => normalizeWireToken(wire?.Color) === "WHITE");
    const groundWires = getRunAutoWires(run)
        .filter(wire => normalizeWireToken(wire?.Color) === "GREEN");
    const communicationWires = getRunAutoWires(run)
        .filter(wire => !["WHITE", "GREEN"].includes(normalizeWireToken(wire?.Color)));
    const overlay = ensureRunWireAssignmentModal();
    overlay.innerHTML = `
        <section class="run-circuit-dialog run-wire-assignment-dialog" role="dialog" aria-modal="true" aria-labelledby="runWireAssignmentTitle">
            <header>
                <div>
                    <h2 id="runWireAssignmentTitle">Run ${runNumber} · ${runModalEscape(run.name || "Run")} · Wire assignments</h2>
                    <p>Breaker wires can be edited below. Main, neutral, and ground wires are generated from the run endpoints and WireAss.</p>
                </div>
                <button type="button" class="run-circuit-close" aria-label="Close">&times;</button>
            </header>
            <div class="run-circuit-list">
                ${mainSources
                    .filter(source => !isRunWireGroupSuppressed(run, getMainAutoWireGroupKey(source)))
                    .map(source => {
                    const rule = getRunWireAssignmentRule(run, source);
                    const size = normalizeWireSize(
                        String(rule?.["WIRE SIZE"] || "").trim() ||
                        getAutomaticWireSize(source.rating)
                    );
                    const groupKey = getMainAutoWireGroupKey(source);
                    const groupedWires = autoMainWires.filter(wire => wire?.runWireGroup === groupKey);
                    const wires = groupedWires.length || autoMainWires.some(wire => wire?.runWireGroup)
                        ? groupedWires
                        : autoMainWires.filter(wire => normalizeWireSize(wire?.Size) === size);
                    const mainLabel = source.rating
                        ? `Main · ${source.rating}A · ${source.catalogNumber}`
                        : `Main · ${source.catalogNumber}`;
                    return `
                        <div class="run-wire-assignment-row run-wire-generated-row">
                            <span>
                                <strong>${runModalEscape(mainLabel)}</strong>
                                <small>${runModalEscape(getRunWireListLabel(wires))}</small>
                            </span>
                            <div class="run-wire-assignment-actions"><em>Auto</em><button type="button" class="run-wire-remove" data-remove-wire-group="${runModalEscape(groupKey)}" title="Remove main wire group" aria-label="Remove main wire group">&times;</button></div>
                        </div>`;
                }).join("")}
                ${neutralWires.length ? `
                    <div class="run-wire-assignment-row run-wire-generated-row">
                        <span>
                            <strong>Neutral · Run level</strong>
                            <small>${runModalEscape(getRunWireListLabel(neutralWires))}</small>
                        </span>
                        <div class="run-wire-assignment-actions"><em>Auto</em><button type="button" class="run-wire-remove" data-remove-wire-group="shared:neutral" title="Remove neutral wire" aria-label="Remove neutral wire">&times;</button></div>
                    </div>` : ""}
                ${groundWires.length ? `
                    <div class="run-wire-assignment-row run-wire-generated-row">
                        <span>
                            <strong>Ground · Run level</strong>
                            <small>${runModalEscape(getRunWireListLabel(groundWires))}</small>
                        </span>
                        <div class="run-wire-assignment-actions"><em>Auto</em><button type="button" class="run-wire-remove" data-remove-wire-group="shared:ground" title="Remove ground wire" aria-label="Remove ground wire">&times;</button></div>
                    </div>` : ""}
                ${communicationWires.length ? `
                    <div class="run-wire-assignment-row run-wire-generated-row">
                        <span>
                            <strong>Communication · Run level</strong>
                            <small>${runModalEscape(getRunWireListLabel(communicationWires))}</small>
                        </span>
                        <div class="run-wire-assignment-actions"><em>Auto</em><button type="button" class="run-wire-remove" data-remove-wire-group="shared:communication" title="Remove communication wire" aria-label="Remove communication wire">&times;</button></div>
                    </div>` : ""}
                ${sources.map(source => {
                    const assignment = assignments.find(item => getRunCircuitSourceKey(item) === getRunCircuitSourceKey(source));
                    const label = getRunWireListLabel(assignment?.wires);
                    const missing = Array.isArray(assignment?.missingMaterials) && assignment.missingMaterials.length
                        ? ` · Missing in MML: ${assignment.missingMaterials.join(", ")}`
                        : "";
                    return `
                        <div class="run-wire-assignment-row">
                            <span>
                                <strong>${runModalEscape(`${source.rating || "?"}A · ${source.catalogNumber}`)}</strong>
                                <small>${runModalEscape(`${label}${missing}`)}</small>
                            </span>
                            <div class="run-wire-assignment-actions">
                                <button type="button" data-source-key="${runModalEscape(getRunCircuitSourceKey(source))}">${assignment?.wires?.length ? "Edit wires" : "Assign wires"}</button>
                                ${assignment?.wires?.length ? `<button type="button" class="run-wire-remove" data-remove-wire-group="${runModalEscape(getBreakerAutoWireGroupKey(source))}" title="Remove breaker wire group" aria-label="Remove breaker wire group">&times;</button>` : ""}
                            </div>
                        </div>`;
                }).join("")}
            </div>
            <footer>
                <button type="button" class="run-circuit-close">Done</button>
            </footer>
        </section>`;

    const close = () => { overlay.style.display = "none"; };
    overlay.querySelectorAll(".run-circuit-close").forEach(button => button.addEventListener("click", close));
    overlay.querySelectorAll("[data-source-key]").forEach(button => button.addEventListener("click", () => {
        const source = sources.find(item => getRunCircuitSourceKey(item) === button.dataset.sourceKey);
        if (source) openRunBreakerWirePicker(runId, source);
    }));
    overlay.querySelectorAll("[data-remove-wire-group]").forEach(button => button.addEventListener("click", () => {
        const groupKey = String(button.dataset.removeWireGroup || "");
        const source = groupKey.startsWith("main:")
            ? mainSources.find(item => getMainAutoWireGroupKey(item) === groupKey)
            : null;
        if (!removeRunWireGroup(run, groupKey, source)) return;
        openRunWireAssignmentModal(runId);
    }));
    overlay.style.display = "flex";
}

function renderCanvasTagOptions(options, currentId, emptyLabel) {

    return [
        `<option value="">${runModalEscape(emptyLabel)}</option>`,
        ...(options || []).map(option => `
            <option value="${runModalEscape(option.id)}" ${option.id === String(currentId || "") ? "selected" : ""}>
                ${runModalEscape(option.label)}
            </option>
        `)
    ].join("");

}

function updateRunCanvasName(run, index, options) {

    const from = getCanvasTagLabel(run.fromCanvasItemId, options);
    const to = getCanvasTagLabel(run.toCanvasItemId, options);

    if (from || to) {
        run.name = from && to ? `${from} → ${to}` : (from || to);
    }
    else if (!String(run.name || "").trim()) {
        run.name = `Run ${index + 1}`;
    }

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

function removeRunsForCanvasLinks(canvasLinkIds, options = {}) {
    const linkIds = new Set(
        (Array.isArray(canvasLinkIds) ? canvasLinkIds : [canvasLinkIds])
            .map(id => String(id || ""))
            .filter(Boolean)
    );

    if (!linkIds.size) return [];

    const runs = getEditableRuns();
    const removedRuns = runs.filter(run =>
        linkIds.has(String(run?.canvasLinkId || ""))
    );

    if (!removedRuns.length) return [];

    const removedIds = new Set(
        removedRuns.map(run => String(run.id || ""))
    );

    for (let index = runs.length - 1; index >= 0; index -= 1) {
        if (removedIds.has(String(runs[index]?.id || ""))) {
            runs.splice(index, 1);
        }
    }

    getEditableGutters().forEach(gutter => {
        if (!Array.isArray(gutter?.excludedRunIds)) return;

        gutter.excludedRunIds = gutter.excludedRunIds.filter(id =>
            !removedIds.has(String(id || ""))
        );
    });

    if (options.captureHistory !== false) {
        captureRunsHistory(
            removedRuns.length === 1
                ? "Run removed with canvas link"
                : `${removedRuns.length} runs removed with canvas links`
        );
    }

    refreshRunsBOM();

    if (
        options.render !== false &&
        runsModalElement?.style.display === "flex"
    ) {
        renderRunsModal();
    }

    return removedRuns;
}

function removeRunsForCanvasLink(canvasLinkId, options = {}) {
    return removeRunsForCanvasLinks([canvasLinkId], options);
}

function removeRunAndCanvasLink(runId) {
    const runs = getEditableRuns();
    const index = runs.findIndex(run => run.id === runId);

    if (index < 0) return false;

    const run = runs[index];
    const canvasLinkId = String(run?.canvasLinkId || "");

    runs.splice(index, 1);

    // Runs created from a canvas link own that link. Manual runs have no
    // canvasLinkId and remain a runs-only estimate.
    if (
        canvasLinkId &&
        typeof removeLink === "function"
    ) {
        removeLink(canvasLinkId, {
            captureHistory: false,
            removeMaterialRun: false
        });
    }

    getEditableGutters().forEach(gutter => {
        if (!Array.isArray(gutter?.excludedRunIds)) return;
        gutter.excludedRunIds = gutter.excludedRunIds.filter(id =>
            String(id || "") !== String(runId)
        );
    });

    captureRunsHistory(
        canvasLinkId
            ? "Run and canvas link removed"
            : "Run removed"
    );
    refreshRunsBOM();
    return true;
}

// A component edit must not create a new Run endpoint.  Runs store the
// canvas item ID, so keep that ID and only refresh the display/name that is
// derived from the component's current catalog or preset.
function refreshRunsForCanvasComponent(itemId) {

    const targetId = String(itemId || "");
    const changedItem = getCanvasItem(targetId);
    const panelBreakersChanged = isPanelCanvasItem(changedItem);
    const runs = getEditableRuns();
    const tags = getCanvasTagOptions();
    let changed = false;

    runs.forEach((run, index) => {
        if (
            String(run?.fromCanvasItemId || "") !== targetId &&
            String(run?.toCanvasItemId || "") !== targetId
        ) {
            return;
        }

        updateRunCanvasName(run, index, tags);
        if (panelBreakersChanged) {
            syncRunPanelBreakerSources(run);
        }
        const hasWireSource =
            getRunAllMainConductorSources(run).length > 0 ||
            getRunCircuitSources(run).length > 0;
        if (hasWireSource) {
            // The canvas item keeps its ID when replaced, but its preset,
            // ampacity, and main breaker can change. Rebuild the generated
            // wires so WireAss immediately reflects the replacement.
            autoAssignRunWires(run);
        }
        changed = true;
    });

    if (changed) {
        saveRunsDraft();
    }

    if (typeof renderBOM === "function") {
        renderBOM();
    }

    if (
        changed &&
        runsModalElement?.style.display === "flex"
    ) {
        renderRunsModal();
    }

    return changed;

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

function getFittingCandidates(materials, run, row, column, selectedSizes = []) {

    const sizes = Array.isArray(selectedSizes) && selectedSizes.length
        ? selectedSizes
        : [run?.conduit?.Size || ""];

    return (Array.isArray(materials) ? materials : [])
        .filter(item => !item?.Placeable)
        .filter(item => {
            const node = normalizeFittingValue(item?.NodeType);
            const description = normalizeFittingValue(item?.Description);

            return row.match(node, description);
        })
        .filter(item => sizes.some(size => isSameFittingSize(item, size)))
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

function setRunFittingQuantity(run, material, quantity) {

    const fittings = getRunFittings(run);
    const catalog = String(material?.CatalogNumber || "");
    const index = fittings.findIndex(fitting =>
        String(fitting?.CatalogNumber || "") === catalog
    );
    const qty = Math.max(0, Math.floor(Number(quantity) || 0));

    if (index >= 0) {
        if (qty > 0) fittings[index].qty = qty;
        else fittings.splice(index, 1);
    }
    else if (qty > 0) {
        fittings.push({
            ...structuredClone(material),
            qty
        });
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

function ensureRunMaterialsModal() {

    if (runMaterialsModalElement) return runMaterialsModalElement;

    const overlay = document.createElement("div");

    overlay.id = "runMaterialsModal";
    overlay.className = "runs-modal";
    overlay.addEventListener("click", event => {
        if (event.target === overlay) {
            closeRunMaterialsModal();
        }
    });

    document.body.appendChild(overlay);
    runMaterialsModalElement = overlay;
    return overlay;

}

function renderRunMaterialsModal() {

    const overlay = ensureRunMaterialsModal();
    const previousDialog = overlay.querySelector(".runs-dialog");
    if (previousDialog) {
        runMaterialsModalScrollTop = previousDialog.scrollTop;
    }

    const runs = getEditableRuns();

    overlay.innerHTML = `
        <section class="runs-dialog run-materials-dialog" role="dialog" aria-modal="true" aria-labelledby="runMaterialsTitle">
            <header class="runs-header">
                <div>
                    <h2 id="runMaterialsTitle">Conduit &amp; Fittings</h2>
                    <p>Edit route length, conduit, and fittings without opening the wire controls.</p>
                </div>
                <button class="runs-close" type="button" aria-label="Close conduit and fittings">&times;</button>
            </header>

            <div class="run-materials-grid-header" aria-hidden="true">
                <span>Run / canvas link</span>
                <span>Conduit</span>
                <span>Fittings</span>
                <span>Length</span>
                <span>Conduit BOM</span>
                <span></span>
            </div>

            <div class="runs-list">
                ${runs.length
                    ? runs.map((run, index) => {
                        const length = Math.max(0, Number(run.length || 0));
                        const fromTag = run.fromCanvasItemId || "";
                        const toTag = run.toCanvasItemId || "";
                        const conduitQty = run.conduit
                            ? `${formatRunFeet(length)} ft`
                            : "—";

                        return `
                            <article class="run-materials-row" data-run-id="${runModalEscape(run.id)}">
                                <div class="run-name">
                                    <div class="run-name-line">
                                        <span class="run-number" aria-label="Run ${index + 1}">${index + 1}</span>
                                        <strong>${runModalEscape(run.name || `Run ${index + 1}`)}</strong>
                                    </div>
                                    <div class="canvas-component-previews">
                                        ${renderRunCanvasComponentPreview(fromTag, "From")}
                                        <span class="canvas-component-arrow">→</span>
                                        ${renderRunCanvasComponentPreview(toTag, "To")}
                                    </div>
                                </div>
                                <button class="run-material-button" type="button" data-action="conduit" title="Select conduit">
                                    ${runModalEscape(getRunMaterialLabel(run.conduit, "Select conduit"))}
                                </button>
                                <button class="run-material-button" type="button" data-action="fittings" title="Select run fittings">
                                    ${runModalEscape(getRunFittingsSummary(run))}
                                </button>
                                <label class="run-length-field">
                                    <input
                                        class="run-materials-length-input"
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
                                </div>
                                <div class="run-actions run-materials-actions">
                                    <button class="run-delete" type="button" data-action="delete-run" title="Remove Run ${index + 1}" aria-label="Remove Run ${index + 1}">&times;</button>
                                </div>
                            </article>
                        `;
                    }).join("")
                    : `<div class="runs-empty">Create a canvas link or add a Run first.</div>`
                }
            </div>

            <footer class="runs-footer">
                <div class="runs-rule">Wire edits remain under Runs.</div>
                <button class="runs-done" type="button">Done</button>
            </footer>
        </section>
    `;

    const dialog = overlay.querySelector(".runs-dialog");
    if (dialog && runMaterialsModalScrollTop > 0) {
        requestAnimationFrame(() => {
            dialog.scrollTop = runMaterialsModalScrollTop;
        });
    }

    overlay.querySelector(".runs-close")?.addEventListener(
        "click",
        closeRunMaterialsModal
    );
    overlay.querySelector(".runs-done")?.addEventListener(
        "click",
        closeRunMaterialsModal
    );

    overlay.querySelectorAll(".run-materials-row").forEach(row => {
        const runId = row.dataset.runId;

        row.querySelector("[data-action='conduit']")?.addEventListener(
            "click",
            () => openRunMaterialPicker(runId, "conduit", "materials")
        );
        row.querySelector("[data-action='fittings']")?.addEventListener(
            "click",
            () => openRunFittingModal(runId, "materials")
        );

        const lengthInput = row.querySelector(".run-materials-length-input");
        lengthInput?.addEventListener("focus", () => lengthInput.select());
        lengthInput?.addEventListener("input", event => {
            const run = findRun(runId);
            if (!run) return;

            const value = Math.max(0, Number(event.target.value || 0));
            run.length = Number.isFinite(value) ? value : 0;
            saveRunsDraft();
        });
        lengthInput?.addEventListener("change", event => {
            const run = findRun(runId);
            if (!run) return;

            const value = Math.max(0, Number(event.target.value || 0));
            run.length = Number.isFinite(value) ? value : 0;
            captureRunsHistory("Run length updated");
            refreshRunsBOM();
            renderRunMaterialsModal();
        });

        row.querySelector("[data-action='delete-run']")?.addEventListener("click", () => {
            if (!removeRunAndCanvasLink(runId)) return;
            renderRunMaterialsModal();
        });
    });

}

function renderRunsModal() {

    const overlay = ensureRunsModal();
    const previousDialog = overlay.querySelector(".runs-dialog");
    if (previousDialog) {
        runsModalScrollTop = previousDialog.scrollTop;
    }
    const runs = getEditableRuns();
    const gutters = getEditableGutters();
    const canvasTags = getCanvasTagOptions();

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
                <span>Run / canvas tag</span>
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

                        const fromTag = run.fromCanvasItemId || "";
                        const toTag = run.toCanvasItemId || "";
                        const usesPresetMainWire = !runConnectsToContactor(run) &&
                            getRunAllMainConductorSources(run).some(isPrescribedWireAssMainSource);
                        return `
                            <article class="run-row" data-run-id="${runModalEscape(run.id)}">
                                <div class="run-name">
                                    <div class="run-name-line">
                                        <span class="run-number" aria-label="Run ${index + 1}">${index + 1}</span>
                                        <input
                                            class="run-name-input"
                                            type="text"
                                            maxlength="80"
                                            value="${runModalEscape(run.name || `Run ${index + 1}`)}"
                                            aria-label="Run ${index + 1} name"
                                        >
                                    </div>
                                    <div class="canvas-tag-selects">
                                        <div class="canvas-component-previews">
                                            ${renderRunCanvasComponentPreview(fromTag, "From")}
                                            <span class="canvas-component-arrow">→</span>
                                            ${renderRunCanvasComponentPreview(toTag, "To")}
                                        </div>
                                        <select data-action="run-from" aria-label="Run ${index + 1} from canvas item">
                                            ${renderCanvasTagOptions(canvasTags, fromTag, "From canvas item")}
                                        </select>
                                        <span>→</span>
                                        <select data-action="run-to" aria-label="Run ${index + 1} to canvas item">
                                            ${renderCanvasTagOptions(canvasTags, toTag, "To canvas item")}
                                        </select>
                                    </div>
                                </div>
                                <button class="run-material-button" type="button" data-action="conduit" title="Select conduit">
                                    ${runModalEscape(getRunMaterialLabel(run.conduit, "Select conduit"))}
                                </button>
                                <div class="run-wire-field">
                                    <button class="run-material-button" type="button" data-action="wire" title="Select wire using ampacity filters">
                                        ${runModalEscape(getRunWireLabel(wires))}
                                    </button>
                                    <div class="run-wire-actions">
                                        ${usesPresetMainWire ? "" : `<button type="button" class="run-circuit-button" data-action="panel-breakers" title="Choose breakers from the connected panel">${runModalEscape(getRunCircuitSummary(run))}</button>`}
                                        <button type="button" class="run-circuit-button" data-action="wire-condition" title="Choose which WireAss groups this run uses">${runModalEscape(getRunWireConditionSummary(run))}</button>
                                        <button type="button" class="run-circuit-button" data-action="auto-wire" title="Automatically assign wires from WireAss">Auto wire</button>
                                        <button type="button" class="run-circuit-button" data-action="wire-assignments" title="Assign wire groups to selected breakers">${runModalEscape(getRunWireAssignmentSummary(run))}</button>
                                        <button type="button" data-action="copy-wire" ${wires.length ? "" : "disabled"}>Copy wire</button>
                                        <button type="button" data-action="paste-wire" ${runWireClipboard?.length ? "" : "disabled"}>Paste wire</button>
                                    </div>
                                </div>
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
                                <div class="run-actions">
                                    <button class="run-duplicate" type="button" data-action="duplicate-run" title="Duplicate Run ${index + 1}" aria-label="Duplicate Run ${index + 1}">⧉</button>
                                    <button class="run-delete" type="button" title="Remove Run ${index + 1}" aria-label="Remove Run ${index + 1}">✕</button>
                                </div>
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
                    <span>Gutter / canvas tag</span>
                    <span>Included runs</span>
                    <span>Fittings</span>
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
                                        <div class="gutter-name">
                                            <input class="gutter-name-input" type="text" maxlength="120"
                                                value="${runModalEscape(gutter.name || `Gutter ${index + 1}`)}"
                                                aria-label="Gutter ${index + 1} name">
                                            <select class="gutter-tag-select" aria-label="Gutter ${index + 1} canvas item">
                                                ${renderCanvasTagOptions(canvasTags, gutter.canvasItemId, "Map to canvas item")}
                                            </select>
                                        </div>
                                        <button class="gutter-runs-button" type="button" data-action="toggle-gutter-runs">
                                            ${runModalEscape(getGutterRunSummary(gutter, runs))}
                                        </button>
                                        <button class="run-material-button" type="button" data-action="gutter-fittings" title="Select gutter fittings by included run size">
                                            ${runModalEscape(getRunFittingsSummary(gutter))}
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
                                                        <span>${runModalEscape(run.name || `Run ${runIndex + 1}`)}</span>
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
                <button id="addLinkRunButton" class="runs-add" type="button">+ Run from Link</button>
                <button id="addGutterButton" class="runs-add" type="button">+ Add Gutter</button>
                <div class="runs-rule">Wire BOM = run length + 4 ft</div>
                <button id="doneRunsButton" class="runs-done" type="button">Done</button>
            </footer>
        </section>
    `;

    const dialog = overlay.querySelector(".runs-dialog");
    if (dialog && runsModalScrollTop > 0) {
        requestAnimationFrame(() => {
            dialog.scrollTop = runsModalScrollTop;
        });
    }

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

    overlay.querySelector("#addLinkRunButton")?.addEventListener(
        "click",
        openRunFromCanvasLinkModal
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

        row.querySelector("[data-action='panel-breakers']")?.addEventListener(
            "click",
            () => openRunCircuitModal(runId)
        );

        row.querySelector("[data-action='wire-condition']")?.addEventListener(
            "click",
            () => openRunWireConditionModal(runId)
        );

        row.querySelector("[data-action='wire-assignments']")?.addEventListener(
            "click",
            () => openRunWireAssignmentModal(runId)
        );

        row.querySelector("[data-action='auto-wire']")?.addEventListener(
            "click",
            () => {
                const run = findRun(runId);
                if (!run) return;

                const result = autoAssignRunWires(run, {
                    resetSuppressed: true
                });
                if (!result.assigned) {
                    alert("No WireAss rule matched this run's endpoints or selected breakers.");
                    return;
                }

                captureRunsHistory("Run wires auto-assigned");
                refreshRunsBOM();
                renderRunsModal();
            }
        );

        row.querySelector("[data-action='copy-wire']")?.addEventListener(
            "click",
            () => {
                const run = findRun(runId);
                if (!run) return;

                runWireClipboard = structuredClone(
                    Array.isArray(run.wires)
                        ? run.wires
                        : (run.wire ? [run.wire] : [])
                );
                renderRunsModal();
            }
        );

        row.querySelector("[data-action='paste-wire']")?.addEventListener(
            "click",
            () => {
                const run = findRun(runId);
                if (!run || !runWireClipboard?.length) return;

                run.wires = structuredClone(runWireClipboard);
                delete run.wire;
                captureRunsHistory("Run wire pasted");
                refreshRunsBOM();
                renderRunsModal();
            }
        );

        row.querySelector("[data-action='fittings']")?.addEventListener(
            "click",
            () => openRunFittingModal(runId)
        );

        row.querySelector(".run-name-input")?.addEventListener(
            "input",
            event => {
                const run = findRun(runId);
                if (!run) return;

                run.name = String(event.target.value || "").trim() || "Run";
                saveRunsDraft();
            }
        );

        ["run-from", "run-to"].forEach(action => {
            row.querySelector(`[data-action='${action}']`)?.addEventListener("change", event => {
                const run = findRun(runId);
                if (!run) return;
                if (action === "run-from") run.fromCanvasItemId = String(event.target.value || "");
                else run.toCanvasItemId = String(event.target.value || "");
                updateRunCanvasName(run, getEditableRuns().indexOf(run), getCanvasTagOptions());
                // Each newly mapped panel contributes all of its installed
                // branch breakers by default. The Panel breakers button can
                // still be used afterwards to remove any circuit manually.
                const circuits = getRunPanelCircuits(run);
                run.panelBreakerSources = circuits.map(createRunCircuitSource);
                run.panelBreakerSourcesConfigured = true;
                run.panelBreakerExcludedSourceKeys = [];

                const hasWireSource = getRunAllMainConductorSources(run).length > 0 || circuits.length > 0;
                if (hasWireSource) {
                    autoAssignRunWires(run);
                }
                captureRunsHistory("Run mapped to canvas");
                saveRunsDraft();
                if (hasWireSource) refreshRunsBOM();
                renderRunsModal();
            });
        });

        row.querySelector(".run-name-input")?.addEventListener(
            "change",
            event => {
                const run = findRun(runId);
                if (!run) return;

                run.name = String(event.target.value || "").trim() || "Run";
                event.target.value = run.name;
                captureRunsHistory("Run renamed");
                saveRunsDraft();
            }
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
                if (!removeRunAndCanvasLink(runId)) return;
                renderRunsModal();
            }
        );

        row.querySelector("[data-action='duplicate-run']")?.addEventListener(
            "click",
            () => {
                const runs = getEditableRuns();
                const index = runs.findIndex(run => run.id === runId);
                if (index < 0) return;

                const copy = structuredClone(runs[index]);
                copy.id = crypto.randomUUID();
                copy.name = getDuplicateRunName(runs[index], runs);
                // A canvas link has one owner. A duplicated run is a manual
                // estimate unless the user creates a separate canvas link.
                copy.canvasLinkId = "";
                runs.splice(index + 1, 0, copy);

                captureRunsHistory("Run duplicated");
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

        entry.querySelector("[data-action='gutter-fittings']")?.addEventListener(
            "click",
            () => openGutterFittingModal(gutterId)
        );

        entry.querySelector(".gutter-name-input")?.addEventListener("input", event => {
            const gutter = findGutter(gutterId);
            if (!gutter) return;
            gutter.name = String(event.target.value || "").trim() || "Gutter";
            saveRunsDraft();
        });

        entry.querySelector(".gutter-name-input")?.addEventListener("change", event => {
            const gutter = findGutter(gutterId);
            if (!gutter) return;
            gutter.name = String(event.target.value || "").trim() || "Gutter";
            event.target.value = gutter.name;
            captureRunsHistory("Gutter renamed");
            saveRunsDraft();
        });

        entry.querySelector(".gutter-tag-select")?.addEventListener("change", event => {
            const gutter = findGutter(gutterId);
            if (!gutter) return;
            gutter.canvasItemId = String(event.target.value || "");
            const tag = getCanvasTagLabel(gutter.canvasItemId);
            if (tag) gutter.name = tag;
            captureRunsHistory("Gutter mapped to canvas");
            saveRunsDraft();
            renderRunsModal();
        });

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

async function openRunMaterialPicker(runId, materialType, returnTo = "runs") {

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

    const overlay = returnTo === "materials"
        ? ensureRunMaterialsModal()
        : ensureRunsModal();
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
                if (returnTo === "materials") {
                    openRunMaterialsModal();
                }
                else {
                    openRunsModal();
                }
            }
        }
    );

}

function openRunWireModal(runId) {

    const run = findRun(runId);

    if (!run) return;

    const draftConnection = {
        hardware: structuredClone(getRunManualWires(run)),
        runWirePicker: true
    };

    const overlay = ensureRunsModal();
    overlay.style.display = "none";

    openMaterialModal(draftConnection, {
        category: "WIRE",
        onClose: () => {
            const currentRun = findRun(runId);

            if (currentRun) {
                currentRun.manualWires = structuredClone(
                    draftConnection.hardware
                );
                rebuildRunWiresFromAssignments(currentRun);

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
        return getDriveImageUrl(driveId, 200);
    }

    return `images/materials/${encodeURIComponent(
        String(material?.CatalogNumber || "")
    )}.png`;

}

async function openRunFittingModal(runId, returnTo = "runs") {

    const run = findRun(runId);

    if (!run) return;

    fittingReturnModal = returnTo;

    openFittingModalForTarget(run, {
        title: `${run.name || "Run"} Fittings`,
        historyLabel: "Run fitting"
    });

}

async function openGutterFittingModal(gutterId) {

    const gutter = findGutter(gutterId);
    const options = gutter
        ? getGutterFittingSizeOptions(gutter, getEditableRuns())
        : [];

    if (!gutter) return;

    fittingReturnModal = "runs";

    if (options.length === 0) {
        alert("Include a Run with a selected conduit size before adding gutter fittings.");
        return;
    }

    const selected = options[0];

    const target = {
        name: gutter.name || "Gutter",
        conduit: { Size: selected.size },
        fittings: getGutterFittings(gutter)
    };

    openFittingModalForTarget(target, {
        title: `${gutter.name || "Gutter"} Fittings`,
        context: selected.sourceRuns.join(", "),
        historyLabel: "Gutter fitting",
        sizeOptions: options,
        selectedSizes: options.map(option => option.size)
    });

}

async function openFittingModalForTarget(target, options = {}) {

    if (!target?.conduit?.Size) {
        alert("Select the conduit first so fittings can be filtered by size.");
        return;
    }

    activeFittingTarget = target;

    const materials = typeof getMaterials === "function"
        ? await getMaterials()
        : [];

    renderRunFittingModal(target, materials, options);

}

function renderRunFittingModal(run, materials, options = {}) {

    const overlay = ensureFittingModal();
    const previousTable = overlay.querySelector(".run-fitting-table-wrap");
    const previousSummary = overlay.querySelector(".fitting-summary-list");
    const scrollState = {
        tableLeft: previousTable?.scrollLeft || 0,
        tableTop: previousTable?.scrollTop || 0,
        summaryTop: previousSummary?.scrollTop || 0
    };
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
    const availableSizeOptions = Array.isArray(options.sizeOptions)
        ? options.sizeOptions
        : [];
    const selectedSizes = availableSizeOptions.length
        ? (Array.isArray(options.selectedSizes) && options.selectedSizes.length
            ? options.selectedSizes.filter(size => availableSizeOptions.some(option => option.size === size))
            : availableSizeOptions.map(option => option.size))
        : [run.conduit.Size];
    options.selectedSizes = selectedSizes;
    const displayedSizes = selectedSizes.join(", ") || "None";
    const fittingContext = options.context
        ? `${options.context} · Sizes`
        : "Conduit size";
    const sizeFilter = availableSizeOptions.length > 1
        ? `
            <fieldset class="fitting-size-filter">
                <legend>Size filter</legend>
                <span>Size filter</span>
                <div class="fitting-size-options">
                    ${availableSizeOptions.map(option => `
                        <label title="${runModalEscape(option.sourceRuns.join(", "))}">
                            <input type="checkbox" value="${runModalEscape(option.size)}" ${selectedSizes.includes(option.size) ? "checked" : ""}>
                            <b>${runModalEscape(option.size)}</b>
                            <small>${runModalEscape(option.sourceRuns.join(", "))}</small>
                        </label>
                    `).join("")}
                </div>
            </fieldset>
        `
        : "";

    // Put conduit systems on the vertical axis and fitting types across the
    // horizontal axis. This gives each square material tile more room.
    const rows = FITTING_MATRIX_COLUMNS.map(column => {
        const cells = FITTING_MATRIX_ROWS.map(row => {
            const material = getFittingCandidates(materials, run, row, column, selectedSizes)[0] || null;

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
                    <h2 id="runFittingTitle">${runModalEscape(options.title || `${run.name || "Run"} Fittings`)}</h2>
                    <p>${runModalEscape(fittingContext)}: <strong>${runModalEscape(displayedSizes)}</strong>. ${fittingQuantityMode ? "Qty mode: click an image to set its exact quantity." : "Click an image to add one fitting."}</p>
                    ${sizeFilter}
                </div>
                <label class="fitting-qty-mode" title="Off: add one fitting per click. On: enter an exact quantity after clicking.">
                    <span>Qty mode</span>
                    <input type="checkbox" ${fittingQuantityMode ? "checked" : ""}>
                    <i aria-hidden="true"></i>
                </label>
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

    overlay.querySelectorAll(".fitting-size-filter input[type='checkbox']").forEach(input => {
        input.addEventListener("change", () => {
            const nextSizes = [...overlay.querySelectorAll(".fitting-size-filter input[type='checkbox']:checked")]
                .map(box => box.value);
            if (!nextSizes.length) {
                input.checked = true;
                return;
            }
            options.selectedSizes = nextSizes;
            renderRunFittingModal(run, materials, options);
        });
    });

    overlay.querySelector(".fitting-qty-mode input")?.addEventListener("change", event => {
        fittingQuantityMode = event.target.checked;
        renderRunFittingModal(run, materials, options);
    });

    overlay.querySelectorAll(".fitting-image-button").forEach(button => {
        button.addEventListener("click", () => {
            const material = catalogLookup.get(button.dataset.catalog || "");
            if (!material) return;

            if (fittingQuantityMode) {
                const current = getFittingQuantity(run, material);
                const input = window.prompt(
                    `Set quantity for ${material.Description || material.CatalogNumber}`,
                    String(current || 1)
                );
                if (input === null) return;

                const quantity = Number(input);
                if (!Number.isInteger(quantity) || quantity < 0) {
                    alert("Enter a whole number that is zero or greater.");
                    return;
                }

                setRunFittingQuantity(run, material, quantity);
                captureRunsHistory(`${options.historyLabel || "Run fitting"} quantity updated`);
            }
            else {
                addRunFitting(run, material);
                captureRunsHistory(`${options.historyLabel || "Run fitting"} added`);
            }
            refreshRunsBOM();
            renderRunFittingModal(run, materials, options);
        });
    });

    overlay.querySelectorAll(".fitting-remove-button").forEach(button => {
        button.addEventListener("click", () => {
            const material = catalogLookup.get(button.dataset.catalog || "");
            if (!material) return;

            removeRunFitting(run, material);
            captureRunsHistory(`${options.historyLabel || "Run fitting"} removed`);
            refreshRunsBOM();
            renderRunFittingModal(run, materials, options);
        });
    });

    overlay.style.display = "flex";

    // Adding/removing a fitting rebuilds the quantities. Keep the user at
    // the same position in the large matrix instead of jumping back to top.
    const table = overlay.querySelector(".run-fitting-table-wrap");
    const summary = overlay.querySelector(".fitting-summary-list");
    if (table) {
        table.scrollLeft = scrollState.tableLeft;
        table.scrollTop = scrollState.tableTop;
    }
    if (summary) summary.scrollTop = scrollState.summaryTop;

}

function closeRunFittingModal() {

    if (fittingModalElement) fittingModalElement.style.display = "none";

    activeFittingTarget = null;

    if (fittingReturnModal === "materials") {
        openRunMaterialsModal();
    }
    else {
        renderRunsModal();
    }

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

function openRunMaterialsModal() {

    const overlay = ensureRunMaterialsModal();

    renderRunMaterialsModal();
    overlay.style.display = "flex";

}

function closeRunMaterialsModal() {

    if (runMaterialsModalElement) {
        runMaterialsModalElement.style.display = "none";
    }

}

// Expose the toolbar entry point only after this module has fully evaluated.
window.openRunsModal = openRunsModal;
window.closeRunsModal = closeRunsModal;
window.openRunMaterialsModal = openRunMaterialsModal;
window.closeRunMaterialsModal = closeRunMaterialsModal;
window.autoCreateRunFromCanvasLink = autoCreateRunFromCanvasLink;
window.refreshRunsForCanvasComponent = refreshRunsForCanvasComponent;
window.removeRunsForCanvasLink = removeRunsForCanvasLink;
window.removeRunsForCanvasLinks = removeRunsForCanvasLinks;
