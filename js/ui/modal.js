//----------------------------------
// Modal
//----------------------------------

const modal = document.getElementById("equipmentModal");
const modalList = document.getElementById("modalList");
const modalSearch = document.getElementById("modalSearch");
const closeModal = document.getElementById("closeModal");

//----------------------------------
// Filter UI
//----------------------------------

const modalFilters =
    document.getElementById("modalFilters");

const equipmentFilters =
    document.getElementById("equipmentFilters");

//----------------------------------
// State
//----------------------------------

let modalMode = "equipment";
let modalTitle = "Place Node";
let modalSource = [];
let modalOnSelect = null;

let currentCell = null;
let currentConnection = null;

//----------------------------------
// Close
//----------------------------------

function closeActiveModal() {

    if (
        typeof getCurrentEquipment === "function" &&
        getCurrentEquipment() &&
        typeof closeEquipmentCardModal === "function"
    ) {

        closeEquipmentCardModal();

        return;

    }

    modal.style.display = "none";

}

closeModal.onclick = closeActiveModal;

modal.onclick = e => {

    if (e.target === modal) {

        closeActiveModal();

    }

};

//----------------------------------
// Generic Picker
//----------------------------------

function openPickerModal(

    title,

    source,

    callback

) {

    modalMode = "picker";

    modalTitle = title;

    modalSource = source || [];

    modalOnSelect = callback || null;

    currentCell = null;

    currentConnection = null;

    modalSearch.value = "";

    //----------------------------------
    // Filters
    //----------------------------------

    if (modalFilters) {

        modalFilters.style.display = "none";

    }

    if (equipmentFilters) {

        equipmentFilters.style.display = "none";

    }

    //----------------------------------

    document.querySelector(

        ".modal-header h2"

    ).textContent = title;

    buildModalList();

    modal.style.display = "flex";

}

//----------------------------------
// Equipment
//----------------------------------

function openModal(index) {

    modalMode = "equipment";

    modalTitle = "Place Node";

    modalSource = equipment;

    modalOnSelect = null;

    currentCell = index;

    currentConnection = null;

    modalSearch.value = "";

    //----------------------------------
    // Filters
    //----------------------------------

    if (modalFilters) {

        modalFilters.style.display = "none";

    }

    if (equipmentFilters) {

        equipmentFilters.style.display = "none";

    }

    //----------------------------------

    document.querySelector(

        ".modal-header h2"

    ).textContent = modalTitle;

    buildModalList();

    modal.style.display = "flex";

}

//----------------------------------
// Connection Hardware
//----------------------------------

async function openMaterialModal(connection) {

    modalMode = "material";

    modalTitle = "Connection Hardware";

    modalSource = await getMaterials();

    modalOnSelect = null;

    currentConnection = connection;

    currentCell = null;

    modalSearch.value = "";

    //----------------------------------
    // Filters
    //----------------------------------

    if (modalFilters) {

        modalFilters.style.display = "grid";

    }

    if (equipmentFilters) {

        equipmentFilters.style.display = "none";

    }

    //----------------------------------
    // Reset
    //----------------------------------

    if (typeof resetModalFilters === "function") {

        resetModalFilters();

    }

    //----------------------------------
    // Build Chips
    //----------------------------------

    if (typeof buildFilterChips === "function") {

        buildFilterChips(

            getHardwareModalList(

                modalSource

            )

        );

    }

    //----------------------------------

    document.querySelector(

        ".modal-header h2"

    ).textContent = modalTitle;

    buildModalList();

    modal.style.display = "flex";

}

//----------------------------------
// Build
//----------------------------------

function buildModalList(searchText = "") {

    modalList.innerHTML = "";

    //----------------------------------
    // Selected Hardware
    //----------------------------------

    if (

        modalMode === "material"

    ) {

        buildHardwarePanel();

    }

    //----------------------------------
    // Source
    //----------------------------------

    let list = [...modalSource];

    //----------------------------------
    // Equipment
    //----------------------------------

    if (

        modalMode === "equipment"

    ) {

        list = getEquipmentModalList(list);

    }

    //----------------------------------
    // Hardware
    //----------------------------------

    else if (

        modalMode === "material"

    ) {

        list = getHardwareModalList(list);

        if (

            typeof applyModalFilters === "function"

        ) {

            list = applyModalFilters(list);

        }

        //----------------------------------
        // Favorites
        //----------------------------------

        list.sort((a, b) => {

            const priorityA =
                Number(a.Favorite || 0);

            const priorityB =
                Number(b.Favorite || 0);

            if (

                priorityA !== priorityB

            ) {

                return priorityB - priorityA;

            }

            return (

                a.CatalogNumber || ""

            ).localeCompare(

                b.CatalogNumber || ""

            );

        });

    }

    //----------------------------------
    // Search
    //----------------------------------

    list = filterModalSearch(

        list,

        searchText

    );

    //----------------------------------
    // Render
    //----------------------------------

    renderModalCards(list);

}

//----------------------------------
// Search
//----------------------------------

modalSearch.addEventListener(

    "input",

    () => {

        buildModalList(

            modalSearch.value

        );

    }

);

//----------------------------------
// Expose
//----------------------------------

window.openModal =
    openModal;

window.openMaterialModal =
    openMaterialModal;

window.openPickerModal =
    openPickerModal;

window.closeActiveModal =
    closeActiveModal;

window.buildModalList =
    buildModalList;