const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8").replace(/\r\n/g, "\n");
}

function write(rel, source) {
  fs.writeFileSync(path.join(root, rel), source, "utf8");
  console.log("Patched:", rel);
}

function replaceOnce(source, target, replacement, label) {
  if (!source.includes(target)) {
    throw new Error(`Unable to locate ${label}`);
  }
  return source.replace(target, replacement);
}

// ============================================================
// Save Project modal
// ============================================================
{
  const file = "js/ui/projectDialog.js";
  let source = read(file);

  if (!source.includes('id =\n        "projectStartDate"')) {
    source = replaceOnce(
      source,
      "//----------------------------------\n// Parse Pasted Project Details\n//----------------------------------",
      `//----------------------------------\n// Normalize Start Date\n//----------------------------------\n\nfunction normalizeProjectStartDate(value) {\n\n    const text = String(value || \"\").trim();\n\n    if (!text) return \"\";\n\n    if (/^\\d{4}-\\d{2}-\\d{2}$/.test(text)) {\n        return text;\n    }\n\n    const match = text.match(\n        /^(\\d{1,2})\\/(\\d{1,2})\\/(\\d{2}|\\d{4})$/\n    );\n\n    if (!match) return \"\";\n\n    const month = String(Number(match[1])).padStart(2, \"0\");\n    const day = String(Number(match[2])).padStart(2, \"0\");\n    let year = match[3];\n\n    if (year.length === 2) {\n        year = \"20\" + year;\n    }\n\n    return \`\${year}-\${month}-\${day}\`;\n\n}\n\n//----------------------------------\n// Parse Pasted Project Details\n//----------------------------------`,
      "project date helper"
    );

    source = replaceOnce(
      source,
      `    if (\n        !lender &&\n        values.length === 4\n    ) {\n\n        lender =\n            values[3] || \"\";\n\n    }\n\n    return {\n        jobName,\n        address,\n        electrician,\n        lender\n    };`,
      `    if (\n        !lender &&\n        values.length === 4\n    ) {\n\n        lender =\n            values[3] || \"\";\n\n    }\n\n    const startDate =\n        values\n            .map(normalizeProjectStartDate)\n            .find(Boolean) || \"\";\n\n    return {\n        jobName,\n        address,\n        electrician,\n        startDate,\n        lender\n    };`,
      "parsed project return"
    );

    source = replaceOnce(
      source,
      `    fields.electricianInput.value =\n        parsed.electrician || \"\";\n\n    fields.lenderInput.value =`,
      `    fields.electricianInput.value =\n        parsed.electrician || \"\";\n\n    fields.startDateInput.value =\n        parsed.startDate || \"\";\n\n    fields.lenderInput.value =`,
      "parsed start date application"
    );

    source = replaceOnce(
      source,
      `        document\n            .getElementById(\"projectElectrician\")\n            .value =\n            project.electrician || \"\";\n\n        document\n            .getElementById(\"projectLender\")`,
      `        document\n            .getElementById(\"projectElectrician\")\n            .value =\n            project.electrician || \"\";\n\n        document\n            .getElementById(\"projectStartDate\")\n            .value =\n            project.startDate || \"\";\n\n        document\n            .getElementById(\"projectLender\")`,
      "dialog reopen start date"
    );

    source = replaceOnce(
      source,
      `    styleProjectDialogInput(\n        electricianInput\n    );\n\n    const lenderLabel =`,
      `    styleProjectDialogInput(\n        electricianInput\n    );\n\n    const startDateLabel =\n        document.createElement(\"label\");\n\n    startDateLabel.textContent =\n        \"Start Date\";\n\n    styleProjectDialogLabel(\n        startDateLabel\n    );\n\n    const startDateInput =\n        document.createElement(\"input\");\n\n    startDateInput.id =\n        \"projectStartDate\";\n\n    startDateInput.type =\n        \"date\";\n\n    styleProjectDialogInput(\n        startDateInput\n    );\n\n    const lenderLabel =`,
      "start date modal input"
    );

    source = replaceOnce(
      source,
      `        electricianInput,\n        lenderInput,`,
      `        electricianInput,\n        startDateInput,\n        lenderInput,`,
      "start date field registration"
    );

    source = replaceOnce(
      source,
      `    electricianInput.value =\n        project.electrician || \"\";\n\n    lenderInput.value =`,
      `    electricianInput.value =\n        project.electrician || \"\";\n\n    startDateInput.value =\n        project.startDate || \"\";\n\n    lenderInput.value =`,
      "start date initial value"
    );

    source = replaceOnce(
      source,
      `            const lender =\n                lenderInput\n                    .value\n                    .trim();`,
      `            const startDate =\n                startDateInput\n                    .value\n                    .trim();\n\n            const lender =\n                lenderInput\n                    .value\n                    .trim();`,
      "start date save value"
    );

    source = replaceOnce(
      source,
      `                    electrician,\n                    lender,\n                    model`,
      `                    electrician,\n                    startDate,\n                    lender,\n                    model`,
      "start date project state save"
    );

    source = replaceOnce(
      source,
      `    card.appendChild(electricianLabel);\n    card.appendChild(electricianInput);\n    card.appendChild(lenderLabel);`,
      `    card.appendChild(electricianLabel);\n    card.appendChild(electricianInput);\n    card.appendChild(startDateLabel);\n    card.appendChild(startDateInput);\n    card.appendChild(lenderLabel);`,
      "start date modal placement"
    );

    source = source.replace(
      "Job Name / Address / Electrician / Lender",
      "Job Name / Address / Electrician / Start Date / Lender"
    );
  }

  write(file, source);
}

