//----------------------------------
// Project API Configuration
//----------------------------------

const PROJECT_SHEET = "PROJECTS";

//----------------------------------
// MML Cache Version Configuration
//----------------------------------

const MML_VERSION_SHEET = "MML";

// Optional:
//
// Use this when the Apps Script is standalone.
// Leave blank when the script is bound directly
// to the correct Google Spreadsheet.

const PROJECT_SPREADSHEET_ID =
  "1biSrfupGYl4aZInIMsu2BC-5bdjz2AOVcT-j03XMLjQ";

//----------------------------------
// doGet
//----------------------------------

function doGet(e) {

  const view = String(
    e?.parameter?.view || ""
  )
    .trim()
    .toLowerCase();

  if (view === "app") {

    return servePanelBuilderApp_();

  }

  return jsonOutput({

    success: true,

    service: "PanelBuilderApi",

    message: "Panel Builder API is running.",

    timestamp: new Date().toISOString()

  });

}

//----------------------------------
// doPost
//----------------------------------

function doPost(e) {

  try {

    //----------------------------------
    // Validate Request
    //----------------------------------

    if (
      !e ||
      !e.postData ||
      !e.postData.contents
    ) {

      return jsonOutput({

        success: false,

        message: "Missing POST request body."

      });

    }

    //----------------------------------
    // Parse Request
    //----------------------------------

    const request = JSON.parse(
      e.postData.contents
    );

    const action = String(
      request.action || ""
    ).trim();

    if (!action) {

      return jsonOutput({

        success: false,

        message: "Missing API action."

      });

    }

    //----------------------------------
    // Route Request
    //----------------------------------

    switch (action) {

      //----------------------------------
      // Get MML
      //----------------------------------

      case "getMML":

        return jsonOutput({

          success: true,

          // Do not calculate the complete-sheet hash here. Reading the
          // catalog is already the expensive operation, and the hash can add
          // enough time to make a manual reload appear to hang. Version
          // checks continue through the dedicated getMMLVersion action.
          mml: getMML()

        });

      //----------------------------------
      // Get MML Version
      //----------------------------------

      case "getMMLVersion":

        return jsonOutput({

          success: true,

          version: getMMLVersion()

        });

      //----------------------------------
      // Get Presets
      //----------------------------------

      case "getPresets":

        return jsonOutput({

          success: true,

          presets: getPresets(),

          version: getPresetsVersion()

        });

      //----------------------------------
      // Get PRESETS Version
      //----------------------------------

      case "getPresetsVersion":

        return jsonOutput({

          success: true,

          version: getPresetsVersion()

        });

      //----------------------------------
      // Get wire assignment rules
      //----------------------------------

      case "getWireAssignments":

        return jsonOutput({

          success: true,

          wireAssignments: getWireAssignments(),

          version: getWireAssignmentsVersion()

        });

      //----------------------------------
      // Save Project
      //----------------------------------

      case "saveProject":

        return jsonOutput(
          saveProject(request)
        );

      //----------------------------------
      // Load Project
      //----------------------------------

      case "loadProject":

        return jsonOutput(
          loadProject(request)
        );

      //----------------------------------
      // Load Project By ID
      //----------------------------------

      case "loadProjectById":

        return jsonOutput(
          loadProjectById(request)
        );

      //----------------------------------
      // Get Projects
      //----------------------------------

      case "getProjects":

        return jsonOutput({

          success: true,

          projects: getProjects()

        });

      //----------------------------------
      // Delete Project
      //----------------------------------

      case "deleteProject":

        return jsonOutput(
          deleteProject(request)
        );

      //----------------------------------
      // API Health
      //----------------------------------

      case "health":

        return jsonOutput({

          success: true,

          service: "PanelBuilderApi"

        });

      //----------------------------------
      // Upload Material Image
      //----------------------------------

      case "uploadMaterialImage":

        validateApiKey(request);

        return jsonOutput(

          uploadMaterialImage(request)

        );

      //----------------------------------
      // Unknown Action
      //----------------------------------

      default:

        return jsonOutput({

          success: false,

          message:
            "Unknown Action: " + action

        });

    }

  }
  catch (err) {

    return jsonOutput({

      success: false,

      message: String(err),

      stack: err.stack || ""

    });

  }

}

