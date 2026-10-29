//----------------------------------
// Panel Circuit Renderer
//----------------------------------

function escapePanelText(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function getPanelBreakerImage(material) {
  if (!material) return "";

  if (typeof getEquipmentImage === "function") {
    return getEquipmentImage(material)?.src || "";
  }

  return getDriveImageUrl(material.DriveFileID, 300);
}

function setPanelBreakerDragData(event, payload) {
  if (!event?.dataTransfer) return;

  event.dataTransfer.effectAllowed = "move";
  event.dataTransfer.setData(
    "text/plain",
    JSON.stringify(payload)
  );
}

function getPanelBreakerDragData(event) {
  try {
    return JSON.parse(
      event?.dataTransfer?.getData("text/plain") || "null"
    );
  }
  catch (error) {
    return null;
  }
}

function handlePanelBreakerDrop(event, side, index) {
  event.preventDefault();
  event.currentTarget?.classList.remove("drag-over");

  const payload = getPanelBreakerDragData(event);
  if (!payload) return false;

  if (payload.kind === "library") {
    const material =
      findPanelMaterial(payload.catalogNumber);

    return material
      ? placeEquipmentComponentAt(material, side, index)
      : false;
  }

  if (payload.kind === "installed") {
    const moved = moveEquipmentComponent(
      payload.componentId,
      side,
      index
    );

    if (!moved) {
      alert("That breaker does not fit in this slot.");
    }

    return moved;
  }

  return false;
}

function renderBreakerLibrary(container, components) {
  const search = String(
    document.getElementById("modalSearch")?.value || ""
  ).trim().toLowerCase();

  const selectedFamily =
    typeof getSelectedBreakerFamily === "function"
      ? getSelectedBreakerFamily()
      : "BR";

  const controls = document.createElement("div");
  controls.className = "panel-circuit-controls";
  controls.innerHTML = `
    <div class="panel-circuit-filter-label">BREAKER TYPE</div>
    <div class="breaker-family-filters">
      ${["BR", "CHP", "CSR"].map(family => `
        <button
          type="button"
          class="breaker-family-filter ${
            family === selectedFamily ? "active" : ""
          }"
          data-family="${family}"
        >${family}</button>
      `).join("")}
    </div>
    <div class="panel-circuit-help">
      Select an empty panel slot, then click a breaker card to install it.
    </div>
  `;

  controls.querySelectorAll("[data-family]").forEach(chip => {
    chip.onclick = () =>
      setSelectedBreakerFamily(chip.dataset.family);
  });

  container.appendChild(controls);

  const filtered = components
    .filter(material => {
      if (getBreakerFamily(material) !== selectedFamily) {
        return false;
      }

      const haystack = [
        material.CatalogNumber,
        material.Description,
        material.Type,
        getBreakerAmperage(material)
      ].join(" ").toLowerCase();

      return !search || haystack.includes(search);
    })
    .sort((first, second) => {
      const favoriteDifference =
        Number(second.Favorite || 0) -
        Number(first.Favorite || 0);

      if (favoriteDifference !== 0) {
        return favoriteDifference;
      }

      return String(first.CatalogNumber || "").localeCompare(
        String(second.CatalogNumber || "")
      );
    });

  // Matrix layout applies only to the breaker material library.
  // The panelboard renderer and breaker placement logic remain unchanged.
  const matrix = document.createElement("table");
  matrix.className = "panel-breaker-picker-matrix";
  matrix.setAttribute("aria-label", "Breaker material choices");
  matrix.innerHTML = `
    <thead><tr>
      <th scope="col">Rating</th>
      <th scope="col">1P</th>
      <th scope="col">2P</th>
      <th scope="col">3P</th>
      <th scope="col">4P</th>
    </tr></thead>
  `;

  const body = document.createElement("tbody");
  const rows = new Map();
  filtered.forEach(material => {
    const rating = Number(getBreakerAmperage(material)) || 0;
    const poles = Number(getBreakerPoleCount(material)) || 1;
    if (!rows.has(rating)) rows.set(rating, new Map());
    const cells = rows.get(rating);
    if (!cells.has(poles)) cells.set(poles, []);
    cells.get(poles).push(material);
  });

  Array.from(rows.keys()).sort((a, b) => b - a).forEach(rating => {
    const row = document.createElement("tr");
    const ratingCell = document.createElement("th");
    ratingCell.scope = "row";
    ratingCell.textContent = rating ? `${rating}A` : "—";
    row.appendChild(ratingCell);

    for (let poles = 1; poles <= 4; poles++) {
      const cell = document.createElement("td");
      const choices = rows.get(rating).get(poles) || [];
      if (!choices.length) {
        cell.className = "panel-breaker-matrix-empty";
        cell.textContent = "—";
      }
      choices.forEach(material => {
        const favorite = Math.max(0, Math.min(Number(material.Favorite || 0), 5));
        const card = document.createElement("button");
        card.type = "button";
        card.className = "panel-breaker-matrix-button";
        card.title = material.Description || material.CatalogNumber || "Install breaker";
        card.innerHTML = `
          <strong>${escapePanelText(material.CatalogNumber || "")}</strong>
          ${favorite ? `<span aria-label="Favorite: ${favorite} of 5">${"★".repeat(favorite)}</span>` : ""}
        `;
        card.draggable = true;
        card.ondragstart = event => {
          card.classList.add("dragging");
          setPanelBreakerDragData(event, {
            kind: "library",
            catalogNumber: material.CatalogNumber
          });
        };
        card.ondragend = () => card.classList.remove("dragging");
        card.onclick = () => addEquipmentComponent(material);
        cell.appendChild(card);
      });
      row.appendChild(cell);
    }
    body.appendChild(row);
  });

  matrix.appendChild(body);
  const matrixScroll = document.createElement("div");
  matrixScroll.className = "panel-breaker-matrix-scroll";
  matrixScroll.appendChild(matrix);
  container.appendChild(matrixScroll);

  if (!filtered.length) {
    const empty = document.createElement("div");
    empty.className = "panel-circuit-empty";
    empty.textContent =
      `No ${selectedFamily} breakers found in the MML.`;
    container.appendChild(empty);
  }
}

