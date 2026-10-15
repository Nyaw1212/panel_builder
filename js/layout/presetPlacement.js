//----------------------------------
// Current Preset
//----------------------------------

let currentPreset = "";

//----------------------------------
// Set Current Preset
//----------------------------------

function setCurrentPreset(preset) {
  currentPreset =
    String(preset || "").trim();

  console.log(
    "Current Preset:",
    currentPreset
  );
}

//----------------------------------
// Get Current Preset
//----------------------------------

function getCurrentPreset() {
  return currentPreset;
}

//----------------------------------
// Clear Current Preset
//----------------------------------

function clearCurrentPreset() {
  currentPreset = "";

  //----------------------------------
  // Remove Highlight
  //----------------------------------

  document
    .querySelectorAll(
      ".preset-button"
    )
    .forEach(button => {
      button.classList.remove(
        "selected"
      );
    });

  console.log(
    "Preset Cleared"
  );
}

//----------------------------------
// Normalize Text
//----------------------------------

function normalizePresetText(value) {
  return String(value ?? "")
    .trim();
}

//----------------------------------
// Normalize Preset Code
//----------------------------------

function normalizePresetCode(value) {
  return normalizePresetText(value)
    .toUpperCase();
}

//----------------------------------
// Get Row Preset Code
//----------------------------------

function getRowPresetCode(row) {
  if (!row) {
    return "";
  }

  return normalizePresetText(
    row.PRESET ??
    row.Preset ??
    row.preset ??
    row.PresetCode ??
    row.presetCode ??
    row.Code ??
    row.code ??
    ""
  );
}

//----------------------------------
// Get Row Catalog Number
//----------------------------------

function getRowCatalogNumber(row) {
  if (!row) {
    return "";
  }

  return normalizePresetText(
    row.CatalogNumber ??
    row.catalogNumber ??
    row.CATALOGNUMBER ??
    row.Catalog ??
    row.catalog ??
    ""
  );
}

//----------------------------------
// Get Row Quantity
//----------------------------------

function getRowQuantity(row) {
  if (!row) {
    return 0;
  }

  const quantity =
    Number(
      row.Qty ??
      row.qty ??
      row.QTY ??
      row.Quantity ??
      row.quantity ??
      row.Items ??
      row.items ??
      1
    );

  return Number.isFinite(quantity) &&
    quantity > 0
    ? quantity
    : 1;
}

//----------------------------------
// Get Equipment Library
//----------------------------------

function getEquipmentLibrary() {
  if (
    typeof window.getEquipment !==
    "function"
  ) {
    return [];
  }

  try {
    const equipment =
      window.getEquipment();

    return Array.isArray(equipment)
      ? equipment
      : [];
  }
  catch (error) {
    console.warn(
      "Unable to read equipment library.",
      error
    );

    return [];
  }
}

//----------------------------------
// Find Equipment By Catalog Number
//----------------------------------

function findEquipmentByCatalogNumber(
  catalogNumber
) {
  const target =
    normalizePresetCode(
      catalogNumber
    );

  if (!target) {
    return null;
  }

  return (
    getEquipmentLibrary().find(item => {
      return (
        normalizePresetCode(
          getRowCatalogNumber(item)
        ) === target
      );
    }) || null
  );
}

//----------------------------------
// Get API Preset Rows
//----------------------------------

function getApiPresetRows(preset) {
  const targetPreset =
    normalizePresetCode(preset);

  if (!targetPreset) {
    return [];
  }

  return (
    Array.isArray(window.presets)
      ? window.presets
      : []
  ).filter(row => {
    return (
      normalizePresetCode(
        getRowPresetCode(row)
      ) === targetPreset
    );
  });
}

//----------------------------------
// Convert Preset Row To Material
//----------------------------------