//----------------------------------
// JSON Output
//----------------------------------

function jsonOutput(data) {

  return ContentService
    .createTextOutput(
      JSON.stringify(data)
    )
    .setMimeType(
      ContentService.MimeType.JSON
    );

}

//----------------------------------
// Get Project Spreadsheet
//----------------------------------

function getProjectSpreadsheet() {

  if (PROJECT_SPREADSHEET_ID) {

    return SpreadsheetApp.openById(
      PROJECT_SPREADSHEET_ID
    );

  }

  const spreadsheet =
    SpreadsheetApp.getActiveSpreadsheet();

  if (!spreadsheet) {

    throw new Error(
      "No active spreadsheet. Add the spreadsheet ID to PROJECT_SPREADSHEET_ID."
    );

  }

  return spreadsheet;

}

//----------------------------------
// Get Project Sheet
//----------------------------------

function normalizeProjectHeader_(value) {

  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

}

function ensureProjectHeaders_(sheet) {

  const requiredHeaders = [
    "ProjectID",
    "JobName",
    "Address",
    "Created",
    "Modified",
    "JSON",
    "Model",
    "Lender",
    "Electrician"
  ];

  const lastColumn = Math.max(sheet.getLastColumn(), 1);

  let headers = sheet
    .getRange(1, 1, 1, lastColumn)
    .getDisplayValues()[0]
    .map(value => String(value || "").trim());

  if (headers.every(value => !value)) {
    headers = [];
  }

  const existing = new Set(
    headers.map(normalizeProjectHeader_)
  );

  const missing = requiredHeaders.filter(
    header => !existing.has(normalizeProjectHeader_(header))
  );

  if (missing.length) {
    const startColumn = headers.length + 1;

    sheet
      .getRange(1, startColumn, 1, missing.length)
      .setValues([missing]);

    headers = headers.concat(missing);
  }

  sheet.setFrozenRows(1);

  const map = {};

  headers.forEach((header, index) => {
    const key = normalizeProjectHeader_(header);
    if (key) map[key] = index + 1;
  });

  return { headers, map };

}

function projectColumn_(map, ...aliases) {

  for (const alias of aliases) {
    const column = map[normalizeProjectHeader_(alias)];
    if (column) return column;
  }

  return 0;

}

function getProjectSheet() {

  const spreadsheet = getProjectSpreadsheet();

  let sheet = spreadsheet.getSheetByName(PROJECT_SHEET);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(PROJECT_SHEET);
  }

  ensureProjectHeaders_(sheet);

  return sheet;

}

//----------------------------------
// Save Project
//----------------------------------

