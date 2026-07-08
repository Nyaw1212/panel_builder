//----------------------------------
// Render Conduit
//----------------------------------

function renderInspectorConduit(link) {

    return `

        <div class="inspector-section">

            <div class="inspector-title">

                Conduit

            </div>

            <div class="inspector-row">

                <label>Type</label>

                <select id="conduitType">

                    <option value="EMT" ${link.conduit.type === "EMT" ? "selected" : ""}>EMT</option>
                    <option value="PVC" ${link.conduit.type === "PVC" ? "selected" : ""}>PVC</option>
                    <option value="LFMC" ${link.conduit.type === "LFMC" ? "selected" : ""}>LFMC</option>

                </select>

            </div>

            <div class="inspector-row">

                <label>Size</label>

                <select id="conduitSize">

                    <option value='1/2"' ${link.conduit.size === '1/2"' ? "selected" : ""}>1/2"</option>
                    <option value='3/4"' ${link.conduit.size === '3/4"' ? "selected" : ""}>3/4"</option>
                    <option value='1"' ${link.conduit.size === '1"' ? "selected" : ""}>1"</option>
                    <option value='1-1/4"' ${link.conduit.size === '1-1/4"' ? "selected" : ""}>1-1/4"</option>
                    <option value='1-1/2"' ${link.conduit.size === '1-1/2"' ? "selected" : ""}>1-1/2"</option>
                    <option value='2"' ${link.conduit.size === '2"' ? "selected" : ""}>2"</option>

                </select>

            </div>

        </div>

    `;

}

//----------------------------------
// Conduit Events
//----------------------------------

function bindConduitEvents(link) {

    const conduitType =
        document.getElementById("conduitType");

    if (conduitType) {

        conduitType.addEventListener("change", e => {

            link.conduit.type = e.target.value;

            updateLinkAssembly(link);

            updateLinkMaterials(link);

            refreshLinkInspector();

        });

    }

    const conduitSize =
        document.getElementById("conduitSize");

    if (conduitSize) {

        conduitSize.addEventListener("change", e => {

            link.conduit.size = e.target.value;

            updateLinkAssembly(link);

            updateLinkMaterials(link);

            refreshLinkInspector();

        });

    }

}