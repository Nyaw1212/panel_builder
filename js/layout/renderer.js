//----------------------------------
// Build Item Cards
//----------------------------------

function buildItemCards({
    container,
    items,
    onClick
}) {

    container.innerHTML = "";

    items.forEach(item => {

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

                    ${item.CatalogNumber ?? ""}

                </div>

                <div class="equipment-desc">

                    ${item.Description ?? ""}

                </div>

                <div class="equipment-size">

                    ${(item.GridWidth ?? "-")} × ${(item.GridHeight ?? "-")}

                </div>

            </div>

        `;

        card.onclick = () => {

            if (typeof onClick === "function") {

                onClick(item, card);

            }

        };

        container.appendChild(card);

    });

}