function saveProject(request) {

  const start = Date.now();
  const sheet = getProjectSheet();
  const { headers, map } = ensureProjectHeaders_(sheet);

  const jobName = String(request.jobName || "").trim();
  const address = String(request.address || "").trim();
  const electrician = String(request.electrician || "").trim();
  const lender = String(request.lender || "").trim();
  const model = String(request.model || "").trim();
  const usedMaterialsSpreadsheetId = String(
    request.usedMaterialsSpreadsheetId || ""
  ).trim();

  let projectId = String(
    request.id || request.projectId || ""
  ).trim();

  if (!jobName) {
    return {
      success: false,
      message: "Job name is required."
    };
  }

  const now = new Date();

  const materialSummary = Array.isArray(request.materialSummary)
    ? request.materialSummary
    : [];

  const bos = Array.isArray(request.bos) ? request.bos : [];
  const van = Array.isArray(request.van) ? request.van : [];

  const summary =
    request.summary && typeof request.summary === "object"
      ? request.summary
      : {};

  const materials = materialSummary.length
    ? materialSummary
    : [...bos, ...van];

  const project = {
    id: projectId,
    version: request.version || 2,
    jobName,
    address,
    electrician,
    lender,
    model,
    usedMaterialsSpreadsheetId,
    layout: Array.isArray(request.layout) ? request.layout : [],
    links: Array.isArray(request.links) ? request.links : [],
    runs: Array.isArray(request.runs) ? request.runs : [],
    gutters: Array.isArray(request.gutters) ? request.gutters : [],
    materialSummary,
    bos,
    van,
    summary
  };

  let row = 0;

  if (projectId) {
    row = findProjectRowById(sheet, projectId);
  }

  if (!row) {
    row = findProjectRowByDetails(sheet, jobName, address);
  }

  const idColumn = projectColumn_(map, "ProjectID", "Project ID");
  const createdColumn = projectColumn_(map, "Created");

  if (row && idColumn) {
    const existingProjectId = String(
      sheet.getRange(row, idColumn).getValue() || ""
    ).trim();

    projectId = existingProjectId || projectId;
  }

  const wasExisting = Boolean(row);

  if (!projectId) {
    projectId = createProjectId(sheet);
  }

  project.id = projectId;

  if (!row) {
    row = Math.max(sheet.getLastRow() + 1, 2);
  }

  const existingRow = row <= sheet.getLastRow()
    ? sheet.getRange(row, 1, 1, headers.length).getValues()[0]
    : new Array(headers.length).fill("");

  const output = existingRow.slice();

  function setByHeader(value, ...aliases) {
    const column = projectColumn_(map, ...aliases);
    if (column) output[column - 1] = value;
  }

  const created =
    createdColumn && existingRow[createdColumn - 1]
      ? existingRow[createdColumn - 1]
      : now;

  setByHeader(projectId, "ProjectID", "Project ID");
  setByHeader(jobName, "JobName", "Job Name");
  setByHeader(address, "Address");
  setByHeader(created, "Created");
  setByHeader(now, "Modified");
  setByHeader(JSON.stringify(project), "JSON", "Project JSON");
  setByHeader(model, "Model");
  setByHeader(lender, "Lender");
  setByHeader(electrician, "Electrician");

  sheet
    .getRange(row, 1, 1, output.length)
    .setValues([output]);

  saveProjectBOMSafe(
    projectId,
    jobName,
    address,
    materials
  );

  const usedMaterials =
    String(request.usedMaterialsOutput || "").trim().toLowerCase() === "xlsx"
      ? null
      : saveProjectUsedMaterialsSafe_(
          usedMaterialsSpreadsheetId,
          jobName,
          address,
          model,
          materials
        );

  if (usedMaterials?.success) {
    project.usedMaterialsSpreadsheetId = usedMaterials.spreadsheetId;
    project.usedMaterialsSpreadsheetUrl = usedMaterials.spreadsheetUrl;

    const jsonColumn = projectColumn_(map, "JSON", "Project JSON");
    if (jsonColumn) {
      sheet.getRange(row, jsonColumn).setValue(JSON.stringify(project));
    }
  }

  Logger.log(
    "Project saved in " + (Date.now() - start) + " ms"
  );

  return {
    success: true,
    action: wasExisting ? "updated" : "created",
    projectId,
    usedMaterials
  };

}

//----------------------------------
// Get Projects
//----------------------------------

