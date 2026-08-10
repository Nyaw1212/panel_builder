//----------------------------------
// Preset Configuration
//----------------------------------

const PRESET_SHEET = "PRESETS";

//----------------------------------
// Get Preset Sheet
//----------------------------------

function getPresetSheet() {

  const spreadsheet =
    typeof getProjectSpreadsheet === "function"
      ? getProjectSpreadsheet()
      : SpreadsheetApp.getActive();

  if (!spreadsheet) {
    throw new Error("Preset spreadsheet is unavailable.");
  }

  const sheet = spreadsheet.getSheetByName(PRESET_SHEET);

  if (!sheet) {
    throw new Error("PRESETS sheet not found.");
  }

  return sheet;
}

//----------------------------------
// Get Presets
//----------------------------------

function getPresets() {

  const sheet = getPresetSheet();

  const values = sheet.getDataRange().getValues();

  if (values.length < 2) {
    return [];
  }

  const headers = values.shift();

  return values.map(row => {

    const obj = {};

    headers.forEach((header, index) => {
      obj[String(header).trim()] = row[index];
    });

    return obj;

  });

}

//----------------------------------
// Get PRESETS Version
//----------------------------------

function getPresetsVersion() {

  const sheet = getPresetSheet();

  const lastRow = sheet.getLastRow();
  const lastColumn = sheet.getLastColumn();

  if (lastRow < 1 || lastColumn < 1) {
    return "presets-empty";
  }

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
