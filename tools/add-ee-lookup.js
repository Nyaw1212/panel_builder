const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const file = path.join(root, "apps-script", "ProjectBOM.js");

let source = fs.readFileSync(file, "utf8").replace(/\r\n/g, "\n");

function replaceOnce(target, replacement, label) {
  if (!source.includes(target)) {
    throw new Error(`Unable to locate ${label}`);
  }
  source = source.replace(target, replacement);
}

if (!source.includes("function getElectricianEELink_")) {
  replaceOnce(
    "//----------------------------------\n// Save Project BOM\n//----------------------------------",
    `//----------------------------------\n// Electrician EE Lookup\n//----------------------------------\n\nfunction normalizeElectricianEEName_(value) {\n  return String(value || \"\")\n    .trim()\n    .toUpperCase()\n    .replace(/\\s+/g, \" \" );\n}\n\nfunction getElectricianEELink_(electrician) {\n  const normalizedName = normalizeElectricianEEName_(electrician);\n\n  if (!normalizedName) {\n    return \"\";\n  }\n\n  const spreadsheet = getProjectSpreadsheet();\n  const sheet = spreadsheet.getSheetByName(\"EE\");\n\n  if (!sheet || sheet.getLastRow() < 1) {\n    return \"\";\n  }\n\n  const values = sheet\n    .getRange(1, 1, sheet.getLastRow(), 2)\n    .getDisplayValues();\n\n  for (let index = 0; index < values.length; index++) {\n    const savedName = normalizeElectricianEEName_(values[index][0]);\n\n    if (savedName === normalizedName) {\n      return String(values[index][1] || \"\").trim();\n    }\n  }\n\n  return \"\";\n}\n\n//----------------------------------\n// Save Project BOM\n//----------------------------------`,
    "Save Project BOM marker"
  );

  replaceOnce(
    "  const { headers, map } = getProjectBOMHeaderMap(sheet);\n  const projectMeta = getProjectBOMProjectMeta_(normalizedProjectId);",
    "  const { headers, map } = getProjectBOMHeaderMap(sheet);\n  const projectMeta = getProjectBOMProjectMeta_(normalizedProjectId);\n  const eeLink = getElectricianEELink_(projectMeta.electrician);",
    "PROJECT_BOM project metadata block"
  );

  replaceOnce(
    `    setProjectBOMValue(\n      row,\n      map,\n      [\"Electrician\"],\n      projectMeta.electrician\n    );`,
    `    setProjectBOMValue(\n      row,\n      map,\n      [\"Electrician\"],\n      projectMeta.electrician\n    );\n\n    setProjectBOMValue(\n      row,\n      map,\n      [\"EE\"],\n      eeLink\n    );`,
    "Electrician BOM row value"
  );
}

fs.writeFileSync(file, source, "utf8");

console.log("Patched:", file);
console.log("PROJECT_BOM EE lookup enabled.");
console.log("EE!A:A = electrician name, EE!B:B = value written to PROJECT_BOM.EE");
