//----------------------------------
// Disconnect Preset Editor
//----------------------------------

let selectedDisconnectFuseSlot = 0;

function getEquipmentEditorType(equipment) {
  const type = String(
    equipment?.data?.Type ??
    equipment?.data?.NodeType ??
    ""
  ).trim().toUpperCase();

  if (type.includes("DISCONNECT")) return "DISCONNECT";
  if (type.includes("PANEL")) return "PANEL";

  return "GENERIC";
}

function findMMLItem(catalogNumber) {
  const target = String(catalogNumber || "")
    .trim()
    .toUpperCase();

  return [
    ...(typeof getMaterials === "function" ? getMaterials() : []),
    ...(typeof getEquipment === "function" ? getEquipment() : [])
  ].find(item =>
    String(item?.CatalogNumber || "")
      .trim()
      .toUpperCase() === target
  ) || null;
}

function isFuseMMLItem(item) {
  if (!item) return false;

  const nodeType = String(item.NodeType || "")
    .trim()
    .toUpperCase();

  const text = [
    item.Type,
    item.Description,
    item.CatalogNumber
  ].join(" ").toUpperCase();

  return (
    nodeType === "FUSE" ||
    /\bFUSE\b/.test(text)
  );
}

function getDisconnectPresetCodes() {
  const codes = Array.from(
    new Set(
      (window.presets || [])
        .map(row => getRowPresetCode(row))
        .filter(Boolean)
    )
  );

  return codes
    .filter(code => {
      const equipment = getPresetEquipment(code);
      return getEquipmentEditorType({ data: equipment }) === "DISCONNECT";
    })
    .sort((first, second) => {
      const firstNumber =
        Number(String(first).replace(/\D/g, "")) || 0;

      const secondNumber =
        Number(String(second).replace(/\D/g, "")) || 0;

      return firstNumber - secondNumber;
    });
}

function getDisconnectFuseLibrary() {
  return (typeof getMaterials === "function"
    ? getMaterials()
    : []
  )
    .filter(isFuseMMLItem)
    .sort((first, second) => {
      const favoriteDifference =
        Number(second.Favorite || 0) -
        Number(first.Favorite || 0);

      if (favoriteDifference !== 0) {
        return favoriteDifference;
      }

      return String(first.CatalogNumber || "")
        .localeCompare(
          String(second.CatalogNumber || "")
        );
    });
}

function getDisconnectFuseEntry(equipment, slotIndex) {
  return (equipment?.materials || []).find(
    entry =>
      Number(entry?.disconnectFuseSlot) ===
      Number(slotIndex)
  ) || null;
}

function buildDisconnectPresetMaterials(
  presetCode,
  presetEquipment
) {
  const presetMaterials =
    ensureMainEquipmentMaterial(
      getApiPresetMaterials(presetCode),
      presetEquipment
    );

  const result = [];
  let fuseSlot = 0;

  presetMaterials.forEach(material => {
    const mmlItem =
      findMMLItem(material.catalogNumber);

    if (isFuseMMLItem(mmlItem)) {
      const quantity = Math.max(
        1,
        Number(material.qty || 1)
      );

      for (
        let count = 0;
        count < quantity && fuseSlot < 2;
        count += 1
      ) {
        result.push({
          ...structuredClone(material),
          id: crypto.randomUUID(),
          qty: 1,
          disconnectFuseSlot: fuseSlot
        });

        fuseSlot += 1;
      }

      return;
    }

    result.push(
      structuredClone(material)
    );
  });

  return result;
}

function applyDisconnectPreset(presetCode) {
  const equipment = getCurrentEquipment();
  const presetEquipment =
    getPresetEquipment(presetCode);

  if (
    !equipment ||
    !presetEquipment ||
    getEquipmentEditorType({
      data: presetEquipment
    }) !== "DISCONNECT"
  ) {
    return false;
  }

  if (
    typeof canPlace === "function" &&
    !canPlace(
      presetEquipment,
      equipment.startCell,
      equipment
    )
  ) {
    alert(
      "The replacement disconnect does not fit in its current canvas position."
    );

    return false;
  }

  const layout = getLayout();

  (equipment.occupied || []).forEach(index => {
    if (layout[index] === equipment) {
      layout[index] = null;
    }
  });

  equipment.data =
    structuredClone(presetEquipment);

  equipment.width =
    Number(presetEquipment.GridWidth || 1);

  equipment.height =
    Number(presetEquipment.GridHeight || 1);

  equipment.preset =
    String(presetCode || "").trim();

  equipment.materials =
    buildDisconnectPresetMaterials(
      presetCode,
      presetEquipment
    );

  updateOccupiedCells(equipment);

  equipment.occupied.forEach(index => {
    layout[index] = equipment;
  });

  selectedDisconnectFuseSlot = 0;

  if (
    window.HistoryManagerV2 &&
    typeof window.HistoryManagerV2.capture === "function"
  ) {
    window.HistoryManagerV2.capture(
      "Disconnect preset changed"
    );
  }

  if (typeof drawCanvas === "function") {
    drawCanvas();
  }

  refreshEquipmentCardModal();
  return true;
}

