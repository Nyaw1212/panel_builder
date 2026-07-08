//----------------------------------
// Render Panels
//----------------------------------

function renderInspectorPanels(link) {

    return `

        <div class="inspector-section">

            <div class="panel-run">

                <div class="panel-card">

                    <div class="panel-label">

                        START PANEL

                    </div>

                    <div class="panel-name">

                        ${link.panels?.start?.data?.CatalogNumber || "-"}

                    </div>

                    <div class="panel-desc">

                        ${link.panels?.start?.data?.Description || ""}

                    </div>

                </div>

                <div class="panel-arrow">

                    ➜

                </div>

                <div class="panel-card">

                    <div class="panel-label">

                        END PANEL

                    </div>

                    <div class="panel-name">

                        ${link.panels?.end?.data?.CatalogNumber || "-"}

                    </div>

                    <div class="panel-desc">

                        ${link.panels?.end?.data?.Description || ""}

                    </div>

                </div>

            </div>

        </div>

        <div class="inspector-section">

            <div class="inspector-title">

                Link

            </div>

            <div class="inspector-row">

                <span>Length</span>

                <strong>${Math.round(link.length)}"</strong>

            </div>

        </div>

    `;

}