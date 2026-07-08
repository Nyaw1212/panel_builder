//----------------------------------
// Render BOM
//----------------------------------

function renderBOM() {

    const body = document.getElementById("bomBody");

    if (!body) return;

    const bom = generateBOM();

    const list = bom.fittings;

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

                    ${item.Qty}

                </div>

                <div class="bom-catalog">

                    ${item.CatalogNumber}

                </div>

                <div class="bom-description">

                    ${item.Description}

                </div>

            </div>

        `).join("")}

    `;

}

window.renderBOM = renderBOM;