//----------------------------------
// Connection Renderer
//----------------------------------

//----------------------------------
// Draw Connections
//----------------------------------

function drawConnections() {

    clearConnectionRegistry();

    const drawn = new Set();

    layout.forEach(item => {

        if (!item) return;

        if (drawn.has(item.id)) return;

        drawn.add(item.id);

        drawKnockouts(item, "top");
        drawKnockouts(item, "right");
        drawKnockouts(item, "bottom");
        drawKnockouts(item, "left");

    });

}

//----------------------------------
// Draw Knockouts
//----------------------------------

function drawKnockouts(item, side) {

    const cell = grid.querySelector(
        `[data-index="${item.startCell}"]`
    );

    if (!cell) return;

    const panel =
        cell.querySelector(".panel-card");

    if (!panel) return;

    //----------------------------------
    // Shared Preview
    //----------------------------------

    const preview =
        getConnectionPreviewOverlay();

    //----------------------------------
    // Ports
    //----------------------------------

    const positions =
        getKnockoutPositions(item, side);

    positions.forEach(offset => {

        let connection =
            item.connections[side].find(c =>

                Math.abs(
                    c.offset - offset
                ) < 0.02

            );

        const node =
            document.createElement("div");

        node.className =
            "connection-node";

        //----------------------------------
        // Identity
        //----------------------------------

        assignConnectionIdentity(

            node,

            item,

            connection

        );

        //----------------------------------
// Routing Side
//----------------------------------

node.dataset.side = side;

        registerConnectionNode(

            item.id,

            connection?.id,

            node

        );

        //----------------------------------
        // Position
        //----------------------------------

        const pos =
            getNodePosition(
                item,
                side,
                offset
            );

        node.style.left = `${pos.x}px`;
        node.style.top = `${pos.y}px`;

        //----------------------------------
        // Existing Hardware
        //----------------------------------

        if (connection) {

            const hardwareCount =
                getHardwareCount(connection);

            if (hardwareCount > 0) {

                node.classList.add("occupied");

                node.title =
                    connection.hardware
                        .map(x => x.CatalogNumber)
                        .join(", ");

                //----------------------------------
                // Badge
                //----------------------------------

                const badge =
                    document.createElement("div");

                badge.className =
                    "connection-badge";

                badge.textContent =
                    hardwareCount;

                node.appendChild(badge);

                //----------------------------------
                // Thumbnail
                //----------------------------------

                const first =
                    connection.hardware[0];

                if (first?.DriveFileID) {

                    const img =
                        document.createElement("img");

                    img.className =
                        "connection-image";

                    img.src = getDriveImageUrl(first.DriveFileID, 64);

                    node.appendChild(img);

                }

            }
            else {

                node.title =
                    "Configure Connection";

            }

        }
        else {

            node.title =
                "Add Connection";

        }

        //----------------------------------
// Hover
//----------------------------------

node.onmouseenter = () => {

    //----------------------------------
    // Remember Hovered Connection
    //----------------------------------

    setHoveredConnection(connection);

    //----------------------------------
    // Preview
    //----------------------------------

    showConnectionPreview(

        preview,

        connection,

        panel,

        node

    );

};

node.onmouseleave = () => {

    //----------------------------------
    // Clear Hover
    //----------------------------------

    clearHoveredConnection();

    //----------------------------------
    // Preview
    //----------------------------------

    hideConnectionPreview(

        preview

    );

};

        //----------------------------------
        // Click
        //----------------------------------

        node.onclick = e => {

            e.stopPropagation();

            if (!connection) {

                connection =
                    addConnection(
                        item,
                        side,
                        offset
                    );

                updateConnectionIdentity(

                    node,

                    connection

                );

                registerConnectionNode(

                    item.id,

                    connection.id,

                    node

                );

            }

            handleConnectionClick(

                item,

                connection

            );

        };

       //----------------------------------
// Double Click
//----------------------------------

node.ondblclick = async e => {

    e.stopPropagation();

    if (!connection) {

        connection =
            addConnection(
                item,
                side,
                offset
            );

        updateConnectionIdentity(

            node,

            connection

        );

        registerConnectionNode(

            item.id,

            connection.id,

            node

        );

    }

    await openMaterialModal(

        connection

    );

};

        panel.appendChild(node);

    });

}
