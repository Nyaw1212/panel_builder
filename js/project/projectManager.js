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
// Generate Used Materials
//----------------------------------

function promptUsedMaterialsProjectDetails(project) {

    return new Promise(resolve => {
        const overlay = document.createElement("div");
        const card = document.createElement("section");
        const title = document.createElement("h2");
        const hint = document.createElement("p");
        const pasteLabel = document.createElement("label");
        const pasteInput = document.createElement("textarea");
        const parseButton = document.createElement("button");
        const fields = {};

        const inputStyle = {
            width: "100%",
            boxSizing: "border-box",
            margin: "6px 0 14px",
            padding: "10px 11px",
            border: "1px solid #475569",
            borderRadius: "7px",
            outline: "none",
            background: "#0f172a",
            color: "#f8fafc",
            font: "inherit"
        };

        const labelStyle = {
            display: "block",
            color: "#cbd5e1",
            fontSize: "13px",
            fontWeight: "700"
        };

        const addField = (key, labelText, value, placeholder) => {
            const label = document.createElement("label");
            const input = document.createElement("input");

            label.textContent = labelText;
            Object.assign(label.style, labelStyle);
            input.type = "text";
            input.value = String(value || "");
            input.placeholder = placeholder;
            Object.assign(input.style, inputStyle);
            label.appendChild(input);
            card.appendChild(label);
            fields[key] = input;
        };

        const applyParsedRow = () => {
            if (typeof parseProjectDetails !== "function") return;

            const parsed = parseProjectDetails(pasteInput.value);
            if (!parsed) return;

            fields.jobName.value = parsed.jobName || "";
            fields.address.value = parsed.address || "";
            fields.electrician.value = parsed.electrician || "";
            fields.lender.value = parsed.lender || "";
        };

        const close = result => {
            overlay.remove();
            resolve(result);
        };

        Object.assign(overlay.style, {
            position: "fixed",
            inset: "0",
            zIndex: "10001",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            boxSizing: "border-box",
            background: "rgba(2, 8, 20, .76)"
        });
        Object.assign(card.style, {
            width: "min(540px, 100%)",
            maxHeight: "90vh",
            overflowY: "auto",
            boxSizing: "border-box",
            padding: "22px",
            border: "1px solid #334155",
            borderRadius: "12px",
            background: "#111827",
            color: "#f8fafc",
            boxShadow: "0 22px 70px rgba(0, 0, 0, .58)"
        });

        title.textContent = "Generate Used Materials";
        Object.assign(title.style, { margin: "0 0 6px", fontSize: "21px" });
        hint.textContent = "Paste the job row to fill the project parameters. Project Template is entered separately.";
        Object.assign(hint.style, { margin: "0 0 18px", color: "#cbd5e1", fontSize: "13px" });

        pasteLabel.textContent = "Paste Job Row";
        Object.assign(pasteLabel.style, labelStyle);
        pasteInput.rows = 3;
        pasteInput.placeholder = "Project Name | Address | Electrician | Start | End | Status | Lender";
        Object.assign(pasteInput.style, inputStyle, { resize: "vertical" });

        parseButton.type = "button";
        parseButton.textContent = "Parse Job Row";
        Object.assign(parseButton.style, {
            width: "100%",
            minHeight: "38px",
            marginBottom: "18px",
            border: "1px solid #475569",
            borderRadius: "7px",
            background: "#1e293b",
            color: "#fff",
            fontWeight: "700",
            cursor: "pointer"
        });
        parseButton.addEventListener("click", applyParsedRow);
        pasteInput.addEventListener("paste", () => {
            window.setTimeout(applyParsedRow, 0);
        });

        card.append(title, hint, pasteLabel, pasteInput, parseButton);
        addField("jobName", "Project Name", project?.jobName, "Required");
        addField("address", "Address", project?.address, "Project address");
        addField("electrician", "Electrician", project?.electrician, "Assigned electrician");
        addField("lender", "Lender", project?.lender, "Lender");
        addField("model", "Project Template", project?.model, "e.g. Duracell");

        const buttons = document.createElement("div");
        const cancel = document.createElement("button");
        const generate = document.createElement("button");

        Object.assign(buttons.style, {
            display: "flex",
            justifyContent: "flex-end",
            gap: "10px",
            marginTop: "4px"
        });
        [cancel, generate].forEach(button => Object.assign(button.style, {
            minHeight: "38px",
            padding: "9px 15px",
            borderRadius: "7px",
            color: "#fff",
            fontWeight: "700",
            cursor: "pointer"
        }));
        cancel.type = "button";
        cancel.textContent = "Cancel";
        Object.assign(cancel.style, { border: "1px solid #475569", background: "#1e293b" });
        cancel.addEventListener("click", () => close(null));

        generate.type = "button";
        generate.textContent = "Generate";
        Object.assign(generate.style, { border: "1px solid #2563eb", background: "#2563eb" });
        generate.addEventListener("click", () => {
            const jobName = fields.jobName.value.trim();
            if (!jobName) {
                alert("Project Name is required.");
                fields.jobName.focus();
                return;
            }

            close({
                jobName,
                address: fields.address.value.trim(),
                electrician: fields.electrician.value.trim(),
                lender: fields.lender.value.trim(),
                model: fields.model.value.trim()
            });
        });

        buttons.append(cancel, generate);
        card.appendChild(buttons);
        overlay.appendChild(card);
        overlay.addEventListener("click", event => {
            if (event.target === overlay) close(null);
        });
        document.body.appendChild(overlay);
        pasteInput.focus();
    });

}

async function generateUsedMaterials() {

    let state = getProjectState();

    if (!String(state.jobName || "").trim()) {
        const details = await promptUsedMaterialsProjectDetails(state);

        if (!details) {
            return {
                success: false,
                message: "A project name is needed to generate Used Materials."
            };
        }

        setProjectState({
            ...state,
            ...details
        });

        state = getProjectState();
    }

    // Open the tab inside the click event so the browser does not block it.
    const usedMaterialsWindow =
        typeof window !== "undefined" &&
        typeof window.open === "function"
            ? window.open("", "_blank")
            : null;

    try {
        const result = await saveProject(
            buildProject(),
            { usedMaterialsOutput: "" }
        );

        if (!result?.success) {
            usedMaterialsWindow?.close();
            return result || {
                success: false,
                message: "Unable to generate Used Materials."
            };
        }

        if (result.projectId) {
            setProjectId(result.projectId);
        }

        if (result.usedMaterials?.success) {
            const project = getProjectState();
            project.usedMaterialsSpreadsheetId = String(
                result.usedMaterials.spreadsheetId || ""
            );
            project.usedMaterialsSpreadsheetUrl = String(
                result.usedMaterials.spreadsheetUrl || ""
            );

            if (usedMaterialsWindow && project.usedMaterialsSpreadsheetUrl) {
                usedMaterialsWindow.location.replace(
                    project.usedMaterialsSpreadsheetUrl
                );
            }
        }
        else {
            usedMaterialsWindow?.close();
        }

        if (typeof invalidateProjectCache === "function") {
            invalidateProjectCache();
        }

        return result;
    }
    catch (error) {
        usedMaterialsWindow?.close();
        console.error("Generate Used Materials Failed:", error);

        return {
            success: false,
            message: error?.message || "Unable to generate Used Materials."
        };
    }

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