function renderPanelSlotCell(equipment, side, index) {
  const occupant = getPanelSlotOccupant(equipment, side, index);
  const selected = getSelectedPanelSlot();
  const slotNumber = index * 2 + (side === "left" ? 1 : 2);
  const button = document.createElement("button");

  button.type = "button";
  button.className = "panel-slot";
  button.dataset.side = side;
  button.dataset.index = index;

  if (
    selected &&
    selected.side === side &&
    selected.index === index
  ) {
    button.classList.add("selected");
  }

  if (!occupant) {
    button.classList.add("empty");
    button.innerHTML = `
      <span class="panel-slot-number">${slotNumber}</span>
      <span class="panel-slot-empty">empty</span>
    `;
    button.onclick = () => selectPanelSlot(side, index);
    button.ondragover = event => {
      event.preventDefault();
      event.dataTransfer.dropEffect = "move";
      button.classList.add("drag-over");
    };
    button.ondragleave = () => {
      button.classList.remove("drag-over");
    };
    button.ondrop = event => {
      handlePanelBreakerDrop(event, side, index);
    };
    return button;
  }

  const slot = occupant.panelSlot;
  const span = Math.max(1, Number(slot.span || 1));
  const material = findPanelMaterial(occupant.catalogNumber);
  const family = slot.family || getBreakerFamily(material);
  const image = getPanelBreakerImage(material);
  const endSlotNumber =
    (index + span - 1) * 2 +
    (side === "left" ? 1 : 2);

  button.classList.add(
    "occupied",
    `family-${String(family).toLowerCase()}`
  );

  if (span > 1) {
    button.classList.add("multipole");
    button.style.gridRow = `span ${span}`;
  }

  button.innerHTML = `
    <span class="panel-slot-number">
      ${span > 1 ? `${slotNumber}–${endSlotNumber}` : slotNumber}
    </span>
    ${image ? `
      <img
        class="panel-slot-breaker-image"
        src="${escapePanelText(image)}"
        alt=""
      >
    ` : ""}
    <span class="panel-slot-breaker">
      <strong>${escapePanelText(occupant.catalogNumber)}</strong>
      <small>${getBreakerAmperage(material) || ""}A • ${span}P</small>
    </span>
    <span
      class="panel-slot-remove"
      title="Remove breaker"
      aria-label="Remove breaker"
    >×</span>
  `;

  const imageElement =
    button.querySelector(".panel-slot-breaker-image");

  if (imageElement) {
    imageElement.onerror = () => {
      imageElement.style.display = "none";
    };
  }

  button.draggable = true;
  button.ondragstart = event => {
    button.classList.add("dragging");
    setPanelBreakerDragData(event, {
      kind: "installed",
      componentId: occupant.id
    });
  };
  button.ondragend = () => {
    button.classList.remove("dragging");
  };

  const removeButton =
    button.querySelector(".panel-slot-remove");

  if (removeButton) {
    removeButton.onclick = event => {
      event.preventDefault();
      event.stopPropagation();
      removeEquipmentComponent(occupant.id);
    };
  }

  button.onclick = () => {
    selectPanelSlot(side, index);
  };

  return button;
}