function createPresetMaterial(row) {
  const catalogNumber =
    getRowCatalogNumber(row);

  if (!catalogNumber) {
    return null;
  }

  const equipment =
    findEquipmentByCatalogNumber(
      catalogNumber
    );

  const description =
    normalizePresetText(
      row.Description ??
      row.description ??
      equipment?.Description ??
      equipment?.description ??
      ""
    );

  const inventoryCategory =
    normalizePresetText(
      row.InventoryCategory ??
      row.inventoryCategory ??
      row.Inventory_Category ??
      row.Category ??
      row.category ??
      equipment?.InventoryCategory ??
      equipment?.inventoryCategory ??
      equipment?.category ??
      ""
    );

  return {
    catalogNumber,
    description,
    inventoryCategory,
    qty:
      getRowQuantity(row)
  };
}

//----------------------------------
// Get API Preset Materials
//----------------------------------

function getApiPresetMaterials(preset) {
  const rows =
    getApiPresetRows(preset);

  const materials =
    rows
      .map(createPresetMaterial)
      .filter(Boolean);

  //----------------------------------
  // Aggregate Duplicate Materials
  //----------------------------------

  const merged =
    new Map();

  materials.forEach(material => {
    const key =
      [
        normalizePresetCode(
          material.catalogNumber
        ),
        normalizePresetCode(
          material.inventoryCategory
        )
      ].join("|");

    if (!merged.has(key)) {
      merged.set(key, {
        catalogNumber:
          material.catalogNumber,

        description:
          material.description,

        inventoryCategory:
          material.inventoryCategory,

        qty:
          0
      });
    }

    const existing =
      merged.get(key);

    existing.qty +=
      Number(material.qty) || 0;

    if (
      !existing.description &&
      material.description
    ) {
      existing.description =
        material.description;
    }

    if (
      !existing.inventoryCategory &&
      material.inventoryCategory
    ) {
      existing.inventoryCategory =
        material.inventoryCategory;
    }
  });

  return Array.from(
    merged.values()
  );
}

//----------------------------------
// Get Equipment From Preset
//----------------------------------

function getPresetEquipment(preset) {
  if (!preset) {
    return null;
  }

  //----------------------------------
  // First API Row Of Preset
  //----------------------------------

  const presetRows =
    getApiPresetRows(preset);

  const presetRow =
    presetRows[0];

  if (!presetRow) {
    console.warn(
      "Preset not found:",
      preset
    );

    return null;
  }

  //----------------------------------
  // Find Main Equipment
  //----------------------------------

  const catalogNumber =
    getRowCatalogNumber(
      presetRow
    );

  const equipment =
    findEquipmentByCatalogNumber(
      catalogNumber
    );

  if (!equipment) {
    console.warn(
      "Equipment not found:",
      catalogNumber
    );

    return null;
  }

  return equipment;
}

//----------------------------------
// Create Main Equipment Material
//----------------------------------

function createMainEquipmentMaterial(
  equipment
) {
  if (!equipment) {
    return null;
  }

  const catalogNumber =
    getRowCatalogNumber(
      equipment
    );

  if (!catalogNumber) {
    return null;
  }

  return {
    catalogNumber,

    description:
      normalizePresetText(
        equipment.Description ??
        equipment.description ??
        ""
      ),

    inventoryCategory:
      normalizePresetText(
        equipment.InventoryCategory ??
        equipment.inventoryCategory ??
        equipment.category ??
        ""
      ),

    qty: 1
  };
}

//----------------------------------
// Ensure Main Equipment Is Included
//----------------------------------

function ensureMainEquipmentMaterial(
  materials,
  equipment
) {
  const result =
    Array.isArray(materials)
      ? [...materials]
      : [];

  const mainMaterial =
    createMainEquipmentMaterial(
      equipment
    );

  if (!mainMaterial) {
    return result;
  }

  const mainCatalog =
    normalizePresetCode(
      mainMaterial.catalogNumber
    );

  const exists =
    result.some(material => {
      return (
        normalizePresetCode(
          material.catalogNumber
        ) === mainCatalog
      );
    });

  if (!exists) {
    result.unshift(
      mainMaterial
    );
  }

  return result;
}

//----------------------------------
// Place Preset
//----------------------------------