function installDisconnectFuse(material, slotIndex) {
  const equipment = getCurrentEquipment();

  if (
    !equipment ||
    !material ||
    !isFuseMMLItem(material)
  ) {
    return false;
  }

  if (!Array.isArray(equipment.materials)) {
    equipment.materials = [];
  }

  equipment.materials =
    equipment.materials.filter(
      entry =>
        Number(entry?.disconnectFuseSlot) !==
        Number(slotIndex)
    );

  equipment.materials.push({
    id: crypto.randomUUID(),
    catalogNumber:
      material.CatalogNumber,
    description:
      material.Description || "",
    inventoryCategory:
      material.InventoryCategory || "",
    qty: 1,
    disconnectFuseSlot:
      Number(slotIndex)
  });

  selectedDisconnectFuseSlot =
    Number(slotIndex) === 0 ? 1 : 0;

  if (
    window.HistoryManagerV2 &&
    typeof window.HistoryManagerV2.capture === "function"
  ) {
    window.HistoryManagerV2.capture(
      "Disconnect fuse changed"
    );
  }

  refreshEquipmentCardModal();
  return true;
}

function removeDisconnectFuse(slotIndex) {
  const equipment = getCurrentEquipment();
  if (!equipment) return false;

  const originalLength =
    equipment.materials?.length || 0;

  equipment.materials =
    (equipment.materials || []).filter(
      entry =>
        Number(entry?.disconnectFuseSlot) !==
        Number(slotIndex)
    );

  if (equipment.materials.length === originalLength) {
    return false;
  }

  if (
    window.HistoryManagerV2 &&
    typeof window.HistoryManagerV2.capture === "function"
  ) {
    window.HistoryManagerV2.capture(
      "Disconnect fuse removed"
    );
  }

  refreshEquipmentCardModal();
  return true;
}

