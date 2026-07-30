//----------------------------------
// Get BOM Material List
//----------------------------------

function getBOMMaterialList() {

    //----------------------------------
    // Complete Project Material Summary
    //----------------------------------

    if (
        typeof window.serializeMaterialSummary ===
        "function"
    ) {

        return window.serializeMaterialSummary();

    }

    //----------------------------------
    // Legacy Fallback
    //----------------------------------

    const bom = generateBOM();

    return Object.values(bom || {})
        .filter(Array.isArray)
        .flat();

}

//----------------------------------
// Render BOM
//----------------------------------

function renderBOM() {

    const body = document.getElementById("bomBody");

    if (!body) return;

    const list = getBOMMaterialList();

    if (!list.length) {

        body.innerHTML = `

            <div class="bom-empty">

                No Materials

            </div>

        `;

        return;

    }

    body.innerHTML = `

        <div class="bom-header">

            <div>Qty</div>

            <div>Catalog</div>

            <div>Description</div>

        </div>

        ${list.map(item => `

            <div class="bom-row">

                <div class="bom-qty">

                    ${Number(
                        item.Qty ??
                        item.qty ??
                        0
                    ) || 0}

                </div>

                <div class="bom-catalog">

                    ${
                        item.CatalogNumber ??
                        item.catalogNumber ??
                        ""
                    }

                </div>

                <div class="bom-description">

                    ${
                        item.Description ??
                        item.description ??
                        ""
                    }

                </div>

            </div>

        `).join("")}

    `;

}

//----------------------------------
// Expose
//----------------------------------

window.getBOMMaterialList =
    getBOMMaterialList;

window.renderBOM = renderBOM;