function renderPanelboard(container, equipment) {
  const leftCapacity = getPanelSideCapacity(equipment, "left");
  const rightCapacity = getPanelSideCapacity(equipment, "right");
  const rows = Math.max(leftCapacity, rightCapacity);
  const placed = getPanelPlacedComponents(equipment);
  const branchCount = placed.filter(
    entry => entry.panelSlot.section === "branch"
  ).reduce((sum, entry) => sum + Number(entry.panelSlot.span || 1), 0);

  const board = document.createElement("aside");
  board.className = "panelboard";
  board.innerHTML = `
    <div class="panelboard-heading">
      <div>
        <h3>PANELBOARD</h3>
        <small>${escapePanelText(equipment.data?.CatalogNumber || "")}</small>
      </div>
      <span>Used: ${branchCount} / ${leftCapacity + rightCapacity}</span>
    </div>
    <div class="panelboard-column-headings">
      <span>LEFT / ODD</span>
      <span>RIGHT / EVEN</span>
    </div>
    <div class="panelboard-slots">
      <div class="panelboard-column panelboard-column--left"></div>
      <div class="panelboard-bus"></div>
      <div class="panelboard-column panelboard-column--right"></div>
    </div>
    <div class="panel-main-breaker">
      <span class="panel-main-label">MAIN</span>
      <div class="panel-main-content"></div>
    </div>
  `;

  const leftColumn = board.querySelector(".panelboard-column--left");
  const rightColumn = board.querySelector(".panelboard-column--right");

  function renderSide(column, side, capacity) {
    let index = 0;

    while (index < capacity) {
      const occupant =
        getPanelSlotOccupant(equipment, side, index);

      if (
        occupant &&
        Number(occupant.panelSlot?.index || 0) < index
      ) {
        index += 1;
        continue;
      }

      const cell =
        renderPanelSlotCell(equipment, side, index);

      column.appendChild(cell);

      const span =
        occupant
          ? Math.max(
              1,
              Number(occupant.panelSlot?.span || 1)
            )
          : 1;

      index += span;
    }
  }

  renderSide(leftColumn, "left", leftCapacity);
  renderSide(rightColumn, "right", rightCapacity);

  const mainContainer = board.querySelector(".panel-main-content");
  const main = placed.find(
    entry => entry.panelSlot.section === "main"
  );

  mainContainer.ondragover = event => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    mainContainer.classList.add("drag-over");
  };

  mainContainer.ondragleave = () => {
    mainContainer.classList.remove("drag-over");
  };

  mainContainer.ondrop = event => {
    event.preventDefault();
    mainContainer.classList.remove("drag-over");

    const payload = getPanelBreakerDragData(event);

    if (payload?.kind !== "library") {
      return;
    }

    const material =
      findPanelMaterial(payload.catalogNumber);

    if (
      material &&
      getBreakerFamily(material) === "CSR"
    ) {
      addEquipmentComponent(material);
    }
  };

  if (main) {
    const material = findPanelMaterial(main.catalogNumber);
    const image = getPanelBreakerImage(material);
    mainContainer.classList.add("occupied");
    mainContainer.innerHTML = `
      ${image ? `<img src="${escapePanelText(image)}" alt="">` : ""}
      <span>
        <strong>${escapePanelText(main.catalogNumber)}</strong>
        <small>${getBreakerAmperage(material) || ""}A MAIN</small>
      </span>
      <button type="button" class="panel-main-remove">×</button>
    `;
    mainContainer.querySelector(".panel-main-remove").onclick = () => {
      removeEquipmentComponent(main.id);
    };
  } else {
    mainContainer.innerHTML =
      '<span class="panel-main-empty">Click a CSR breaker to install</span>';
  }

  container.appendChild(board);
}

