//----------------------------------
// Modal Filter State
//----------------------------------

let selectedCategory = "FITTING";
let selectedFittingType = "All";
let selectedMaterialType = "All";
let selectedSize = "All";
let selectedWirePreset = "SINGLE";

//----------------------------------
// Wire Presets
//----------------------------------

const WIRE_PRESETS = {

    SINGLE: null,
    RB: ["RED", "BLACK"],
    RBG: ["RED", "BLACK", "GREEN"],
    RWB: ["RED", "WHITE", "BLACK"],
    RGWB: ["RED", "GREEN", "WHITE", "BLACK"]

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

        list = list.filter(item =>

            String(item.Size || "").trim() ===
            selectedSize

        );

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
window.buildFilterChips = buildFilterChips;
window.applyModalFilters = applyModalFilters;
window.getSelectedWirePreset =
    getSelectedWirePreset;
window.getSelectedWirePresetColors =
    getSelectedWirePresetColors;
window.WIRE_PRESETS = WIRE_PRESETS;