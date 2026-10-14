//----------------------------------
// Wire assignment configuration
//----------------------------------

const WIRE_ASSIGNMENT_SHEET = "WireAss";

function getWireAssignmentSheet() {

  const spreadsheet =
    typeof getProjectSpreadsheet === "function"
      ? getProjectSpreadsheet()
      : SpreadsheetApp.getActive();

  const sheet = spreadsheet.getSheetByName(WIRE_ASSIGNMENT_SHEET);

  if (!sheet) {
    throw new Error("WireAss sheet not found.");
  }

  return sheet;
}

function getWireAssignments() {

  const values = getWireAssignmentSheet().getDataRange().getValues();

  if (values.length < 2) return [];

  const headers = values.shift().map(header => String(header || "").trim());

  return values
    .map(row => headers.reduce((record, header, index) => {
      record[header] = typeof row[index] === "string" ? row[index].trim() : row[index];
      return record;
    }, {}))
    .filter(record => String(record["Panel Preset"] || "").trim());
}

function getWireAssignmentsVersion() {

  const sheet = getWireAssignmentSheet();
  const values = sheet.getDataRange().getDisplayValues();
  const digest = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    JSON.stringify(values),
    Utilities.Charset.UTF_8
  );

  return digest.map(byte => (byte + 256).toString(16).slice(-2)).join("");
}