function renderEquipmentComponents() {
  const modal = document.getElementById("equipmentModal");
  const body = modal?.querySelector(".modal-body");
  const filterPanel = modal?.querySelector(".filter-panel");
  const libraryPanel = modal?.querySelector(".library-panel");
  const list = document.getElementById("modalList");
  const equipment = getCurrentEquipment();

  if (!modal || !body || !libraryPanel || !list || !equipment) {
    return;
  }

  const editorType =
    typeof getEquipmentEditorType === "function"
      ? getEquipmentEditorType(equipment)
      : "PANEL";

  if (
    editorType === "DISCONNECT" &&
    typeof renderDisconnectPresetEditor === "function"
  ) {
    renderDisconnectPresetEditor(
      modal,
      equipment
    );

    return;
  }

  modal.classList.remove("disconnect-preset-mode");

  body.querySelectorAll(".disconnect-editor")
    .forEach(node => node.remove());

  if (editorType !== "PANEL") {
    modal.classList.remove("equipment-circuit-mode");

    const title =
      modal.querySelector(".modal-header h2");

    title.textContent = "Equipment Components";

    if (filterPanel) {
      filterPanel.style.display = "none";
    }

    body.querySelectorAll(".panelboard")
      .forEach(node => node.remove());

    list.innerHTML = "";
    list.className = "panel-breaker-library";

    renderBreakerLibrary(
      list,
      getEquipmentCardLibrary()
    );

    return;
  }

  modal.classList.add("equipment-circuit-mode");

  const title = modal.querySelector(".modal-header h2");
  title.textContent = "Panel Circuit Configuration";

  if (filterPanel) filterPanel.style.display = "none";

  body.querySelectorAll(".panelboard").forEach(node => node.remove());

  list.innerHTML = "";
  list.className = "panel-breaker-library";

  const components = getEquipmentCardLibrary();

  renderBreakerLibrary(list, components);
  renderPanelboard(body, equipment);

  if (!getSelectedPanelSlot()) {
    selectFirstAvailablePanelSlot();
    const selected = getSelectedPanelSlot();
    if (selected) {
      const slot = body.querySelector(
        `.panel-slot[data-side="${selected.side}"][data-index="${selected.index}"]`
      );
      slot?.classList.add("selected");
    }
  }
}

window.escapePanelText = escapePanelText;
window.renderEquipmentComponents = renderEquipmentComponents;