function getProjects() {

  const sheet = getProjectSheet();
  const lastRow = sheet.getLastRow();

  if (lastRow < 2) return [];

  const { headers, map } = ensureProjectHeaders_(sheet);

  const idColumn = projectColumn_(map, "ProjectID", "Project ID");
  const jobColumn = projectColumn_(map, "JobName", "Job Name");
  const addressColumn = projectColumn_(map, "Address");
  const createdColumn = projectColumn_(map, "Created");
  const modifiedColumn = projectColumn_(map, "Modified");
  const jsonColumn = projectColumn_(map, "JSON", "Project JSON");
  const modelColumn = projectColumn_(map, "Model");
  const lenderColumn = projectColumn_(map, "Lender");
  const electricianColumn = projectColumn_(map, "Electrician");

  const values = sheet
    .getRange(2, 1, lastRow - 1, headers.length)
    .getValues();

  return values
    .filter(row => idColumn && row[idColumn - 1])
    .map(row => {
      const project = jsonColumn
        ? parseProjectJSON(row[jsonColumn - 1])
        : null;

      if (project) {
        project.model = project.model || (modelColumn ? String(row[modelColumn - 1] || "").trim() : "");
        project.lender = project.lender || (lenderColumn ? String(row[lenderColumn - 1] || "").trim() : "");
        project.electrician = project.electrician || (electricianColumn ? String(row[electricianColumn - 1] || "").trim() : "");
      }

      return {
        projectId: String(row[idColumn - 1] || ""),
        jobName: jobColumn ? String(row[jobColumn - 1] || "") : "",
        address: addressColumn ? String(row[addressColumn - 1] || "") : "",
        model: modelColumn ? String(row[modelColumn - 1] || "") : "",
        lender: lenderColumn ? String(row[lenderColumn - 1] || "") : "",
        electrician: electricianColumn ? String(row[electricianColumn - 1] || "") : "",
        created: createdColumn ? row[createdColumn - 1] : null,
        modified: modifiedColumn ? row[modifiedColumn - 1] : null,
        project
      };
    });

}

//----------------------------------
// Load Project
//----------------------------------

function loadProject(request) {

  const sheet = getProjectSheet();

  const jobName = String(
    request.jobName || ""
  ).trim();

  const address = String(
    request.address || ""
  ).trim();

  const row = findProjectRowByDetails(

    sheet,

    jobName,

    address

  );

  if (!row) {

    return {

      success: true,

      found: false

    };

  }

  return buildLoadedProjectResponse(
    sheet,
    row
  );

}

//----------------------------------
// Load Project By ID
//----------------------------------

function loadProjectById(request) {

  const sheet = getProjectSheet();

  const projectId = String(

    request.projectId ||
    request.id ||
    ""

  ).trim();

  if (!projectId) {

    return {

      success: false,

      found: false,

      message: "Project ID is required."

    };

  }

  const row = findProjectRowById(

    sheet,

    projectId

  );

  if (!row) {

    return {

      success: true,

      found: false

    };

  }

  return buildLoadedProjectResponse(
    sheet,
    row
  );

}

//----------------------------------
// Delete Project
//----------------------------------

function deleteProject(request) {

  const sheet = getProjectSheet();

  const projectId = String(

    request.projectId ||
    request.id ||
    ""

  ).trim();

  if (!projectId) {

    return {

      success: false,

      message: "Project ID is required."

    };

  }

  const row = findProjectRowById(

    sheet,

    projectId

  );

  if (!row) {

    return {

      success: true,

      deleted: false,

      message: "Project not found."

    };

  }

  sheet.deleteRow(row);

  deleteProjectBOMSafe(projectId);

  return {

    success: true,

    deleted: true,

    projectId

  };

}

//----------------------------------
// Build Loaded Project Response
//----------------------------------

