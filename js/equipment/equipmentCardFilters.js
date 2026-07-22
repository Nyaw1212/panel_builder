//----------------------------------
// Panel Circuit Filters
//----------------------------------

let selectedBreakerSize = "";

function getBreakerFamily(material) {
  const catalog = String(material?.CatalogNumber || "").trim().toUpperCase();

  if (catalog.startsWith("CSR")) return "CSR";
  if (catalog.startsWith("CHP") || catalog.startsWith("CHF")) return "CHP";
  if (catalog.startsWith("BR")) return "BR";

  return "";
}

function getBreakerPoleCount(material) {
  const direct = Number(
    material?.Poles ??
    material?.Pole ??
    material?.PoleCount ??
    material?.poles ??
    0
  );

  if (direct > 0) return Math.max(1, Math.round(direct));

  const text = [
    material?.Type,
    material?.Description,
    material?.CatalogNumber
  ].join(" ").toUpperCase();

  const poleMatch = text.match(/([123])\s*(?:P|POLE)/);
  if (poleMatch) return Number(poleMatch[1]);

  const catalogMatch = String(material?.CatalogNumber || "")
    .toUpperCase()
    .match(/^(?:BR|CHP|CHF)([123])/);

  return catalogMatch ? Number(catalogMatch[1]) : 1;
}

function getBreakerAmperage(material) {
  const direct = Number(
    material?.Amperage ??
    material?.Amps ??
    material?.Amp ??
    material?.Rating ??
    0
  );

  if (direct > 0) return direct;

  const text = [
    material?.Description,
    material?.Type
  ].join(" ");

  const ampMatch = text.match(/(\d{1,3})\s*A(?:MP)?\b/i);
  if (ampMatch) return Number(ampMatch[1]);

  const catalog = String(material?.CatalogNumber || "")
    .toUpperCase()
    .replace(/^(?:BR|CHP|CHF)/, "");

  if (/^[123]\d{2,3}$/.test(catalog)) {
    return Number(catalog.slice(1));
  }

  return 0;
}

function getAvailableBreakerSizes(materials) {
  return Array.from(
    new Set(
      (materials || [])
        .map(getBreakerAmperage)
        .filter(value => value > 0)
    )
  ).sort((a, b) => a - b);
}

function setSelectedBreakerSize(size) {
  selectedBreakerSize =
    String(selectedBreakerSize) === String(size)
      ? ""
      : String(size || "");

  refreshEquipmentCardModal();
}

function getSelectedBreakerSize() {
  return selectedBreakerSize;
}

// Backward-compatible hooks.
function buildEquipmentComponentChips() {}
function getSelectedEquipmentComponent() {
  return "BREAKER";
}

window.getBreakerFamily = getBreakerFamily;
window.getBreakerPoleCount = getBreakerPoleCount;
window.getBreakerAmperage = getBreakerAmperage;
window.getAvailableBreakerSizes = getAvailableBreakerSizes;
window.setSelectedBreakerSize = setSelectedBreakerSize;
window.getSelectedBreakerSize = getSelectedBreakerSize;
window.buildEquipmentComponentChips = buildEquipmentComponentChips;
window.getSelectedEquipmentComponent = getSelectedEquipmentComponent;
