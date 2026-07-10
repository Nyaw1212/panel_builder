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

async function openMaterialModal(connection) {

    modalMode = "material";

    modalTitle = "Connection Hardware";

    modalSource = await getMaterials();

    console.log("Materials Loaded:", modalSource.length);
    console.table(modalSource.slice(0, 5));

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

    console.log("Initial List:", list.length);

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

        console.log("Before Hardware Filter:", list.length);

        list = getHardwareModalList(list);

        console.log("After Hardware Filter:", list.length);

    }

    //----------------------------------
    // Search
    //----------------------------------

    console.log("Before Search:", list.length);

    list = filterModalSearch(

        list,

        searchText

    );

    console.log("After Search:", list.length);

    //----------------------------------
    // Render
    //----------------------------------

    console.log("Rendering:", list.length);

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