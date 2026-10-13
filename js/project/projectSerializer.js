//----------------------------------
// Safe Clone
//----------------------------------
function cloneSerializable(value) {
  if (value === undefined) return undefined;
  if (typeof structuredClone === "function") return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
}

//----------------------------------
// Catalog-backed compact records
//----------------------------------
function getCatalogNumber(value) {
  return String(
    value?.CatalogNumber ??
    value?.catalogNumber ??
    ""
  ).trim();
}

function findCatalogRecord(catalogNumber) {
  const key = String(catalogNumber || "").trim();
  if (!key) return null;

  const sources = [
    window.equipment,
    window.materials,
    window.mml,
    window.MML
  ];

  for (const source of sources) {
    if (!Array.isArray(source)) continue;

    const match = source.find(item =>
      getCatalogNumber(item) === key
    );

    if (match) return match;
  }

  return null;
}

function sameSerializableValue(a, b) {
  try {
    return JSON.stringify(a) === JSON.stringify(b);
  }
  catch {
    return a === b;
  }
}

function compactCatalogRecord(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return cloneSerializable(value);
  }

  const catalogNumber = getCatalogNumber(value);
  if (!catalogNumber) {
    return cloneSerializable(value);
  }

  const base = findCatalogRecord(catalogNumber);
  if (!base) {
    return cloneSerializable(value);
  }

  const overrides = {};

  Object.keys(value).forEach(key => {
    const currentValue = value[key];

    // Runtime-only state is rebuilt after loading.
    if (key === "links") return;

    if (!sameSerializableValue(currentValue, base[key])) {
      overrides[key] = cloneSerializable(currentValue);
    }
  });

  const compact = { $ref: catalogNumber };

  if (Object.keys(overrides).length) {
    compact.$o = overrides;
  }

  return compact;
}

function hydrateCatalogRecord(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return cloneSerializable(value);
  }

  // Legacy project: already contains the full record.
  if (!value.$ref) {
    return cloneSerializable(value);
  }

  const catalogNumber = String(value.$ref || "").trim();
  const base = findCatalogRecord(catalogNumber);
  const overrides = cloneSerializable(value.$o || {});

  if (!base) {
    return {
      CatalogNumber: catalogNumber,
      ...overrides
    };
  }

  return {
    ...cloneSerializable(base),
    ...overrides
  };
}

function compactCatalogList(values) {
  return (Array.isArray(values) ? values : [])
    .map(compactCatalogRecord);
}

function hydrateCatalogList(values) {
  return (Array.isArray(values) ? values : [])
    .map(hydrateCatalogRecord);
}

//----------------------------------
// Equipment / Connection / Item
//----------------------------------
function serializeEquipmentData(data) {
  return compactCatalogRecord(data);
}

function serializeConnection(connection) {
  const result = {
    id: connection.id,
    side: connection.side,
    offset: connection.offset
  };

  if (connection.connected) {
    result.connected = true;
  }

  if (Array.isArray(connection.hardware) && connection.hardware.length) {
    result.hardware = compactCatalogList(connection.hardware);
  }

  if (Array.isArray(connection.wires) && connection.wires.length) {
    result.wires = compactCatalogList(connection.wires);
  }

  if (Array.isArray(connection.materials) && connection.materials.length) {
    result.materials = compactCatalogList(connection.materials);
  }

  if (connection.conduit) {
    result.conduit = compactCatalogRecord(connection.conduit);
  }

  const conduitLength = Number(connection.conduitLength || 0);
  if (conduitLength) {
    result.conduitLength = conduitLength;
  }

  const notes = String(connection.notes || "");
  if (notes) {
    result.notes = notes;
  }

  return result;
}

function serializeItem(item) {
  const connections = {};

  CONNECTION_SIDES.forEach(side => {
    const list = (item.connections?.[side] || [])
      .map(serializeConnection);

    if (list.length) {
      connections[side] = list;
    }
  });

  const result = {
    id: item.id,
    startCell: item.startCell,
    width: Number(item.width || 1),
    height: Number(item.height || 1),
    data: serializeEquipmentData(item.data),
    connections
  };

  const rotation = Number(item.rotation || 0);
  if (rotation) {
    result.rotation = rotation;
  }

  if (item.preset) {
    result.preset = item.preset;
  }

  if (Array.isArray(item.materials) && item.materials.length) {
    result.materials = compactCatalogList(item.materials);
  }

  return result;
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
  const result = {
    id: link.id,
    start: cloneSerializable(link.start),
    end: cloneSerializable(link.end)
  };

  if (link.conduit) {
    result.conduit = compactCatalogRecord(link.conduit);
  }

  // assembly, geometry, length and materials are derived again on load.
  if (link.routingMode && link.routingMode !== "auto") {
    result.routingMode = link.routingMode;
  }

  if (link.manualRoute) {
    result.manualRoute = cloneSerializable(link.manualRoute);
  }

  return result;
}

function serializeLinks() {
  return getLinks().map(serializeLink);
}

//----------------------------------
// Free-form Material Runs
//----------------------------------
function serializeRuns() {
  const runs = typeof getProjectRuns === "function"
    ? getProjectRuns()
    : [];

  return runs
    .map((run, index) => {
      const length = Number(run?.length || 0);

      return {
        id: String(run?.id || ""),
        name: String(run?.name || `Run ${index + 1}`),
        length: Number.isFinite(length) && length >= 0 ? length : 0,
        conduit: run?.conduit
          ? compactCatalogRecord(run.conduit)
          : null,
        wires: compactCatalogList(
          Array.isArray(run?.wires)
            ? run.wires
            : (run?.wire ? [run.wire] : [])
        )
      };
    })
    .filter(run =>
      run.id ||
      run.length ||
      run.conduit ||
      run.wires.length
    );
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
    version: Math.max(Number(project.version || 1), 2),
    jobName: project.jobName || "",
    address: project.address || "",
    electrician: project.electrician || "",
    lender: project.lender || "",
    model: project.model || "",
    layout: serializeLayout(),
    links: serializeLinks(),
    runs: serializeRuns(),
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
window.getCatalogNumber = getCatalogNumber;
window.findCatalogRecord = findCatalogRecord;
window.compactCatalogRecord = compactCatalogRecord;
window.hydrateCatalogRecord = hydrateCatalogRecord;
window.compactCatalogList = compactCatalogList;
window.hydrateCatalogList = hydrateCatalogList;
window.serializeEquipmentData = serializeEquipmentData;
window.serializeConnection = serializeConnection;
window.serializeItem = serializeItem;
window.serializeLayout = serializeLayout;
window.serializeLink = serializeLink;
window.serializeLinks = serializeLinks;
window.serializeRuns = serializeRuns;
window.serializeMaterialSummary = serializeMaterialSummary;
window.serializeProjectCore = serializeProjectCore;
window.serializeProject = serializeProject;
window.serializeProjectHistory = serializeProjectHistory;
