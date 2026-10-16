//----------------------------------
// Project History Helper
//----------------------------------

function resetProjectHistory(
    label
) {

    if (
        !window.HistoryManagerV2 ||
        typeof window
            .HistoryManagerV2
            .reset !==
            "function"
    ) {

        return false;

    }

    window
        .HistoryManagerV2
        .reset(
            label
        );

    return true;

}

//----------------------------------
// Finalize Loaded Project History
//----------------------------------

function finalizeLoadedProjectHistory() {

    /*
     * Call this only AFTER the loaded
     * project has been deserialized into
     * the canvas, layout, links, and UI.
     */

    return resetProjectHistory(
        "Project loaded"
    );

}

//----------------------------------
// Build Project
//----------------------------------

function buildProject() {

    const project =
        getProjectState();

    return {

        id:
            project.id,

        version:
            project.version,

        jobName:
            project.jobName,

        address:
            project.address,

        layout:
            getLayout(),

        links:
            getLinks(),

        runs:
            typeof serializeRuns === "function"
                ? serializeRuns()
                : [],

        gutters:
            typeof serializeGutters === "function"
                ? serializeGutters()
                : []

    };

}

//----------------------------------
// Save Current Project
//----------------------------------

async function saveCurrentProject(options = {}) {

    const saveAsNew = options.saveAsNew === true;
    const previousProjectState = saveAsNew
        ? structuredClone(getProjectState())
        : null;

    // Clear the identity before serializing. This makes Save as New work
    // safely with the currently deployed API as well as with the forceNew
    // backend flag: the saved copy can never update the opened project ID.
    if (saveAsNew) {
        setProjectState({
            ...previousProjectState,
            id: "",
            usedMaterialsSpreadsheetId: "",
            usedMaterialsSpreadsheetUrl: ""
        });
    }

    // Open the tab while the Save click still has browser user activation.
    // Navigating a tab after the async request alone can be blocked as a popup.
    let usedMaterialsWindow = null;

    if (
        typeof window !== "undefined" &&
        typeof window.open === "function"
    ) {

        usedMaterialsWindow =
            window.open(
                "",
                "_blank"
            );

    }

    console.time(
        "Build Project"
    );

    const project =
        buildProject();

    console.timeEnd(
        "Build Project"
    );

    console.time(
        "Save API"
    );

    const result =
        await saveProject(
            project,
            { forceNew: saveAsNew }
        );

    console.timeEnd(
        "Save API"
    );

    console.log(
        "Project Saved",
        result
    );

    if (!result?.success && previousProjectState) {
        setProjectState(previousProjectState);
    }

    if (
        result?.success &&
        result.projectId
    ) {

        setProjectId(
            result.projectId
        );

        if (result.usedMaterials?.success) {
            const state = getProjectState();
            state.usedMaterialsSpreadsheetId =
                String(result.usedMaterials.spreadsheetId || "");
            state.usedMaterialsSpreadsheetUrl =
                String(result.usedMaterials.spreadsheetUrl || "");

            if (
                usedMaterialsWindow &&
                state.usedMaterialsSpreadsheetUrl
            ) {

                usedMaterialsWindow.location.replace(
                    state.usedMaterialsSpreadsheetUrl
                );

            }
            else if (usedMaterialsWindow) {

                usedMaterialsWindow.close();

            }
        }
        else if (usedMaterialsWindow) {

            usedMaterialsWindow.close();

        }

        //----------------------------------
        // Refresh Project Cache
        //----------------------------------

        if (
            typeof invalidateProjectCache ===
            "function"
        ) {

            invalidateProjectCache();

        }

    }
    else if (usedMaterialsWindow) {

        usedMaterialsWindow.close();

    }

    /*
     * Saving does not change the project,
     * so no history entry is created.
     */

    return result;

}

//----------------------------------
// Download Used Materials XLS
//----------------------------------

