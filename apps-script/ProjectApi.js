//----------------------------------
// Project API Configuration
//----------------------------------

const PROJECT_SHEET = "PROJECTS";
const MML_VERSION_SHEET = "MML";

const PROJECT_SPREADSHEET_ID =
  "1biSrfupGYl4aZInIMsu2BC-5bdjz2AOVcT-j03XMLjQ";

//----------------------------------
// doGet
//----------------------------------

function doGet(e) {
  const view = String(e?.parameter?.view || "")
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
    if (!e || !e.postData || !e.postData.contents) {
      return jsonOutput({
        success: false,
        message: "Missing POST request body."
      });
    }

    const request = JSON.parse(e.postData.contents);
    const action = String(request.action || "").trim();

    if (!action) {
      return jsonOutput({
        success: false,
        message: "Missing API action."
      });
    }

    switch (action) {
      case "getMML":
        return jsonOutput({
          success: true,
          mml: getMML(),
          version: getMMLVersion()
        });

      case "getMMLVersion":
        return jsonOutput({
          success: true,
          version: getMMLVersion()
        });

      case "getPresets":
        return jsonOutput({
          success: true,
          presets: getPresets(),
          version: getPresetsVersion()
        });

      case "getPresetsVersion":
        return jsonOutput({
          success: true,
          version: getPresetsVersion()
        });

      case "saveProject":
        return jsonOutput(saveProject(request));

      case "loadProject":
        return jsonOutput(loadProject(request));

      case "loadProjectById":
        return jsonOutput(loadProjectById(request));

      case "getProjects":
        return jsonOutput({
          success: true,
          projects: getProjects()
        });

      case "deleteProject":
        return jsonOutput(deleteProject(request));

      case "health":
        return jsonOutput({
          success: true,
          service: "PanelBuilderApi"
        });

      case "uploadMaterialImage":
        validateApiKey(request);
        return jsonOutput(uploadMaterialImage(request));

      default:
        return jsonOutput({
          success: false,
          message: "Unknown Action: " + action
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
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

//----------------------------------
// Spreadsheet
//----------------------------------

function getProjectSpreadsheet() {
  if (PROJECT_SPREADSHEET_ID) {
    return SpreadsheetApp.openById(PROJECT_SPREADSHEET_ID);
  }

  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();

  if (!spreadsheet) {
    throw new Error(
      "No active spreadsheet. Add the spreadsheet ID to PROJECT_SPREADSHEET_ID."
    );
  }

  return spreadsheet;
}

//----------------------------------
// Project Sheet Headers
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
    "JSONFileID",
    "Model",
    "Lender",
    "Electrician",
    "StartDate"
  ];

  const lastColumn = Math.max(sheet.getLastColumn(), 1);

  let headers = sheet
    .getRange(1, 1, 1, lastColumn)
    .getDisplayValues()[0]
    .map(value => String(value || "").trim());

  if (headers.every(value => !value)) {
    headers = [];
  }

  const existing = new Set(headers.map(normalizeProjectHeader_));
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

function getStoredProjectFromRow_(rowValues, map) {
  const jsonFileColumn = projectColumn_(
    map,
    "JSONFileID",
    "JSON File ID"
  );

  const jsonColumn = projectColumn_(
    map,
    "JSON",
    "Project JSON"
  );

  if (jsonFileColumn) {
    const fileId = String(rowValues[jsonFileColumn - 1] || "").trim();

    if (fileId && typeof readProjectJsonFile_ === "function") {
      const project = readProjectJsonFile_(fileId);
      if (project) return project;
    }
  }

  return jsonColumn
    ? parseProjectJSON(rowValues[jsonColumn - 1])
    : null;
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
  const startDate = String(request.startDate || "").trim();
  const lender = String(request.lender || "").trim();
  const model = String(request.model || "").trim();

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
    startDate,
    lender,
    model,
    layout: Array.isArray(request.layout) ? request.layout : [],
    links: Array.isArray(request.links) ? request.links : [],
    materialSummary,
    bos,
    van,
    summary,
    savedAt: request.savedAt || Date.now()
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
  const jsonFileColumn = projectColumn_(map, "JSONFileID", "JSON File ID");

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

  const existingJsonFileId =
    jsonFileColumn
      ? String(existingRow[jsonFileColumn - 1] || "").trim()
      : "";

  if (typeof saveProjectJsonFile_ !== "function") {
    throw new Error(
      "ProjectStorage.js is missing. Unable to save project JSON safely."
    );
  }

  const jsonFileId = saveProjectJsonFile_(
    projectId,
    project,
    existingJsonFileId
  );

  setByHeader(projectId, "ProjectID", "Project ID");
  setByHeader(jobName, "JobName", "Job Name");
  setByHeader(address, "Address");
  setByHeader(created, "Created");
  setByHeader(now, "Modified");

  // Full project JSON now lives in Drive. Keep the legacy cell empty so
  // large projects never hit the 50,000-character Google Sheets limit.
  setByHeader("", "JSON", "Project JSON");
  setByHeader(jsonFileId, "JSONFileID", "JSON File ID");
  setByHeader(model, "Model");
  setByHeader(lender, "Lender");
  setByHeader(electrician, "Electrician");
  setByHeader(startDate, "StartDate", "Start Date");

  sheet
    .getRange(row, 1, 1, output.length)
    .setValues([output]);

  saveProjectBOMSafe(
    projectId,
    jobName,
    address,
    materials
  );

  Logger.log(
    "Project saved in " + (Date.now() - start) + " ms"
  );

  return {
    success: true,
    action: wasExisting ? "updated" : "created",
    projectId,
    jsonFileId
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
  const modelColumn = projectColumn_(map, "Model");
  const lenderColumn = projectColumn_(map, "Lender");
  const electricianColumn = projectColumn_(map, "Electrician");
  const startDateColumn = projectColumn_(map, "StartDate", "Start Date");
  const jsonFileColumn = projectColumn_(map, "JSONFileID", "JSON File ID");

  const values = sheet
    .getRange(2, 1, lastRow - 1, headers.length)
    .getValues();

  return values
    .filter(row => idColumn && row[idColumn - 1])
    .map(row => {
      const project = getStoredProjectFromRow_(row, map);

      if (project) {
        project.model = project.model ||
          (modelColumn ? String(row[modelColumn - 1] || "").trim() : "");
        project.lender = project.lender ||
          (lenderColumn ? String(row[lenderColumn - 1] || "").trim() : "");
        project.electrician = project.electrician ||
          (electricianColumn ? String(row[electricianColumn - 1] || "").trim() : "");
        project.startDate = project.startDate ||
          (startDateColumn ? String(row[startDateColumn - 1] || "").trim() : "");
      }

      return {
        projectId: String(row[idColumn - 1] || ""),
        jobName: jobColumn ? String(row[jobColumn - 1] || "") : "",
        address: addressColumn ? String(row[addressColumn - 1] || "") : "",
        model: modelColumn ? String(row[modelColumn - 1] || "") : "",
        lender: lenderColumn ? String(row[lenderColumn - 1] || "") : "",
        electrician: electricianColumn ? String(row[electricianColumn - 1] || "") : "",
        startDate: startDateColumn ? String(row[startDateColumn - 1] || "") : "",
        jsonFileId: jsonFileColumn ? String(row[jsonFileColumn - 1] || "") : "",
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
  const jobName = String(request.jobName || "").trim();
  const address = String(request.address || "").trim();

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

  return buildLoadedProjectResponse(sheet, row);
}

//----------------------------------
// Load Project By ID
//----------------------------------

function loadProjectById(request) {
  const sheet = getProjectSheet();
  const projectId = String(
    request.projectId || request.id || ""
  ).trim();

  if (!projectId) {
    return {
      success: false,
      found: false,
      message: "Project ID is required."
    };
  }

  const row = findProjectRowById(sheet, projectId);

  if (!row) {
    return {
      success: true,
      found: false
    };
  }

  return buildLoadedProjectResponse(sheet, row);
}

//----------------------------------
// Delete Project
//----------------------------------

function deleteProject(request) {
  const sheet = getProjectSheet();
  const projectId = String(
    request.projectId || request.id || ""
  ).trim();

  if (!projectId) {
    return {
      success: false,
      message: "Project ID is required."
    };
  }

  const row = findProjectRowById(sheet, projectId);

  if (!row) {
    return {
      success: true,
      deleted: false,
      message: "Project not found."
    };
  }

  const { map } = ensureProjectHeaders_(sheet);
  const jsonFileColumn = projectColumn_(map, "JSONFileID", "JSON File ID");
  const jsonFileId = jsonFileColumn
    ? String(sheet.getRange(row, jsonFileColumn).getValue() || "").trim()
    : "";

  sheet.deleteRow(row);
  deleteProjectBOMSafe(projectId);

  if (jsonFileId && typeof deleteProjectJsonFile_ === "function") {
    deleteProjectJsonFile_(jsonFileId);
  }

  return {
    success: true,
    deleted: true,
    projectId
  };
}

//----------------------------------
// Build Loaded Project Response
//----------------------------------

function buildLoadedProjectResponse(sheet, row) {
  const { headers, map } = ensureProjectHeaders_(sheet);

  const idColumn = projectColumn_(map, "ProjectID", "Project ID");
  const jobColumn = projectColumn_(map, "JobName", "Job Name");
  const addressColumn = projectColumn_(map, "Address");
  const modelColumn = projectColumn_(map, "Model");
  const lenderColumn = projectColumn_(map, "Lender");
  const electricianColumn = projectColumn_(map, "Electrician");
  const startDateColumn = projectColumn_(map, "StartDate", "Start Date");

  const rowValues = sheet
    .getRange(row, 1, 1, headers.length)
    .getValues()[0];

  const projectId = idColumn
    ? String(rowValues[idColumn - 1] || "").trim()
    : "";

  const project = getStoredProjectFromRow_(rowValues, map);

  if (!project) {
    return {
      success: false,
      found: true,
      projectId,
      message: "Project JSON is empty, invalid, or unavailable."
    };
  }

  project.id = project.id || projectId;
  project.jobName = project.jobName ||
    (jobColumn ? String(rowValues[jobColumn - 1] || "").trim() : "");
  project.address = project.address ||
    (addressColumn ? String(rowValues[addressColumn - 1] || "").trim() : "");
  project.model = project.model ||
    (modelColumn ? String(rowValues[modelColumn - 1] || "").trim() : "");
  project.lender = project.lender ||
    (lenderColumn ? String(rowValues[lenderColumn - 1] || "").trim() : "");
  project.electrician = project.electrician ||
    (electricianColumn ? String(rowValues[electricianColumn - 1] || "").trim() : "");
  project.startDate = project.startDate ||
    (startDateColumn ? String(rowValues[startDateColumn - 1] || "").trim() : "");

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

function findProjectRowById(sheet, projectId) {
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

function findProjectRowByDetails(sheet, jobName, address) {
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

  if (typeof value === "object") {
    return value;
  }

  try {
    return JSON.parse(String(value));
  }
  catch (err) {
    Logger.log("Invalid Project JSON: " + err.message);
    return null;
  }
}

//----------------------------------
// BOM Safe Wrappers
//----------------------------------

function saveProjectBOMSafe(projectId, jobName, address, materials) {
  if (typeof saveProjectBOM !== "function") {
    Logger.log("saveProjectBOM() not found. BOM save skipped.");
    return;
  }

  saveProjectBOM(
    projectId,
    jobName,
    address,
    materials
  );
}

function deleteProjectBOMSafe(projectId) {
  if (typeof deleteProjectBOM !== "function") {
    Logger.log("deleteProjectBOM() not found. BOM deletion skipped.");
    return;
  }

  deleteProjectBOM(projectId);
}

//----------------------------------
// Get MML Version
//----------------------------------

function getMMLVersion() {
  const spreadsheet = getProjectSpreadsheet();
  const sheet = spreadsheet.getSheetByName(MML_VERSION_SHEET);

  if (!sheet) {
    throw new Error("MML sheet not found.");
  }

  const lastRow = sheet.getLastRow();
  const lastColumn = sheet.getLastColumn();

  if (lastRow < 1 || lastColumn < 1) {
    return "mml-empty";
  }

  const values = sheet
    .getRange(1, 1, lastRow, lastColumn)
    .getDisplayValues();

  const snapshot = JSON.stringify({
    rows: lastRow,
    columns: lastColumn,
    values
  });

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

    driveFile = folder.createFile(blob);

    if (CONFIG.MAKE_FILES_PUBLIC) {
      try {
        driveFile.setSharing(
          DriveApp.Access.ANYONE_WITH_LINK,
          DriveApp.Permission.VIEW
        );
      }
      catch (sharingError) {
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
      fileId,
      fileUrl,
      fileName: driveFile.getName(),
      updatedRows: matchingRows.length,
      updatedCatalogs: getUniqueCatalogs(matchingRows),
      missingCatalogs: findMissingCatalogs(
        catalogNumbers,
        matchingRows
      )
    };
  }
  catch (error) {
    if (driveFile) {
      try {
        driveFile.setTrashed(true);
      }
      catch (cleanupError) {
        console.error(
          "Unable to trash failed upload: " +
          cleanupError.message
        );
      }
    }

    throw error;
  }
  finally {
    lock.releaseLock();
  }
}

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
    headers,
    values
  };
}

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
        rowNumber: index + 2,
        catalogNumber
      });
    }
  });

  return matchingRows;
}

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
      unique[normalizeCatalogKey(catalogNumber)] = catalogNumber;
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

function getUniqueCatalogs(matchingRows) {
  const catalogs = {};

  matchingRows.forEach(function (match) {
    catalogs[match.catalogNumber] = true;
  });

  return Object.keys(catalogs);
}

function findMissingCatalogs(requestedCatalogs, matchingRows) {
  const found = {};

  matchingRows.forEach(function (match) {
    found[normalizeCatalogKey(match.catalogNumber)] = true;
  });

  return requestedCatalogs.filter(function (catalogNumber) {
    return !found[normalizeCatalogKey(catalogNumber)];
  });
}
