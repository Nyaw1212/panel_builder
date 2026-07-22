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

  return material.DriveFileID
    ? `https://drive.google.com/thumbnail?id=${material.DriveFileID}&sz=w300`
    : "";
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

  const filtered = components.filter(material => {
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
  });

  const grid = document.createElement("div");
  grid.className = "panel-breaker-card-grid";

  filtered.forEach(material => {
    const amp = getBreakerAmperage(material);
    const poles = getBreakerPoleCount(material);
    const image = getPanelBreakerImage(material);
    const card = document.createElement("button");

    card.type = "button";
    card.className = "panel-breaker-card";
    card.title = `Install ${material.CatalogNumber}`;
    card.innerHTML = `
      ${image ? `
        <img
          class="panel-breaker-card__image"
          src="${escapePanelText(image)}"
          alt=""
        >
      ` : `
        <span class="panel-breaker-card__image panel-breaker-card__image--empty">
          ${escapePanelText(selectedFamily)}
        </span>
      `}
      <span class="panel-breaker-card__info">
        <strong>${escapePanelText(material.CatalogNumber)}</strong>
        <span>${escapePanelText(material.Description || material.Type || "")}</span>
        <small>${amp ? `${amp}A` : ""} • ${poles}P</small>
      </span>
    `;

    const img = card.querySelector("img");
    if (img) {
      img.onerror = () => {
        img.style.display = "none";
      };
    }

    card.onclick = () => addEquipmentComponent(material);
    grid.appendChild(card);
  });

  container.appendChild(grid);

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
    return button;
  }

  const slot = occupant.panelSlot;
  const start = Number(slot.index || 0);
  const material = findPanelMaterial(occupant.catalogNumber);
  const isStart = index === start;
  const family = slot.family || getBreakerFamily(material);

  button.classList.add("occupied", `family-${String(family).toLowerCase()}`);
  if (!isStart) button.classList.add("continuation");

  button.innerHTML = `
    <span class="panel-slot-number">${slotNumber}</span>
    <span class="panel-slot-breaker">
      <strong>${escapePanelText(occupant.catalogNumber)}</strong>
      <small>${getBreakerAmperage(material) || ""}A • ${slot.span || 1}P</small>
    </span>
    ${isStart ? `
      <span
        class="panel-slot-remove"
        title="Remove breaker"
        aria-label="Remove breaker"
      >×</span>
    ` : ""}
  `;

  if (isStart) {
    button.onclick = event => {
      event.stopPropagation();
      removeEquipmentComponent(occupant.id);
    };
  }

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

  for (let index = 0; index < rows; index += 1) {
    if (index < leftCapacity) {
      leftColumn.appendChild(
        renderPanelSlotCell(equipment, "left", index)
      );
    }

    if (index < rightCapacity) {
      rightColumn.appendChild(
        renderPanelSlotCell(equipment, "right", index)
      );
    }
  }

  const mainContainer = board.querySelector(".panel-main-content");
  const main = placed.find(
    entry => entry.panelSlot.section === "main"
  );

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
