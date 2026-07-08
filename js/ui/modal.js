//----------------------------------
// Modal
//----------------------------------

const modal = document.getElementById("equipmentModal");
const modalList = document.getElementById("modalList");
const modalSearch = document.getElementById("modalSearch");
const closeModal = document.getElementById("closeModal");

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

    document.querySelector(".modal-header h2").textContent = modalTitle;

    buildModalList();

    modal.style.display = "flex";

}

//----------------------------------
// Connection Hardware
//----------------------------------

function openMaterialModal(connection) {

    modalMode = "material";

    modalTitle = "Connection Hardware";

    modalSource = materials;

    modalOnSelect = null;

    currentConnection = connection;

    currentCell = null;

    modalSearch.value = "";

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
    // Connection Hardware Panel
    //----------------------------------

    if (modalMode === "material") {

        buildHardwarePanel();

    }

    //----------------------------------
    // Source
    //----------------------------------

    let list = modalSource;

    //----------------------------------
    // Equipment
    //----------------------------------

    if (modalMode === "equipment") {

        list = getEquipmentModalList(list);

    }

    //----------------------------------
    // Connection Hardware
    //----------------------------------

    else if (modalMode === "material") {

        list = getHardwareModalList(list);

    }

    //----------------------------------
    // Picker
    //----------------------------------

    // picker uses modalSource directly

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