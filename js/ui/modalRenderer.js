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
// Build Local Image Path
//----------------------------------

function getModalLocalImage(item) {

    const catalogNumber = String(
        item.CatalogNumber || ""
    ).trim();

    if (!catalogNumber) {

        return "";

    }

    return (
        "images/materials/" +
        encodeURIComponent(catalogNumber) +
        ".png"
    );

}

//----------------------------------
// Build Drive Image URL
//----------------------------------

function getModalDriveImage(item) {

    const driveFileId = String(
        item.DriveFileID || ""
    ).trim();

    if (!driveFileId) {

        return "";

    }

    return getDriveImageUrl(driveFileId, 400);

}

//----------------------------------
// Replace Failed Image
//----------------------------------

function showModalImagePlaceholder(image) {

    const wrapper = image.closest(
        ".material-card-image-wrap"
    );

    if (!wrapper) {

        return;

    }

    wrapper.innerHTML = `

        <div class="material-card-image-placeholder">
            No image
        </div>

    `;

}

//----------------------------------
// Material Image Fallback
//----------------------------------

function handleModalMaterialImageError(event) {

    const image = event.currentTarget;

    const stage = Number(
        image.dataset.fallbackStage || 0
    );

    const driveImage =
        image.dataset.driveImage || "";

    const placeholderImage =
        image.dataset.placeholderImage || "";

    //----------------------------------
    // Local Failed → Google Drive
    //----------------------------------

    if (
        stage === 0 &&
        driveImage
    ) {

        image.dataset.fallbackStage = "1";

        image.src = driveImage;

        return;

    }

    //----------------------------------
    // Google Drive Failed → Placeholder
    //----------------------------------

    if (
        stage <= 1 &&
        placeholderImage
    ) {

        image.dataset.fallbackStage = "2";

        image.src = placeholderImage;

        return;

    }

    //----------------------------------
    // Everything Failed → No Image
    //----------------------------------

    image.removeEventListener(
        "error",
        handleModalMaterialImageError
    );

    showModalImagePlaceholder(image);

}

//----------------------------------
// Build Card
//----------------------------------

function buildModalCard(item) {

    //----------------------------------
    // Images
    // Local → Google Drive → Placeholder
    //----------------------------------

    const localImage =
        getModalLocalImage(item);

    const driveImage =
        getModalDriveImage(item);

    const placeholderImage =
        "images/placeholder.png";

    const startingImage =
        localImage ||
        driveImage ||
        placeholderImage;

    //----------------------------------
    // Favorite Priority
    //----------------------------------

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

    card.className =
        "equipment material-card";

    card.dataset.category =
        normalizeModalCardValue(category);

    //----------------------------------
    // Selected
    //----------------------------------

    if (

        modalMode === "material" &&

        currentConnection &&

        Array.isArray(currentConnection.hardware) &&

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

                ${startingImage
                    ? `
                        <img
                            class="equipment-image material-card-image"
                            src="${escapeModalHTML(startingImage)}"
                            alt="${escapeModalHTML(
                                item.Description ||
                                item.CatalogNumber ||
                                "Material"
                            )}"
                            loading="lazy"
                            data-fallback-stage="${localImage ? "0" : driveImage ? "1" : "2"}"
                            data-drive-image="${escapeModalHTML(driveImage)}"
                            data-placeholder-image="${escapeModalHTML(placeholderImage)}"
                        >
                    `
                    : `
                        <div class="material-card-image-placeholder">
                            No image
                        </div>
                    `
                }

            </div>

            <button
                type="button"
                class="material-card-photo-button"
                title="Upload or replace the photo for ${escapeModalHTML(item.CatalogNumber || "this material")}"
                aria-label="Update photo for ${escapeModalHTML(item.CatalogNumber || "this material")}"
            >
                ↑ Photo
            </button>

            <div class="equipment-info material-card-info">

                <div class="equipment-code material-card-code">

                    ${escapeModalHTML(
                        item.PickerCardCode ||
                        item.CatalogNumber || ""
                    )}

                </div>

                <div class="equipment-desc material-card-description">

                    ${escapeModalHTML(
                        item.Description || ""
                    )}

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

            <div
                class="
                    material-category-badge
                    material-category-${normalizeModalCardValue(category).toLowerCase()}
                "
            >

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
    // Image Fallback Listener
    //----------------------------------

    const imageElement = card.querySelector(
        ".material-card-image"
    );

    if (imageElement) {

        imageElement.addEventListener(
            "error",
            handleModalMaterialImageError
        );

    }

    //----------------------------------
    // Update Photo
    //----------------------------------

    const photoButton = card.querySelector(
        ".material-card-photo-button"
    );

    if (photoButton) {

        photoButton.addEventListener(
            "click",
            event => {

                event.preventDefault();
                event.stopPropagation();

                if (
                    typeof openMaterialImageUpload ===
                    "function"
                ) {

                    openMaterialImageUpload(
                        item,
                        card,
                        photoButton
                    );

                }

            }
        );

    }

    //----------------------------------
    // Click
    //----------------------------------

    card.onclick = () => {

        //----------------------------------
        // Generic Picker
        //----------------------------------

        if (modalMode === "picker") {

            if (
                typeof modalOnSelect ===
                "function"
            ) {

                const applied = modalOnSelect(item);
                // Keep the picker open when the replacement could not be applied.
                if (applied === false) return;

            }

            closeActiveModal();

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

window.buildModalCard =
    buildModalCard;

window.renderModalCards =
    renderModalCards;
