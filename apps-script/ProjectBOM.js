//----------------------------------
// Constants
//----------------------------------

const PROJECT_BOM_SHEET = "PROJECT_BOM";

//----------------------------------
// Normalize BOM Header
//----------------------------------

function normalizeProjectBOMHeader(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "");
}

//----------------------------------
// Header Map
//----------------------------------

function getProjectBOMHeaderMap(sheet) {
  const lastColumn = sheet.getLastColumn();

  if (lastColumn < 1) {
    throw new Error(
      "PROJECT_BOM does not contain any headers."
    );
  }

  const headers = sheet
    .getRange(1, 1, 1, lastColumn)
    .getValues()[0];

  const map = {};

  headers.forEach((header, index) => {
    const key = normalizeProjectBOMHeader(header);
    if (key) map[key] = index;
  });

  return { headers, map };
}

//----------------------------------
// Find BOM Column
//----------------------------------

function getProjectBOMColumn(map, names) {
  for (let i = 0; i < names.length; i++) {
    const key = normalizeProjectBOMHeader(names[i]);
    if (map[key] !== undefined) {
      return map[key];
    }
  }

  return undefined;
}

//----------------------------------
// Set BOM Row Value
//----------------------------------

function setProjectBOMValue(row, map, names, value) {
  const column = getProjectBOMColumn(map, names);

  if (column !== undefined) {
    row[column] = value;
  }
}

//----------------------------------
// Project Metadata For BOM
//----------------------------------

