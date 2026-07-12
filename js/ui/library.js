//----------------------------------
// Library
//----------------------------------

const equipmentList = document.getElementById("equipmentList");
const searchBox = document.getElementById("searchBox");
const presetLibrary = document.getElementById("presetLibrary");

const selectedEquipment = {

    type: null

};

//----------------------------------
// Build Equipment Library
//----------------------------------

function buildEquipmentLibrary(searchText = "") {

    equipmentList.innerHTML = "";

    const equipment =

        typeof getEquipment === "function"

            ? getEquipment()

            : [];

    if (!equipment.length) {

        console.warn("Equipment not loaded yet.");

        return;

    }

    const keywords = searchText
        .toLowerCase()
        .trim()
        .split(/\s+/)
        .filter(Boolean);

    equipment

        .filter(item => item.Placeable)

        .filter(item => {

            if (!keywords.length) {

                return true;

            }

            const haystack = [

                item.CatalogNumber,
                item.Description,
                item.NodeType,
                item.Type,
                item.Size,
                item.Color

            ]

                .filter(Boolean)

                .join(" ")

                .toLowerCase();

            return keywords.every(

                word => haystack.includes(word)

            );

        })

        .sort((a, b) => {

            if (a.Favorite && !b.Favorite) return -1;

            if (!a.Favorite && b.Favorite) return 1;

            return (a.CatalogNumber || "").localeCompare(

                b.CatalogNumber || ""

            );

        })

        .forEach(item => {

            const image = item.DriveFileID

                ? `https://drive.google.com/thumbnail?id=${item.DriveFileID}&sz=w300`

                : "";

            const card = document.createElement("div");

            card.className = "equipment";

            card.innerHTML = `

                <img
                    class="equipment-image"
                    src="${image}"
                >

                <div class="equipment-info">

                    <div class="equipment-code">

                        ${item.CatalogNumber}

                    </div>

                    <div class="equipment-desc">

                        ${item.Description}

                    </div>

                    <div class="equipment-size">

                        ${item.GridWidth} × ${item.GridHeight}

                    </div>

                </div>

            `;

            card.onclick = () => {

                document

                    .querySelectorAll(".equipment")

                    .forEach(card =>

                        card.classList.remove("selected")

                    );

                card.classList.add("selected");

                selectedEquipment.type = item;

            };

            equipmentList.appendChild(card);

        });

}

//----------------------------------
// Build Preset Library
//----------------------------------

function buildPresetLibrary() {

    if (!presetLibrary) return;

    presetLibrary.innerHTML = "";

    if (!window.presets?.length) {

        presetLibrary.innerHTML = "No Presets";

        return;

    }

    const presetCodes = [

        ...new Set(

            window.presets.map(

                item => item.PRESET

            )

        )

    ]

    .sort((a, b) => {

        const aNum = parseInt(a.replace("FD", "")) || 0;

        const bNum = parseInt(b.replace("FD", "")) || 0;

        return bNum - aNum;

    });

    presetCodes.forEach(code => {

        const button = document.createElement("button");

        button.className = "preset-button";

        button.textContent = code;

        button.onclick = () => {

            //----------------------------------
            // Store Preset
            //----------------------------------

            setCurrentPreset(code);

            //----------------------------------
            // Highlight Button
            //----------------------------------

            document

                .querySelectorAll(".preset-button")

                .forEach(btn =>

                    btn.classList.remove("selected")

                );

            button.classList.add("selected");

            //----------------------------------
            // Find First Equipment
            //----------------------------------

            const presetRow = window.presets.find(

                p => p.PRESET === code

            );

            if (!presetRow) {

                console.warn("Preset not found:", code);

                return;

            }

            const equipment = getEquipment().find(

                e =>

                    e.CatalogNumber ===

                    presetRow.CatalogNumber

            );

            if (!equipment) {

                console.warn(

                    "Equipment not found:",

                    presetRow.CatalogNumber

                );

                return;

            }

            //----------------------------------
            // Show Ghost Preview
            //----------------------------------

            showPlacementPreview(equipment);

            console.group("Preset Mode");

            console.log("Preset:", code);

            console.log("Equipment:", equipment.CatalogNumber);

            console.groupEnd();

        };

        presetLibrary.appendChild(button);

    });

}

//----------------------------------
// Search
//----------------------------------

searchBox.addEventListener(

    "input",

    () => {

        buildEquipmentLibrary(

            searchBox.value

        );

    }

);

//----------------------------------
// Expose
//----------------------------------

window.buildEquipmentLibrary = buildEquipmentLibrary;

window.buildPresetLibrary = buildPresetLibrary;