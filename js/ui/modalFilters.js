//----------------------------------
// Modal Filter State
//----------------------------------

let selectedCategory = "FITTING";
let selectedFittingType = "All";
let selectedMaterialType = "All";
let selectedSize = "All";
let selectedWirePreset = "SINGLE";

// Clickable ampacity-table filter state
let selectedAmpacityMaterial = "COPPER";
let selectedAmpacityRow = null;

//----------------------------------
// Wire Presets
//----------------------------------

const WIRE_PRESETS = {

    SINGLE: null,
    RB: ["RED", "BLACK"],
    BB: ["BLACK", "BLACK"],
    BBB: ["BLACK", "BLACK", "BLACK"],
    RBG: ["RED", "BLACK", "GREEN"],
    RWB: ["RED", "WHITE", "BLACK"],
    RGWB: ["RED", "GREEN", "WHITE", "BLACK"]

};

//----------------------------------
// Ampacity Reference Tables
//----------------------------------

const WIRE_AMPACITY_TABLES = {

    COPPER: [
        { awg: "#18", mm2: "0.82", ampacity: 14 },
        { awg: "#16", mm2: "1.31", ampacity: 18 },
        { awg: "#14", mm2: "2.08", ampacity: 25 },
        { awg: "#12", mm2: "3.31", ampacity: 30 },
        { awg: "#10", mm2: "5.26", ampacity: 40 },
        { awg: "#8",  mm2: "8.37", ampacity: 55 },
        { awg: "#6",  mm2: "13.3", ampacity: 75 },
        { awg: "#4",  mm2: "21.2", ampacity: 95 },
        { awg: "#3",  mm2: "26.7", ampacity: 115 },
        { awg: "#2",  mm2: "33.6", ampacity: 130 },
        { awg: "#1",  mm2: "42.4", ampacity: 150 },
        { awg: "1/0", mm2: "53.5", ampacity: 175 },
        { awg: "2/0", mm2: "67.4", ampacity: 195 },
        { awg: "3/0", mm2: "85.0", ampacity: 225 },
        { awg: "4/0", mm2: "107.2", ampacity: 260 }
    ],

    ALUMINUM: [
        { awg: "12", mm2: "3.31", ampacity: 25 },
        { awg: "10", mm2: "5.26", ampacity: 35 },
        { awg: "8",  mm2: "8.37", ampacity: 45 },
        { awg: "6",  mm2: "13.3", ampacity: 60 },
        { awg: "4",  mm2: "21.2", ampacity: 75 },
        { awg: "3",  mm2: "26.7", ampacity: 85 },
        { awg: "2",  mm2: "33.6", ampacity: 100 },
        { awg: "1",  mm2: "42.4", ampacity: 115 },
        { awg: "1/0", mm2: "53.5", ampacity: 135 },
        { awg: "2/0", mm2: "67.4", ampacity: 150 },
        { awg: "3/0", mm2: "85.0", ampacity: 175 },
        { awg: "4/0", mm2: "107.2", ampacity: 205 }
    ]

};

//----------------------------------
// Reset Filters
//----------------------------------

function resetModalFilters() {

    selectedCategory = "FITTING";
    selectedFittingType = "All";
    selectedMaterialType = "All";
    selectedSize = "All";
    selectedWirePreset = "SINGLE";
    selectedAmpacityMaterial = "COPPER";
    selectedAmpacityRow = null;

    renderWireAmpacityPanel();

}

//----------------------------------
// Set Category Programmatically
//----------------------------------

function setModalCategory(category) {

    selectedCategory = normalizeModalValue(category);
    selectedFittingType = "All";
    selectedMaterialType = "All";
    selectedSize = "All";
    selectedWirePreset = "SINGLE";
    selectedAmpacityRow = null;

}

//----------------------------------
// Normalize Value
//----------------------------------

function normalizeModalValue(value) {

    return String(value || "")
        .trim()
        .toUpperCase();

}

//----------------------------------
// Category Helpers
//----------------------------------

function isWireMode() {

    return selectedCategory === "WIRE";

}

function isPipeMode() {

    return selectedCategory === "PIPE";

}

function isBreakerMode() {

    return selectedCategory === "BREAKER";

}

function isFittingMode() {

    return selectedCategory === "FITTING";

}

//----------------------------------
// Fitting Record
//----------------------------------