function placePreset(
  preset,
  startCell,
  options = {}
) {
  console.group(
    "Place Preset"
  );

  console.log(
    "Preset:",
    preset
  );

  console.log(
    "Cell:",
    startCell
  );

  //----------------------------------
  // Lookup Equipment
  //----------------------------------

  const equipment =
    getPresetEquipment(
      preset
    );

  if (!equipment) {
    console.warn(
      "Unable to locate preset equipment."
    );

    console.groupEnd();

    return null;
  }

  console.log(
    "Equipment:",
    equipment.CatalogNumber ??
    equipment.catalogNumber
  );

  //----------------------------------
  // Get All API Preset Materials
  //----------------------------------

  const presetMaterials =
    ensureMainEquipmentMaterial(
      getApiPresetMaterials(
        preset
      ),
      equipment
    );

  console.log(
    "Preset Materials:",
    presetMaterials
  );

  //----------------------------------
  // Place Equipment
  //----------------------------------

  const placedItem =
    placeItem(
      equipment,
      startCell,
      preset,
      {
        /*
         * Disable the early placement
         * snapshot. The preset is captured
         * after its full BOM is restored.
         */
        captureHistory: false
      }
    );

  if (!placedItem) {
    console.warn(
      "Placement Failed."
    );

    console.groupEnd();

    return null;
  }

  //----------------------------------
  // Store Preset Information
  //----------------------------------

  placedItem.preset =
    normalizePresetText(
      preset
    );

  //----------------------------------
  // Store Complete Preset BOM
  //----------------------------------

  const equipmentType = [
    equipment?.Type,
    equipment?.NodeType,
    equipment?.Category
  ].filter(Boolean).join(" ").toUpperCase();
  const isPanelEquipment =
    equipmentType.includes("PANEL") ||
    equipmentType.includes("FSU");
  let hasPresetMainBreaker = false;

  placedItem.materials = presetMaterials.map(material => {
    const catalogNumber = material.catalogNumber;
    const isCsrMainBreaker = isPanelEquipment &&
      !hasPresetMainBreaker && /^CSR/i.test(String(catalogNumber || ""));

    if (isCsrMainBreaker) hasPresetMainBreaker = true;

    const placedMaterial = {
      catalogNumber,
      description: material.description,
      inventoryCategory: material.inventoryCategory,
      qty: Number(material.qty) || 0
    };

    if (isCsrMainBreaker) {
      const breakerMaterial = (typeof getMaterials === "function" ? getMaterials() : [])
        .find(item => String(item?.CatalogNumber || "") === String(catalogNumber || "")) || material;
      placedMaterial.id = crypto.randomUUID();
      placedMaterial.qty = 1;
      placedMaterial.panelSlot = {
        section: "main",
        family: "CSR",
        span: typeof getBreakerPoleCount === "function"
          ? Math.max(1, Number(getBreakerPoleCount(breakerMaterial) || 1))
          : 1
      };
    }

    return placedMaterial;
  });

  console.log(
    "Placed Item Materials:",
    placedItem.materials
  );

  //----------------------------------
  // Capture History
  //----------------------------------

  if (
    options.captureHistory !== false &&
    window.HistoryManagerV2 &&
    typeof window.HistoryManagerV2.capture ===
      "function"
  ) {
    window.HistoryManagerV2.capture(
      "Preset placed"
    );
  }

  //----------------------------------
  // Draw
  //----------------------------------

  drawCanvas();

  //----------------------------------
  // Refresh Material Summary
  //----------------------------------

  if (
    window.MaterialDebugPanelV2 &&
    typeof (
      window.MaterialDebugPanelV2
        .refresh
    ) === "function"
  ) {
    window.MaterialDebugPanelV2
      .refresh();
  }

  //----------------------------------
  // Exit Placement Mode
  //----------------------------------

  clearCurrentPreset();

  console.groupEnd();

  return placedItem;
}

//----------------------------------
// Expose
//----------------------------------

window.setCurrentPreset =
  setCurrentPreset;

window.getCurrentPreset =
  getCurrentPreset;

window.clearCurrentPreset =
  clearCurrentPreset;

window.getPresetEquipment =
  getPresetEquipment;

window.getApiPresetRows =
  getApiPresetRows;

window.getApiPresetMaterials =
  getApiPresetMaterials;

window.placePreset =
  placePreset;
