// ----------------------------------
// Equipment BOM Status
// ----------------------------------
// New equipment is included in the BOM. Existing equipment remains fully
// functional on the canvas, but its card/preset materials are excluded.

(function equipmentBomStatus() {
  const controlId = "equipment-bom-status-control";

  function getActiveEquipment() {
    return typeof window.getCurrentEquipment === "function"
      ? window.getCurrentEquipment()
      : null;
  }

  function isModalOpen(modal) {
    if (!modal) return false;

    const style = window.getComputedStyle(modal);
    return style.display !== "none" && style.visibility !== "hidden";
  }

  function saveEquipmentBomStatus() {
    if (typeof window.drawCanvas === "function") {
      window.drawCanvas();
    }
    else if (typeof window.renderBOM === "function") {
      window.renderBOM();
    }

    if (typeof window.saveDraft === "function") {
      window.saveDraft();
    }
  }

  function setEquipmentStatus(equipment, isExisting) {
    if (!equipment || equipment.isExisting === isExisting) return;

    equipment.isExisting = isExisting;

    if (
      window.HistoryManagerV2 &&
      typeof window.HistoryManagerV2.capture === "function"
    ) {
      window.HistoryManagerV2.capture(
        isExisting
          ? "Equipment marked existing"
          : "Equipment marked new"
      );
    }

    saveEquipmentBomStatus();
    document.dispatchEvent(new CustomEvent("panel-builder-equipment-bom-status", {
      detail: { itemId: equipment.id, isExisting }
    }));
    refreshEquipmentBomStatusControl();
  }

  function refreshEquipmentBomStatusControl() {
    const modal = document.getElementById("equipmentModal");
    const header = modal?.querySelector(".modal-header");
    const equipment = getActiveEquipment();

    header?.querySelector(`#${controlId}`)?.remove();

    if (!header || !equipment?.id || !isModalOpen(modal)) return;

    const control = document.createElement("div");
    control.id = controlId;
    control.className = "equipment-bom-status";
    control.title = "Existing equipment remains on the canvas but is excluded from the BOM.";

    const label = document.createElement("span");
    label.textContent = "BOM";
    control.appendChild(label);

    [
      { label: "New", isExisting: false },
      { label: "Existing", isExisting: true }
    ].forEach(option => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = option.label;
      button.className = equipment.isExisting === option.isExisting
        ? "active"
        : "";
      button.setAttribute("aria-pressed", String(
        equipment.isExisting === option.isExisting
      ));
      button.addEventListener("click", event => {
        event.preventDefault();
        event.stopPropagation();
        setEquipmentStatus(equipment, option.isExisting);
      });
      control.appendChild(button);
    });

    const closeButton = header.querySelector("#closeModal");
    header.insertBefore(control, closeButton || null);
  }

  function installStyles() {
    if (document.getElementById("equipment-bom-status-style")) return;

    const style = document.createElement("style");
    style.id = "equipment-bom-status-style";
    style.textContent = `
      .equipment-bom-status {
        display: inline-flex;
        align-items: center;
        gap: 3px;
        margin-left: auto;
        margin-right: 9px;
        padding: 3px;
        border: 1px solid #405371;
        border-radius: 6px;
        background: #0b1422;
      }
      .equipment-bom-status > span {
        padding: 0 5px;
        color: #9fb2ca;
        font-size: 10px;
        font-weight: 800;
        letter-spacing: .06em;
      }
      .equipment-bom-status button {
        min-width: 58px;
        margin: 0;
        padding: 5px 8px;
        border: 1px solid transparent;
        border-radius: 4px;
        color: #aab9ca;
        background: transparent;
        font-size: 11px;
        font-weight: 800;
        cursor: pointer;
      }
      .equipment-bom-status button.active {
        border-color: #3777b5;
        color: #fff;
        background: #245883;
      }
      .equipment-bom-status button:last-child.active {
        border-color: #bd8331;
        background: #704611;
      }
    `;
    document.head.appendChild(style);
  }

  function start() {
    installStyles();
    refreshEquipmentBomStatusControl();

    const modal = document.getElementById("equipmentModal");
    if (!modal) return;

    new MutationObserver(() => {
      window.requestAnimationFrame(refreshEquipmentBomStatusControl);
    }).observe(modal, {
      attributes: true,
      attributeFilter: ["style", "class"]
    });
  }

  window.refreshEquipmentBomStatusControl = refreshEquipmentBomStatusControl;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  }
  else {
    start();
  }
})();
