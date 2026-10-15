//----------------------------------
// Connection Preview Overlay
//----------------------------------

let connectionPreviewOverlay = null;

function getConnectionPreviewOverlay() {

    const canvas =
        document.getElementById(
            "canvasContainer"
        );

    if (!canvas) {
        return null;
    }

    if (
        connectionPreviewOverlay &&
        connectionPreviewOverlay
            .isConnected
    ) {
        return connectionPreviewOverlay;
    }

    connectionPreviewOverlay =
        document.createElement(
            "div"
        );

    connectionPreviewOverlay
        .className =
        "connection-preview connection-preview--overlay";

    canvas.appendChild(
        connectionPreviewOverlay
    );

    return connectionPreviewOverlay;

}

//----------------------------------
// Show Preview
//----------------------------------

function showConnectionPreview(
    preview,
    connection,
    panel,
    node = null
) {

    const overlay =
        preview ||
        getConnectionPreviewOverlay();

    if (!overlay) {
        return;
    }

    overlay.innerHTML = "";

    if (!connection?.hardware?.length) {
        hideConnectionPreview(
            overlay
        );

        return;
    }

    connection.hardware.forEach(
        (
            hardware,
            index
        ) => {

            const card =
                document.createElement(
                    "div"
                );

            card.className =
                "preview-card";

            card.style.animationDelay =
                `${index * 50}ms`;

            card.innerHTML = `

                <img
                    src="${getDriveImageUrl(hardware.DriveFileID, 120)}"
                >

                <div class="preview-code">
                    ${hardware.CatalogNumber}
                </div>

                <div class="preview-desc">
                    ${hardware.Description}
                </div>
            `;

            overlay.appendChild(
                card
            );

        }
    );

    const canvas =
        document.getElementById(
            "canvasContainer"
        );

    const anchor =
        node ||
        panel;

    if (
        canvas &&
        anchor
    ) {

        const canvasRect =
            canvas.getBoundingClientRect();

        const anchorRect =
            anchor.getBoundingClientRect();

        const scaleX =
            canvas.offsetWidth
                ? canvasRect.width /
                  canvas.offsetWidth
                : 1;

        const scaleY =
            canvas.offsetHeight
                ? canvasRect.height /
                  canvas.offsetHeight
                : 1;

        overlay.style.left =
            `${
                (
                    anchorRect.left +
                    anchorRect.width / 2 -
                    canvasRect.left
                ) /
                scaleX
            }px`;

        overlay.style.top =
            `${
                (
                    anchorRect.bottom -
                    canvasRect.top
                ) /
                scaleY +
                18
            }px`;

    }

    overlay.classList.add(
        "show"
    );

}

//----------------------------------
// Hide Preview
//----------------------------------

function hideConnectionPreview(
    preview = null
) {

    const overlay =
        preview ||
        connectionPreviewOverlay;

    overlay?.classList.remove(
        "show"
    );

}

//----------------------------------
// Expose
//----------------------------------

window.getConnectionPreviewOverlay =
    getConnectionPreviewOverlay;

window.showConnectionPreview =
    showConnectionPreview;

window.hideConnectionPreview =
    hideConnectionPreview;
