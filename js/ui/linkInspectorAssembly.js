//----------------------------------
// Build Fitting Run
//----------------------------------

function getFittingRun(link) {

    return [

        ...link.nodes.start.hardware.map((material, index) => ({
            section: "start",
            index,
            material
        })),

        ...link.assembly.map((part, index) => ({
            section: "assembly",
            index,
            material: part.material,
            type: part.type,
            part
        })),

        ...link.nodes.end.hardware.map((material, index) => ({
            section: "end",
            index,
            material
        }))

    ];

}

//----------------------------------
// Render Assembly
//----------------------------------

function renderInspectorAssembly(link) {

    const fittings = getFittingRun(link);

    return `

        <div class="inspector-section">

            <div class="inspector-title">

                Fittings

            </div>

            <div class="assembly-run">

                ${fittings.map((item, i) => {

                    const image = getDriveImageUrl(item.material?.DriveFileID, 200);

                    return `

                        <div
                            class="assembly-card"
                            data-section="${item.section}"
                            data-index="${item.index}"
                        >

                            ${item.material ? `

                                <button
                                    class="assembly-remove"
                                    data-section="${item.section}"
                                    data-index="${item.index}"
                                >

                                    ✕

                                </button>

                            ` : ""}

                            <div class="assembly-image">

                                ${image
                                    ? `<img src="${image}">`
                                    : `<span>Select</span>`
                                }

                            </div>

                            <div class="assembly-name">

                                ${item.material?.CatalogNumber || item.type || ""}

                            </div>

                            <div class="assembly-qty">

                                Qty: ${item.part?.qty ?? 1}

                            </div>

                            <div class="assembly-desc">

                                ${item.material?.Description || "Click to Select"}

                            </div>

                        </div>

                        ${

                            i < fittings.length - 1

                                ? `<div class="assembly-arrow">➜</div>`

                                : ""

                        }

                    `;

                }).join("")}

            </div>

        </div>

    `;

}

//----------------------------------
// Assembly Events
//----------------------------------

function bindAssemblyEvents(link) {

    //----------------------------------
    // Card Click
    //----------------------------------

    document

        .querySelectorAll(".assembly-card")

        .forEach(card => {

            card.addEventListener("click", () => {

                openAssemblyPicker(

                    link,

                    card.dataset.section,

                    Number(card.dataset.index)

                );

            });

        });

    //----------------------------------
    // Remove
    //----------------------------------

    document

        .querySelectorAll(".assembly-remove")

        .forEach(button => {

            button.addEventListener("click", e => {

                e.stopPropagation();

                removeAssemblyMaterial(

                    link,

                    button.dataset.section,

                    Number(button.dataset.index)

                );

            });

        });

}
