//----------------------------------
// Material Sort Engine V2
//----------------------------------

const MaterialSortEngineV2 = (() => {
  let orderMap = new Map();

  //----------------------------------
  // Normalize Catalog Number
  //----------------------------------

  function normalizeCatalogNumber(value) {
    return String(value || "")
      .trim()
      .toUpperCase();
  }

  //----------------------------------
  // Initialize
  //----------------------------------

  function init(materials = []) {
    orderMap.clear();

    materials.forEach((material, index) => {
      const catalogNumber =
        normalizeCatalogNumber(
          material.CatalogNumber ??
          material.catalogNumber
        );

      if (!catalogNumber) return;

      if (orderMap.has(catalogNumber)) {
        return;
      }

      orderMap.set(
        catalogNumber,
        index
      );
    });

    console.log(
      "MaterialSortEngineV2 initialized",
      {
        materials: materials.length,
        indexed: orderMap.size,
      }
    );
  }

  //----------------------------------
  // Get Sort Index
  //----------------------------------

  function getSortIndex(material) {
    const catalogNumber =
      normalizeCatalogNumber(
        material?.CatalogNumber ??
        material?.catalogNumber
      );

    if (!catalogNumber) {
      return Number.MAX_SAFE_INTEGER;
    }

    return orderMap.get(
      catalogNumber
    ) ?? Number.MAX_SAFE_INTEGER;
  }

  //----------------------------------
  // Sort Materials
  //----------------------------------

  function sort(materials = []) {
    if (!Array.isArray(materials)) {
      return [];
    }

    return [...materials].sort(
      (a, b) => {
        const aIndex =
          getSortIndex(a);

        const bIndex =
          getSortIndex(b);

        //----------------------------------
        // MML Order
        //----------------------------------

        if (aIndex !== bIndex) {
          return aIndex - bIndex;
        }

        //----------------------------------
        // Unknown Materials
        //----------------------------------

        const aCatalog =
          normalizeCatalogNumber(
            a?.CatalogNumber ??
            a?.catalogNumber
          );

        const bCatalog =
          normalizeCatalogNumber(
            b?.CatalogNumber ??
            b?.catalogNumber
          );

        return aCatalog.localeCompare(
          bCatalog
        );
      }
    );
  }

  //----------------------------------
  // Check Initialized
  //----------------------------------

  function isInitialized() {
    return orderMap.size > 0;
  }

  //----------------------------------
  // Clear
  //----------------------------------

  function clear() {
    orderMap.clear();
  }

  //----------------------------------
  // Public API
  //----------------------------------

  return {
    init,
    sort,
    clear,
    isInitialized,
    getSortIndex,
  };
})();

window.MaterialSortEngineV2 =
  MaterialSortEngineV2;