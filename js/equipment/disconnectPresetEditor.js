//----------------------------------
// Disconnect Preset Editor
//----------------------------------

let selectedDisconnectFuseSlot = 0;

function getEquipmentEditorType(equipment) {
  const type = [
    equipment?.data?.Type,
    equipment?.data?.NodeType,
    equipment?.data?.Category
  ].filter(Boolean).join(" ").trim().toUpperCase();

  const presetCode = String(
    equipment?.preset ||
    equipment?.data?.PRESET ||
    ""
  ).trim();

  const presetEquipment = presetCode &&
    typeof getPresetEquipment === "function"
    ? getPresetEquipment(presetCode)
    : null;

  const presetType = [
    presetEquipment?.Type,
    presetEquipment?.NodeType,
    presetEquipment?.Category
  ].filter(Boolean).join(" ").trim().toUpperCase();

  if (
    type.includes("DISCONNECT") ||
    presetType.includes("DISCONNECT") ||
    /(?:^|[-_\s])DISC(?:ONNECT)?(?:$|[-_\s])/i.test(presetCode)
  ) return "DISCONNECT";
  if (type.includes("PANEL") || type.includes("FSU")) return "PANEL";

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

//----------------------------------
// L-DISC Material Picker
//----------------------------------

function getItemPresetCode(item) {
  return String(
    item?.preset ||
    item?.data?.PRESET ||
    item?.data?.Preset ||
    ""
  ).trim();
}

function isLDiscMaterialCard(item) {
  const type = [
    item?.data?.NodeType,
    item?.data?.Type,
    item?.data?.Category
  ].join(" ")
    .replace(/[^A-Z0-9]/gi, "")
    .toUpperCase();

  return type.includes("LDISC");
}

function getLDiscMaterialLibrary() {
  const catalog = [
    ...(typeof getMaterials === "function"
      ? getMaterials()
      : []),
    ...(typeof getEquipment === "function"
      ? getEquipment()
      : [])
  ];

  const unique = new Map();

  catalog.forEach(material => {
    const catalogNumber = String(
      material?.CatalogNumber || ""
    ).trim().toUpperCase();

    if (catalogNumber && !unique.has(catalogNumber)) {
      unique.set(catalogNumber, material);
    }
  });

  return Array.from(unique.values())
    // The MML NodeType is the real component category. D60 is a WireAss
    // preset, while L-DISC identifies which materials may replace it.
    .filter(isLDiscMaterialCard)
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
}

function replaceLDiscMaterial(equipment, material) {
  if (!equipment || !material || !isLDiscMaterialCard({ data: material })) {
    return false;
  }

  if (
    typeof canPlace === "function" &&
    !canPlace(material, equipment.startCell, equipment)
  ) {
    alert(
      "The selected L-DISC material does not fit in its current canvas position."
    );

    return false;
  }

  const layout = getLayout();
  const previousCatalog = String(
    equipment.data?.CatalogNumber || ""
  ).trim().toUpperCase();

  (equipment.occupied || []).forEach(index => {
    if (layout[index] === equipment) {
      layout[index] = null;
    }
  });

  equipment.data = structuredClone(material);
  equipment.width = Number(material.GridWidth || 1);
  equipment.height = Number(material.GridHeight || 1);
  // Keep the canvas preset (for example D60). WireAss uses that value;
  // only the physical L-DISC component is being replaced.
  equipment.preset = getItemPresetCode(equipment);

  const mainMaterial = {
    id: crypto.randomUUID(),
    catalogNumber: material.CatalogNumber,
    description: material.Description || "",
    inventoryCategory: material.InventoryCategory || "",
    qty: 1
  };

  equipment.materials = [
    mainMaterial,
    ...(equipment.materials || []).filter(entry => {
      return String(
        entry?.catalogNumber || entry?.CatalogNumber || ""
      ).trim().toUpperCase() !== previousCatalog;
    })
  ];

  updateOccupiedCells(equipment);

  equipment.occupied.forEach(index => {
    layout[index] = equipment;
  });

  if (
    window.HistoryManagerV2 &&
    typeof window.HistoryManagerV2.capture === "function"
  ) {
    window.HistoryManagerV2.capture("L-DISC material changed");
  }

  if (typeof drawCanvas === "function") {
    drawCanvas();
  }

  if (
    typeof refreshRunsForCanvasComponent === "function"
  ) {
    refreshRunsForCanvasComponent(equipment.id);
  }
  else if (typeof renderBOM === "function") {
    renderBOM();
  }

  return true;
}

function openLDiscMaterialPicker(equipment) {
  if (!equipment || typeof openPickerModal !== "function") {
    return;
  }

  const materials = getLDiscMaterialLibrary();

  console.group("[L-DISC Picker] Target and filter");
  console.log("Clicked canvas card:", {
    id: equipment.id,
    preset: getItemPresetCode(equipment),
    catalogNumber: equipment.data?.CatalogNumber || "",
    description: equipment.data?.Description || "",
    startCell: equipment.startCell
  });
  console.table(materials.map(material => ({
    catalogNumber: material.CatalogNumber,
    description: material.Description || "",
    nodeType: material.NodeType || "",
    gridWidth: material.GridWidth || "",
    gridHeight: material.GridHeight || ""
  })));

  if (!materials.length) {
    console.warn(
      "No L-DISC materials were found. Check the MML NodeType column for L-DISC."
    );
  }

  console.groupEnd();

  openPickerModal(
    "L-DISC Material Picker",
    materials,
    material => {
      console.info("[L-DISC Picker] Selected replacement:", {
        from: equipment.data?.CatalogNumber || "",
        to: material.CatalogNumber || ""
      });

      return replaceLDiscMaterial(equipment, material);
    }
  );
}

function renderDisconnectPresetEditor(
  modal,
  equipment
) {
  const body = modal.querySelector(".modal-body");
  const filterPanel = modal.querySelector(".filter-panel");
  const list = document.getElementById("modalList");

  if (!body || !list) return;

  const hasMappedFuse =
    (equipment.materials || []).some(
      entry =>
        entry?.disconnectFuseSlot !==
        undefined
    );

  if (
    !hasMappedFuse &&
    equipment.preset
  ) {
    equipment.materials =
      buildDisconnectPresetMaterials(
        equipment.preset,
        equipment.data
      );
  }

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
    "Choose Disconnect";

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
      CHOOSE A DIFFERENT DISCONNECT
    </div>
    <div class="disconnect-choice-grid">
      ${presetCodes.map(code => {
        const candidate = getPresetEquipment(code) || {};
        const image = getPanelBreakerImage(candidate);
        const catalogNumber = candidate.CatalogNumber || code;
        const description = candidate.Description || candidate.Type || "Disconnect";
        return `
        <button
          type="button"
          class="disconnect-choice-card ${
            String(equipment.preset || "")
              .toUpperCase() ===
            String(code).toUpperCase()
              ? "active"
              : ""
          }"
          data-preset="${escapePanelText(code)}"
        >
          ${image ? `
            <img src="${escapePanelText(image)}" alt="">
          ` : ""}
          <span>
            <strong>${escapePanelText(catalogNumber)}</strong>
            <small>${escapePanelText(description)}</small>
            <em>${escapePanelText(code)}</em>
          </span>
        </button>
      `;
      }).join("")}
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

window.isLDiscMaterialCard =
  isLDiscMaterialCard;

window.openLDiscMaterialPicker =
  openLDiscMaterialPicker;

window.renderDisconnectPresetEditor =
  renderDisconnectPresetEditor;