// ============================================================
// Apps Script project persistence
// ============================================================
{
  const file = "apps-script/ProjectApi.js";
  let source = read(file);

  if (!source.includes('"StartDate"')) {
    source = replaceOnce(
      source,
      `    \"Electrician\"\n  ];`,
      `    \"Electrician\",\n    \"StartDate\"\n  ];`,
      "PROJECTS StartDate header"
    );

    source = replaceOnce(
      source,
      `  const electrician = String(request.electrician || \"\").trim();\n  const lender =`,
      `  const electrician = String(request.electrician || \"\").trim();\n  const startDate = String(request.startDate || \"\").trim();\n  const lender =`,
      "API StartDate request"
    );

    source = replaceOnce(
      source,
      `    electrician,\n    lender,\n    model,`,
      `    electrician,\n    startDate,\n    lender,\n    model,`,
      "API project StartDate"
    );

    source = replaceOnce(
      source,
      `  setByHeader(electrician, \"Electrician\");`,
      `  setByHeader(electrician, \"Electrician\");\n  setByHeader(startDate, \"StartDate\", \"Start Date\");`,
      "API StartDate sheet save"
    );

    source = replaceOnce(
      source,
      `  const electricianColumn = projectColumn_(map, \"Electrician\");\n\n  const values =`,
      `  const electricianColumn = projectColumn_(map, \"Electrician\");\n  const startDateColumn = projectColumn_(map, \"StartDate\", \"Start Date\");\n\n  const values =`,
      "getProjects StartDate column"
    );

    source = replaceOnce(
      source,
      `        project.electrician = project.electrician || (electricianColumn ? String(row[electricianColumn - 1] || \"\").trim() : \"\");\n      }`,
      `        project.electrician = project.electrician || (electricianColumn ? String(row[electricianColumn - 1] || \"\").trim() : \"\");\n        project.startDate = project.startDate || (startDateColumn ? String(row[startDateColumn - 1] || \"\").trim() : \"\");\n      }`,
      "getProjects StartDate fallback"
    );

    source = replaceOnce(
      source,
      `        electrician: electricianColumn ? String(row[electricianColumn - 1] || \"\") : \"\",\n        created:`,
      `        electrician: electricianColumn ? String(row[electricianColumn - 1] || \"\") : \"\",\n        startDate: startDateColumn ? String(row[startDateColumn - 1] || \"\") : \"\",\n        created:`,
      "getProjects StartDate response"
    );

    source = replaceOnce(
      source,
      `  const electricianColumn = projectColumn_(map, \"Electrician\");\n\n  const projectId =`,
      `  const electricianColumn = projectColumn_(map, \"Electrician\");\n  const startDateColumn = projectColumn_(map, \"StartDate\", \"Start Date\");\n\n  const projectId =`,
      "load response StartDate column"
    );

    source = replaceOnce(
      source,
      `  project.electrician = project.electrician || (electricianColumn ? String(sheet.getRange(row, electricianColumn).getValue() || \"\").trim() : \"\");`,
      `  project.electrician = project.electrician || (electricianColumn ? String(sheet.getRange(row, electricianColumn).getValue() || \"\").trim() : \"\");\n  project.startDate = project.startDate || (startDateColumn ? String(sheet.getRange(row, startDateColumn).getValue() || \"\").trim() : \"\");`,
      "load response StartDate value"
    );
  }

  write(file, source);
}