function isFittingRecord(item) {

    const nodeType = normalizeModalValue(item.NodeType);

    return (

        nodeType !== "PIPE" &&
        nodeType !== "WIRE" &&
        nodeType !== "BREAKER"

    );

}

//----------------------------------
// Unique Values
//----------------------------------

function getUniqueModalValues(list, property) {

    return [

        ...new Set(

            list
                .map(item => normalizeModalValue(item[property]))
                .filter(Boolean)

        )

    ].sort((a, b) => a.localeCompare(b));

}

//----------------------------------
// Sort Sizes
//----------------------------------

function sortModalSizes(values) {

    const conduitOrder = [

        '3/4"',
        '1"',
        '1-1/4"',
        '1-1/2"',
        '2"'

    ];

    return [...values].sort((a, b) => {

        const aIndex = conduitOrder.indexOf(a);
        const bIndex = conduitOrder.indexOf(b);

        if (aIndex !== -1 && bIndex !== -1) {

            return aIndex - bIndex;

        }

        if (aIndex !== -1) return -1;
        if (bIndex !== -1) return 1;

        return String(a).localeCompare(

            String(b),
            undefined,
            {
                numeric: true,
                sensitivity: "base"
            }

        );

    });

}

//----------------------------------
// Create Dynamic Filter Group
//----------------------------------

function ensureDynamicFilterGroup(

    referenceChips,
    groupId,
    labelText,
    chipsId

) {

    let group = document.getElementById(groupId);

    if (group) return group;

    const referenceGroup = referenceChips
        ? referenceChips.closest(".filter-group")
        : null;

    if (!referenceGroup || !referenceGroup.parentElement) {

        return null;

    }

    group = document.createElement("div");
    group.id = groupId;
    group.className = "filter-group";

    const label = document.createElement("div");
    label.className = "filter-label";
    label.textContent = labelText;

    const chips = document.createElement("div");
    chips.id = chipsId;
    chips.className = "chip-container";

    group.appendChild(label);
    group.appendChild(chips);

    referenceGroup.insertAdjacentElement("afterend", group);

    return group;

}

//----------------------------------
// Update Group Label
//----------------------------------

function updateGroupLabel(chips, text) {

    if (!chips) return;

    const group = chips.closest(".filter-group");

    if (!group) return;

    const label = group.querySelector(

        ".filter-label, label, h3, h4"

    );

    if (label) {

        label.textContent = text;

    }

}

//----------------------------------
// Show / Hide Group
//----------------------------------

function setFilterGroupVisible(chips, visible) {

    if (!chips) return;

    const group = chips.closest(".filter-group");

    if (group) {

        group.style.display = visible
            ? ""
            : "none";

    }

}

//----------------------------------
// Normalize Wire AWG
//----------------------------------