function getProjectBOMProjectMeta_(projectId) {
  const spreadsheet = getProjectSpreadsheet();
  const sheet = spreadsheet.getSheetByName(PROJECT_SHEET || "PROJECTS");

  const empty = {
    model: "",
    lender: "",
    electrician: ""
  };

  if (!sheet || sheet.getLastRow() < 2 || sheet.getLastColumn() < 1) {
    return empty;
  }

  const headers = sheet
    .getRange(1, 1, 1, sheet.getLastColumn())
    .getDisplayValues()[0];

  const map = {};

  headers.forEach((header, index) => {
    const key = String(header || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");

    if (key) map[key] = index;
  });

  const idColumn =
    map.projectid !== undefined
      ? map.projectid
      : undefined;

  if (idColumn === undefined) {
    return empty;
  }

  const values = sheet
    .getRange(
      2,
      1,
      sheet.getLastRow() - 1,
      sheet.getLastColumn()
    )
    .getValues();

  const normalizedProjectId = String(projectId || "").trim();

  const row = values.find(item =>
    String(item[idColumn] || "").trim() === normalizedProjectId
  );

  if (!row) {
    return empty;
  }

  function valueFor(key) {
    const index = map[key];
    return index !== undefined
      ? String(row[index] || "").trim()
      : "";
  }

  let model = valueFor("model");
  let lender = valueFor("lender");
  let electrician = valueFor("electrician");

  // Backward-compatible fallback: read the saved project JSON.
  if (!model || !lender || !electrician) {
    const jsonIndex =
      map.json !== undefined
        ? map.json
        : map.projectjson;

    if (jsonIndex !== undefined && row[jsonIndex]) {
      try {
        const project =
          typeof row[jsonIndex] === "object"
            ? row[jsonIndex]
            : JSON.parse(String(row[jsonIndex]));

        model = model || String(project.model || "").trim();
        lender = lender || String(project.lender || "").trim();
        electrician = electrician || String(project.electrician || "").trim();
      }
      catch (err) {
        Logger.log(
          "Unable to parse project metadata for PROJECT_BOM: " +
          err.message
        );
      }
    }
  }

  return {
    model,
    lender,
    electrician
  };
}

//----------------------------------
// Save Project BOM
//----------------------------------

function saveProjectBOM(
  projectId,
  jobName,
  address,
  materials
) {
  const spreadsheet = getProjectSpreadsheet();
  const sheet = spreadsheet.getSheetByName(PROJECT_BOM_SHEET);

  if (!sheet) {
    throw new Error('Sheet "PROJECT_BOM" was not found.');
  }

  const normalizedProjectId = String(projectId || "").trim();

  if (!normalizedProjectId) {
    throw new Error(
      "Project ID is required to save the BOM."
    );
  }

  //----------------------------------
  // Delete Existing Project BOM
  //----------------------------------

  deleteProjectBOM(normalizedProjectId);

  //----------------------------------
  // Validate Materials
  //----------------------------------

  const materialList = Array.isArray(materials)
    ? materials
    : [];

  if (!materialList.length) {
    return {
      success: true,
      projectId: normalizedProjectId,
      materialCount: 0
    };
  }

  //----------------------------------
  // Headers + Project Details
  //----------------------------------

  const { headers, map } = getProjectBOMHeaderMap(sheet);
  const projectMeta = getProjectBOMProjectMeta_(normalizedProjectId);

  //----------------------------------
  // Build Rows
  //----------------------------------

  const rows = materialList.map(material => {
    const row = new Array(headers.length).fill("");

    setProjectBOMValue(
      row,
      map,
      ["ProjectID", "Project ID"],
      normalizedProjectId
    );

    setProjectBOMValue(
      row,
      map,
      ["JobName", "Job Name"],
      String(jobName || "").trim()
    );

    setProjectBOMValue(
      row,
      map,
      ["Address"],
      String(address || "").trim()
    );

    setProjectBOMValue(
      row,
      map,
      ["Model"],
      projectMeta.model
    );

    setProjectBOMValue(
      row,
      map,
      ["Lender"],
      projectMeta.lender
    );

    setProjectBOMValue(
      row,
      map,
      ["Electrician"],
      projectMeta.electrician
    );

    setProjectBOMValue(
      row,
      map,
      ["CatalogNumber", "Catalog Number"],
      String(
        material.CatalogNumber ||
        material.catalogNumber ||
        ""
      ).trim()
    );

    setProjectBOMValue(
      row,
      map,
      ["Description"],
      String(
        material.Description ||
        material.description ||
        ""
      ).trim()
    );

    setProjectBOMValue(
      row,
      map,
      ["Type"],
      String(
        material.Type ||
        material.type ||
        ""
      ).trim()
    );

    setProjectBOMValue(
      row,
      map,
      ["InventoryCategory", "Inventory Category"],
      String(
        material.InventoryCategory ||
        material.inventoryCategory ||
        material.category ||
        ""
      ).trim()
    );

    setProjectBOMValue(
      row,
      map,
      ["Supplier"],
      String(
        material.Supplier ||
        material.supplier ||
        ""
      ).trim()
    );

    setProjectBOMValue(
      row,
      map,
      ["VendorCode", "Vendor Code"],
      String(
        material.VendorCode ||
        material.vendorCode ||
        ""
      ).trim()
    );

    setProjectBOMValue(
      row,
      map,
      ["Price"],
      Number(
        material.Price ??
        material.price ??
        0
      ) || 0
    );

    setProjectBOMValue(
      row,
      map,
      ["Qty", "Quantity"],
      Number(
        material.Qty ??
        material.qty ??
        material.Quantity ??
        0
      ) || 0
    );

    return row;
  });

  //----------------------------------
  // Append Rows
  //----------------------------------

  sheet
    .getRange(
      sheet.getLastRow() + 1,
      1,
      rows.length,
      headers.length
    )
    .setValues(rows);

  return {
    success: true,
    projectId: normalizedProjectId,
    materialCount: rows.length
  };
}

//----------------------------------
// Delete Existing Project BOM
//----------------------------------

function deleteProjectBOM(projectId) {
  const spreadsheet = getProjectSpreadsheet();
  const sheet = spreadsheet.getSheetByName(PROJECT_BOM_SHEET);

  if (!sheet) {
    return;
  }

  const lastRow = sheet.getLastRow();

  if (lastRow < 2) {
    return;
  }

  const { map } = getProjectBOMHeaderMap(sheet);

  const projectIdColumn = getProjectBOMColumn(
    map,
    ["ProjectID", "Project ID"]
  );

  if (projectIdColumn === undefined) {
    throw new Error(
      "PROJECT_BOM is missing the ProjectID header."
    );
  }

  const values = sheet
    .getRange(
      2,
      1,
      lastRow - 1,
      sheet.getLastColumn()
    )
    .getValues();

  const normalizedProjectId = String(projectId || "").trim();

  //----------------------------------
  // Delete Bottom-Up
  //----------------------------------

  for (let index = values.length - 1; index >= 0; index--) {
    const savedProjectId = String(
      values[index][projectIdColumn] || ""
    ).trim();

    if (savedProjectId === normalizedProjectId) {
      sheet.deleteRow(index + 2);
    }
  }
}