function downloadUsedMaterialsXls() {

    const materials =
        typeof serializeMaterialSummary === "function"
            ? serializeMaterialSummary()
            : [];

    if (!materials.length) {
        return {
            success: false,
            message: "There are no BOS or VAN materials to export."
        };
    }

    const project = getProjectState();
    const projectName = String(
        project.jobName || project.model || "Panel Builder"
    ).trim();
    const escapeXml = value => String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&apos;");
    const numberCell = value =>
        `<Cell><Data ss:Type="Number">${Number(value) || 0}</Data></Cell>`;
    const textCell = value =>
        `<Cell><Data ss:Type="String">${escapeXml(value)}</Data></Cell>`;
    const rows = materials.map(material => {
        const qty = Number(material.Qty ?? material.qty ?? 0) || 0;
        const price = Number(material.Price ?? material.price ?? 0) || 0;

        return `<Row>${textCell(material.Description || material.description || "")}${textCell(material.CatalogNumber || material.catalogNumber || "")}${textCell(material.InventoryCategory || material.inventoryCategory || "")}${numberCell(qty)}${numberCell(price)}${numberCell(qty * price)}</Row>`;
    }).join("");
    const spreadsheet = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Worksheet ss:Name="Used Materials">
  <Table>
   <Row><Cell ss:MergeAcross="5"><Data ss:Type="String">Project Name: ${escapeXml(projectName)}</Data></Cell></Row>
   <Row><Cell ss:MergeAcross="5"><Data ss:Type="String">Address: ${escapeXml(project.address || "")}</Data></Cell></Row>
   <Row></Row>
   <Row>${textCell("Description")}${textCell("Catalog Number")}${textCell("Category")}${textCell("Qty")}${textCell("Unit Price")}${textCell("Total")}</Row>
   ${rows}
  </Table>
 </Worksheet>
</Workbook>`;
    const safeName = projectName
        .replace(/[\\/:*?"<>|]/g, "-")
        .trim() || "Panel Builder";
    const blob = new Blob(
        [spreadsheet],
        { type: "application/vnd.ms-excel;charset=utf-8" }
    );
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = `${safeName} Used Materials.xls`;
    anchor.style.display = "none";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);

    return {
        success: true,
        fileName: anchor.download,
        materialCount: materials.length
    };
}

//----------------------------------
// Load Current Project
//----------------------------------

async function loadCurrentProject(
    jobName,
    address,
    options = {}
) {

    console.time(
        "Load API"
    );

    const result =
        await loadProject(
            jobName,
            address
        );

    console.timeEnd(
        "Load API"
    );

    console.log(
        "Project Loaded",
        result
    );

    if (
        result?.success &&
        result.found
    ) {

        setProjectState({

            id:
                result.projectId,

            jobName,

            address,

            version:
                result.project?.version ||
                2,

            usedMaterialsSpreadsheetId:
                result.project?.usedMaterialsSpreadsheetId || "",

            usedMaterialsSpreadsheetUrl:
                result.project?.usedMaterialsSpreadsheetUrl || ""

        });

        //----------------------------------
        // Optional Deserialization
        //----------------------------------

        if (
            options.deserialize === true &&
            typeof deserializeProject ===
                "function"
        ) {

            await deserializeProject(
                result.project
            );

            finalizeLoadedProjectHistory();

        }
        else if (
            options.resetHistory === true
        ) {

            /*
             * Use only when the caller has
             * already restored the loaded
             * project before this point.
             */

            finalizeLoadedProjectHistory();

        }

    }

    return result;

}

//----------------------------------
// New Project
//----------------------------------

function newProject(
    jobName,
    address,
    options = {}
) {

    clearProjectState();

    setProjectState({

        id:
            "",

        version:
            2,

        jobName,

        address

    });

    //----------------------------------
    // Optional Canvas Reset
    //----------------------------------

    if (
        options.clearCanvas === true
    ) {

        if (
            typeof clearLinks ===
            "function"
        ) {

            clearLinks({

                captureHistory:
                    false,

                refresh:
                    false

            });

        }

        const layout =
            typeof getLayout ===
                "function"
                ? getLayout()
                : null;

        if (
            Array.isArray(layout)
        ) {

            layout.fill(
                null
            );

        }

        if (
            typeof SelectionManager !==
                "undefined" &&
            typeof SelectionManager.clear ===
                "function"
        ) {

            SelectionManager.clear();

        }

        if (
            typeof drawCanvas ===
                "function"
        ) {

            drawCanvas();

        }

    }

    //----------------------------------
    // Reset History Baseline
    //----------------------------------

    if (
        options.resetHistory !==
        false
    ) {

        resetProjectHistory(
            "New project"
        );

    }

    return getProjectState();

}

//----------------------------------
// Expose
//----------------------------------

window.resetProjectHistory =
    resetProjectHistory;

window.finalizeLoadedProjectHistory =
    finalizeLoadedProjectHistory;

window.buildProject =
    buildProject;

window.saveCurrentProject =
    saveCurrentProject;

window.saveProjectAsNew =
    () => saveCurrentProject({ saveAsNew: true });

window.loadCurrentProject =
    loadCurrentProject;

window.newProject =
    newProject;
