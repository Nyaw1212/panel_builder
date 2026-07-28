//----------------------------------
// Safe Clone
//----------------------------------
function cloneSerializable(value) {
  if (value === undefined) return undefined;
  if (typeof structuredClone === "function") return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
}

//----------------------------------
// Equipment / Connection / Item
//----------------------------------
function serializeEquipmentData(data) {
  return cloneSerializable(data);
}

function serializeConnection(connection) {
  return {
    id: connection.id,
    side: connection.side,
    offset: connection.offset,
    connected: connection.connected,
    hardware: cloneSerializable(connection.hardware || []),
    wires: cloneSerializable(connection.wires || []),
    materials: cloneSerializable(connection.materials || []),
    conduit: cloneSerializable(connection.conduit || null),
    conduitLength: Number(connection.conduitLength || 0),
    notes: connection.notes || ""
  };
}

function serializeItem(item) {
  const connections = {};
  CONNECTION_SIDES.forEach(side => {
    connections[side] = (item.connections?.[side] || []).map(serializeConnection);
  });

  return {
    id: item.id,
    startCell: item.startCell,
    width: Number(item.width || 1),
    height: Number(item.height || 1),
    rotation: Number(item.rotation || 0),
    data: serializeEquipmentData(item.data),
    preset: item.preset || "",
    materials: cloneSerializable(item.materials || []),
    connections
  };
}

function serializeLayout() {
  const uniqueItems = [];
  const seen = new Set();

  getLayout().forEach(item => {
    if (!item || seen.has(item.id)) return;
    seen.add(item.id);
    uniqueItems.push(serializeItem(item));
  });

  return uniqueItems;
}

//----------------------------------
// Links
//----------------------------------
function serializeLink(link) {
  return {
    id: link.id,
    start: cloneSerializable(link.start),
    end: cloneSerializable(link.end),
    conduit: cloneSerializable(link.conduit || null),
    assembly: cloneSerializable(link.assembly || null),
    materials: cloneSerializable(link.materials || []),
    geometry: cloneSerializable(link.geometry || null),
    routingMode: link.routingMode || "auto",
    manualRoute: link.manualRoute ? cloneSerializable(link.manualRoute) : null,
    manualRoutingV3:
      typeof ManualRouteSerializerV3 !== "undefined"
        ? ManualRouteSerializerV3.serialize(link)
        : null
  };
}

function serializeLinks() {
  return getLinks().map(serializeLink);
}

//----------------------------------
// Material Summary
//----------------------------------
function serializeMaterialSummary() {
  const map = {};
  const seen = new Set();

  function normalizeCategory(value) {
    return String(value || "").trim().toUpperCase();
  }

  function addMaterial(item, qty = 1, fallbackCategory = "") {
    if (!item) return;

    const catalogNumber = String(
      item.CatalogNumber ?? item.catalogNumber ?? ""
    ).trim();

    if (!catalogNumber) return;

    const category = normalizeCategory(
      item.InventoryCategory ??
      item.inventoryCategory ??
      item.category ??
      fallbackCategory
    );

    if (!map[catalogNumber]) {
      map[catalogNumber] = {
        CatalogNumber: catalogNumber,
        Description: item.Description ?? item.description ?? "",
        Type: item.Type ?? item.type ?? "",
        InventoryCategory: category,
        Supplier: item.Supplier ?? item.supplier ?? "",
        VendorCode: item.VendorCode ?? item.vendorCode ?? "",
        Price: Number(item.Price ?? item.price ?? 0) || 0,
        Qty: 0
      };
    }

    const row = map[catalogNumber];

    if (!row.InventoryCategory && category) row.InventoryCategory = category;
    if (!row.Description) row.Description = item.Description ?? item.description ?? "";
    if (!row.Type) row.Type = item.Type ?? item.type ?? "";
    if (!row.Supplier) row.Supplier = item.Supplier ?? item.supplier ?? "";
    if (!row.VendorCode) row.VendorCode = item.VendorCode ?? item.vendorCode ?? "";
    if (!row.Price) row.Price = Number(item.Price ?? item.price ?? 0) || 0;

    row.Qty += Number(qty) || 0;
  }

  //----------------------------------
  // Equipment + Equipment Card Materials = BOS
  //----------------------------------
  getLayout().forEach(item => {
    if (!item || seen.has(item.id)) return;
    seen.add(item.id);

    const equipmentCatalogNumber = String(
      item.data?.CatalogNumber ?? item.data?.catalogNumber ?? ""
    ).trim();

    addMaterial(item.data, 1, "BOS");

    (item.materials || []).forEach(component => {
      const catalogNumber = String(
        component.CatalogNumber ?? component.catalogNumber ?? ""
      ).trim();

      if (!catalogNumber) return;

      // The parent equipment is already counted above.
      // Some equipment cards also contain the parent catalog as a component.
      if (catalogNumber === equipmentCatalogNumber) return;

      const material =
        typeof getMaterial === "function"
          ? getMaterial(catalogNumber)
          : null;

      addMaterial(
        material || component,
        component.Qty ?? component.qty ?? component.Quantity ?? 1,
        "BOS"
      );
    });
  });

  //----------------------------------
  // Generated BOM = VAN
  //----------------------------------
  const bom = generateBOM();

  Object.values(bom || {}).forEach(group => {
    if (!Array.isArray(group)) return;

    group.forEach(item => {
      addMaterial(
        item,
        item.Qty ?? item.qty ?? item.Quantity ?? 1,
        "VAN"
      );
    });
  });

  return Object.values(map).sort((a, b) =>
    a.CatalogNumber.localeCompare(b.CatalogNumber)
  );
}

//----------------------------------
// Project
//----------------------------------
function serializeProjectCore() {
  const project = getProjectState();

  return {
    id: project.id,
    version: project.version,
    jobName: project.jobName || "",
    address: project.address || "",
    electrician: project.electrician || "",
    lender: project.lender || "",
    model: project.model || "",
    layout: serializeLayout(),
    links: serializeLinks(),
    materialSummary: serializeMaterialSummary()
  };
}

function serializeProject() {
  return {
    ...serializeProjectCore(),
    savedAt: Date.now()
  };
}

function serializeProjectHistory() {
  return serializeProjectCore();
}

//----------------------------------
// Expose
//----------------------------------
window.cloneSerializable = cloneSerializable;
window.serializeEquipmentData = serializeEquipmentData;
window.serializeConnection = serializeConnection;
window.serializeItem = serializeItem;
window.serializeLayout = serializeLayout;
window.serializeLink = serializeLink;
window.serializeLinks = serializeLinks;
window.serializeMaterialSummary = serializeMaterialSummary;
window.serializeProjectCore = serializeProjectCore;
window.serializeProject = serializeProject;
window.serializeProjectHistory = serializeProjectHistory;