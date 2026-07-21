//----------------------------------
// Escape HTML
//----------------------------------

function escapeModalHTML(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}

//----------------------------------
// Normalize Card Value
//----------------------------------

function normalizeModalCardValue(value) {

    return String(value || "")
        .trim()
        .toUpperCase();

}

//----------------------------------
// Get Card Category
//----------------------------------

function getModalCardCategory(item) {

    const nodeType = normalizeModalCardValue(
        item.NodeType
    );

    if (nodeType === "BREAKER") return "Breaker";
    if (nodeType === "WIRE") return "Wire";
    if (nodeType === "PIPE") return "Pipe";

    if (
        nodeType === "CONNECTOR" ||
        nodeType === "COUPLING"
    ) {

        return nodeType.charAt(0) +
            nodeType.slice(1).toLowerCase();

    }

    return "Fitting";

}

//----------------------------------
// Get Card Badge Icon
//----------------------------------

function getModalCardBadgeIcon(category) {

    switch (category) {

        case "Breaker":
            return "ϟ";

        case "Wire":
            return "〰";

        case "Pipe":
            return "▰";

        case "Connector":
            return "⌘";

        case "Coupling":
            return "⧉";

        default:
            return "⌗";

    }

}

//----------------------------------
// Get Card Detail
//----------------------------------

function getModalCardDetail(item) {

    if (modalMode === "equipment") {

        const width = item.GridWidth || "";
        const height = item.GridHeight || "";

        return width && height
            ? `${width} × ${height}`
            : "";

    }

    const size = String(item.Size || "").trim();
    const type = String(item.Type || "").trim();

    return [size, type]
        .filter(Boolean)
        .join(" ");

}

//----------------------------------
// Get Secondary Detail
//----------------------------------

function getModalCardSecondaryDetail(item) {

    const nodeType = normalizeModalCardValue(
        item.NodeType
    );

    if (nodeType === "BREAKER") {

        return String(

            item.Voltage ||
            item.Rating ||
            item.InterruptRating ||
            ""

        ).trim();

    }

    return String(

        item.System ||
        item.Material ||
        ""

    ).trim();

}

//----------------------------------
// Build Card
//----------------------------------

function buildModalCard(item) {

    const image = item.DriveFileID
        ? `https://drive.google.com/thumbnail?id=${encodeURIComponent(item.DriveFileID)}&sz=w400`
        : "";

    const priority = Math.max(

        0,

        Math.min(

            Number(item.Favorite || 0),

            5

        )

    );

    const category =
        getModalCardCategory(item);

    const badgeIcon =
        getModalCardBadgeIcon(category);

    const detail =
        getModalCardDetail(item);

    const secondaryDetail =
        getModalCardSecondaryDetail(item);

    const card =
        document.createElement("div");

    card.className = "equipment material-card";

    card.dataset.category =
        normalizeModalCardValue(category);

    //----------------------------------
    // Selected
    //----------------------------------

    if (

        modalMode === "material" &&

        currentConnection &&

        currentConnection.hardware.some(

            hardware =>
                hardware.CatalogNumber ===
                item.CatalogNumber

        )

    ) {

        card.classList.add("selected");

    }

    //----------------------------------
    // HTML
    //----------------------------------

    card.innerHTML = `

        <div class="material-card-main">

            <div class="material-card-image-wrap">

                ${image
                    ? `
                        <img
                            class="equipment-image material-card-image"
                            src="${image}"
                            alt="${escapeModalHTML(item.Description || item.CatalogNumber || "Material")}"
                            loading="lazy"
                        >
                    `
                    : `
                        <div class="material-card-image-placeholder">
                            No image
                        </div>
                    `
                }

            </div>

            <div class="equipment-info material-card-info">

                <div class="equipment-code material-card-code">

                    ${escapeModalHTML(item.CatalogNumber || "")}

                </div>

                <div class="equipment-desc material-card-description">

                    ${escapeModalHTML(item.Description || "")}

                </div>

                ${detail
                    ? `
                        <div class="equipment-size material-card-detail">
                            ${escapeModalHTML(detail)}
                        </div>
                    `
                    : ""
                }

                ${secondaryDetail
                    ? `
                        <div class="material-card-secondary">
                            ${escapeModalHTML(secondaryDetail)}
                        </div>
                    `
                    : ""
                }

            </div>

        </div>

        <div class="material-card-footer">

            <div class="material-category-badge material-category-${normalizeModalCardValue(category).toLowerCase()}">

                <span class="material-category-icon">
                    ${badgeIcon}
                </span>

                <span>
                    ${escapeModalHTML(category)}
                </span>

            </div>

            ${priority > 0
                ? `
                    <div
                        class="material-favorite"
                        title="Favorite value: ${priority}"
                        aria-label="Favorite value: ${priority} out of 5"
                    >

                        ${Array.from(
                            { length: priority },
                            () => `
                                <span
                                    class="favorite-star filled"
                                    aria-hidden="true"
                                >
                                    ★
                                </span>
                            `
                        ).join("")}

                    </div>
                `
                : ""
            }

        </div>

    `;

    //----------------------------------
    // Click
    //----------------------------------

    card.onclick = () => {

        //----------------------------------
        // Generic Picker
        //----------------------------------

        if (modalMode === "picker") {

            if (typeof modalOnSelect === "function") {

                modalOnSelect(item);

            }

            modal.style.display = "none";

            return;

        }

        //----------------------------------
        // Equipment
        //----------------------------------

        if (modalMode === "equipment") {

            handleEquipmentClick(item);

            return;

        }

        //----------------------------------
        // Connection Hardware
        //----------------------------------

        if (modalMode === "material") {

            handleHardwareClick(item);

            return;

        }

        console.warn(
            "Unknown modal:",
            modalMode
        );

    };

    return card;

}

//----------------------------------
// Render Cards
//----------------------------------

function renderModalCards(list) {

    modalList.innerHTML = "";

    list.forEach(item => {

        modalList.appendChild(

            buildModalCard(item)

        );

    });

}

//----------------------------------
// Expose
//----------------------------------

window.buildModalCard = buildModalCard;
window.renderModalCards = renderModalCards;