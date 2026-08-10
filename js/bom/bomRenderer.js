//----------------------------------
// Get BOM Material List
//----------------------------------

function getBOMMaterialList() {

    const map = {};

    function addMaterial(material) {

        if (!material) return;

        const catalogNumber = String(

            material.CatalogNumber ??
            material.catalogNumber ??
            ""

        ).trim();

        if (!catalogNumber) return;

        const qty = Number(

            material.Qty ??
            material.qty ??
            material.Quantity ??
            1

        ) || 0;

        if (qty <= 0) return;

        if (!map[catalogNumber]) {

            map[catalogNumber] = {

                CatalogNumber: catalogNumber,

                Description:
                    material.Description ??
                    material.description ??
                    "",

                Qty: 0

            };

        }

        map[catalogNumber].Qty += qty;

        if (!map[catalogNumber].Description) {

            map[catalogNumber].Description =
                material.Description ??
                material.description ??
                "";

        }

    }

    //----------------------------------
    // Existing Generated BOM
    //----------------------------------

    const bom = generateBOM();

    Object.values(bom || {}).forEach(group => {

        if (!Array.isArray(group)) return;

        group.forEach(addMaterial);

    });

    //----------------------------------
    // Equipment Card Components
    //----------------------------------

    if (typeof getLayout === "function") {

        const seen = new Set();

        getLayout().forEach(item => {

            if (!item || seen.has(item.id)) return;

            seen.add(item.id);

            (item.materials || []).forEach(addMaterial);

        });

    }

    return Object.values(map).sort((a, b) =>

        String(a.CatalogNumber || "").localeCompare(
            String(b.CatalogNumber || "")
        )

    );

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

                    ${item.Qty}

                </div>

                <div class="bom-catalog">

                    ${item.CatalogNumber}

                </div>

                <div class="bom-description">

                    ${item.Description || ""}

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
