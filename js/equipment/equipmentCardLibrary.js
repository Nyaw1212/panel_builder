//----------------------------------
// Panel Breaker Library
//----------------------------------

function getEquipmentCardLibrary() {
  const materials =
    typeof getMaterials === "function"
      ? getMaterials()
      : [];

  return (materials || []).filter(material =>
    Boolean(getBreakerFamily(material))
  );
}

window.getEquipmentCardLibrary = getEquipmentCardLibrary;