function buildLoadedProjectResponse(
  sheet,
  row
) {

  const { map } = ensureProjectHeaders_(sheet);

  const idColumn = projectColumn_(map, "ProjectID", "Project ID");
  const jsonColumn = projectColumn_(map, "JSON", "Project JSON");
  const jobColumn = projectColumn_(map, "JobName", "Job Name");
  const addressColumn = projectColumn_(map, "Address");
  const modelColumn = projectColumn_(map, "Model");
  const lenderColumn = projectColumn_(map, "Lender");
  const electricianColumn = projectColumn_(map, "Electrician");

  const projectId = idColumn
    ? String(sheet.getRange(row, idColumn).getValue() || "").trim()
    : "";

  const json = jsonColumn
    ? sheet.getRange(row, jsonColumn).getValue()
    : "";

  const project = parseProjectJSON(json);

  if (!project) {
    return {
      success: false,
      found: true,
      projectId,
      message: "Project JSON is empty or invalid."
    };
  }

  project.id = project.id || projectId;
  project.jobName = project.jobName || (jobColumn ? String(sheet.getRange(row, jobColumn).getValue() || "").trim() : "");
  project.address = project.address || (addressColumn ? String(sheet.getRange(row, addressColumn).getValue() || "").trim() : "");
  project.model = project.model || (modelColumn ? String(sheet.getRange(row, modelColumn).getValue() || "").trim() : "");
  project.lender = project.lender || (lenderColumn ? String(sheet.getRange(row, lenderColumn).getValue() || "").trim() : "");
  project.electrician = project.electrician || (electricianColumn ? String(sheet.getRange(row, electricianColumn).getValue() || "").trim() : "");

  return {
    success: true,
    found: true,
    projectId,
    project
  };

}

//----------------------------------
// Find Project Row By ID
//----------------------------------

function findProjectRowById(
  sheet,
  projectId
) {

  if (!projectId) return 0;

  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return 0;

  const { map } = ensureProjectHeaders_(sheet);
  const idColumn = projectColumn_(map, "ProjectID", "Project ID");

  if (!idColumn) return 0;

  const finder = sheet
    .getRange(2, idColumn, lastRow - 1, 1)
    .createTextFinder(projectId)
    .matchEntireCell(true);

  const cell = finder.findNext();

  return cell ? cell.getRow() : 0;

}

//----------------------------------
// Find Project Row By Details
//----------------------------------

function findProjectRowByDetails(
  sheet,
  jobName,
  address
) {

  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return 0;

  const { map } = ensureProjectHeaders_(sheet);
  const jobColumn = projectColumn_(map, "JobName", "Job Name");
  const addressColumn = projectColumn_(map, "Address");

  if (!jobColumn || !addressColumn) return 0;

  const lastColumn = Math.max(jobColumn, addressColumn);
  const values = sheet
    .getRange(2, 1, lastRow - 1, lastColumn)
    .getValues();

  for (let index = 0; index < values.length; index++) {
    const savedJobName = String(values[index][jobColumn - 1] || "").trim();
    const savedAddress = String(values[index][addressColumn - 1] || "").trim();

    if (savedJobName === jobName && savedAddress === address) {
      return index + 2;
    }
  }

  return 0;

}

//----------------------------------
// Create Project ID
//----------------------------------

function createProjectId(sheet) {

  const lastRow = sheet.getLastRow();

  if (lastRow < 2) {
    return "PJ000001";
  }

  const { map } = ensureProjectHeaders_(sheet);
  const idColumn = projectColumn_(map, "ProjectID", "Project ID");

  if (!idColumn) {
    return "PJ000001";
  }

  const projectIds = sheet
    .getRange(2, idColumn, lastRow - 1, 1)
    .getValues()
    .flat();

  let highestNumber = 0;

  projectIds.forEach(projectId => {
    const match = String(projectId)
      .trim()
      .match(/^PJ(\d+)$/i);

    if (!match) return;

    highestNumber = Math.max(
      highestNumber,
      Number(match[1])
    );
  });

  return "PJ" + String(highestNumber + 1).padStart(6, "0");

}

//----------------------------------
// Parse Project JSON
//----------------------------------

function parseProjectJSON(value) {

  if (!value) {

    return null;

  }

  if (
    typeof value === "object"
  ) {

    return value;

  }

  try {

    return JSON.parse(
      String(value)
    );

  }
  catch (err) {

    Logger.log(
      "Invalid Project JSON: " +
      err.message
    );

    return null;

  }

}

//----------------------------------
// Save Project BOM Safely
//----------------------------------

