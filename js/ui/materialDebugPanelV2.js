//----------------------------------
// Material Debug Panel V2
//----------------------------------

const MaterialDebugPanelV2 = (() => {
  let panel = null;

  let bosBody = null;
  let vanBody = null;

  let bosCount = null;
  let vanCount = null;

  let minimizeButton = null;
  let refreshButton = null;
  let usedMaterialsButton = null;

  let refreshTimer = null;
  let previousSignature = "";

  //----------------------------------
  // Initialize
  //----------------------------------

  function init() {
    if (panel) {
      return panel;
    }

    panel = document.createElement("aside");

    panel.className =
      "material-debug-panel-v2";

    panel.innerHTML = `
      <header class="material-debug-panel-v2__header">
        <div class="material-debug-panel-v2__heading">
          <h2>Project Materials</h2>
          <p>BOS and VAN summary</p>
        </div>

        <button
          type="button"
          class="material-debug-panel-v2__used-materials"
          data-action="used-materials"
          aria-label="Download Used Materials XLS"
          title="Download Used Materials XLS"
        >
          XLS
        </button>

        <button
          type="button"
          class="material-debug-panel-v2__refresh"
          data-action="refresh"
          aria-label="Refresh project materials"
          title="Refresh project materials"
        >
          ↻
        </button>

        <button
          type="button"
          class="material-debug-panel-v2__minimize"
          data-action="minimize"
          aria-label="Minimize material panel"
          title="Minimize"
        >
          —
        </button>
      </header>

      <div class="material-debug-panel-v2__content">

        <section class="material-debug-group-v2">
          <div class="material-debug-group-v2__title">
            <h3>BOS</h3>

            <span
              class="material-debug-group-v2__count"
              data-role="bos-count"
            >
              0
            </span>
          </div>

          <div class="material-debug-table-v2__wrapper">
            <table class="material-debug-table-v2">
              <thead>
                <tr>
                  <th>Qty</th>
                  <th>Catalog Number</th>
                  <th>Description</th>
                  <th>Inventory Category</th>
                </tr>
              </thead>

              <tbody data-role="bos-body"></tbody>
            </table>
          </div>
        </section>

        <section class="material-debug-group-v2">
          <div class="material-debug-group-v2__title">
            <h3>VAN</h3>

            <span
              class="material-debug-group-v2__count"
              data-role="van-count"
            >
              0
            </span>
          </div>

          <div class="material-debug-table-v2__wrapper">
            <table class="material-debug-table-v2">
              <thead>
                <tr>
                  <th>Qty</th>
                  <th>Catalog Number</th>
                  <th>Description</th>
                  <th>Inventory Category</th>
                </tr>
              </thead>

              <tbody data-role="van-body"></tbody>
            </table>
          </div>
        </section>

      </div>
    `;

    document.body.appendChild(panel);

    bosBody =
      panel.querySelector(
        '[data-role="bos-body"]'
      );

    vanBody =
      panel.querySelector(
        '[data-role="van-body"]'
      );

    bosCount =
      panel.querySelector(
        '[data-role="bos-count"]'
      );

    vanCount =
      panel.querySelector(
        '[data-role="van-count"]'
      );

    minimizeButton =
      panel.querySelector(
        '[data-action="minimize"]'
      );

    refreshButton =
      panel.querySelector(
        '[data-action="refresh"]'
      );

    refreshButton.addEventListener(
      "click",
      () => refresh(true)
    );

    usedMaterialsButton =
      panel.querySelector(
        '[data-action="used-materials"]'
      );

    usedMaterialsButton.addEventListener(
      "click",
      generateUsedMaterialsFile
    );

    minimizeButton.addEventListener(
      "click",
      toggleMinimize
    );

    //----------------------------------
    // Reveal on Hover
    //----------------------------------

    panel.addEventListener(
      "mouseenter",
      () => {
        setMinimized(false);
      }
    );

    panel.addEventListener(
      "mouseleave",
      () => {
        setMinimized(true);
      }
    );

    //----------------------------------
    // Start Minimized
    //----------------------------------

    setMinimized(true);

    //----------------------------------
    // Initial Render
    //----------------------------------

    refresh();

    //----------------------------------
    // Automatic Refresh
    //----------------------------------

    startAutoRefresh();

    return panel;
  }

  //----------------------------------
  // Get Serialized Project
  //----------------------------------

  function getSerializedProject() {
    if (
      typeof window.serializeProject !==
      "function"
    ) {
      console.warn(
        "MaterialDebugPanelV2: serializeProject() is not available."
      );

      return null;
    }

    try {
      return window.serializeProject();
    }
    catch (error) {
      console.error(
        "MaterialDebugPanelV2: Failed to serialize project.",
        error
      );

      return null;
    }
  }

  //----------------------------------
  // Get Project Materials
  //----------------------------------

  function getProjectMaterials() {
    if (typeof window.generateBOM !== "function") {
      console.warn(
        "MaterialDebugPanelV2: generateBOM() is not available."
      );
      return [];
    }

    // This panel must show the same list as the BOM.  The previous version
    // built a second list from the saved-project summary and preset rows,
    // which could count an equipment card again.  Generate one live BOM and
    // only enrich its rows with catalog details when they are missing.
    const bom = window.generateBOM();
    const bomMaterials = Object.values(bom || {})
      .flatMap(group => Array.isArray(group) ? group : []);

    return mergeMaterials(
      bomMaterials.map(enrichBOMMaterial)
    );
  }

  function enrichBOMMaterial(material) {
    const catalogNumber = String(
      material?.CatalogNumber ??
      material?.catalogNumber ??
      ""
    ).trim();

    const catalogMaterial =
      typeof window.getMaterial === "function"
        ? window.getMaterial(catalogNumber)
        : null;
    const equipment =
      catalogMaterial ||
      findEquipmentByCatalogNumber(catalogNumber);

    return {
      ...equipment,
      ...material,
      CatalogNumber: catalogNumber,
      Qty: Number(
        material?.Qty ??
        material?.qty ??
        material?.quantity ??
        0
      ) || 0,
      Description:
        material?.Description ??
        material?.description ??
        equipment?.Description ??
        equipment?.description ??
        "",
      InventoryCategory:
        material?.InventoryCategory ??
        material?.inventoryCategory ??
        material?.category ??
        equipment?.InventoryCategory ??
        equipment?.inventoryCategory ??
        equipment?.category ??
        ""
    };
  }

  async function generateUsedMaterialsFile() {
    if (typeof window.downloadUsedMaterialsXls !== "function") {
      alert("Used Materials XLS is not available yet. Please reload the app.");
      return;
    }

    const originalLabel = usedMaterialsButton.textContent;
    usedMaterialsButton.disabled = true;
    usedMaterialsButton.textContent = "...";

    const result = await window.downloadUsedMaterialsXls();

    usedMaterialsButton.disabled = false;
    usedMaterialsButton.textContent = originalLabel;

    if (!result?.success) {
      alert(result?.message || "Unable to download Used Materials XLS.");
    }
  }

  //----------------------------------
  // Get Preset Materials From API
  //----------------------------------

  function getProjectPresetMaterials(
    project
  ) {
    if (!Array.isArray(window.presets)) {
      console.warn(
        "MaterialDebugPanelV2: window.presets is not available."
      );

      return [];
    }

    const placements =
      findPresetPlacements(project);

    const materials = [];

    placements.forEach(placement => {
      const presetCode =
        String(
          placement.presetCode || ""
        )
          .trim()
          .toUpperCase();

      if (!presetCode) {
        return;
      }

      const placementQty =
        Number(
          placement.qty
        ) || 1;

      const presetRows =
        window.presets.filter(row => {
          const rowPreset =
            String(
              row.PRESET ??
              row.Preset ??
              row.preset ??
              ""
            )
              .trim()
              .toUpperCase();

          return (
            rowPreset === presetCode
          );
        });

      presetRows.forEach(
        presetMaterial => {
          const catalogNumber =
            String(
              presetMaterial.CatalogNumber ??
              presetMaterial.catalogNumber ??
              presetMaterial["Catalog Number"] ??
              ""
            ).trim();

          if (!catalogNumber) {
            return;
          }

          const presetQty =
            Number(
              presetMaterial.QTY ??
              presetMaterial.Qty ??
              presetMaterial.qty ??
              0
            ) || 0;

          if (presetQty <= 0) {
            return;
          }

          const equipment =
            findEquipmentByCatalogNumber(
              catalogNumber
            );

          const description =
            equipment?.Description ??
            equipment?.description ??
            presetMaterial.DESCRIPTION ??
            presetMaterial.Description ??
            presetMaterial.description ??
            "";

          let inventoryCategory =
            equipment?.InventoryCategory ??
            equipment?.inventoryCategory ??
            equipment?.category ??
            presetMaterial.InventoryCategory ??
            presetMaterial.inventoryCategory ??
            presetMaterial.category ??
            "";

          //----------------------------------
          // Preset Fuse Fallback
          //----------------------------------

          if (
            !inventoryCategory &&
            /^FRNR/i.test(catalogNumber)
          ) {
            inventoryCategory = "BOS";
          }

          materials.push({
            CatalogNumber:
              catalogNumber,

            Qty:
              presetQty *
              placementQty,

            Description:
              description,

            InventoryCategory:
              inventoryCategory,

            source:
              "API_PRESET",

            preset:
              presetCode
          });
        }
      );
    });

    return materials;
  }

  //----------------------------------
  // Find Preset Placements
  //----------------------------------

  function findPresetPlacements(
    project
  ) {
    const placements = [];

    const visited =
      new WeakSet();

    const placementKeys =
      new Set();

    function walk(
      value,
      path = "project"
    ) {
      if (
        !value ||
        typeof value !== "object"
      ) {
        return;
      }

      if (visited.has(value)) {
        return;
      }

      visited.add(value);

      //----------------------------------
      // Do Not Read Material Summary
      //----------------------------------

      if (
        path ===
        "project.materialSummary"
      ) {
        return;
      }

      //----------------------------------
      // Arrays
      //----------------------------------

      if (Array.isArray(value)) {
        value.forEach(
          (item, index) => {
            walk(
              item,
              `${path}[${index}]`
            );
          }
        );

        return;
      }

      //----------------------------------
      // Detect Preset Code
      //----------------------------------

      const presetCode =
        getPresetCode(value);

      if (presetCode) {
        const placementId =
          getPlacementIdentity(
            value,
            path
          );

        const key =
          `${placementId}|${presetCode}`;

        if (!placementKeys.has(key)) {
          placementKeys.add(key);

          placements.push({
            presetCode,
            qty:
              getPlacementQuantity(
                value
              ),
            item:
              value,
            path
          });
        }
      }

      //----------------------------------
      // Continue Traversal
      //----------------------------------

      Object.entries(value)
        .forEach(
          ([key, child]) => {
            if (
              key ===
              "materialSummary"
            ) {
              return;
            }

            walk(
              child,
              `${path}.${key}`
            );
          }
        );
    }

    walk(project);

    return placements;
  }

  //----------------------------------
  // Get Preset Code
  //----------------------------------

  function getPresetCode(item) {
    const value =
      item.preset ??
      item.presetCode ??
      item.PRESET ??
      item.Preset ??
      item.templatePreset ??
      item.templateCode ??
      "";

    const presetCode =
      String(value || "")
        .trim()
        .toUpperCase();

    if (!presetCode) {
      return "";
    }

    if (!Array.isArray(window.presets)) {
      return "";
    }

    const exists =
      window.presets.some(row =>
        String(
          row.PRESET ??
          row.Preset ??
          row.preset ??
          ""
        )
          .trim()
          .toUpperCase() ===
        presetCode
      );

    return exists
      ? presetCode
      : "";
  }

  //----------------------------------
  // Get Placement Identity
  //----------------------------------

  function getPlacementIdentity(
    item,
    fallbackPath
  ) {
    return String(
      item.id ??
      item.itemId ??
      item.nodeId ??
      item.placementId ??
      item.instanceId ??
      item.uuid ??
      item.cellId ??
      item.startCellId ??
      fallbackPath
    );
  }

  //----------------------------------
  // Get Placement Quantity
  //----------------------------------

  function getPlacementQuantity(item) {
    const quantity =
      Number(
        item.Qty ??
        item.qty ??
        item.quantity ??
        item.count ??
        1
      );

    return quantity > 0
      ? quantity
      : 1;
  }

  //----------------------------------
  // Find Equipment By Catalog Number
  //----------------------------------

  function findEquipmentByCatalogNumber(
    catalogNumber
  ) {
    if (
      typeof window.getEquipment !==
      "function"
    ) {
      return null;
    }

    try {
      const equipment =
        window.getEquipment();

      if (!Array.isArray(equipment)) {
        return null;
      }

      return equipment.find(item => {
        const itemCatalogNumber =
          String(
            item.CatalogNumber ??
            item.catalogNumber ??
            ""
          ).trim();

        return (
          itemCatalogNumber ===
          catalogNumber
        );
      }) || null;
    }
    catch (error) {
      console.warn(
        "MaterialDebugPanelV2: Equipment lookup failed.",
        catalogNumber,
        error
      );

      return null;
    }
  }

  //----------------------------------
  // Merge Materials
  //----------------------------------

  function mergeMaterials(materials) {
    const merged =
      new Map();

    materials.forEach(material => {
      const catalogNumber =
        String(
          material.CatalogNumber ??
          material.catalogNumber ??
          ""
        ).trim();

      if (!catalogNumber) {
        return;
      }

      const quantity =
        Number(
          material.Qty ??
          material.qty ??
          material.quantity ??
          0
        ) || 0;

      if (quantity <= 0) {
        return;
      }

      const inventoryCategory =
        String(
          material.InventoryCategory ??
          material.inventoryCategory ??
          material.category ??
          ""
        ).trim();

      //----------------------------------
      // Category Included In Key
      //----------------------------------

      const key =
        [
          catalogNumber.toUpperCase(),
          inventoryCategory.toUpperCase()
        ].join("|");

      if (!merged.has(key)) {
        merged.set(key, {
          CatalogNumber:
            catalogNumber,

          Qty:
            0,

          Description:
            material.Description ??
            material.description ??
            "",

          InventoryCategory:
            inventoryCategory
        });
      }

      const existing =
        merged.get(key);

      existing.Qty +=
        quantity;

      //----------------------------------
      // Fill Missing Details
      //----------------------------------

      if (!existing.Description) {
        existing.Description =
          material.Description ??
          material.description ??
          "";
      }

      if (!existing.InventoryCategory) {
        existing.InventoryCategory =
          inventoryCategory;
      }
    });

    return Array.from(
      merged.values()
    ).sort(
      (a, b) =>
        String(
          a.CatalogNumber
        ).localeCompare(
          String(
            b.CatalogNumber
          )
        )
    );
  }

  //----------------------------------
  // Refresh
  //----------------------------------

  function refresh(force = false) {
    init();

    const materials =
      getProjectMaterials();

    const signature =
      JSON.stringify(materials);

    //----------------------------------
    // Avoid Unnecessary Rendering
    //----------------------------------

    if (
      !force &&
      signature === previousSignature
    ) {
      return;
    }

    previousSignature = signature;

    const bos = [];
    const van = [];

    materials.forEach(material => {
      const category =
        normalizeCategory(
          material.InventoryCategory ??
          material.inventoryCategory ??
          material.category
        );

      if (category === "BOS") {
        bos.push(material);
      }

      if (category === "VAN") {
        van.push(material);
      }
    });

    renderRows(
      bosBody,
      bos
    );

    renderRows(
      vanBody,
      van
    );

    bosCount.textContent =
      getTotalQuantity(bos);

    vanCount.textContent =
      getTotalQuantity(van);
  }

  //----------------------------------
  // Automatic Refresh
  //----------------------------------

  function startAutoRefresh() {
    if (refreshTimer) {
      return;
    }

    refreshTimer =
      window.setInterval(
        refresh,
        1500
      );
  }

  //----------------------------------
  // Stop Automatic Refresh
  //----------------------------------

  function stopAutoRefresh() {
    if (!refreshTimer) {
      return;
    }

    window.clearInterval(
      refreshTimer
    );

    refreshTimer = null;
  }

  //----------------------------------
  // Toggle Minimize
  //----------------------------------

  function toggleMinimize() {
    if (!panel) {
      return;
    }

    const shouldMinimize =
      !panel.classList.contains(
        "material-debug-panel-v2--minimized"
      );

    setMinimized(shouldMinimize);
  }

  //----------------------------------
  // Set Minimized State
  //----------------------------------

  function setMinimized(minimized) {
    if (!panel || !minimizeButton) {
      return;
    }

    panel.classList.toggle(
      "material-debug-panel-v2--minimized",
      minimized
    );

    minimizeButton.textContent =
      minimized
        ? "+"
        : "—";

    minimizeButton.title =
      minimized
        ? "Expand"
        : "Minimize";

    minimizeButton.setAttribute(
      "aria-label",
      minimized
        ? "Expand material panel"
        : "Minimize material panel"
    );
  }

  //----------------------------------
  // Get Total Quantity
  //----------------------------------

  function getTotalQuantity(materials) {
    return materials.reduce(
      (total, material) => {
        return total +
          (
            Number(
              material.Qty ??
              material.qty ??
              0
            ) || 0
          );
      },
      0
    );
  }

  //----------------------------------
  // Normalize Category
  //----------------------------------

  function normalizeCategory(value) {
    return String(value || "")
      .trim()
      .toUpperCase();
  }

  //----------------------------------
  // Render Rows
  //----------------------------------

  function renderRows(
    tbody,
    materials
  ) {
    tbody.innerHTML = "";

    if (!materials.length) {
      const row =
        document.createElement("tr");

      row.innerHTML = `
        <td
          colspan="4"
          class="material-debug-table-v2__empty"
        >
          No materials found
        </td>
      `;

      tbody.appendChild(row);

      return;
    }

    materials.forEach(material => {
      const row =
        document.createElement("tr");

      row.innerHTML = `
        <td>
          ${escapeHTML(
            Number(
              material.Qty ??
              material.qty ??
              0
            ) || 0
          )}
        </td>

        <td>
          ${escapeHTML(
            material.CatalogNumber ??
            material.catalogNumber ??
            ""
          )}
        </td>

        <td>
          ${escapeHTML(
            material.Description ??
            material.description ??
            ""
          )}
        </td>

        <td>
          ${escapeHTML(
            material.InventoryCategory ??
            material.inventoryCategory ??
            material.category ??
            ""
          )}
        </td>
      `;

      tbody.appendChild(row);
    });
  }

  //----------------------------------
  // Escape HTML
  //----------------------------------

  function escapeHTML(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  //----------------------------------
  // Public API
  //----------------------------------

  return {
    init,
    refresh,
    toggleMinimize,
    startAutoRefresh,
    stopAutoRefresh,

    getMaterials:
      getProjectMaterials,

    getPresetMaterials:
      getProjectPresetMaterials,

    findPresetPlacements
  };
})();

//----------------------------------
// Expose
//----------------------------------

window.MaterialDebugPanelV2 =
  MaterialDebugPanelV2;

//----------------------------------
// Always Initialize
//----------------------------------

document.addEventListener(
  "DOMContentLoaded",
  () => {
    MaterialDebugPanelV2.init();
  }
);
