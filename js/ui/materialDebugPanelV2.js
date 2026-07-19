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

    minimizeButton.addEventListener(
      "click",
      toggleMinimize
    );

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
  // Get Project Serializer Data
  //----------------------------------

  function getProjectMaterials() {
    if (
      typeof window.serializeProject !==
      "function"
    ) {
      console.warn(
        "MaterialDebugPanelV2: serializeProject() is not available."
      );

      return [];
    }

    try {
      const project =
        window.serializeProject();

      if (
        !project ||
        !Array.isArray(
          project.materialSummary
        )
      ) {
        console.warn(
          "MaterialDebugPanelV2: project.materialSummary is missing.",
          project
        );

        return [];
      }

      return project.materialSummary;
    }
    catch (error) {
      console.error(
        "MaterialDebugPanelV2: Failed to serialize project.",
        error
      );

      return [];
    }
  }

  //----------------------------------
  // Refresh
  //----------------------------------

  function refresh() {
    init();

    const materials =
      getProjectMaterials();

    const signature =
      JSON.stringify(materials);

    //----------------------------------
    // Avoid Unnecessary Rendering
    //----------------------------------

    if (
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

    refreshTimer = window.setInterval(
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

    const minimized =
      panel.classList.toggle(
        "material-debug-panel-v2--minimized"
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
      getProjectMaterials
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