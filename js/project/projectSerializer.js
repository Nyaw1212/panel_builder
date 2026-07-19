//----------------------------------
// Serialize Equipment Data
//----------------------------------

function serializeEquipmentData(data) {
  return structuredClone(data);
}

//----------------------------------
// Serialize Connection
//----------------------------------

function serializeConnection(connection) {
  return {
    id: connection.id,

    side: connection.side,

    offset: connection.offset,

    connected: connection.connected,

    hardware: structuredClone(connection.hardware),

    wires: structuredClone(connection.wires),

    materials: structuredClone(connection.materials),

    conduit: structuredClone(connection.conduit),

    conduitLength: connection.conduitLength,

    notes: connection.notes,
  };
}

//----------------------------------
// Serialize Item
//----------------------------------

function serializeItem(item) {
  const connections = {};

  CONNECTION_SIDES.forEach((side) => {
    connections[side] =
      item.connections[side].map(
        serializeConnection
      );
  });

  return {
    //----------------------------------
    // Identity
    //----------------------------------

    id: item.id,

    //----------------------------------
    // Layout
    //----------------------------------

    startCell: item.startCell,

    width: item.width,

    height: item.height,

    rotation: item.rotation || 0,

    //----------------------------------
    // Equipment
    //----------------------------------

    data: serializeEquipmentData(item.data),

    preset: item.preset || "",

    materials: structuredClone(
      item.materials || []
    ),

    //----------------------------------
    // Connections
    //----------------------------------

    connections,
  };
}

//----------------------------------
// Serialize Layout
//----------------------------------

function serializeLayout() {
  const uniqueItems = [];

  const seen = new Set();

  getLayout().forEach((item) => {
    if (!item) return;

    if (seen.has(item.id)) return;

    seen.add(item.id);

    uniqueItems.push(
      serializeItem(item)
    );
  });

  return uniqueItems;
}

//----------------------------------
// Serialize Link
//----------------------------------

function serializeLink(link) {
  return {
    id: link.id,

    start: structuredClone(link.start),

    end: structuredClone(link.end),

    conduit: structuredClone(link.conduit),

    assembly: structuredClone(link.assembly),

    materials: structuredClone(link.materials),

    geometry: structuredClone(link.geometry),
  };
}

//----------------------------------
// Serialize Links
//----------------------------------

function serializeLinks() {
  return getLinks().map(
    serializeLink
  );
}

//----------------------------------
// Serialize Material Summary
//----------------------------------

function serializeMaterialSummary() {
  const map = {};

  const seen = new Set();

  //----------------------------------
  // Normalize Category
  //----------------------------------

  function normalizeCategory(value) {
    return String(value || "")
      .trim()
      .toUpperCase();
  }

  //----------------------------------
  // Add Material
  //----------------------------------

  function addMaterial(
    item,
    qty = 1,
    fallbackCategory = ""
  ) {
    if (!item) return;

    const catalogNumber = String(
      item.CatalogNumber ??
      item.catalogNumber ??
      ""
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
        CatalogNumber:
          catalogNumber,

        Description:
          item.Description ??
          item.description ??
          "",

        Type:
          item.Type ??
          item.type ??
          "",

        InventoryCategory:
          category,

        Supplier:
          item.Supplier ??
          item.supplier ??
          "",

        VendorCode:
          item.VendorCode ??
          item.vendorCode ??
          "",

        Price:
          Number(
            item.Price ??
            item.price ??
            0
          ) || 0,

        Qty: 0,
      };
    }

    //----------------------------------
    // Preserve BOS / VAN
    //----------------------------------

    if (
      !map[catalogNumber].InventoryCategory &&
      category
    ) {
      map[catalogNumber].InventoryCategory =
        category;
    }

    //----------------------------------
    // Preserve Missing Details
    //----------------------------------

    if (
      !map[catalogNumber].Description
    ) {
      map[catalogNumber].Description =
        item.Description ??
        item.description ??
        "";
    }

    if (
      !map[catalogNumber].Type
    ) {
      map[catalogNumber].Type =
        item.Type ??
        item.type ??
        "";
    }

    if (
      !map[catalogNumber].Supplier
    ) {
      map[catalogNumber].Supplier =
        item.Supplier ??
        item.supplier ??
        "";
    }

    if (
      !map[catalogNumber].VendorCode
    ) {
      map[catalogNumber].VendorCode =
        item.VendorCode ??
        item.vendorCode ??
        "";
    }

    if (
      !map[catalogNumber].Price
    ) {
      map[catalogNumber].Price =
        Number(
          item.Price ??
          item.price ??
          0
        ) || 0;
    }

    //----------------------------------
    // Add Quantity
    //----------------------------------

    map[catalogNumber].Qty +=
      Number(qty) || 0;
  }

  //----------------------------------
  // Equipment = BOS
  //----------------------------------

  getLayout().forEach((item) => {
    if (!item) return;

    if (seen.has(item.id)) return;

    seen.add(item.id);

    addMaterial(
      item.data,
      1,
      "BOS"
    );
  });

  //----------------------------------
  // Generated BOM = VAN
  //----------------------------------

  const bom = generateBOM();

  Object.values(
    bom || {}
  ).forEach((group) => {
    if (!Array.isArray(group)) {
      return;
    }

    group.forEach((item) => {
      addMaterial(
        item,
        item.Qty ??
        item.qty ??
        item.Quantity ??
        1,
        "VAN"
      );
    });
  });

  //----------------------------------
  // Sort
  //----------------------------------

  return Object.values(map)
    .sort((a, b) =>
      a.CatalogNumber.localeCompare(
        b.CatalogNumber
      )
    );
}

//----------------------------------
// Serialize Project
//----------------------------------

function serializeProject() {
  const project = getProjectState();

  return {
    id: project.id,

    version: project.version,

    jobName: project.jobName,

    address: project.address,

    layout: serializeLayout(),

    links: serializeLinks(),

    materialSummary:
      serializeMaterialSummary(),

    savedAt: Date.now(),
  };
}

//----------------------------------
// Expose
//----------------------------------

window.serializeEquipmentData =
  serializeEquipmentData;

window.serializeConnection =
  serializeConnection;

window.serializeItem =
  serializeItem;

window.serializeLayout =
  serializeLayout;

window.serializeLink =
  serializeLink;

window.serializeLinks =
  serializeLinks;

window.serializeMaterialSummary =
  serializeMaterialSummary;

window.serializeProject =
  serializeProject;