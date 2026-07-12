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

    //----------------------------------
    // Get Equipment
    //----------------------------------

    const equipment =

        typeof getEquipment === "function"

            ? getEquipment()

            : [];

    if (!equipment.length) {

        console.warn("Equipment not loaded yet.");

        return;

    }

    //----------------------------------
    // Search
    //----------------------------------

    const keywords = searchText
        .toLowerCase()
        .trim()
        .split(/\s+/)
        .filter(Boolean);

    equipment

        .filter(item => item.Placeable)

        .filter(item => {

            if (keywords.length === 0) {

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

                        card.classList.remove(

                            "selected"

                        )

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

    if (!presetLibrary) {

        return;

    }

    presetLibrary.innerHTML = "";

    if (

        !window.presets ||

        window.presets.length === 0

    ) {

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

        const aNum = parseInt(

            a.replace("FD", "")

        ) || 0;

        const bNum = parseInt(

            b.replace("FD", "")

        ) || 0;

        return bNum - aNum;

    });

    presetCodes.forEach(code => {

        const button =

            document.createElement(

                "button"

            );

        button.className =

            "preset-button";

        button.textContent = code;

        button.onclick = () => {

            //----------------------------------
            // Delegate to Preset Manager
            //----------------------------------

            setCurrentPreset(code);

            //----------------------------------
            // Highlight
            //----------------------------------

            document

                .querySelectorAll(".preset-button")

                .forEach(button =>

                    button.classList.remove(

                        "selected"

                    )

                );

            button.classList.add("selected");

            console.log(

                "Preset Selected:",

                code

            );

        };

        presetLibrary.appendChild(

            button

        );

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

window.buildEquipmentLibrary =
    buildEquipmentLibrary;

window.buildPresetLibrary =
    buildPresetLibrary;