//----------------------------------
// Panel Breaker Library
//----------------------------------

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
    );
  });
}

window.getEquipmentCardLibrary = getEquipmentCardLibrary;