function renderDisconnectPresetEditor(
  modal,
  equipment
) {
  const body = modal.querySelector(".modal-body");
  const filterPanel = modal.querySelector(".filter-panel");
  const list = document.getElementById("modalList");

  if (!body || !list) return;

  modal.classList.remove("equipment-circuit-mode");
  modal.classList.add("disconnect-preset-mode");

  body.querySelectorAll(
    ".panelboard, .disconnect-editor"
  ).forEach(node => node.remove());

  if (filterPanel) {
    filterPanel.style.display = "none";
  }

  const title =
    modal.querySelector(".modal-header h2");

  title.textContent =
    "Disconnect Preset Configuration";

  list.className = "disconnect-library";
  list.innerHTML = "";

  const presetCodes =
    getDisconnectPresetCodes();

  const presetSection =
    document.createElement("section");

  presetSection.className =
    "disconnect-preset-section";

  presetSection.innerHTML = `
    <div class="panel-circuit-filter-label">
      DISCONNECT PRESET
    </div>
    <div class="disconnect-preset-chips">
      ${presetCodes.map(code => `
        <button
          type="button"
          class="disconnect-preset-chip ${
            String(equipment.preset || "")
              .toUpperCase() ===
            String(code).toUpperCase()
              ? "active"
              : ""
          }"
          data-preset="${escapePanelText(code)}"
        >${escapePanelText(code)}</button>
      `).join("")}
    </div>
  `;

  presetSection
    .querySelectorAll("[data-preset]")
    .forEach(button => {
      button.onclick = () =>
        applyDisconnectPreset(
          button.dataset.preset
        );
    });

  list.appendChild(presetSection);

  const search = String(
    document.getElementById("modalSearch")
      ?.value || ""
  ).trim().toLowerCase();

  const fuses =
    getDisconnectFuseLibrary()
      .filter(material => {
        const haystack = [
          material.CatalogNumber,
          material.Description,
          material.Type
        ].join(" ").toLowerCase();

        return (
          !search ||
          haystack.includes(search)
        );
      });

  const fuseHeading =
    document.createElement("h3");

  fuseHeading.className =
    "disconnect-library-heading";

  fuseHeading.textContent =
    "FUSE LIBRARY";

  list.appendChild(fuseHeading);

  const fuseGrid =
    document.createElement("div");

  fuseGrid.className =
    "disconnect-fuse-library-grid";

  fuses.forEach(material => {
    const image =
      getPanelBreakerImage(material);

    const favorite = Math.max(
      0,
      Math.min(
        Number(material.Favorite || 0),
        5
      )
    );

    const card =
      document.createElement("button");

    card.type = "button";
    card.className =
      "disconnect-fuse-library-card";

    card.innerHTML = `
      ${image ? `
        <img
          src="${escapePanelText(image)}"
          alt=""
        >
      ` : ""}
      <span>
        <strong>${escapePanelText(
          material.CatalogNumber
        )}</strong>
        <small>${escapePanelText(
          material.Description || ""
        )}</small>
      </span>
      ${favorite > 0 ? `
        <span class="panel-breaker-favorite">
          ${"★".repeat(favorite)}
        </span>
      ` : ""}
    `;

    card.onclick = () =>
      installDisconnectFuse(
        material,
        selectedDisconnectFuseSlot
      );

    fuseGrid.appendChild(card);
  });

  list.appendChild(fuseGrid);

  const editor =
    document.createElement("aside");

  editor.className =
    "disconnect-editor";

  const equipmentImage =
    getPanelBreakerImage(equipment.data);

  editor.innerHTML = `
    <div class="disconnect-editor-heading">
      <div>
        <h3>DISCONNECT</h3>
        <small>${escapePanelText(
          equipment.data?.CatalogNumber || ""
        )}</small>
      </div>
      <strong>${escapePanelText(
        equipment.preset || "NO PRESET"
      )}</strong>
    </div>

    <div class="disconnect-switch-visual">
      ${equipmentImage ? `
        <img
          src="${escapePanelText(
            equipmentImage
          )}"
          alt=""
        >
      ` : ""}
      <span>${escapePanelText(
        equipment.data?.Description || ""
      )}</span>
    </div>

    <div class="disconnect-fuse-slots"></div>
  `;

  const slotContainer =
    editor.querySelector(
      ".disconnect-fuse-slots"
    );

  [0, 1].forEach(slotIndex => {
    const entry =
      getDisconnectFuseEntry(
        equipment,
        slotIndex
      );

    const material =
      entry
        ? findMMLItem(
            entry.catalogNumber
          )
        : null;

    const image =
      getPanelBreakerImage(material);

    const slot =
      document.createElement("button");

    slot.type = "button";
    slot.className =
      "disconnect-fuse-slot";

    if (
      selectedDisconnectFuseSlot ===
      slotIndex
    ) {
      slot.classList.add("selected");
    }

    if (entry) {
      slot.classList.add("occupied");
      slot.innerHTML = `
        <span class="disconnect-fuse-slot-label">
          FUSE ${slotIndex + 1}
        </span>
        ${image ? `
          <img
            src="${escapePanelText(image)}"
            alt=""
          >
        ` : ""}
        <strong>${escapePanelText(
          entry.catalogNumber
        )}</strong>
        <span
          class="disconnect-fuse-remove"
          title="Remove fuse"
        >×</span>
      `;

      slot.querySelector(
        ".disconnect-fuse-remove"
      ).onclick = event => {
        event.stopPropagation();
        removeDisconnectFuse(
          slotIndex
        );
      };
    }
    else {
      slot.classList.add("empty");
      slot.innerHTML = `
        <span class="disconnect-fuse-slot-label">
          FUSE ${slotIndex + 1}
        </span>
        <span>Click, then choose a fuse</span>
      `;
    }

    slot.onclick = () => {
      selectedDisconnectFuseSlot =
        slotIndex;

      renderEquipmentComponents();
    };

    slotContainer.appendChild(slot);
  });

  body.appendChild(editor);
}

window.getEquipmentEditorType =
  getEquipmentEditorType;

window.applyDisconnectPreset =
  applyDisconnectPreset;

window.installDisconnectFuse =
  installDisconnectFuse;

window.removeDisconnectFuse =
  removeDisconnectFuse;

window.renderDisconnectPresetEditor =
  renderDisconnectPresetEditor;
