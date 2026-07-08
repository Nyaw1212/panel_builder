//----------------------------------
// Show Preview
//----------------------------------

function showConnectionPreview(
    preview,
    connection,
    panel
) {

    preview.innerHTML = "";

    if (!connection?.hardware?.length) {

        return;

    }

    connection.hardware.forEach((hardware, index) => {

        const card = document.createElement("div");

        card.className = "preview-card";

        card.style.animationDelay = `${index * 50}ms`;

        card.innerHTML = `

            <img
                src="https://drive.google.com/thumbnail?id=${hardware.DriveFileID}&sz=w120"
            >

            <div class="preview-code">

                ${hardware.CatalogNumber}

            </div>

            <div class="preview-desc">

                ${hardware.Description}

            </div>

        `;

        preview.appendChild(card);

    });

    preview.classList.add("show");

    preview.style.left =
        `${panel.offsetWidth / 2}px`;

    preview.style.top =
        `${panel.offsetHeight + 500}px`;

}

//----------------------------------
// Hide Preview
//----------------------------------

function hideConnectionPreview(preview) {

    preview.classList.remove("show");

}