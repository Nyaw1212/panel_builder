//----------------------------------
// Modal
//----------------------------------

const modal = document.getElementById("equipmentModal");
const modalList = document.getElementById("modalList");
const modalSearch = document.getElementById("modalSearch");
const closeModal = document.getElementById("closeModal");

// Filter UI
const modalFilters = document.getElementById("modalFilters");

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

closeModal.onclick = () => {

    modal.style.display = "none";

};

modal.onclick = e => {

    if (e.target === modal) {

        modal.style.display = "none";

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

    if (modalFilters) {

        modalFilters.style.display = "none";

    }

    document.querySelector(".modal-header h2").textContent = title;

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

    if (modalFilters) {

        modalFilters.style.display = "none";

    }

    document.querySelector(".modal-header h2").textContent = modalTitle;

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

    if (modalFilters) {

        modalFilters.style.display = "grid";

    }

    //----------------------------------
    // Filters (safe)
    //----------------------------------

    if (typeof resetModalFilters === "function") {

        resetModalFilters();

    }

    if (typeof buildFilterChips === "function") {

        buildFilterChips(

            getHardwareModalList(modalSource)

        );

    }

    document.querySelector(".modal-header h2").textContent = modalTitle;

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

    if (modalMode === "material") {

        buildHardwarePanel();

    }

    //----------------------------------
    // Source
    //----------------------------------

    let list = [...modalSource];

    //----------------------------------
    // Equipment
    //----------------------------------

    if (modalMode === "equipment") {

        list = getEquipmentModalList(list);

    }

    //----------------------------------
    // Hardware
    //----------------------------------

    else if (modalMode === "material") {

        list = getHardwareModalList(list);

        if (typeof applyModalFilters === "function") {

            list = applyModalFilters(list);

        }

        //----------------------------------
        // Favorites First
        //----------------------------------

        list.sort((a, b) => {

            const favA = Number(a.Favorite) === 1;
            const favB = Number(b.Favorite) === 1;

            if (favA && !favB) return -1;
            if (!favA && favB) return 1;

            return (a.CatalogNumber || "")
                .localeCompare(b.CatalogNumber || "");

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

modalSearch.addEventListener("input", () => {

    buildModalList(

        modalSearch.value

    );

});

//----------------------------------
// Expose
//----------------------------------

window.openModal = openModal;
window.openMaterialModal = openMaterialModal;
window.openPickerModal = openPickerModal;
window.buildModalList = buildModalList;