function normalizeWireAWG(value) {

    let text = normalizeModalValue(value);

    if (!text) return "";

    //----------------------------------
    // Match X/0 sizes first
    //----------------------------------

    const oughtMatch = text.match(
        /(?:#\s*)?([1-4])\s*\/\s*0\b/
    );

    if (oughtMatch) {

        return `${oughtMatch[1]}/0`;

    }

    //----------------------------------
    // Explicit hash size
    //----------------------------------

    const hashMatch = text.match(
        /#\s*(18|16|14|12|10|8|6|4|3|2|1)\b/
    );

    if (hashMatch) {

        return hashMatch[1];

    }

    //----------------------------------
    // Common formatted size fields
    //----------------------------------

    const exactMatch = text.match(
        /^(?:AWG\s*)?#?\s*(18|16|14|12|10|8|6|4|3|2|1)\s*(?:AWG)?$/
    );

    if (exactMatch) {

        return exactMatch[1];

    }

    //----------------------------------
    // Description fallback
    //----------------------------------

    const descriptionMatch = text.match(
        /\b(18|16|14|12|10|8|6|4|3|2|1)\s*(?:AWG|THHN|THWN(?:-2)?|XHHW(?:-2)?|STR|STRANDED|SOL|SOLID)\b/
    );

    if (descriptionMatch) {

        return descriptionMatch[1];

    }

    return "";

}


//----------------------------------
// Read Wire AWG From Material
//----------------------------------

function getWireItemAWG(item) {

    //----------------------------------
    // Prefer dedicated size fields
    //----------------------------------

    const preferredCandidates = [

        item.Size,
        item.WireSize,
        item.AWG

    ];

    for (const candidate of preferredCandidates) {

        const awg = normalizeWireAWG(candidate);

        if (awg) {

            return awg;

        }

    }

    //----------------------------------
    // Description fallback
    //----------------------------------

    const description =
        normalizeModalValue(
            item.Description
        );

    const descriptionOughtMatch =
        description.match(
            /(?:#\s*)?([1-4])\s*\/\s*0\b/
        );

    if (descriptionOughtMatch) {

        return `${descriptionOughtMatch[1]}/0`;

    }

    const descriptionMatch =
        description.match(
            /(?:#\s*)?(18|16|14|12|10|8|6|4|3|2|1)\s*(?:AWG|THHN|THWN(?:-2)?|XHHW(?:-2)?|STR|STRANDED|SOL|SOLID)\b/
        );

    if (descriptionMatch) {

        return descriptionMatch[1];

    }

    //----------------------------------
    // Catalog Number fallback
    //----------------------------------

    const catalog =
        normalizeModalValue(
            item.CatalogNumber
        );

    const catalogOughtMatch =
        catalog.match(
            /(?:THHN|THWN|XHHW)([1-4])\/0/
        );

    if (catalogOughtMatch) {

        return `${catalogOughtMatch[1]}/0`;

    }

    const catalogMatch =
        catalog.match(
            /(?:THHN|THWN|XHHW)(18|16|14|12|10|8|6|4|3|2|1)(?=[A-Z]|$)/
        );

    if (catalogMatch) {

        return catalogMatch[1];

    }

    return "";

}


//----------------------------------
// Ampacity Selection Match
//----------------------------------

function isAmpacityRowSelected(row) {

    if (!selectedAmpacityRow) {

        return false;

    }

    return (

        normalizeWireAWG(
            selectedAmpacityRow.awg
        ) ===
        normalizeWireAWG(
            row.awg
        ) &&

        selectedAmpacityMaterial ===
        selectedAmpacityRow.material

    );

}


//----------------------------------
// Set Ampacity Row Filter
//----------------------------------

function selectAmpacityTableRow(row) {

    //----------------------------------
    // Toggle Selected Row
    //----------------------------------

    if (isAmpacityRowSelected(row)) {

        selectedAmpacityRow = null;

    }

    else {

        selectedAmpacityRow = {

            ...row,

            awg:
                normalizeWireAWG(
                    row.awg
                ),

            material:
                selectedAmpacityMaterial

        };

    }

    //----------------------------------
    // Do not synchronize selectedSize.
    // Wire size text can be 14, #14,
    // or 14 AWG. Ampacity filtering
    // normalizes these formats itself.
    //----------------------------------

    selectedSize = "All";

    renderWireAmpacityPanel();

    const searchInput =
        document.getElementById(
            "modalSearch"
        );

    buildModalList(

        searchInput
            ? searchInput.value
            : ""

    );

}

//----------------------------------
// Inject Ampacity Styles
//----------------------------------

function ensureWireAmpacityStyles() {

    if (document.getElementById(
        "wireAmpacityInjectedStyles"
    )) return;

    const style = document.createElement("style");
    style.id = "wireAmpacityInjectedStyles";

    style.textContent = `
        #equipmentModal .modal-content.wire-ampacity-modal {
            width: min(1500px, 96vw) !important;
            max-width: 96vw !important;
        }

        #equipmentModal .modal-body.wire-ampacity-layout {
            display: grid !important;
            grid-template-columns: minmax(140px, 190px) minmax(0, 1fr) 260px !important;
            align-items: stretch;
            gap: 12px;
        }

        #wireAmpacityPanel {
            min-width: 0;
            overflow: hidden;
            border-left: 1px solid rgba(88, 125, 178, 0.45);
            border-radius: 0 8px 8px 0;
            background: linear-gradient(180deg, #132541, #0d1b31);
            color: #f4f7ff;
        }

        #wireAmpacityPanel[hidden] {
            display: none !important;
        }

        .wire-ampacity-inner {
            height: 100%;
            padding: 14px 12px 12px;
            box-sizing: border-box;
        }

        .wire-ampacity-heading {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 10px;
            font-size: 13px;
            font-weight: 800;
        }

        .wire-ampacity-info {
            display: inline-grid;
            place-items: center;
            width: 17px;
            height: 17px;
            border: 1px solid #8da5c8;
            border-radius: 50%;
            color: #cfe0ff;
            font-size: 11px;
        }

        .wire-ampacity-tabs {
            display: grid;
            grid-template-columns: 1fr 1fr;
            margin-bottom: 8px;
        }

        .wire-ampacity-tab {
            min-height: 32px;
            border: 1px solid #405f8b;
            background: #0b172c;
            color: #dce8fa;
            cursor: pointer;
            font-size: 10px;
            font-weight: 700;
        }

        .wire-ampacity-tab:first-child {
            border-radius: 5px 0 0 5px;
        }

        .wire-ampacity-tab:last-child {
            border-radius: 0 5px 5px 0;
        }

        .wire-ampacity-tab.active {
            border-color: #ffb000;
            background: linear-gradient(180deg, #ffc238, #f5a800);
            color: #111827;
        }

        .wire-ampacity-table {
            width: 100%;
            border-collapse: separate;
            border-spacing: 0;
            overflow: hidden;
            border: 1px solid #36547d;
            border-radius: 5px;
            font-size: 11px;
        }

        .wire-ampacity-table th,
        .wire-ampacity-table td {
            padding: 7px 6px;
            border-right: 1px solid #36547d;
            border-bottom: 1px solid #36547d;
            text-align: center;
        }

        .wire-ampacity-table th:last-child,
        .wire-ampacity-table td:last-child {
            border-right: 0;
        }

        .wire-ampacity-table tr:last-child td {
            border-bottom: 0;
        }

        .wire-ampacity-table th {
            background: #09162a;
            color: #f1f5ff;
            font-size: 10px;
        }

        .wire-ampacity-row {
            cursor: pointer;
            transition: background 120ms ease,
                        color 120ms ease;
        }

        .wire-ampacity-row:hover {
            background: rgba(255, 177, 0, 0.16);
        }

        .wire-ampacity-row.active {
            background: linear-gradient(90deg, #ffc42d, #f4ac00);
            color: #101827;
            font-weight: 900;
        }

        .wire-ampacity-row.active td:first-child::before {
            content: "▶";
            margin-right: 5px;
            color: #ffffff;
            font-size: 9px;
        }

        .wire-ampacity-reference {
            margin-top: 9px;
            color: #9eb0ca;
            font-size: 9px;
            line-height: 1.45;
        }

        .wire-ampacity-clear {
            width: 100%;
            min-height: 30px;
            margin-top: 8px;
            border: 1px solid #49698f;
            border-radius: 5px;
            background: #0b172c;
            color: #dce8fa;
            cursor: pointer;
            font-size: 10px;
            font-weight: 700;
        }

        .wire-ampacity-clear:hover {
            border-color: #ffb000;
            color: #ffbf26;
        }

        @media (max-width: 1050px) {
            #equipmentModal .modal-body.wire-ampacity-layout {
                grid-template-columns: minmax(135px, 170px) minmax(0, 1fr) !important;
            }

            #wireAmpacityPanel {
                grid-column: 1 / -1;
                border-left: 0;
                border-top: 1px solid rgba(88, 125, 178, 0.45);
                border-radius: 0 0 8px 8px;
            }

            .wire-ampacity-inner {
                max-height: 420px;
                overflow: auto;
            }
        }
    `;

    document.head.appendChild(style);

}

//----------------------------------
// Ensure Ampacity Panel
//----------------------------------

function ensureWireAmpacityPanel() {

    ensureWireAmpacityStyles();

    let panel = document.getElementById(
        "wireAmpacityPanel"
    );

    if (panel) return panel;

    const modalBody = document.querySelector(
        "#equipmentModal .modal-body"
    );

    if (!modalBody) return null;

    panel = document.createElement("aside");
    panel.id = "wireAmpacityPanel";
    panel.hidden = true;

    modalBody.appendChild(panel);

    return panel;

}

//----------------------------------
// Render Ampacity Panel
//----------------------------------

function renderWireAmpacityPanel() {

    const panel = ensureWireAmpacityPanel();
    const modalBody = document.querySelector(
        "#equipmentModal .modal-body"
    );
    const modalContent = document.querySelector(
        "#equipmentModal .modal-content"
    );

    if (!panel || !modalBody || !modalContent) {
        return;
    }

    const visible =
        typeof isWireMode === "function" &&
        isWireMode() &&
        typeof modalMode !== "undefined" &&
        modalMode === "material";

    panel.hidden = !visible;
    modalBody.classList.toggle(
        "wire-ampacity-layout",
        visible
    );
    modalContent.classList.toggle(
        "wire-ampacity-modal",
        visible
    );

    if (!visible) return;

    const rows =
        WIRE_AMPACITY_TABLES[
            selectedAmpacityMaterial
        ] || [];

    panel.innerHTML = `
        <div class="wire-ampacity-inner">
            <div class="wire-ampacity-heading">
                <span>WIRE AMPACITY TABLE</span>
                <span
                    class="wire-ampacity-info"
                    title="Click a table row to filter the wire list. Click it again to clear the filter."
                >i</span>
            </div>

            <div class="wire-ampacity-tabs">
                <button
                    type="button"
                    class="wire-ampacity-tab ${
                        selectedAmpacityMaterial === "COPPER"
                            ? "active"
                            : ""
                    }"
                    data-ampacity-material="COPPER"
                >COPPER (60°C)</button>

                <button
                    type="button"
                    class="wire-ampacity-tab ${
                        selectedAmpacityMaterial === "ALUMINUM"
                            ? "active"
                            : ""
                    }"
                    data-ampacity-material="ALUMINUM"
                >ALUMINUM (75°C)</button>
            </div>

            <table class="wire-ampacity-table">
                <thead>
                    <tr>
                        <th>AWG</th>
                        <th>mm²</th>
                        <th>AMPACITY (A)</th>
                    </tr>
                </thead>

                <tbody>
                    ${rows.map(row => `
                        <tr
                            class="wire-ampacity-row ${
                                isAmpacityRowSelected(row)
                                    ? "active"
                                    : ""
                            }"
                            data-awg="${row.awg}"
                        >
                            <td>${row.awg}</td>
                            <td>${row.mm2}</td>
                            <td>${row.ampacity}</td>
                        </tr>
                    `).join("")}
                </tbody>
            </table>

            ${selectedAmpacityRow ? `
                <button
                    type="button"
                    class="wire-ampacity-clear"
                >CLEAR AMPACITY FILTER</button>
            ` : ""}

            <div class="wire-ampacity-reference">
                Reference: NEC Table 310.16<br>
                THHN/THWN-2 Conductors
            </div>
        </div>
    `;

    panel
        .querySelectorAll(
            "[data-ampacity-material]"
        )
        .forEach(button => {

            button.onclick = () => {

                selectedAmpacityMaterial =
                    button.dataset.ampacityMaterial;

                selectedAmpacityRow = null;

                renderWireAmpacityPanel();

                const searchInput =
                    document.getElementById(
                        "modalSearch"
                    );

                buildModalList(
                    searchInput
                        ? searchInput.value
                        : ""
                );

            };

        });

    panel
        .querySelectorAll(".wire-ampacity-row")
        .forEach((rowElement, index) => {

            rowElement.onclick = () => {
                selectAmpacityTableRow(rows[index]);
            };

        });

    const clearButton = panel.querySelector(
        ".wire-ampacity-clear"
    );

    if (clearButton) {

        clearButton.onclick = () => {

            selectedAmpacityRow = null;
            selectedSize = "All";

            renderWireAmpacityPanel();

            const searchInput =
                document.getElementById(
                    "modalSearch"
                );

            buildModalList(
                searchInput
                    ? searchInput.value
                    : ""
            );

        };

    }

}

//----------------------------------
// Selected Ampacity API
//----------------------------------

function getSelectedAmpacityRow() {

    return selectedAmpacityRow
        ? { ...selectedAmpacityRow }
        : null;

}

//----------------------------------
// Build Filter Chips
//----------------------------------

function buildFilterChips(list) {

    //----------------------------------
    // Existing Elements
    //----------------------------------

    const systemChips =
        document.getElementById("systemChips");

    const categoryChips =
        document.getElementById("typeChips");

    const sizeChips =
        document.getElementById("sizeChips");

    if (

        !systemChips ||
        !categoryChips ||
        !sizeChips

    ) {

        console.error(
            "Modal filter containers not found."
        );

        return;

    }

    //----------------------------------
    // Dynamic Groups
    //----------------------------------

    ensureDynamicFilterGroup(

        categoryChips,
        "fittingTypeFilterGroup",
        "Fitting Type",
        "fittingTypeChips"

    );

    ensureDynamicFilterGroup(

        systemChips,
        "wirePresetFilterGroup",
        "Preset",
        "wirePresetChips"

    );

    const fittingTypeChips =
        document.getElementById("fittingTypeChips");

    const wirePresetChips =
        document.getElementById("wirePresetChips");

    //----------------------------------
    // Records by Category
    //----------------------------------

    const fittingList = list.filter(
        isFittingRecord
    );

    const pipeList = list.filter(item =>

        normalizeModalValue(item.NodeType) ===
        "PIPE"

    );

    const wireList = list.filter(item =>

        normalizeModalValue(item.NodeType) ===
        "WIRE"

    );

    let activeList = fittingList;

    if (isPipeMode()) activeList = pipeList;
    if (isWireMode()) activeList = wireList;

    //----------------------------------
    // Filter Values
    //----------------------------------

    const categories = [

        "FITTING",
        "PIPE",
        "WIRE",
        "BREAKER"

    ];

    const fittingTypes = [

        "All",
        ...getUniqueModalValues(
            fittingList,
            "NodeType"
        )

    ];

    const materialTypes = [

        "All",
        ...getUniqueModalValues(
            activeList,
            "Type"
        )

    ];

    const sizes = [

        "All",
        ...sortModalSizes(

            [

                ...new Set(

                    activeList
                        .map(item =>
                            String(
                                item.Size || ""
                            ).trim()
                        )
                        .filter(Boolean)

                )

            ]

        )

    ];

    const presets = Object.keys(
        WIRE_PRESETS
    );

    //----------------------------------
    // Validate State
    //----------------------------------

    if (!categories.includes(selectedCategory)) {

        selectedCategory = "FITTING";

    }

    if (!fittingTypes.includes(selectedFittingType)) {

        selectedFittingType = "All";

    }

    if (!materialTypes.includes(selectedMaterialType)) {

        selectedMaterialType = "All";

    }

    if (!sizes.includes(selectedSize)) {

        selectedSize = "All";

    }

    if (!presets.includes(selectedWirePreset)) {

        selectedWirePreset = "SINGLE";

    }

    //----------------------------------
    // Clear
    //----------------------------------

    categoryChips.innerHTML = "";
    systemChips.innerHTML = "";
    sizeChips.innerHTML = "";

    if (fittingTypeChips) {

        fittingTypeChips.innerHTML = "";

    }

    if (wirePresetChips) {

        wirePresetChips.innerHTML = "";

    }

    //----------------------------------
    // Chip Helper
    //----------------------------------

    function buildChip(

        container,
        value,
        callback,
        active

    ) {

        if (!container) return;

        const chip = document.createElement("button");

        chip.className = "chip";
        chip.type = "button";
        chip.textContent = value;

        //----------------------------------
        // Long Fitting Labels
        // Span the complete chip row
        //----------------------------------

        if (

            container.id === "fittingTypeChips" &&
            String(value || "").trim().length >= 11

        ) {

            chip.classList.add("chip-wide");

        }

        if (active) {

            chip.classList.add("active");

        }

        chip.onclick = () => {

            callback(value);

            buildFilterChips(list);

            const searchInput =
                document.getElementById(
                    "modalSearch"
                );

            buildModalList(

                searchInput
                    ? searchInput.value
                    : ""

            );

        };

        container.appendChild(chip);

    }

    //----------------------------------
    // Main Category Chips
    //----------------------------------

    categories.forEach(category => {

        buildChip(

            categoryChips,
            category,

            value => {

                if (selectedCategory === value) {

                    return;

                }

                selectedCategory = value;
                selectedFittingType = "All";
                selectedMaterialType = "All";
                selectedSize = "All";
                selectedWirePreset = "SINGLE";
                selectedAmpacityRow = null;

            },

            selectedCategory === category

        );

    });

    //----------------------------------
    // Fitting Type Chips
    //----------------------------------

    if (isFittingMode()) {

        fittingTypes.forEach(type => {

            buildChip(

                fittingTypeChips,
                type,

                value => {

                    selectedFittingType = value;

                },

                selectedFittingType === type

            );

        });

    }

    //----------------------------------
    // Pipe / Wire Type Chips
    //----------------------------------

    if (isPipeMode() || isWireMode()) {

        materialTypes.forEach(type => {

            buildChip(

                systemChips,
                type,

                value => {

                    selectedMaterialType = value;
                    selectedSize = "All";

                },

                selectedMaterialType === type

            );

        });

    }

    //----------------------------------
    // Size Chips
    //----------------------------------

    if (

        isFittingMode() ||
        isPipeMode() ||
        isWireMode()

    ) {

        sizes.forEach(size => {

            buildChip(

                sizeChips,
                size,

                value => {

                    selectedSize = value;

                },

                selectedSize === size

            );

        });

    }

    //----------------------------------
    // Wire Preset Chips
    //----------------------------------

    if (isWireMode()) {

        presets.forEach(preset => {

            buildChip(

                wirePresetChips,
                preset,

                value => {

                    selectedWirePreset = value;

                },

                selectedWirePreset === preset

            );

        });

    }

    //----------------------------------
    // Labels
    //----------------------------------

    updateGroupLabel(
        categoryChips,
        "Category"
    );

    updateGroupLabel(
        systemChips,
        "Type"
    );

    updateGroupLabel(
        sizeChips,
        "Size"
    );

    //----------------------------------
    // Visibility
    //----------------------------------

    setFilterGroupVisible(
        categoryChips,
        true
    );

    setFilterGroupVisible(
        fittingTypeChips,
        isFittingMode()
    );

    setFilterGroupVisible(
        systemChips,
        isPipeMode() || isWireMode()
    );

    setFilterGroupVisible(
        sizeChips,
        !isBreakerMode()
    );

    setFilterGroupVisible(
        wirePresetChips,
        isWireMode()
    );

    renderWireAmpacityPanel();

}

//----------------------------------
// Apply Filters
//----------------------------------

function applyModalFilters(list) {

    //----------------------------------
    // Category
    //----------------------------------

    if (isFittingMode()) {

        list = list.filter(
            isFittingRecord
        );

    }

    else {

        list = list.filter(item =>

            normalizeModalValue(item.NodeType) ===
            selectedCategory

        );

    }

    //----------------------------------
    // Breaker
    //----------------------------------

    if (isBreakerMode()) {

        return list;

    }

    //----------------------------------
    // Fitting Type
    //----------------------------------

    if (

        isFittingMode() &&
        selectedFittingType !== "All"

    ) {

        list = list.filter(item =>

            normalizeModalValue(item.NodeType) ===
            selectedFittingType

        );

    }

    //----------------------------------
    // Pipe / Wire Type
    //----------------------------------

    if (

        (isPipeMode() || isWireMode()) &&
        selectedMaterialType !== "All"

    ) {

        list = list.filter(item =>

            normalizeModalValue(item.Type) ===
            selectedMaterialType

        );

    }

    //----------------------------------
    // Size
    //----------------------------------

    if (selectedSize !== "All") {

        if (isWireMode()) {

            const selectedWireSize =
                normalizeWireAWG(
                    selectedSize
                );

            list = list.filter(item =>

                getWireItemAWG(item) ===
                selectedWireSize

            );

        }

        else {

            list = list.filter(item =>

                String(item.Size || "").trim() ===
                selectedSize

            );

        }

    }

    //----------------------------------
    // Clickable Ampacity Table Filter
    //----------------------------------

    if (
        isWireMode() &&
        selectedAmpacityRow
    ) {

        const selectedAWG =
            normalizeWireAWG(
                selectedAmpacityRow.awg
            );

        list = list.filter(item => {

            const itemAWG =
                getWireItemAWG(item);

            return (
                itemAWG ===
                selectedAWG
            );

        });

    }

    return list;

}

//----------------------------------
// Wire Preset API
//----------------------------------

function getSelectedWirePreset() {

    return selectedWirePreset;

}

function getSelectedWirePresetColors() {

    const colors =
        WIRE_PRESETS[selectedWirePreset];

    return Array.isArray(colors)
        ? [...colors]
        : null;

}

//----------------------------------
// Expose
//----------------------------------

window.resetModalFilters = resetModalFilters;
window.setModalCategory = setModalCategory;
window.buildFilterChips = buildFilterChips;
window.applyModalFilters = applyModalFilters;
window.getSelectedWirePreset =
    getSelectedWirePreset;
window.getSelectedWirePresetColors =
    getSelectedWirePresetColors;
window.getSelectedAmpacityRow =
    getSelectedAmpacityRow;
window.renderWireAmpacityPanel =
    renderWireAmpacityPanel;
window.WIRE_PRESETS = WIRE_PRESETS;
window.WIRE_AMPACITY_TABLES =
    WIRE_AMPACITY_TABLES;
