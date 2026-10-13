//----------------------------------
// Per-project Used Materials export
//----------------------------------

function projectUsedMaterialsName_(jobName) {
  const cleanName = String(jobName || "Project")
    .replace(/[\\/:*?"<>|]/g, "-")
    .trim();

  return `${cleanName || "Project"} Used Materials`;
}

function getOrCreateProjectExportSheet_(spreadsheet, name) {
  let sheet = spreadsheet.getSheetByName(name);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(name);
  }

  sheet.getDataRange().breakApart();
  sheet.clear();
  sheet.clearFormats();

  return sheet;
}

function aggregateUsedMaterials_(materials) {
  const byCatalog = {};

  (Array.isArray(materials) ? materials : []).forEach(material => {
    const catalog = String(
      material?.CatalogNumber || material?.catalogNumber || ""
    ).trim();

    if (!catalog) return;

    const qty = Number(
      material?.Qty ?? material?.qty ?? material?.Quantity ?? 0
    ) || 0;

    if (!byCatalog[catalog]) {
      byCatalog[catalog] = {
        catalog,
        description: String(material?.Description || material?.description || "").trim(),
        supplier: String(material?.Supplier || material?.supplier || "").trim(),
        vendorCode: String(material?.VendorCode || material?.vendorCode || "").trim(),
        price: Number(material?.Price ?? material?.price ?? 0) || 0,
        qty: 0
      };
    }

    byCatalog[catalog].qty += qty;
  });

  return Object.values(byCatalog).sort((a, b) =>
    a.catalog.localeCompare(b.catalog)
  );
}

function saveProjectUsedMaterials(
  existingSpreadsheetId,
  jobName,
  address,
  model,
  materials
) {
  const name = projectUsedMaterialsName_(jobName);
  let spreadsheet = null;

  if (existingSpreadsheetId) {
    try {
      spreadsheet = SpreadsheetApp.openById(existingSpreadsheetId);
    }
    catch (err) {
      Logger.log("Used Materials export not found. A new one will be created: " + err.message);
    }
  }

  if (!spreadsheet) {
    spreadsheet = SpreadsheetApp.create(name);
  }

  spreadsheet.rename(name);

  const usedSheet = getOrCreateProjectExportSheet_(
    spreadsheet,
    "Used materials"
  );
  const sourceSheet = getOrCreateProjectExportSheet_(
    spreadsheet,
    "Material purchased list"
  );

  const defaultSheet = spreadsheet.getSheetByName("Sheet1");
  if (defaultSheet && defaultSheet.getSheetId() !== usedSheet.getSheetId()) {
    spreadsheet.deleteSheet(defaultSheet);
  }

  const rows = aggregateUsedMaterials_(materials);

  //----------------------------------
  // Used materials summary
  //----------------------------------

  usedSheet.getRange("A1:E1").merge();
  usedSheet.getRange("A1").setValue(
    `Project Template Name: ${String(model || "Panel Builder").trim() || "Panel Builder"}`
  );
  usedSheet.getRange("A2:E2").merge();
  usedSheet.getRange("A2").setValue(`Project Name: ${String(jobName || "").trim()}`);
  usedSheet.getRange("A3:E3").merge();
  usedSheet.getRange("A3").setValue(`Address: ${String(address || "").trim()}`);
  usedSheet.getRange("A5:E5").merge();
  usedSheet.getRange("A5").setValue("Used materials");

  const usedHeaders = [["Description", "Catalog Number", "Qty", "Unit Price", "Total"]];
  usedSheet.getRange(6, 1, 1, 5).setValues(usedHeaders);

  if (rows.length) {
    usedSheet.getRange(7, 1, rows.length, 5).setValues(
      rows.map(item => [
        item.description,
        item.catalog,
        item.qty,
        item.price,
        item.qty * item.price
      ])
    );
  }

  usedSheet.getRange("A1:E1").setBackground("#0f172a").setFontColor("#ffffff").setFontWeight("bold");
  usedSheet.getRange("A2:E3").setFontWeight("bold");
  usedSheet.getRange("A5:E5").setBackground("#102238").setFontColor("#bae6fd").setFontWeight("bold");
  usedSheet.getRange("A6:E6").setBackground("#1e3a5f").setFontColor("#ffffff").setFontWeight("bold");
  usedSheet.getRange("C7:C").setNumberFormat("#,##0.##");
  usedSheet.getRange("D7:E").setNumberFormat("$#,##0.00");
  usedSheet.setFrozenRows(6);
  usedSheet.setColumnWidths(1, 1, 420);
  usedSheet.setColumnWidths(2, 1, 140);
  usedSheet.setColumnWidths(3, 1, 80);
  usedSheet.setColumnWidths(4, 2, 100);

  //----------------------------------
  // Source / audit list
  //----------------------------------

  const sourceHeaders = [[
    "Supplier",
    "Catalog Number",
    "Vendor Code",
    "Description",
    "Unit Price",
    "Used",
    "QTY",
    "Total"
  ]];
  sourceSheet.getRange(1, 1, 1, 8).setValues(sourceHeaders);

  if (rows.length) {
    sourceSheet.getRange(2, 1, rows.length, 8).setValues(
      rows.map(item => [
        item.supplier,
        item.catalog,
        item.vendorCode,
        item.description,
        item.price,
        "Used",
        item.qty,
        item.qty * item.price
      ])
    );
  }

  sourceSheet.getRange("A1:H1").setBackground("#1e3a5f").setFontColor("#ffffff").setFontWeight("bold");
  sourceSheet.getRange("E2:E").setNumberFormat("$#,##0.00");
  sourceSheet.getRange("G2:G").setNumberFormat("#,##0.##");
  sourceSheet.getRange("H2:H").setNumberFormat("$#,##0.00");
  sourceSheet.setFrozenRows(1);
  sourceSheet.setColumnWidths(1, 1, 100);
  sourceSheet.setColumnWidths(2, 1, 140);
  sourceSheet.setColumnWidths(3, 1, 90);
  sourceSheet.setColumnWidths(4, 1, 420);
  sourceSheet.setColumnWidths(5, 4, 100);

  spreadsheet.setActiveSheet(usedSheet);
  SpreadsheetApp.flush();

  return {
    success: true,
    spreadsheetId: spreadsheet.getId(),
    spreadsheetUrl: spreadsheet.getUrl(),
    spreadsheetName: spreadsheet.getName(),
    materialCount: rows.length
  };
}
