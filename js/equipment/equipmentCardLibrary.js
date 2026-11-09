//----------------------------------
// Panel Breaker Library
//----------------------------------

function isPanelPolarisTapMaterial(material) {
  const text = [
    material?.CatalogNumber,
    material?.Description,
    material?.Type
  ].join(" ").toUpperCase();

  // Polaris insulated butt splices are not distribution taps. Keep the
  // panel accessory list to actual Insul-Tap and connector-block products.
  return text.includes("POLARIS") && !text.includes("BUTT");
}

function getEquipmentCardLibrary() {
  const materials =
    typeof getMaterials === "function"
      ? getMaterials()
      : [];

  return (materials || []).filter(material => {
    const nodeType = String(material?.NodeType || "")
      .trim()
      .toUpperCase();

    return (
      nodeType === "BREAKER" &&
      Boolean(getBreakerFamily(material))
    ) || isPanelPolarisTapMaterial(material);
  });
}

window.isPanelPolarisTapMaterial = isPanelPolarisTapMaterial;
window.getEquipmentCardLibrary = getEquipmentCardLibrary;
