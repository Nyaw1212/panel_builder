//----------------------------------
// Panel Circuit Selection
//----------------------------------

let selectedPanelSlot = null;

function getPanelSideCapacity(equipment, side) {
  const data = equipment?.data || {};
  const keys =
    side === "left"
      ? ["LeftSlot", "leftSlot", "LeftSlots", "leftSlots"]
      : ["RightSlot", "rightSlot", "RightSlots", "rightSlots"];

  for (const key of keys) {
    const value = Number(data[key]);
    if (Number.isFinite(value) && value > 0) {
      return Math.round(value);
    }
  }

  return 12;
}

function getPanelPlacedComponents(equipment) {
  return (equipment?.materials || []).filter(
    entry => entry?.panelSlot
  );
}

function findPanelMaterial(catalogNumber) {
  return (getMaterials() || []).find(
    material =>
      String(material.CatalogNumber || "") ===
      String(catalogNumber || "")
  ) || null;
}

function getPanelSlotOccupant(equipment, side, index) {
  return getPanelPlacedComponents(equipment).find(entry => {
    const slot = entry.panelSlot || {};
    if (slot.section !== "branch" || slot.side !== side) {
      return false;
    }

    const start = Number(slot.index || 0);
    const span = Math.max(1, Number(slot.span || 1));

    return index >= start && index < start + span;
  }) || null;
}

function selectPanelSlot(side, index) {
  const equipment = getCurrentEquipment();
  if (!equipment) return;

  const capacity = getPanelSideCapacity(equipment, side);
  if (index < 0 || index >= capacity) return;

  selectedPanelSlot = { side, index };
  renderEquipmentComponents();
}

function getSelectedPanelSlot() {
  return selectedPanelSlot;
}

function selectFirstAvailablePanelSlot() {
  const equipment = getCurrentEquipment();
  if (!equipment) return null;

  for (let index = 0; index < Math.max(
    getPanelSideCapacity(equipment, "left"),
    getPanelSideCapacity(equipment, "right")
  ); index += 1) {
    for (const side of ["left", "right"]) {
      if (
        index < getPanelSideCapacity(equipment, side) &&
        !getPanelSlotOccupant(equipment, side, index)
      ) {
        selectedPanelSlot = { side, index };
        return selectedPanelSlot;
      }
    }
  }

  selectedPanelSlot = null;
  return null;
}

function canPlacePanelBreaker(equipment, side, index, span) {
  const capacity = getPanelSideCapacity(equipment, side);

  if (index < 0 || index + span > capacity) {
    return false;
  }

  for (let offset = 0; offset < span; offset += 1) {
    if (getPanelSlotOccupant(equipment, side, index + offset)) {
      return false;
    }
  }

  return true;
}

function capturePanelCircuitHistory(label) {
  if (
    window.HistoryManagerV2 &&
    typeof window.HistoryManagerV2.capture === "function"
  ) {
    window.HistoryManagerV2.capture(label);
  }
}

function addEquipmentComponent(material) {
  const equipment = getCurrentEquipment();
  if (!equipment || !material) return false;

  if (!Array.isArray(equipment.materials)) {
    equipment.materials = [];
  }

  const family = getBreakerFamily(material);
  const catalogNumber = material.CatalogNumber;

  if (family === "CSR") {
    equipment.materials = equipment.materials.filter(
      entry => entry?.panelSlot?.section !== "main"
    );

    equipment.materials.push({
      id: crypto.randomUUID(),
      catalogNumber,
      qty: 1,
      panelSlot: {
        section: "main",
        family: "CSR",
        span: getBreakerPoleCount(material)
      }
    });

    capturePanelCircuitHistory("Main breaker installed");
    refreshEquipmentCardModal();
    return true;
  }

  if (!selectedPanelSlot) {
    selectFirstAvailablePanelSlot();
  }

  if (!selectedPanelSlot) {
    alert("No available panel slot.");
    return false;
  }

  const span = getBreakerPoleCount(material);
  const { side, index } = selectedPanelSlot;

  if (!canPlacePanelBreaker(equipment, side, index, span)) {
    alert(
      `This ${span}-pole breaker does not fit in the selected ${side} slot.`
    );
    return false;
  }

  equipment.materials.push({
    id: crypto.randomUUID(),
    catalogNumber,
    qty: 1,
    panelSlot: {
      section: "branch",
      side,
      index,
      span,
      family
    }
  });

  capturePanelCircuitHistory("Panel breaker installed");
  selectFirstAvailablePanelSlot();
  refreshEquipmentCardModal();
  return true;
}

function placeEquipmentComponentAt(
  material,
  side,
  index
) {
  selectedPanelSlot = {
    side,
    index: Number(index)
  };

  return addEquipmentComponent(material);
}

function moveEquipmentComponent(
  componentId,
  side,
  index
) {
  const equipment = getCurrentEquipment();
  if (!equipment || !Array.isArray(equipment.materials)) {
    return false;
  }

  const component = equipment.materials.find(
    entry => entry.id === componentId
  );

  if (
    !component ||
    component.panelSlot?.section !== "branch"
  ) {
    return false;
  }

  const previousSlot =
    structuredClone(component.panelSlot);

  component.panelSlot.side = side;
  component.panelSlot.index = Number(index);

  const span = Math.max(
    1,
    Number(component.panelSlot.span || 1)
  );

  const collides = equipment.materials.some(entry => {
    if (
      entry === component ||
      entry.panelSlot?.section !== "branch" ||
      entry.panelSlot?.side !== side
    ) {
      return false;
    }

    const otherStart =
      Number(entry.panelSlot.index || 0);

    const otherSpan = Math.max(
      1,
      Number(entry.panelSlot.span || 1)
    );

    return (
      Number(index) < otherStart + otherSpan &&
      Number(index) + span > otherStart
    );
  });

  const capacity =
    getPanelSideCapacity(equipment, side);

  if (
    collides ||
    Number(index) < 0 ||
    Number(index) + span > capacity
  ) {
    component.panelSlot = previousSlot;
    return false;
  }

  selectedPanelSlot = {
    side,
    index: Number(index)
  };

  capturePanelCircuitHistory("Panel breaker moved");
  refreshEquipmentCardModal();
  return true;
}

function removeEquipmentComponent(componentId) {
  const equipment = getCurrentEquipment();
  if (!equipment || !Array.isArray(equipment.materials)) {
    return false;
  }

  const originalLength = equipment.materials.length;

  equipment.materials = equipment.materials.filter(
    entry => entry.id !== componentId
  );

  if (equipment.materials.length === originalLength) {
    return false;
  }

  capturePanelCircuitHistory("Panel breaker removed");
  refreshEquipmentCardModal();
  return true;
}

function resetPanelCircuitSelection() {
  selectedPanelSlot = null;
}

window.getPanelSideCapacity = getPanelSideCapacity;
window.getPanelPlacedComponents = getPanelPlacedComponents;
window.findPanelMaterial = findPanelMaterial;
window.getPanelSlotOccupant = getPanelSlotOccupant;
window.selectPanelSlot = selectPanelSlot;
window.getSelectedPanelSlot = getSelectedPanelSlot;
window.selectFirstAvailablePanelSlot = selectFirstAvailablePanelSlot;
window.canPlacePanelBreaker = canPlacePanelBreaker;
window.addEquipmentComponent = addEquipmentComponent;
window.placeEquipmentComponentAt = placeEquipmentComponentAt;
window.moveEquipmentComponent = moveEquipmentComponent;
window.removeEquipmentComponent = removeEquipmentComponent;
window.resetPanelCircuitSelection = resetPanelCircuitSelection;
