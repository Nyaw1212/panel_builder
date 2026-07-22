//----------------------------------
// Material Image Upload
//----------------------------------

const MATERIAL_IMAGE_UPLOAD_API_URL =
    "https://script.google.com/macros/s/AKfycbztkGaSk-SGnzFk5ZnST0bIjma06J1WhPDF2Hd62sHTtkQH8fm6yq-F3FtJYQzFYLfM/exec";

//----------------------------------
// Sanitize Catalog Number
//----------------------------------

function sanitizeMaterialImageCatalog(value) {

    const sanitized = String(value || "")
        .trim()
        .replace(/[<>:"/\\|?*\x00-\x1F]/g, "_")
        .replace(/\s+/g, "_")
        .replace(/_+/g, "_")
        .replace(/^\.+|\.+$/g, "");

    return sanitized || "material-image";

}

//----------------------------------
// File Extension
//----------------------------------

function getMaterialImageExtension(filename) {

    const match = String(filename || "")
        .match(/(\.[^.]+)$/);

    return match
        ? match[1].toLowerCase()
        : ".png";

}

//----------------------------------
// Read File
//----------------------------------

function readMaterialImageAsBase64(file) {

    return new Promise((resolve, reject) => {

        const reader = new FileReader();

        reader.addEventListener("load", () => {

            const result = String(
                reader.result || ""
            );

            resolve(
                result.includes(",")
                    ? result.split(",").pop()
                    : result
            );

        });

        reader.addEventListener("error", () => {

            reject(
                reader.error ||
                new Error("Unable to read the image.")
            );

        });

        reader.readAsDataURL(file);

    });

}

//----------------------------------
// Choose File
//----------------------------------

function chooseMaterialImageFile() {

    return new Promise(resolve => {

        const input =
            document.createElement("input");

        input.type = "file";
        input.accept = "image/*";
        input.hidden = true;

        input.addEventListener(
            "change",
            () => {

                const file =
                    input.files?.[0] || null;

                input.remove();

                resolve(file);

            },
            { once: true }
        );

        document.body.appendChild(input);
        input.click();

    });

}

//----------------------------------
// Update Card Image
//----------------------------------

function updateUploadedMaterialCard(
    item,
    card,
    result
) {

    item.DriveFileID =
        result.fileId ||
        item.DriveFileID ||
        "";

    item.GOOGLE =
        result.fileUrl ||
        item.GOOGLE ||
        "";

    const wrapper = card?.querySelector(
        ".material-card-image-wrap"
    );

    if (
        !wrapper ||
        !item.DriveFileID
    ) {

        return;

    }

    let image = wrapper.querySelector(
        ".material-card-image"
    );

    if (!image) {

        wrapper.innerHTML = "";

        image =
            document.createElement("img");

        image.className =
            "equipment-image material-card-image";

        image.alt =
            item.Description ||
            item.CatalogNumber ||
            "Material";

        wrapper.appendChild(image);

    }

    const driveImage =
        "https://drive.google.com/thumbnail?id=" +
        encodeURIComponent(item.DriveFileID) +
        "&sz=w400&v=" +
        Date.now();

    image.dataset.fallbackStage = "1";
    image.dataset.driveImage = driveImage;
    image.dataset.placeholderImage =
        "images/placeholder.png";

    image.removeEventListener(
        "error",
        handleModalMaterialImageError
    );

    image.addEventListener(
        "error",
        handleModalMaterialImageError
    );

    image.src = driveImage;

}

//----------------------------------
// Upload Selected Image
//----------------------------------

async function uploadMaterialCardImage(
    item,
    card,
    button
) {

    const catalogNumber = String(
        item?.CatalogNumber || ""
    ).trim();

    if (!catalogNumber) {

        throw new Error(
            "This material has no catalog number."
        );

    }

    const file =
        await chooseMaterialImageFile();

    if (!file) {

        return;

    }

    if (!file.type.startsWith("image/")) {

        throw new Error(
            "Please choose a valid image file."
        );

    }

    const originalText =
        button?.textContent || "Update Photo";

    if (button) {

        button.disabled = true;
        button.textContent = "Uploading…";

    }

    try {

        const base64 =
            await readMaterialImageAsBase64(file);

        const fileName =
            sanitizeMaterialImageCatalog(
                catalogNumber
            ) +
            getMaterialImageExtension(
                file.name
            );

        const response = await fetch(
            MATERIAL_IMAGE_UPLOAD_API_URL,
            {
                method: "POST",
                body: JSON.stringify({
                    action:
                        "uploadMaterialImage",
                    catalogNumbers: [
                        catalogNumber
                    ],
                    fileName,
                    mimeType:
                        file.type ||
                        "application/octet-stream",
                    base64
                })
            }
        );

        if (!response.ok) {

            throw new Error(
                `Upload returned HTTP ${response.status}.`
            );

        }

        const result =
            await response.json();

        if (!result.success) {

            throw new Error(
                result.message ||
                "The image upload failed."
            );

        }

        updateUploadedMaterialCard(
            item,
            card,
            result
        );

        if (button) {

            button.textContent = "Photo Updated";

            window.setTimeout(
                () => {

                    button.textContent =
                        originalText;

                },
                1600
            );

        }

        return result;

    }
    finally {

        if (button) {

            button.disabled = false;

            if (
                button.textContent ===
                "Uploading…"
            ) {

                button.textContent =
                    originalText;

            }

        }

    }

}

//----------------------------------
// Open Upload
//----------------------------------

async function openMaterialImageUpload(
    item,
    card,
    button
) {

    try {

        await uploadMaterialCardImage(
            item,
            card,
            button
        );

    }
    catch (error) {

        console.error(
            "Material image upload failed:",
            error
        );

        window.alert(
            error.message ||
            "Unable to update the material photo."
        );

    }

}

//----------------------------------
// Expose
//----------------------------------

window.openMaterialImageUpload =
    openMaterialImageUpload;
