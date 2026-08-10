const fs = require("fs");
const path = require("path");

const file = path.resolve(__dirname, "..", "apps-script", "ProjectApi.js");
let source = fs.readFileSync(file, "utf8").replace(/\r\n/g, "\n");

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function findFunctionStart(functionName) {
  const regex = new RegExp(
    `function\\s+${escapeRegExp(functionName)}\\s*\\(`,
    "m"
  );

  const match = regex.exec(source);

  if (!match) {
    throw new Error(`Unable to locate function: ${functionName}`);
  }

  return match.index;
}

function findSectionMarker(markerText, afterIndex) {
  const normalized = markerText.replace(/\r\n/g, "\n");
  const index = source.indexOf(normalized, afterIndex);

  if (index === -1) {
    throw new Error(`Unable to locate section marker: ${markerText}`);
  }

  return index;
}

function replaceFunctionSection(functionName, endMarker, replacement) {
  const start = findFunctionStart(functionName);
  const end = findSectionMarker(endMarker, start);

  source =
    source.slice(0, start) +
    replacement.trimEnd() +
    "\n\n" +
    source.slice(end);
}

replaceFunctionSection(
  "getProjectSheet",
  "//----------------------------------\n// Save Project",
  `function normalizeProjectHeader_(value) {

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

}`
);

replaceFunctionSection(
  "saveProject",
  "//----------------------------------\n// Get Projects",
  `function saveProject(request) {

  const start = Date.now();
  const sheet = getProjectSheet();
  const { headers, map } = ensureProjectHeaders_(sheet);

  const jobName = String(request.jobName || "").trim();
  const address = String(request.address || "").trim();
  const electrician = String(request.electrician || "").trim();
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
    lender,
    model,
    layout: Array.isArray(request.layout) ? request.layout : [],
    links: Array.isArray(request.links) ? request.links : [],
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

  Logger.log(
    "Project saved in " + (Date.now() - start) + " ms"
  );

  return {
    success: true,
    action: wasExisting ? "updated" : "created",
    projectId
  };

}`
);

replaceFunctionSection(
  "getProjects",
  "//----------------------------------\n// Load Project",
  `function getProjects() {

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

}`
);

replaceFunctionSection(
  "buildLoadedProjectResponse",
  "//----------------------------------\n// Find Project Row By ID",
  `function buildLoadedProjectResponse(
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

}`
);

replaceFunctionSection(
  "findProjectRowById",
  "//----------------------------------\n// Find Project Row By Details",
  `function findProjectRowById(
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

}`
);

replaceFunctionSection(
  "findProjectRowByDetails",
  "//----------------------------------\n// Create Project ID",
  `function findProjectRowByDetails(
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

}`
);

replaceFunctionSection(
  "createProjectId",
  "//----------------------------------\n// Parse Project JSON",
  `function createProjectId(sheet) {

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
      .match(/^PJ(\\d+)$/i);

    if (!match) return;

    highestNumber = Math.max(
      highestNumber,
      Number(match[1])
    );
  });

  return "PJ" + String(highestNumber + 1).padStart(6, "0");

}`
);

fs.writeFileSync(file, source, "utf8");
console.log("Patched:", file);
console.log("Project API is now header-aware for Model, Lender, and Electrician.");