function saveProjectBOMSafe(

  projectId,

  jobName,

  address,

  materials

) {

  if (
    typeof saveProjectBOM !==
    "function"
  ) {

    Logger.log(
      "saveProjectBOM() not found. BOM save skipped."
    );

    return;

  }

  saveProjectBOM(

    projectId,

    jobName,

    address,

    materials

  );

}

function saveProjectUsedMaterialsSafe_(
  existingSpreadsheetId,
  jobName,
  address,
  model,
  materials
) {
  if (typeof saveProjectUsedMaterials !== "function") {
    Logger.log("saveProjectUsedMaterials() not found. Export skipped.");
    return { success: false, skipped: true };
  }

  try {
    return saveProjectUsedMaterials(
      existingSpreadsheetId,
      jobName,
      address,
      model,
      materials
    );
  }
  catch (err) {
    Logger.log("Used Materials export failed: " + err.message);
    return { success: false, message: err.message };
  }
}

//----------------------------------
// Delete Project BOM Safely
//----------------------------------

function deleteProjectBOMSafe(
  projectId
) {

  if (
    typeof deleteProjectBOM !==
    "function"
  ) {

    Logger.log(
      "deleteProjectBOM() not found. BOM deletion skipped."
    );

    return;

  }

  deleteProjectBOM(projectId);

}

//----------------------------------
// Get MML Version
//----------------------------------

function getMMLVersion() {

  const spreadsheet =
    getProjectSpreadsheet();

  const sheet = spreadsheet.getSheetByName(
    MML_VERSION_SHEET
  );

  if (!sheet) {

    throw new Error(
      "MML sheet not found."
    );

  }

  const lastRow = sheet.getLastRow();
  const lastColumn = sheet.getLastColumn();

  if (
    lastRow < 1 ||
    lastColumn < 1
  ) {

    return "mml-empty";

  }

  //----------------------------------
  // Build Stable Sheet Snapshot
  //----------------------------------

  const values = sheet
    .getRange(
      1,
      1,
      lastRow,
      lastColumn
    )
    .getDisplayValues();

  const snapshot = JSON.stringify({

    rows: lastRow,

    columns: lastColumn,

    values

  });

  //----------------------------------
  // SHA-256 Version Hash
  //----------------------------------

  const digest = Utilities.computeDigest(

    Utilities.DigestAlgorithm.SHA_256,

    snapshot,

    Utilities.Charset.UTF_8

  );

  return digest
    .map(byte =>

      (byte + 256)
        .toString(16)
        .slice(-2)

    )
    .join("");

}


//----------------------------------
// Material Image API Configuration
//----------------------------------

const CONFIG = {
  SPREADSHEET_ID:
    "1biSrfupGYl4aZInIMsu2BC-5bdjz2AOVcT-j03XMLjQ",

  SHEET_NAME: "MML",

  DRIVE_FOLDER_ID:
    "1YVAvxbqMbSMNyq3eW6Os9ScSAwy4OyTP",

  CATALOG_HEADER: "CatalogNumber",
  DRIVE_FILE_ID_HEADER: "DriveFileID",
  GOOGLE_URL_HEADER: "GOOGLE",

  WRITE_GOOGLE_URL: true,
  MAKE_FILES_PUBLIC: true,

  API_KEY: ""
};


//----------------------------------
// Upload Image and Update MML
//----------------------------------