// ============================================================
// PROJECT_BOM StartDate
// ============================================================
{
  const file = "apps-script/ProjectBOM.js";
  let source = read(file);

  if (!source.includes("projectMeta.startDate")) {
    source = replaceOnce(
      source,
      `function setProjectBOMValue(row, map, names, value) {\n  const column = getProjectBOMColumn(map, names);\n\n  if (column !== undefined) {\n    row[column] = value;\n  }\n}\n`,
      `function setProjectBOMValue(row, map, names, value) {\n  const column = getProjectBOMColumn(map, names);\n\n  if (column !== undefined) {\n    row[column] = value;\n  }\n}\n\nfunction ensureProjectBOMHeader_(sheet, headerName) {\n  const { headers, map } = getProjectBOMHeaderMap(sheet);\n  const key = normalizeProjectBOMHeader(headerName);\n\n  if (map[key] !== undefined) {\n    return;\n  }\n\n  sheet\n    .getRange(1, headers.length + 1)\n    .setValue(headerName);\n}\n`,
      "PROJECT_BOM header helper"
    );

    source = replaceOnce(
      source,
      `  const empty = {\n    model: \"\",\n    lender: \"\",\n    electrician: \"\"\n  };`,
      `  const empty = {\n    model: \"\",\n    lender: \"\",\n    electrician: \"\",\n    startDate: \"\"\n  };`,
      "PROJECT_BOM empty metadata"
    );

    source = replaceOnce(
      source,
      `  let electrician = valueFor(\"electrician\");`,
      `  let electrician = valueFor(\"electrician\");\n  let startDate = valueFor(\"startdate\");`,
      "PROJECT_BOM StartDate metadata"
    );

    source = replaceOnce(
      source,
      `  if (!model || !lender || !electrician) {`,
      `  if (!model || !lender || !electrician || !startDate) {`,
      "PROJECT_BOM metadata fallback condition"
    );

    source = replaceOnce(
      source,
      `        electrician = electrician || String(project.electrician || \"\").trim();`,
      `        electrician = electrician || String(project.electrician || \"\").trim();\n        startDate = startDate || String(project.startDate || \"\").trim();`,
      "PROJECT_BOM JSON StartDate fallback"
    );

    source = replaceOnce(
      source,
      `    electrician\n  };`,
      `    electrician,\n    startDate\n  };`,
      "PROJECT_BOM StartDate metadata return"
    );

    source = replaceOnce(
      source,
      `  if (!sheet) {\n    throw new Error('Sheet \"PROJECT_BOM\" was not found.');\n  }\n\n  const normalizedProjectId =`,
      `  if (!sheet) {\n    throw new Error('Sheet \"PROJECT_BOM\" was not found.');\n  }\n\n  ensureProjectBOMHeader_(sheet, \"StartDate\");\n\n  const normalizedProjectId =`,
      "PROJECT_BOM ensure StartDate header"
    );

    source = replaceOnce(
      source,
      `    setProjectBOMValue(\n      row,\n      map,\n      [\"Electrician\"],\n      projectMeta.electrician\n    );`,
      `    setProjectBOMValue(\n      row,\n      map,\n      [\"Electrician\"],\n      projectMeta.electrician\n    );\n\n    setProjectBOMValue(\n      row,\n      map,\n      [\"StartDate\", \"Start Date\"],\n      projectMeta.startDate\n    );`,
      "PROJECT_BOM StartDate row value"
    );
  }

  write(file, source);
}

console.log("Start Date support added end-to-end.");
console.log("Storage format: YYYY-MM-DD");
