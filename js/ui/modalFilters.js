//----------------------------------
// Modal Filter State
//----------------------------------

let selectedType = "All";
let selectedSize = "All";

//----------------------------------
// Reset Filters
//----------------------------------

function resetModalFilters() {

    selectedType = "All";
    selectedSize = "All";

}

//----------------------------------
// Build Filter Chips
//----------------------------------

function buildFilterChips(list) {

    //----------------------------------
    // Elements
    //----------------------------------

    const typeChips = document.getElementById("typeChips");
    const sizeChips = document.getElementById("sizeChips");

    if (!typeChips || !sizeChips) {

        console.error("Modal filter containers not found.");

        return;

    }

    //----------------------------------
    // Types
    //----------------------------------

    const types = [

        "All",

        ...new Set(

            list
                .map(item => String(item.NodeType || "").trim())
                .filter(Boolean)

        )

    ];

    //----------------------------------
    // Sizes
    //----------------------------------

    const sizes = [

        "All",

        ...new Set(

            list
                .map(item => String(item.Size || "").trim())
                .filter(Boolean)

        )

    ];

    //----------------------------------
    // Sort
    //----------------------------------

    types.sort();
    sizes.sort();

    //----------------------------------
    // Keep All First
    //----------------------------------

    types.splice(types.indexOf("All"), 1);
    types.unshift("All");

    sizes.splice(sizes.indexOf("All"), 1);
    sizes.unshift("All");

    //----------------------------------
    // Clear
    //----------------------------------

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
    // Type
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

    if (selectedType !== "All") {

        list = list.filter(item =>

            String(item.NodeType || "").trim() === selectedType

        );

    }

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