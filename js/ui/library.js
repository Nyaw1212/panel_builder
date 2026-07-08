//----------------------------------
// Library
//----------------------------------

const equipmentList = document.getElementById("equipmentList");
const searchBox = document.getElementById("searchBox");


const selectedEquipment = {

    type: null

};

//----------------------------------
// Build Library
//----------------------------------

function buildEquipmentLibrary(searchText = "") {

    equipmentList.innerHTML = "";

    const keywords = searchText
        .toLowerCase()
        .trim()
        .split(/\s+/)
        .filter(Boolean);

    equipment

        .filter(item => item.Placeable)

        .filter(item => {

            if (keywords.length === 0) return true;

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

            return keywords.every(word => haystack.includes(word));

        })

        .sort((a, b) => {

            if (a.Favorite && !b.Favorite) return -1;
            if (!a.Favorite && b.Favorite) return 1;

            return a.CatalogNumber.localeCompare(b.CatalogNumber);

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
                    .forEach(c => c.classList.remove("selected"));

                card.classList.add("selected");

                selectedEquipment.type = item;

            };

            equipmentList.appendChild(card);

        });

}

//----------------------------------
// Search
//----------------------------------

searchBox.addEventListener("input", () => {

    buildEquipmentLibrary(searchBox.value);

});