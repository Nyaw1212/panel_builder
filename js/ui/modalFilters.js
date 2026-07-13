//----------------------------------
// Modal Filter State
//----------------------------------

let selectedSystem = "EMT";
let selectedType = "HUB";
let selectedSize = '2"';

//----------------------------------
// Reset Filters
//----------------------------------

function resetModalFilters() {

    selectedSystem = "EMT";
    selectedType = "HUB";
    selectedSize = '2"';

}

//----------------------------------
// Build Filter Chips
//----------------------------------

function buildFilterChips(list) {

    //----------------------------------
    // Elements
    //----------------------------------

    const systemChips = document.getElementById("systemChips");
    const typeChips = document.getElementById("typeChips");
    const sizeChips = document.getElementById("sizeChips");

    if (!systemChips || !typeChips || !sizeChips) {

        console.error("Modal filter containers not found.");

        return;

    }

    //----------------------------------
    // Conduit Types (Color)
    //----------------------------------

    const systems = [

        "All",

        ...new Set(

            list
                .map(item => String(item.Color || "").trim().toUpperCase())
                .filter(Boolean)

        )

    ];

    //----------------------------------
    // Fitting Types
    //----------------------------------

    const types = [

        "All",

        ...new Set(

            list
                .map(item => String(item.NodeType || "").trim().toUpperCase())
                .filter(Boolean)

        )

    ];

    //----------------------------------
    // Sizes
    //----------------------------------

    const allowedSizes = [

        '2"',
        '1-1/2"',
        '1-1/4"',
        '1"',
        '3/4"'

    ];

    const sizes = [

        "All",

        ...allowedSizes.filter(size =>

            list.some(item =>

                String(item.Size || "").trim() === size

            )

        )

    ];

    //----------------------------------
    // Sort
    //----------------------------------

    systems.sort();
    types.sort();

    systems.splice(systems.indexOf("All"), 1);
    systems.unshift("All");

    types.splice(types.indexOf("All"), 1);
    types.unshift("All");

    //----------------------------------
    // Clear
    //----------------------------------

    systemChips.innerHTML = "";
    typeChips.innerHTML = "";
    sizeChips.innerHTML = "";

    //----------------------------------
    // Helper
    //----------------------------------

    function buildChip(container, value, callback, active) {

        const chip = document.createElement("button");

        chip.className = "chip";

        chip.textContent = value;

        if (active) {

            chip.classList.add("active");

        }

        chip.onclick = () => {

            callback(value);

            buildFilterChips(list);

            buildModalList(

                document.getElementById("modalSearch").value

            );

        };

        container.appendChild(chip);

    }

    //----------------------------------
    // Conduit
    //----------------------------------

    systems.forEach(system => {

        buildChip(

            systemChips,

            system,

            value => {

                selectedSystem = value;

            },

            selectedSystem === system

        );

    });

    //----------------------------------
    // Fitting
    //----------------------------------

    types.forEach(type => {

        buildChip(

            typeChips,

            type,

            value => {

                selectedType = value;

            },

            selectedType === type

        );

    });

    //----------------------------------
    // Size
    //----------------------------------

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
// Apply Filters
//----------------------------------

function applyModalFilters(list) {

    //----------------------------------
    // Conduit
    //----------------------------------

    if (selectedSystem !== "All") {

        list = list.filter(item =>

            String(item.Color || "").trim().toUpperCase() === selectedSystem

        );

    }

    //----------------------------------
    // Fitting
    //----------------------------------

    if (selectedType !== "All") {

        list = list.filter(item =>

            String(item.NodeType || "").trim().toUpperCase() === selectedType

        );

    }

    //----------------------------------
    // Size
    //----------------------------------

    if (selectedSize !== "All") {

        list = list.filter(item =>

            String(item.Size || "").trim() === selectedSize

        );

    }

    return list;

}

//----------------------------------
// Expose
//----------------------------------

window.resetModalFilters = resetModalFilters;
window.buildFilterChips = buildFilterChips;
window.applyModalFilters = applyModalFilters;