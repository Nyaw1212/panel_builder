//----------------------------------
// Safe Clone
//----------------------------------

function cloneSerializable(value) {

  if (
    value === undefined
  ) {
    return undefined;
  }

  if (
    typeof structuredClone ===
    "function"
  ) {

    return structuredClone(
      value
    );

  }

  return JSON.parse(
    JSON.stringify(
      value
    )
  );

}

//----------------------------------
// Serialize Equipment Data
//----------------------------------

function serializeEquipmentData(data) {

  return cloneSerializable(
    data
  );

}

//----------------------------------
// Serialize Connection
//----------------------------------

function serializeConnection(
  connection
) {

  return {

    id:
      connection.id,

    side:
      connection.side,

    offset:
      connection.offset,

    connected:
      connection.connected,

    hardware:
      cloneSerializable(
        connection.hardware || []
      ),

    wires:
      cloneSerializable(
        connection.wires || []
      ),

    materials:
      cloneSerializable(
        connection.materials || []
      ),

    conduit:
      cloneSerializable(
        connection.conduit || null
      ),

    conduitLength:
      Number(
        connection.conduitLength || 0
      ),

    notes:
      connection.notes || ""

  };

}

//----------------------------------
// Serialize Item
//----------------------------------

function serializeItem(item) {

  const connections = {};

  CONNECTION_SIDES.forEach(
    side => {

      const sideConnections =
        item.connections?.[side] || [];

      connections[side] =
        sideConnections.map(
          serializeConnection
        );

    }
  );

  return {

    //----------------------------------
    // Identity
    //----------------------------------

    id:
      item.id,

    //----------------------------------
    // Layout
    //----------------------------------

    startCell:
      item.startCell,

    width:
      Number(
        item.width || 1
      ),

    height:
      Number(
        item.height || 1
      ),

    rotation:
      Number(
        item.rotation || 0
      ),

    //----------------------------------
    // Equipment
    //----------------------------------

    data:
      serializeEquipmentData(
        item.data
      ),

    preset:
      item.preset || "",

    materials:
      cloneSerializable(
        item.materials || []
      ),

    //----------------------------------
    // Connections
    //----------------------------------

    connections

  };

}

//----------------------------------
// Serialize Layout
//----------------------------------

function serializeLayout() {

  const uniqueItems = [];

  const seen = new Set();

  getLayout().forEach(
    item => {

      if (!item) return;

      if (
        seen.has(
          item.id
        )
      ) {
        return;
      }

      seen.add(
        item.id
      );

      uniqueItems.push(
        serializeItem(
          item
        )
      );

    }
  );

  return uniqueItems;

}

//----------------------------------
// Serialize Link
//----------------------------------

function serializeLink(link) {

  return {

    id:
      link.id,

    start:
      cloneSerializable(
        link.start
      ),

    end:
      cloneSerializable(
        link.end
      ),

    conduit:
      cloneSerializable(
        link.conduit || null
      ),

    assembly:
      cloneSerializable(
        link.assembly || null
      ),

    materials:
      cloneSerializable(
        link.materials || []
      ),

    geometry:
      cloneSerializable(
        link.geometry || null
      ),

    //----------------------------------
    // Routing Mode
    //----------------------------------

    routingMode:
      link.routingMode || "auto",

    manualRoute:
      link.manualRoute
        ? cloneSerializable(
            link.manualRoute
          )
        : null,

    manualRoutingV3:
      typeof ManualRouteSerializerV3 !==
        "undefined"
        ? ManualRouteSerializerV3
            .serialize(link)
        : null

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

    return String(
      value || ""
    )
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

    const catalogNumber =
      String(
        item.CatalogNumber ??
        item.catalogNumber ??
        ""
      ).trim();

    if (!catalogNumber) {
      return;
    }

    const category =
      normalizeCategory(
        item.InventoryCategory ??
        item.inventoryCategory ??
        item.category ??
        fallbackCategory
      );

    if (
      !map[catalogNumber]
    ) {

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

        Qty: 0

      };

    }

    //----------------------------------
    // Preserve BOS / VAN
    //----------------------------------

    if (
      !map[catalogNumber]
        .InventoryCategory &&
      category
    ) {

      map[catalogNumber]
        .InventoryCategory =
        category;

    }

    //----------------------------------
    // Preserve Missing Details
    //----------------------------------

    if (
      !map[catalogNumber]
        .Description
    ) {

      map[catalogNumber]
        .Description =
        item.Description ??
        item.description ??
        "";

    }

    if (
      !map[catalogNumber]
        .Type
    ) {

      map[catalogNumber]
        .Type =
        item.Type ??
        item.type ??
        "";

    }

    if (
      !map[catalogNumber]
        .Supplier
    ) {

      map[catalogNumber]
        .Supplier =
        item.Supplier ??
        item.supplier ??
        "";

    }

    if (
      !map[catalogNumber]
        .VendorCode
    ) {

      map[catalogNumber]
        .VendorCode =
        item.VendorCode ??
        item.vendorCode ??
        "";

    }

    if (
      !map[catalogNumber]
        .Price
    ) {

      map[catalogNumber]
        .Price =
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
      Number(
        qty
      ) || 0;

  }

  //----------------------------------
  // Equipment = BOS
  //----------------------------------

  getLayout().forEach(
    item => {

      if (!item) return;

      if (
        seen.has(
          item.id
        )
      ) {
        return;
      }

      seen.add(
        item.id
      );

      addMaterial(
        item.data,
        1,
        "BOS"
      );

    }
  );

  //----------------------------------
  // Generated BOM = VAN
  //----------------------------------

  const bom =
    generateBOM();

  Object.values(
    bom || {}
  ).forEach(
    group => {

      if (
        !Array.isArray(
          group
        )
      ) {
        return;
      }

      group.forEach(
        item => {

          addMaterial(
            item,
            item.Qty ??
            item.qty ??
            item.Quantity ??
            1,
            "VAN"
          );

        }
      );

    }
  );

  //----------------------------------
  // Sort
  //----------------------------------

  return Object.values(
    map
  ).sort(
    (a, b) =>
      a.CatalogNumber.localeCompare(
        b.CatalogNumber
      )
  );

}

//----------------------------------
// Serialize Project Core
//----------------------------------

function serializeProjectCore() {

  const project =
    getProjectState();

  return {

    id:
      project.id,

    version:
      project.version,

    jobName:
      project.jobName || "",

    address:
      project.address || "",

    electrician:
      project.electrician || "",

    lender:
      project.lender || "",

    model:
      project.model || "",

    layout:
      serializeLayout(),

    links:
      serializeLinks(),

    materialSummary:
      serializeMaterialSummary()

  };

}

//----------------------------------
// Serialize Project For Save
//----------------------------------

function serializeProject() {

  return {

    ...serializeProjectCore(),

    savedAt:
      Date.now()

  };

}

//----------------------------------
// Serialize Project For History
//----------------------------------

function serializeProjectHistory() {

  /*
   * History snapshots must not contain
   * changing timestamps such as savedAt.
   *
   * Otherwise every history capture appears
   * different even when the project did not
   * actually change.
   */

  return serializeProjectCore();

}

//----------------------------------
// Expose
//----------------------------------

window.cloneSerializable =
  cloneSerializable;

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

window.serializeProjectCore =
  serializeProjectCore;

window.serializeProject =
  serializeProject;

window.serializeProjectHistory =
  serializeProjectHistory;