function uploadMaterialImage(request) {
  validateConfiguration();

  const catalogNumbers = normalizeCatalogNumbers(request);
  const fileName = sanitizeFileName(request.fileName);
  const mimeType =
    String(request.mimeType || "").trim() || "application/octet-stream";
  const base64Data = normalizeBase64(request.base64);

  if (!catalogNumbers.length) {
    throw new Error("At least one catalog number is required.");
  }

  if (!fileName) {
    throw new Error("A valid file name is required.");
  }

  if (!base64Data) {
    throw new Error("Image data is missing.");
  }

  const lock = LockService.getScriptLock();
  let driveFile = null;

  lock.waitLock(30000);

  try {
    const spreadsheet = SpreadsheetApp.openById(
      CONFIG.SPREADSHEET_ID
    );

    const sheet = spreadsheet.getSheetByName(
      CONFIG.SHEET_NAME
    );

    if (!sheet) {
      throw new Error(
        'Sheet "' + CONFIG.SHEET_NAME + '" was not found.'
      );
    }

    const table = readMmlTable(sheet);

    const matchingRows = findCatalogRows(
      table,
      catalogNumbers
    );

    if (!matchingRows.length) {
      throw new Error(
        "No matching CatalogNumber rows were found in the MML."
      );
    }

    const bytes = Utilities.base64Decode(base64Data);
    const blob = Utilities.newBlob(bytes, mimeType, fileName);

    const folder = DriveApp.getFolderById(
      CONFIG.DRIVE_FOLDER_ID
    );

    // The image is uploaded only once, even when multiple catalog
    // variants are selected.
    driveFile = folder.createFile(blob);

    if (CONFIG.MAKE_FILES_PUBLIC) {
      try {
        driveFile.setSharing(
          DriveApp.Access.ANYONE_WITH_LINK,
          DriveApp.Permission.VIEW
        );
      } catch (sharingError) {
        // Keep the upload, but report the sharing restriction.
        console.warn(
          "Could not enable public link sharing: " +
          sharingError.message
        );
      }
    }

    const fileId = driveFile.getId();
    const fileUrl = driveFile.getUrl();

    updateMmlRows(
      sheet,
      table.headers,
      matchingRows,
      fileId,
      fileUrl
    );

    SpreadsheetApp.flush();

    return {
      success: true,
      message:
        "Uploaded one image and updated " +
        matchingRows.length +
        " MML row(s).",
      fileId: fileId,
      fileUrl: fileUrl,
      fileName: driveFile.getName(),
      updatedRows: matchingRows.length,
      updatedCatalogs: getUniqueCatalogs(matchingRows),
      missingCatalogs: findMissingCatalogs(
        catalogNumbers,
        matchingRows
      )
    };
  } catch (error) {
    // Prevent an orphaned Drive image when the sheet update fails.
    if (driveFile) {
      try {
        driveFile.setTrashed(true);
      } catch (cleanupError) {
        console.error(
          "Unable to trash failed upload: " +
          cleanupError.message
        );
      }
    }

    throw error;
  } finally {
    lock.releaseLock();
  }
}


//----------------------------------
// Read MML
//----------------------------------

function readMmlTable(sheet) {
  const lastRow = sheet.getLastRow();
  const lastColumn = sheet.getLastColumn();

  if (lastRow < 1 || lastColumn < 1) {
    throw new Error("The MML sheet is empty.");
  }

  const headers = sheet
    .getRange(1, 1, 1, lastColumn)
    .getDisplayValues()[0]
    .map(function (header) {
      return String(header).trim();
    });

  requireHeader(headers, CONFIG.CATALOG_HEADER);
  requireHeader(headers, CONFIG.DRIVE_FILE_ID_HEADER);

  if (CONFIG.WRITE_GOOGLE_URL) {
    requireHeader(headers, CONFIG.GOOGLE_URL_HEADER);
  }

  const values =
    lastRow > 1
      ? sheet
          .getRange(2, 1, lastRow - 1, lastColumn)
          .getDisplayValues()
      : [];

  return {
    headers: headers,
    values: values
  };
}


//----------------------------------
// Find Catalog Rows
//----------------------------------

function findCatalogRows(table, catalogNumbers) {
  const catalogColumn = table.headers.indexOf(
    CONFIG.CATALOG_HEADER
  );

  const requested = {};

  catalogNumbers.forEach(function (catalogNumber) {
    requested[normalizeCatalogKey(catalogNumber)] = true;
  });

  const matchingRows = [];

  table.values.forEach(function (row, index) {
    const catalogNumber = String(
      row[catalogColumn] || ""
    ).trim();

    if (
      catalogNumber &&
      requested[normalizeCatalogKey(catalogNumber)]
    ) {
      matchingRows.push({
        // Sheet data starts at row 2.
        rowNumber: index + 2,
        catalogNumber: catalogNumber
      });
    }
  });

  return matchingRows;
}


