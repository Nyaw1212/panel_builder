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

// Resolve export prices from the live MML sheet at report generation time.
// Catalog numbers are treated as text to preserve leading zeroes.
function getUsedMaterialsMmlPrices_() {
  const sheet = getProjectSpreadsheet().getSheetByName("MML");
  if (!sheet) throw new Error("MML sheet not found; Used Materials prices cannot be resolved.");
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) throw new Error("MML has no material rows.");
  const norm = value => String(value == null ? "" : value).trim().toLowerCase().replace(/[^a-z0-9]/g, "");
  const headers = data[0].map(norm);
  const col = (...names) => names.map(name => headers.indexOf(norm(name))).find(index => index >= 0) ?? -1;
  const catalogCol = col("CatalogNumber", "Catalog Number");
  const unitCol = col("UnitPrice", "Unit Price", "Price");
  const packageCol = col("PackagePrice", "Package Price");
  const quantityCol = col("PackageQuantity", "Package Quantity", "PackQty", "Pack Qty");
  if (catalogCol < 0) throw new Error("MML is missing CatalogNumber.");
  if (unitCol < 0 && (packageCol < 0 || quantityCol < 0)) {
    throw new Error("MML requires UnitPrice/Price or PackagePrice and PackageQuantity.");
  }
  const money = value => {
    if (typeof value === "number") return Number.isFinite(value) ? value : null;
    const cleaned = String(value == null ? "" : value).replace(/[$,\s]/g, "");
    if (!cleaned) return null;
    const number = Number(cleaned);
    return Number.isFinite(number) ? number : null;
  };
  const lookup = new Map();
  data.slice(1).forEach(row => {
    const catalog = String(row[catalogCol] == null ? "" : row[catalogCol]).trim().toUpperCase();
    if (!catalog) return;
    let price = unitCol >= 0 ? money(row[unitCol]) : null;
    if (price === null && packageCol >= 0 && quantityCol >= 0) {
      const packagePrice = money(row[packageCol]);
      const packageQty = money(row[quantityCol]);
      if (packagePrice !== null && packageQty > 0) price = packagePrice / packageQty;
    }
    if (price !== null) lookup.set(catalog, price);
  });
  return lookup;
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
      inventoryCategory: String(
        material?.InventoryCategory || material?.inventoryCategory || ""
      ).trim().toUpperCase(),
        price: null,
        qty: 0
      };
    }

    byCatalog[catalog].qty += qty;
  });

  const categoryOrder = { BOS: 0, VAN: 1 };

  return Object.values(byCatalog).sort((a, b) => {
    const categoryDifference =
      (categoryOrder[a.inventoryCategory] ?? 2) -
      (categoryOrder[b.inventoryCategory] ?? 2);

    return categoryDifference || a.catalog.localeCompare(b.catalog);
  });
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
  const mmlPrices = getUsedMaterialsMmlPrices_();
  rows.forEach(item => {
    item.price = mmlPrices.has(item.catalog.toUpperCase())
      ? mmlPrices.get(item.catalog.toUpperCase())
      : null;
  });
  const missingPrices = rows.filter(item => item.price === null).map(item => item.catalog);
  if (missingPrices.length) {
    Logger.log("MML prices missing for catalog numbers: " + missingPrices.join(", "));
  }

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

  let outputRow = 7;

  if (rows.length) {
    usedSheet.getRange(outputRow, 1, rows.length, 5).setValues(
      rows.map(item => [
        item.description,
        item.catalog,
        item.qty,
        item.price === null ? "" : item.price,
        item.price === null ? "" : item.qty * item.price
      ])
    );
    outputRow += rows.length;
  }

  usedSheet.getRange(outputRow, 4).setValue("Grand Total");
  const grandTotalCell = usedSheet.getRange(outputRow, 5);

  if (outputRow > 7) {
    grandTotalCell.setFormula(`=SUM(E7:E${outputRow - 1})`);
  }
  else {
    grandTotalCell.setValue(0);
  }
  usedSheet.getRange(outputRow, 4, 1, 2)
    .setBackground("#b7b7b7")
    .setFontColor("#000000")
    .setFontWeight("bold");

  usedSheet.getRange("A1:E1")
    .setBackground("#999999")
    .setFontWeight("bold")
    .setHorizontalAlignment("center");
  usedSheet.getRange("A2:E3")
    .setFontWeight("bold")
    .setHorizontalAlignment("center");
  usedSheet.getRange("A5:E5")
    .setBackground("#999999")
    .setFontWeight("bold")
    .setHorizontalAlignment("center");
  usedSheet.getRange("A6:E6")
    .setBackground("#b7b7b7")
    .setFontColor("#000000")
    .setFontWeight("bold")
    .setHorizontalAlignment("center");
  if (rows.length) {
    usedSheet.getRange(7, 1, rows.length, 5)
      .setHorizontalAlignment("center");
  }
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
        item.price === null ? "" : item.price,
        "Used",
        item.qty,
        item.price === null ? "" : item.qty * item.price
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