//----------------------------------
// Update MML Rows
//----------------------------------

function updateMmlRows(
  sheet,
  headers,
  matchingRows,
  fileId,
  fileUrl
) {
  const driveIdColumn =
    headers.indexOf(CONFIG.DRIVE_FILE_ID_HEADER) + 1;

  const googleUrlColumn =
    headers.indexOf(CONFIG.GOOGLE_URL_HEADER) + 1;

  matchingRows.forEach(function (match) {
    sheet
      .getRange(match.rowNumber, driveIdColumn)
      .setValue(fileId);

    if (CONFIG.WRITE_GOOGLE_URL) {
      sheet
        .getRange(match.rowNumber, googleUrlColumn)
        .setValue(fileUrl);
    }
  });
}


//----------------------------------
// Validation
//----------------------------------

function validateConfiguration() {
  const required = [
    ["SPREADSHEET_ID", CONFIG.SPREADSHEET_ID],
    ["SHEET_NAME", CONFIG.SHEET_NAME],
    ["DRIVE_FOLDER_ID", CONFIG.DRIVE_FOLDER_ID]
  ];

  required.forEach(function (entry) {
    const name = entry[0];
    const value = String(entry[1] || "").trim();

    if (!value || value.indexOf("PASTE_") === 0) {
      throw new Error(
        "MaterialImageApi configuration is missing " + name + "."
      );
    }
  });
}


function validateApiKey(request) {
  if (!CONFIG.API_KEY) {
    return;
  }

  if (String(request.apiKey || "") !== CONFIG.API_KEY) {
    throw new Error("Invalid API key.");
  }
}


function requireHeader(headers, headerName) {
  if (headers.indexOf(headerName) === -1) {
    throw new Error(
      'Required MML header "' + headerName + '" was not found.'
    );
  }
}


//----------------------------------
// Request Helpers
//----------------------------------

function normalizeCatalogNumbers(request) {
  let values =
    request.catalogNumbers ||
    request.catalogs ||
    request.catalogNumber ||
    [];

  if (!Array.isArray(values)) {
    values = [values];
  }

  const unique = {};

  values.forEach(function (value) {
    const catalogNumber = String(value || "").trim();

    if (catalogNumber) {
      unique[normalizeCatalogKey(catalogNumber)] =
        catalogNumber;
    }
  });

  return Object.keys(unique).map(function (key) {
    return unique[key];
  });
}


function normalizeCatalogKey(value) {
  return String(value || "").trim().toUpperCase();
}


function normalizeBase64(value) {
  let base64 = String(value || "").trim();

  // Also accepts complete data URLs.
  const marker = ";base64,";
  const markerIndex = base64.indexOf(marker);

  if (markerIndex !== -1) {
    base64 = base64.substring(
      markerIndex + marker.length
    );
  }

  return base64.replace(/\s/g, "");
}


function sanitizeFileName(value) {
  let name = String(value || "").trim();

  name = name
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, "_")
    .replace(/\s+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^\.+/, "");

  return name.substring(0, 200);
}


//----------------------------------
// Result Helpers
//----------------------------------

function getUniqueCatalogs(matchingRows) {
  const catalogs = {};

  matchingRows.forEach(function (match) {
    catalogs[match.catalogNumber] = true;
  });

  return Object.keys(catalogs);
}


function findMissingCatalogs(
  requestedCatalogs,
  matchingRows
) {
  const found = {};

  matchingRows.forEach(function (match) {
    found[normalizeCatalogKey(match.catalogNumber)] = true;
  });

  return requestedCatalogs.filter(function (catalogNumber) {
    return !found[normalizeCatalogKey(catalogNumber)];
  });
}
